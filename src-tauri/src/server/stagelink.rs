use base64::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, LazyLock, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::broadcast;

use crate::display::types::NativeDisplayInfo;
use crate::display::window_manager::{
    capture_window_frame_jpeg, enumerate_real_displays_fallback, WindowCaptureOutcome,
};
use crate::display::windows_capture::capture_screen_jpeg_raw;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StageWhisperPayload {
    pub id: String,
    pub message: String,
    pub tone: String, // "INFO" | "WARN" | "CRITICAL"
    pub created_at_ms: u64,
    pub expires_at_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StageLinkSlot {
    pub id: String,
    pub name: String,
    pub stage_zone: String,
    pub source_mode: String, // "WINDOW" | "DISPLAY" | "SPLIT"
    pub primary_source_id: String,
    pub primary_source_label: String,
    pub secondary_source_id: Option<String>,
    pub secondary_source_label: Option<String>,
    pub split_layout: String, // "SIDE_70_30" | "SIDE_50_50" | "TOP_BOTTOM" | "PIP_CORNER"
    pub target_fps: u32,
    pub max_width: u32,
    pub jpeg_quality: u8,
    pub is_frozen: bool,
    pub is_blackout: bool,
    pub is_flashing: bool,
    pub active_whisper: Option<StageWhisperPayload>,
    pub connected_clients: usize,
    pub source_minimized: bool,
    pub source_missing: bool,
    pub live_fps: u32,
    pub last_frame_kb: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview_data_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrUpdateSlotInput {
    pub id: Option<String>,
    pub name: String,
    pub stage_zone: String,
    pub source_mode: String,
    pub primary_source_id: String,
    pub primary_source_label: String,
    pub secondary_source_id: Option<String>,
    pub secondary_source_label: Option<String>,
    pub split_layout: Option<String>,
    pub target_fps: Option<u32>,
    pub max_width: Option<u32>,
}

#[derive(Clone, Debug)]
pub enum StageBroadcastPacket {
    /// Channel 1 (0x01) = Primary frame, Channel 2 (0x02) = Secondary frame
    BinaryFrame(Arc<Vec<u8>>),
    /// JSON control event (slot_state, whisper, flash, blackout, etc.)
    JsonText(String),
}

pub struct SlotRuntime {
    pub slot: Mutex<StageLinkSlot>,
    pub tx: broadcast::Sender<StageBroadcastPacket>,
    pub subscriber_count: AtomicUsize,
    pub last_frame_primary: Mutex<Option<Arc<Vec<u8>>>>,
    pub last_frame_secondary: Mutex<Option<Arc<Vec<u8>>>>,
    pub worker_running: AtomicBool,
    pub removed: AtomicBool,
}

fn generate_session_token() -> String {
    let now_ns = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(982_451_653);
    let pid = std::process::id() as u64;
    let mut seed = now_ns ^ (pid.rotate_left(19)) ^ 0x517cc1b727220a95;
    seed = seed.wrapping_mul(0x100000001b3) ^ (seed >> 29);
    format!("xt_{:016x}{:08x}", seed, pid ^ (now_ns as u32 as u64))
}

fn generate_random_pin() -> String {
    let now_ns = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(982_451_653);
    let pid = std::process::id() as u64;
    let mut seed = now_ns ^ (pid.rotate_left(23)) ^ 0xa24b9c1d;
    seed = seed.wrapping_mul(0x100000001b3) ^ (seed >> 17);
    let p1 = ((seed % 900) + 100) as u32;
    let p2 = (((seed >> 16) % 900) + 100) as u32;
    format!("{p1:03}-{p2:03}")
}

static SESSION_SECURITY: LazyLock<Mutex<SecurityConfig>> = LazyLock::new(|| {
    let token = generate_session_token();
    let pin = generate_random_pin();

    Mutex::new(SecurityConfig {
        session_token: token,
        active_pin: pin,
        pin_lock_enabled: true,
    })
});

#[derive(Debug, Clone)]
pub struct SecurityConfig {
    pub session_token: String,
    pub active_pin: String,
    pub pin_lock_enabled: bool,
}

static COMPANION_HTTP_SESSIONS: LazyLock<Mutex<HashMap<String, u64>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

static STAGE_SLOTS: LazyLock<Mutex<HashMap<String, Arc<SlotRuntime>>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

pub fn now_epoch_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

pub fn get_security_config() -> SecurityConfig {
    SESSION_SECURITY
        .lock()
        .map(|g| g.clone())
        .unwrap_or_else(|e| e.into_inner().clone())
}

pub fn set_security_pin(new_pin: Option<String>, pin_lock_enabled: Option<bool>) -> SecurityConfig {
    if let Ok(mut sec) = SESSION_SECURITY.lock() {
        let mut security_changed = false;
        if let Some(p) = new_pin {
            let trimmed = p.trim();
            if !trimmed.is_empty() && trimmed != sec.active_pin {
                sec.active_pin = trimmed.to_string();
                security_changed = true;
            }
        }
        if let Some(lock) = pin_lock_enabled {
            if lock != sec.pin_lock_enabled {
                sec.pin_lock_enabled = lock;
                security_changed = true;
            }
        }
        if security_changed {
            sec.session_token = generate_session_token();
        }
        return sec.clone();
    }
    get_security_config()
}

pub fn verify_access_key_or_pin(candidate: &str) -> bool {
    let sec = get_security_config();
    if !sec.pin_lock_enabled {
        return true;
    }
    let clean = candidate.trim();
    if clean.is_empty() {
        return false;
    }
    if clean == sec.session_token {
        return true;
    }
    let norm_cand: String = clean.chars().filter(|c| c.is_alphanumeric()).collect();
    let norm_pin: String = sec.active_pin.chars().filter(|c| c.is_alphanumeric()).collect();
    !norm_pin.is_empty() && norm_cand.eq_ignore_ascii_case(&norm_pin)
}

pub fn record_companion_heartbeat(client_id: &str) {
    if client_id.is_empty() {
        return;
    }
    let now = now_epoch_ms();
    if let Ok(mut map) = COMPANION_HTTP_SESSIONS.lock() {
        map.insert(client_id.to_string(), now);
        // Prune sessions idle > 12 seconds
        map.retain(|_, ts| now.saturating_sub(*ts) <= 12_000);
    }
}

pub fn get_total_live_client_count() -> usize {
    let now = now_epoch_ms();
    let http_clients = COMPANION_HTTP_SESSIONS
        .lock()
        .map(|mut map| {
            map.retain(|_, ts| now.saturating_sub(*ts) <= 12_000);
            map.len()
        })
        .unwrap_or(0);

    let ws_clients: usize = STAGE_SLOTS
        .lock()
        .map(|slots| {
            slots
                .values()
                .map(|rt| rt.subscriber_count.load(Ordering::Relaxed))
                .sum()
        })
        .unwrap_or(0);

    http_clients + ws_clients
}

pub fn ensure_default_slot_exists() -> Arc<SlotRuntime> {
    if let Some(rt) = STAGE_SLOTS.lock().ok().and_then(|m| m.get("stage-1").cloned()) {
        return rt;
    }
    upsert_stage_slot(CreateOrUpdateSlotInput {
        id: Some("stage-1".to_string()),
        name: "Pulpit Confidence Tablet".to_string(),
        stage_zone: "Pulpit Altar".to_string(),
        source_mode: "WINDOW".to_string(),
        primary_source_id: "".to_string(),
        primary_source_label: "".to_string(),
        secondary_source_id: None,
        secondary_source_label: None,
        split_layout: Some("SIDE_70_30".to_string()),
        target_fps: Some(30),
        max_width: Some(1280),
    });
    STAGE_SLOTS
        .lock()
        .ok()
        .and_then(|m| m.get("stage-1").cloned())
        .expect("default slot stage-1 must exist after upsert")
}

pub fn list_stage_slots(include_previews: bool) -> Vec<StageLinkSlot> {
    let is_empty = STAGE_SLOTS.lock().map(|m| m.is_empty()).unwrap_or(false);
    if is_empty {
        ensure_default_slot_exists();
    }

    let runtimes: Vec<Arc<SlotRuntime>> = STAGE_SLOTS
        .lock()
        .map(|m| m.values().cloned().collect())
        .unwrap_or_default();

    let now = now_epoch_ms();
    let mut list = Vec::with_capacity(runtimes.len());

    for rt in runtimes {
        if let Ok(mut slot) = rt.slot.lock() {
            // Auto-expire timed whisper if elapsed
            if let Some(ref w) = slot.active_whisper {
                if let Some(exp) = w.expires_at_ms {
                    if now >= exp {
                        slot.active_whisper = None;
                    }
                }
            }
            slot.connected_clients = rt.subscriber_count.load(Ordering::Relaxed);
            let mut cloned = slot.clone();
            if !include_previews {
                cloned.preview_data_url = None;
            }
            list.push(cloned);
        }
    }

    list.sort_by(|a, b| a.id.cmp(&b.id));
    list
}

pub fn get_slot_runtime(slot_id: &str) -> Option<Arc<SlotRuntime>> {
    STAGE_SLOTS
        .lock()
        .ok()
        .and_then(|m| m.get(slot_id).cloned())
}

pub fn upsert_stage_slot(input: CreateOrUpdateSlotInput) -> StageLinkSlot {
    let slot_id = input
        .id
        .filter(|s| !s.trim().is_empty())
        .map(|s| {
            let clean: String = s.chars().filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_').collect();
            if clean.is_empty() { "stage-1".to_string() } else { clean }
        })
        .unwrap_or_else(|| {
            if let Ok(guard) = STAGE_SLOTS.lock() {
                for i in 1..=50 {
                    let candidate = format!("stage-{i}");
                    if !guard.contains_key(&candidate) {
                        return candidate;
                    }
                }
            }
            "stage-1".to_string()
        });

    let split_layout = input
        .split_layout
        .unwrap_or_else(|| "SIDE_70_30".to_string());
    let target_fps = input.target_fps.unwrap_or(20).clamp(5, 30);
    let max_width = input.max_width.unwrap_or(1280).clamp(640, 1920);

    let existing = get_slot_runtime(&slot_id);
    if let Some(rt) = existing {
        let updated_snapshot = {
            let mut slot = rt.slot.lock().unwrap();
            let source_changed = slot.primary_source_id != input.primary_source_id
                || slot.secondary_source_id != input.secondary_source_id
                || slot.source_mode != input.source_mode;

            slot.name = input.name;
            slot.stage_zone = input.stage_zone;
            slot.source_mode = input.source_mode;
            slot.primary_source_id = input.primary_source_id;
            slot.primary_source_label = input.primary_source_label;
            slot.secondary_source_id = input.secondary_source_id;
            slot.secondary_source_label = input.secondary_source_label;
            slot.split_layout = split_layout;
            slot.target_fps = target_fps;
            slot.max_width = max_width;
            if source_changed {
                slot.source_minimized = false;
                slot.source_missing = false;
            }
            slot.clone()
        };

        // Refresh initial preview synchronously on blocking pool or next tick
        broadcast_slot_state(&rt, &updated_snapshot);
        return updated_snapshot;
    }

    let new_slot = StageLinkSlot {
        id: slot_id.clone(),
        name: if input.name.trim().is_empty() {
            format!("Wireless Stage {}", slot_id)
        } else {
            input.name
        },
        stage_zone: if input.stage_zone.trim().is_empty() {
            "Stage / Pulpit".to_string()
        } else {
            input.stage_zone
        },
        source_mode: input.source_mode,
        primary_source_id: input.primary_source_id,
        primary_source_label: input.primary_source_label,
        secondary_source_id: input.secondary_source_id,
        secondary_source_label: input.secondary_source_label,
        split_layout,
        target_fps,
        max_width,
        jpeg_quality: 78,
        is_frozen: false,
        is_blackout: false,
        is_flashing: false,
        active_whisper: None,
        connected_clients: 0,
        source_minimized: false,
        source_missing: false,
        live_fps: 0,
        last_frame_kb: 0,
        preview_data_url: None,
    };

    let (tx, _) = broadcast::channel(16);
    let rt = Arc::new(SlotRuntime {
        slot: Mutex::new(new_slot.clone()),
        tx,
        subscriber_count: AtomicUsize::new(0),
        last_frame_primary: Mutex::new(None),
        last_frame_secondary: Mutex::new(None),
        worker_running: AtomicBool::new(false),
        removed: AtomicBool::new(false),
    });

    if let Ok(mut map) = STAGE_SLOTS.lock() {
        map.insert(slot_id, rt.clone());
    }

    // Capture one initial preview frame so FOH sees the live thumbnail immediately
    capture_single_preview_for_runtime(&rt);
    let final_state = rt.slot.lock().map(|s| s.clone()).unwrap_or(new_slot);
    final_state
}

pub fn remove_stage_slot(slot_id: &str) -> bool {
    let removed_rt = STAGE_SLOTS
        .lock()
        .ok()
        .and_then(|mut map| map.remove(slot_id));

    if let Some(rt) = removed_rt {
        rt.removed.store(true, Ordering::SeqCst);
        let _ = rt.tx.send(StageBroadcastPacket::JsonText(
            serde_json::json!({ "type": "slot_removed", "slot_id": slot_id }).to_string(),
        ));
        return true;
    }
    false
}

pub fn set_slot_freeze(slot_id: &str, frozen: bool) -> Option<StageLinkSlot> {
    let rt = get_slot_runtime(slot_id)?;
    let snap = {
        let mut slot = rt.slot.lock().ok()?;
        slot.is_frozen = frozen;
        slot.clone()
    };
    broadcast_slot_state(&rt, &snap);
    Some(snap)
}

pub fn set_slot_blackout(slot_id: &str, blackout: bool) -> Option<StageLinkSlot> {
    let rt = get_slot_runtime(slot_id)?;
    let snap = {
        let mut slot = rt.slot.lock().ok()?;
        slot.is_blackout = blackout;
        slot.clone()
    };
    broadcast_slot_state(&rt, &snap);
    Some(snap)
}

pub fn trigger_slot_flash(slot_id: &str) -> Option<StageLinkSlot> {
    let rt = get_slot_runtime(slot_id)?;
    let snap = {
        let mut slot = rt.slot.lock().ok()?;
        slot.is_flashing = true;
        slot.clone()
    };
    broadcast_slot_state(&rt, &snap);

    let rt_clone = rt.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        let cleared = {
            if let Ok(mut slot) = rt_clone.slot.lock() {
                slot.is_flashing = false;
                Some(slot.clone())
            } else {
                None
            }
        };
        if let Some(s) = cleared {
            broadcast_slot_state(&rt_clone, &s);
        }
    });

    Some(snap)
}

pub fn send_stage_whisper(
    slot_id: &str,
    message: String,
    tone: String,
    duration_seconds: Option<u32>,
) -> Option<StageLinkSlot> {
    let rt = get_slot_runtime(slot_id)?;
    let trimmed = message.trim().to_string();
    if trimmed.is_empty() {
        return clear_stage_whisper(slot_id);
    }

    let now = now_epoch_ms();
    let expires_at_ms = duration_seconds
        .filter(|&d| d > 0)
        .map(|d| now + (d as u64) * 1000);

    let whisper_id = format!("w-{now}");
    let whisper = StageWhisperPayload {
        id: whisper_id.clone(),
        message: trimmed,
        tone: match tone.to_uppercase().as_str() {
            "CRITICAL" | "ERROR" => "CRITICAL".to_string(),
            "WARN" | "AMBER" => "WARN".to_string(),
            _ => "INFO".to_string(),
        },
        created_at_ms: now,
        expires_at_ms,
    };

    let snap = {
        let mut slot = rt.slot.lock().ok()?;
        slot.active_whisper = Some(whisper);
        slot.clone()
    };
    broadcast_slot_state(&rt, &snap);

    if let Some(secs) = duration_seconds.filter(|&d| d > 0) {
        let rt_clone = rt.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(secs as u64)).await;
            let cleared = {
                if let Ok(mut slot) = rt_clone.slot.lock() {
                    if slot
                        .active_whisper
                        .as_ref()
                        .map(|w| w.id == whisper_id)
                        .unwrap_or(false)
                    {
                        slot.active_whisper = None;
                        Some(slot.clone())
                    } else {
                        None
                    }
                } else {
                    None
                }
            };
            if let Some(s) = cleared {
                broadcast_slot_state(&rt_clone, &s);
            }
        });
    }

    Some(snap)
}

pub fn clear_stage_whisper(slot_id: &str) -> Option<StageLinkSlot> {
    let rt = get_slot_runtime(slot_id)?;
    let snap = {
        let mut slot = rt.slot.lock().ok()?;
        slot.active_whisper = None;
        slot.clone()
    };
    broadcast_slot_state(&rt, &snap);
    Some(snap)
}

pub fn broadcast_slot_state(rt: &Arc<SlotRuntime>, slot: &StageLinkSlot) {
    let mut public_slot = slot.clone();
    public_slot.preview_data_url = None;
    let payload = serde_json::json!({
        "type": "slot_state",
        "slot": public_slot,
    });
    let _ = rt.tx.send(StageBroadcastPacket::JsonText(payload.to_string()));
}

fn capture_any_source_raw(
    source_spec: &str,
    default_mode: &str,
    max_width: u32,
    jpeg_quality: u8,
    prev_checksum: Option<u64>,
    displays_cache: &[NativeDisplayInfo],
) -> WindowCaptureOutcome {
    let (kind, raw_id) = if let Some(rest) = source_spec.strip_prefix("W:") {
        ("WINDOW", rest)
    } else if let Some(rest) = source_spec.strip_prefix("D:") {
        ("DISPLAY", rest)
    } else if default_mode == "DISPLAY" {
        ("DISPLAY", source_spec)
    } else {
        ("WINDOW", source_spec)
    };

    if kind == "DISPLAY" {
        let disp = displays_cache
            .iter()
            .find(|d| d.id == raw_id || d.os_index.to_string() == raw_id);

        if let Some(d) = disp {
            if let Some(ref b) = d.bounds {
                return capture_screen_jpeg_raw(
                    b.x,
                    b.y,
                    b.width,
                    b.height,
                    max_width,
                    jpeg_quality,
                    false,
                    prev_checksum,
                );
            }
        }
        return WindowCaptureOutcome::NotFound;
    }

    capture_window_frame_jpeg(raw_id, max_width, jpeg_quality, prev_checksum)
}

pub fn capture_single_preview_for_runtime(rt: &Arc<SlotRuntime>) {
    let (source_mode, prim_id, sec_id, max_w, qual, is_frozen, is_blackout) = {
        let Ok(slot) = rt.slot.lock() else { return };
        (
            slot.source_mode.clone(),
            slot.primary_source_id.clone(),
            slot.secondary_source_id.clone(),
            slot.max_width,
            slot.jpeg_quality,
            slot.is_frozen,
            slot.is_blackout,
        )
    };

    if is_frozen || is_blackout || prim_id.is_empty() {
        return;
    }

    let displays = enumerate_real_displays_fallback();
    let outcome = capture_any_source_raw(&prim_id, &source_mode, max_w.min(960), qual, None, &displays);

    match outcome {
        WindowCaptureOutcome::Frame { jpeg_bytes, .. } => {
            let b64 = BASE64_STANDARD.encode(&jpeg_bytes);
            let data_url = format!("data:image/jpeg;base64,{b64}");

            let mut packet = Vec::with_capacity(jpeg_bytes.len() + 1);
            packet.push(0x01u8);
            packet.extend_from_slice(&jpeg_bytes);
            if let Ok(mut last_p) = rt.last_frame_primary.lock() {
                *last_p = Some(Arc::new(packet));
            }

            if let Ok(mut slot) = rt.slot.lock() {
                slot.last_frame_kb = ((jpeg_bytes.len() + 1023) / 1024) as u32;
                slot.preview_data_url = Some(data_url);
                slot.source_minimized = false;
                slot.source_missing = false;
            }
        }
        WindowCaptureOutcome::Minimized => {
            if let Ok(mut slot) = rt.slot.lock() {
                slot.source_minimized = true;
                slot.source_missing = false;
            }
        }
        WindowCaptureOutcome::NotFound => {
            if let Ok(mut slot) = rt.slot.lock() {
                slot.source_missing = true;
            }
        }
        WindowCaptureOutcome::Unchanged { .. } => {}
    }

    if source_mode == "SPLIT" {
        if let Some(sec) = sec_id.filter(|s| !s.is_empty()) {
            if let WindowCaptureOutcome::Frame { jpeg_bytes, .. } =
                capture_any_source_raw(&sec, "WINDOW", 720, qual, None, &displays)
            {
                let mut packet = Vec::with_capacity(jpeg_bytes.len() + 1);
                packet.push(0x02u8);
                packet.extend_from_slice(&jpeg_bytes);
                if let Ok(mut last_s) = rt.last_frame_secondary.lock() {
                    *last_s = Some(Arc::new(packet));
                }
            }
        }
    }
}

pub fn refresh_all_slot_previews() -> Vec<StageLinkSlot> {
    let runtimes: Vec<Arc<SlotRuntime>> = STAGE_SLOTS
        .lock()
        .map(|m| m.values().cloned().collect())
        .unwrap_or_default();

    for rt in &runtimes {
        // Only run manual preview capture if background streaming worker isn't already actively capturing
        if rt.subscriber_count.load(Ordering::Relaxed) == 0 {
            capture_single_preview_for_runtime(rt);
        }
    }

    list_stage_slots(true)
}

pub fn ensure_slot_worker_running(rt: Arc<SlotRuntime>) {
    if rt
        .worker_running
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return;
    }

    tokio::spawn(async move {
        let mut prev_checksum_a: Option<u64> = None;
        let mut prev_checksum_b: Option<u64> = None;
        let mut frames_sent_window: u32 = 0;
        let mut window_start_ms = now_epoch_ms();
        let mut displays_cache = enumerate_real_displays_fallback();
        let mut last_disp_refresh_ms = window_start_ms;
        let mut prev_minimized = false;
        let mut prev_missing = false;
        let mut last_forced_keyframe_ms = window_start_ms;

        loop {
            if rt.removed.load(Ordering::Relaxed)
                || rt.subscriber_count.load(Ordering::Relaxed) == 0
            {
                if let Ok(mut s) = rt.slot.lock() {
                    s.live_fps = 0;
                    s.connected_clients = rt.subscriber_count.load(Ordering::Relaxed);
                }
                rt.worker_running.store(false, Ordering::SeqCst);
                // Double check race if subscriber joined right as we exited
                if !rt.removed.load(Ordering::Relaxed)
                    && rt.subscriber_count.load(Ordering::Relaxed) > 0
                {
                    ensure_slot_worker_running(rt);
                }
                break;
            }

            let (source_mode, prim_id, sec_id, target_fps, max_w, qual, is_frozen, is_blackout) = {
                match rt.slot.lock() {
                    Ok(s) => (
                        s.source_mode.clone(),
                        s.primary_source_id.clone(),
                        s.secondary_source_id.clone(),
                        s.target_fps.clamp(5, 30),
                        s.max_width.clamp(640, 1920),
                        s.jpeg_quality,
                        s.is_frozen,
                        s.is_blackout,
                    ),
                    Err(_) => break,
                }
            };

            let frame_interval_ms = (1000 / target_fps).max(33) as u64;

            if is_frozen || is_blackout || prim_id.is_empty() {
                prev_checksum_a = None;
                prev_checksum_b = None;
                tokio::time::sleep(tokio::time::Duration::from_millis(120)).await;
                continue;
            }

            let now = now_epoch_ms();
            if now.saturating_sub(last_disp_refresh_ms) > 3000 {
                displays_cache = enumerate_real_displays_fallback();
                last_disp_refresh_ms = now;
            }

            // Forced keyframe heartbeat every 1500ms guarantees receivers never freeze on static windows
            let is_heartbeat = now.saturating_sub(last_forced_keyframe_ms) >= 1500;
            if is_heartbeat {
                last_forced_keyframe_ms = now;
            }

            let disp_clone = displays_cache.clone();
            let mode_clone = source_mode.clone();
            let prim_clone = prim_id.clone();
            let sec_clone = sec_id.clone();
            let prev_a = if is_heartbeat { None } else { prev_checksum_a };
            let prev_b = if is_heartbeat { None } else { prev_checksum_b };

            let capture_res = tokio::task::spawn_blocking(move || {
                let out_a = capture_any_source_raw(
                    &prim_clone,
                    &mode_clone,
                    max_w,
                    qual,
                    prev_a,
                    &disp_clone,
                );
                let out_b = if mode_clone == "SPLIT" {
                    sec_clone
                        .filter(|s| !s.is_empty())
                        .map(|sec| capture_any_source_raw(&sec, "WINDOW", 768, qual, prev_b, &disp_clone))
                } else {
                    None
                };
                (out_a, out_b)
            })
            .await;

            if let Ok((out_a, out_b)) = capture_res {
                let mut state_flag_changed = false;

                match out_a {
                    WindowCaptureOutcome::Frame {
                        jpeg_bytes,
                        checksum,
                        ..
                    } => {
                        prev_checksum_a = Some(checksum);
                        frames_sent_window += 1;

                        let b64 = BASE64_STANDARD.encode(&jpeg_bytes);
                        let preview_url = format!("data:image/jpeg;base64,{b64}");

                        let mut packet = Vec::with_capacity(jpeg_bytes.len() + 1);
                        packet.push(0x01u8);
                        packet.extend_from_slice(&jpeg_bytes);
                        let arc_pkt = Arc::new(packet);

                        if let Ok(mut lp) = rt.last_frame_primary.lock() {
                            *lp = Some(arc_pkt.clone());
                        }
                        let _ = rt.tx.send(StageBroadcastPacket::BinaryFrame(arc_pkt));

                        if let Ok(mut s) = rt.slot.lock() {
                            s.last_frame_kb = ((jpeg_bytes.len() + 1023) / 1024) as u32;
                            s.preview_data_url = Some(preview_url);
                            if s.source_minimized || s.source_missing {
                                s.source_minimized = false;
                                s.source_missing = false;
                                state_flag_changed = true;
                            }
                        }
                        prev_minimized = false;
                        prev_missing = false;
                    }
                    WindowCaptureOutcome::Unchanged { checksum } => {
                        prev_checksum_a = Some(checksum);
                        if prev_minimized || prev_missing {
                            if let Ok(mut s) = rt.slot.lock() {
                                s.source_minimized = false;
                                s.source_missing = false;
                                state_flag_changed = true;
                            }
                            prev_minimized = false;
                            prev_missing = false;
                        }
                    }
                    WindowCaptureOutcome::Minimized => {
                        if !prev_minimized {
                            prev_minimized = true;
                            if let Ok(mut s) = rt.slot.lock() {
                                s.source_minimized = true;
                                s.source_missing = false;
                                state_flag_changed = true;
                            }
                        }
                    }
                    WindowCaptureOutcome::NotFound => {
                        if !prev_missing {
                            prev_missing = true;
                            if let Ok(mut s) = rt.slot.lock() {
                                s.source_missing = true;
                                state_flag_changed = true;
                            }
                        }
                    }
                }

                if let Some(ref outcome_b) = out_b {
                    match outcome_b {
                        WindowCaptureOutcome::Frame { jpeg_bytes, checksum, .. } => {
                            prev_checksum_b = Some(*checksum);
                            let mut packet = Vec::with_capacity(jpeg_bytes.len() + 1);
                            packet.push(0x02u8);
                            packet.extend_from_slice(jpeg_bytes);
                            let arc_pkt = Arc::new(packet);
                            if let Ok(mut ls) = rt.last_frame_secondary.lock() {
                                *ls = Some(arc_pkt.clone());
                            }
                            let _ = rt.tx.send(StageBroadcastPacket::BinaryFrame(arc_pkt));
                        }
                        WindowCaptureOutcome::Minimized => {
                            if !prev_minimized {
                                prev_minimized = true;
                                if let Ok(mut s) = rt.slot.lock() {
                                    s.source_minimized = true;
                                    state_flag_changed = true;
                                }
                            }
                        }
                        _ => {}
                    }
                }

                let elapsed = now_epoch_ms().saturating_sub(window_start_ms);
                if elapsed >= 1000 {
                    let measured_fps =
                        ((frames_sent_window as u64 * 1000) / elapsed.max(1)) as u32;
                    if let Ok(mut s) = rt.slot.lock() {
                        s.live_fps = measured_fps;
                        s.connected_clients = rt.subscriber_count.load(Ordering::Relaxed);
                    }
                    frames_sent_window = 0;
                    window_start_ms = now_epoch_ms();
                }

                if state_flag_changed {
                    let snap = rt.slot.lock().ok().map(|s| s.clone());
                    if let Some(s) = snap {
                        broadcast_slot_state(&rt, &s);
                    }
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(frame_interval_ms)).await;
        }
    });
}
