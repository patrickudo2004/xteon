pub mod audio;
pub mod bandwidth;
pub mod display;
pub mod server;

use audio::wasapi_meter::get_system_master_audio_peak;
use bandwidth::calculator::{calculate_signal_bandwidth, BandwidthResult};
use display::types::NativeDisplayInfo;
use display::windows_capture::{
    capture_all_displays_batch, capture_screen_thumbnail, enumerate_real_windows_displays,
    CaptureDisplayTarget, CapturedFrameResult,
};
use server::companion::{get_companion_status, start_companion_server_with_handle, CompanionServerStatus};
use server::network::{list_network_interfaces, NetworkAdapterInfo};
use server::stagelink::{
    clear_stage_whisper, list_stage_slots, refresh_all_slot_previews, remove_stage_slot,
    send_stage_whisper, set_security_pin, set_slot_blackout, set_slot_freeze, trigger_slot_flash,
    upsert_stage_slot, CreateOrUpdateSlotInput, StageLinkSlot,
};
use display::window_manager::{
    list_capturable_windows, recall_stray_windows_to_primary, restore_window_behind,
    route_window_to_display, set_window_pinned_stage, unroute_window_to_primary, CapturableWindow,
};
use tauri::Manager;

fn sanitize_label(id: &str) -> String {
    let clean: String = id.chars().filter(|c| c.is_alphanumeric() || *c == '_').collect();
    if clean.is_empty() {
        "disp".to_string()
    } else {
        clean
    }
}

#[tauri::command]
fn get_connected_displays(app: tauri::AppHandle) -> Vec<NativeDisplayInfo> {
    #[cfg(windows)]
    {
        let displays = enumerate_real_windows_displays();
        if !displays.is_empty() {
            return displays;
        }
    }

    // Native macOS (Cocoa NSScreen) and Linux (XRandR / Wayland) detection via Tauri
    if let Ok(monitors) = app.available_monitors() {
        let primary = app.primary_monitor().ok().flatten();
        let primary_name = primary.as_ref().and_then(|p| p.name().cloned());

        return monitors.into_iter().enumerate().map(|(idx, m)| {
            let name = m.name().cloned().unwrap_or_else(|| format!("Display {}", idx + 1));
            let is_primary = primary_name.as_deref() == Some(&name) || idx == 0;
            let size = m.size();
            let pos = m.position();

            let port_type = if is_primary {
                "INTERNAL_DISPLAY".to_string()
            } else if name.to_lowercase().contains("wireless") || name.to_lowercase().contains("airplay") || name.to_lowercase().contains("sidecar") {
                "WIRELESS".to_string()
            } else {
                "HDMI_2_0".to_string()
            };

            let custom_alias = if is_primary || port_type == "INTERNAL_DISPLAY" {
                "Host Laptop / Workstation (Built-in Screen)".to_string()
            } else if port_type == "WIRELESS" {
                "Wireless / Sidecar Display".to_string()
            } else {
                format!("External Stage Display {}", idx + 1)
            };

            let stage_zone = if is_primary {
                "FOH Control Booth".to_string()
            } else if port_type == "WIRELESS" {
                "Mobile Director / Stage".to_string()
            } else {
                "Stage Area".to_string()
            };

            NativeDisplayInfo {
                id: format!("live-disp-{}", idx + 1),
                os_index: (idx + 1) as u32,
                name: name.clone(),
                custom_alias,
                stage_zone,
                port_type,
                vendor: if cfg!(target_os = "macos") { "Apple / macOS".to_string() } else { "Linux / Wayland / X11".to_string() },
                model: name,
                serial: format!("MON-{}", idx + 1),
                width: size.width,
                height: size.height,
                refresh_rate_hz: 60,
                is_hdr: false,
                color_space: "sRGB / Rec.709".to_string(),
                status: "ONLINE".to_string(),
                bounds: Some(display::types::NativeDisplayBounds {
                    x: pos.x,
                    y: pos.y,
                    width: size.width,
                    height: size.height,
                }),
            }
        }).collect();
    }

    Vec::new()
}

#[tauri::command]
fn get_system_audio_level() -> f32 {
    get_system_master_audio_peak()
}

#[tauri::command]
async fn capture_display_frame(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    show_cursor: bool,
) -> Option<String> {
    tokio::task::spawn_blocking(move || {
        capture_screen_thumbnail(x, y, width, height, show_cursor)
    })
    .await
    .unwrap_or(None)
}

#[tauri::command]
async fn capture_all_screens(
    targets: Vec<CaptureDisplayTarget>,
    show_cursor: bool,
) -> Vec<CapturedFrameResult> {
    tokio::task::spawn_blocking(move || {
        capture_all_displays_batch(targets, show_cursor)
    })
    .await
    .unwrap_or_default()
}

#[tauri::command]
fn validate_bandwidth(
    width: u32,
    height: u32,
    fps: u32,
    color_depth_bits: u32,
    cable_type: String,
    length_meters: f64,
) -> BandwidthResult {
    calculate_signal_bandwidth(width, height, fps, color_depth_bits, &cable_type, length_meters)
}

#[tauri::command]
fn get_mobile_companion_status() -> CompanionServerStatus {
    get_companion_status()
}

pub fn trigger_flash_native(
    app: tauri::AppHandle,
    display_id: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<String, String> {
    println!("Flashing display {} at physical bounds ({}, {}) {}x{}", display_id, x, y, width, height);

    let clean_id = sanitize_label(&display_id);
    let window_label = format!("xteon_flash_{}", clean_id);
    if let Some(existing) = app.get_webview_window(&window_label) {
        let _ = existing.close();
    }

    if let Ok(win) = tauri::WebviewWindowBuilder::new(
        &app,
        &window_label,
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("⚡ Xteon Screen Identifier")
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .background_color(tauri::window::Color(10, 11, 14, 255))
    .build()
    {
        let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
        let _ = win.set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }));
        let _ = win.show();
        let _ = win.set_focus();

        // Automatically dismiss flash after 8 seconds if not dismissed by user
        let win_clone = win.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(8000)).await;
            let _ = win_clone.close();
        });
    }

    Ok(format!("Flash triggered on {}", display_id))
}

#[tauri::command]
async fn trigger_flash(
    app: tauri::AppHandle,
    display_id: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<String, String> {
    trigger_flash_native(app, display_id, x, y, width, height)
}

#[tauri::command]
fn close_flash(app: tauri::AppHandle) -> bool {
    for (label, win) in app.webview_windows() {
        if label.starts_with("xteon_flash_") {
            let _ = win.close();
        }
    }
    true
}

#[tauri::command]
async fn show_test_pattern(
    app: tauri::AppHandle,
    display_id: String,
    pattern_type: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<String, String> {
    println!("Showing pattern {} on {} at ({}, {}) {}x{}", pattern_type, display_id, x, y, width, height);

    let clean_id = sanitize_label(&display_id);
    let clean_pat = sanitize_label(&pattern_type);
    let window_label = format!("xteon_pattern_{}_{}", clean_pat, clean_id);

    // Close any previous pattern windows
    for (label, win) in app.webview_windows() {
        if label.starts_with("xteon_pattern_") {
            let _ = win.close();
        }
    }

    if let Ok(win) = tauri::WebviewWindowBuilder::new(
        &app,
        &window_label,
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("🎛️ Xteon Test Pattern")
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .background_color(tauri::window::Color(0, 0, 0, 255))
    .build()
    {
        let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
        let _ = win.set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }));
        let _ = win.show();
        let _ = win.set_focus();
    }

    Ok(format!("Pattern {} active on {}", pattern_type, display_id))
}

#[tauri::command]
fn close_test_pattern(app: tauri::AppHandle) -> bool {
    for (label, win) in app.webview_windows() {
        if label.starts_with("xteon_pattern_") {
            let _ = win.close();
        }
    }
    true
}

#[tauri::command]
fn sync_mobile_companion_displays(displays: Vec<server::companion::CompanionDisplayPayload>) -> bool {
    server::companion::update_synced_displays(displays);
    true
}

#[tauri::command]
fn close_all_overlays(app: tauri::AppHandle) -> bool {
    for (label, window) in app.webview_windows() {
        if label.starts_with("xteon_pattern_") || label.starts_with("xteon_flash_") || label.starts_with("xteon_blackout_") {
            let _ = window.close();
        }
    }
    true
}

#[tauri::command]
async fn list_os_windows(app: tauri::AppHandle) -> Vec<CapturableWindow> {
    let displays = get_connected_displays(app);
    tokio::task::spawn_blocking(move || list_capturable_windows(Some(displays)))
        .await
        .unwrap_or_default()
}

#[tauri::command]
async fn route_os_window(
    app: tauri::AppHandle,
    hwnd_id: String,
    display_id: String,
    borderless_fullscreen: bool,
    pin_to_stage: bool,
) -> Result<String, String> {
    let displays = get_connected_displays(app);
    let target = displays
        .iter()
        .find(|d| d.id == display_id || d.os_index.to_string() == display_id)
        .cloned()
        .ok_or_else(|| format!("Target display {display_id} not found"))?;

    let (tx, ty, tw, th) = if let Some(ref b) = target.bounds {
        (b.x, b.y, b.width, b.height)
    } else {
        (0, 0, target.width, target.height)
    };

    tokio::task::spawn_blocking(move || {
        route_window_to_display(&hwnd_id, tx, ty, tw, th, borderless_fullscreen, pin_to_stage)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn unroute_os_window(app: tauri::AppHandle, hwnd_id: String) -> Result<String, String> {
    let displays = get_connected_displays(app);
    tokio::task::spawn_blocking(move || unroute_window_to_primary(&hwnd_id, &displays))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
fn set_os_window_pinned(hwnd_id: String, pinned: bool) -> bool {
    set_window_pinned_stage(&hwnd_id, pinned)
}

#[tauri::command]
async fn restore_os_window_behind(hwnd_id: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || restore_window_behind(&hwnd_id))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn recall_stray_os_windows(app: tauri::AppHandle) -> Result<usize, String> {
    let displays = get_connected_displays(app);
    tokio::task::spawn_blocking(move || recall_stray_windows_to_primary(&displays))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
fn get_network_interfaces() -> Vec<NetworkAdapterInfo> {
    list_network_interfaces()
}

#[tauri::command]
fn configure_companion_security(
    pin: Option<String>,
    pin_lock_enabled: Option<bool>,
) -> CompanionServerStatus {
    let _ = set_security_pin(pin, pin_lock_enabled);
    get_companion_status()
}

#[tauri::command]
async fn get_stagelink_slots(refresh_previews: bool) -> Vec<StageLinkSlot> {
    tokio::task::spawn_blocking(move || {
        if refresh_previews {
            refresh_all_slot_previews()
        } else {
            list_stage_slots(true)
        }
    })
    .await
    .unwrap_or_default()
}

#[tauri::command]
async fn upsert_stagelink_slot(input: CreateOrUpdateSlotInput) -> StageLinkSlot {
    tokio::task::spawn_blocking(move || upsert_stage_slot(input))
        .await
        .expect("upsert_stagelink_slot worker failed")
}

#[tauri::command]
async fn delete_stagelink_slot(slot_id: String) -> bool {
    remove_stage_slot(&slot_id)
}

#[tauri::command]
async fn set_stagelink_slot_freeze(slot_id: String, frozen: bool) -> Option<StageLinkSlot> {
    set_slot_freeze(&slot_id, frozen)
}

#[tauri::command]
async fn set_stagelink_slot_blackout(slot_id: String, blackout: bool) -> Option<StageLinkSlot> {
    set_slot_blackout(&slot_id, blackout)
}

#[tauri::command]
async fn flash_stagelink_slot(slot_id: String) -> Option<StageLinkSlot> {
    trigger_slot_flash(&slot_id)
}

#[tauri::command]
async fn send_stagelink_whisper(
    slot_id: String,
    message: String,
    tone: String,
    duration_seconds: Option<u32>,
) -> Option<StageLinkSlot> {
    send_stage_whisper(&slot_id, message, tone, duration_seconds)
}

#[tauri::command]
async fn clear_stagelink_whisper(slot_id: String) -> Option<StageLinkSlot> {
    clear_stage_whisper(&slot_id)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.center();
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }

            // Forcefully close any stray overlay windows on startup
            for (label, window) in app.webview_windows() {
                if label != "main" {
                    let _ = window.close();
                }
            }

            // Spawn the live local Wi-Fi Mobile Companion web server with Tauri AppHandle
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_companion_server_with_handle(app_handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_connected_displays,
            get_system_audio_level,
            capture_display_frame,
            capture_all_screens,
            validate_bandwidth,
            get_mobile_companion_status,
            sync_mobile_companion_displays,
            trigger_flash,
            close_flash,
            show_test_pattern,
            close_test_pattern,
            close_all_overlays,
            list_os_windows,
            route_os_window,
            unroute_os_window,
            set_os_window_pinned,
            restore_os_window_behind,
            recall_stray_os_windows,
            get_network_interfaces,
            configure_companion_security,
            get_stagelink_slots,
            upsert_stagelink_slot,
            delete_stagelink_slot,
            set_stagelink_slot_freeze,
            set_stagelink_slot_blackout,
            flash_stagelink_slot,
            send_stagelink_whisper,
            clear_stagelink_whisper
        ])
        .run(tauri::generate_context!())
        .expect("error while running xteon application");
}

