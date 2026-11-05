use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query, State,
    },
    http::StatusCode,
    response::{Html, IntoResponse, Json},
    routing::{delete, get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock, Mutex};
use tower_http::cors::{Any, CorsLayer};

use crate::display::window_manager::{
    list_capturable_windows, recall_stray_windows_to_primary, restore_window_behind,
    route_window_to_display,
};
use super::network::{get_preferred_lan_ip, list_network_interfaces, NetworkAdapterInfo};
use super::stagelink::{
    clear_stage_whisper, ensure_slot_worker_running, get_security_config, get_slot_runtime,
    get_total_live_client_count, list_stage_slots, record_companion_heartbeat, remove_stage_slot,
    send_stage_whisper, set_slot_blackout, set_slot_freeze, trigger_slot_flash, upsert_stage_slot,
    verify_access_key_or_pin, CreateOrUpdateSlotInput, StageBroadcastPacket,
};
use super::web_views::{render_companion_director_html, render_stage_receiver_html};

static SERVER_BOUND_OK: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionServerStatus {
    pub is_running: bool,
    pub port: u16,
    pub host: String,
    pub interfaces: Vec<NetworkAdapterInfo>,
    pub active_pin: String,
    pub session_token: String,
    pub pin_lock_enabled: bool,
    pub client_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionDisplayPayload {
    pub id: String,
    pub os_index: u32,
    pub name: String,
    pub custom_alias: String,
    pub stage_zone: String,
    pub port_type: String,
    pub width: u32,
    pub height: u32,
    pub refresh_rate_hz: u32,
    pub is_primary: bool,
    pub is_frozen: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bounds_x: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bounds_y: Option<i32>,
}

static SYNCED_DISPLAYS: LazyLock<Mutex<Vec<CompanionDisplayPayload>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));

pub fn update_synced_displays(displays: Vec<CompanionDisplayPayload>) {
    if let Ok(mut lock) = SYNCED_DISPLAYS.lock() {
        *lock = displays;
    }
}

pub fn get_synced_displays() -> Vec<CompanionDisplayPayload> {
    if let Ok(lock) = SYNCED_DISPLAYS.lock() {
        if !lock.is_empty() {
            return lock.clone();
        }
    }
    let raw = crate::display::windows_capture::enumerate_real_windows_displays();
    raw.into_iter()
        .enumerate()
        .map(|(idx, d)| {
            let (bx, by) = if let Some(ref b) = d.bounds {
                (Some(b.x), Some(b.y))
            } else {
                (None, None)
            };
            CompanionDisplayPayload {
                id: d.id,
                os_index: (idx + 1) as u32,
                name: d.name,
                custom_alias: d.custom_alias,
                stage_zone: d.stage_zone,
                port_type: d.port_type,
                width: d.width,
                height: d.height,
                refresh_rate_hz: d.refresh_rate_hz,
                is_primary: idx == 0,
                is_frozen: false,
                bounds_x: bx,
                bounds_y: by,
            }
        })
        .collect()
}

#[derive(Clone)]
pub struct AppState {
    pub app_handle: Option<tauri::AppHandle>,
}

pub fn get_companion_status() -> CompanionServerStatus {
    let interfaces = list_network_interfaces();
    let host = interfaces
        .first()
        .map(|i| i.ip.clone())
        .unwrap_or_else(get_preferred_lan_ip);
    let sec = get_security_config();

    CompanionServerStatus {
        is_running: SERVER_BOUND_OK.load(Ordering::Relaxed),
        port: 8765,
        host,
        interfaces,
        active_pin: sec.active_pin,
        session_token: sec.session_token,
        pin_lock_enabled: sec.pin_lock_enabled,
        client_count: get_total_live_client_count(),
    }
}

pub fn build_companion_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/", get(serve_mobile_ui))
        .route("/stage/:slot_id", get(serve_stage_ui))
        .route("/ws/stage/:slot_id", get(ws_stage_handler))
        .route("/api/status", get(api_status))
        .route("/api/network-interfaces", get(api_network_interfaces))
        .route("/api/auth/check", get(api_auth_check))
        .route("/api/auth/verify", post(api_auth_verify))
        .route("/api/displays", get(api_displays))
        .route("/api/flash/:id", post(api_flash))
        .route("/api/windows", get(api_windows))
        .route("/api/windows/route", post(api_route_window))
        .route("/api/windows/restore", post(api_restore_window))
        .route("/api/windows/recall", post(api_recall_windows))
        .route("/api/stagelink/slots", get(api_list_slots).post(api_upsert_slot))
        .route("/api/stagelink/slots/:id", delete(api_delete_slot))
        .route("/api/stagelink/slots/:id/freeze", post(api_freeze_slot))
        .route("/api/stagelink/slots/:id/blackout", post(api_blackout_slot))
        .route("/api/stagelink/slots/:id/flash", post(api_flash_slot))
        .route("/api/stagelink/slots/:id/whisper", post(api_whisper_slot))
        .route(
            "/api/stagelink/slots/:id/whisper/clear",
            post(api_clear_whisper_slot),
        )
        .layer(cors)
        .with_state(state)
}

pub async fn start_companion_server_with_handle(app_handle: tauri::AppHandle) {
    let port = 8765;
    let state = AppState {
        app_handle: Some(app_handle),
    };
    let app = build_companion_router(state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
        SERVER_BOUND_OK.store(true, Ordering::SeqCst);
        println!(
            "🚀 [Xteon Companion & StageLink] Live Server listening on http://{}:{}",
            get_preferred_lan_ip(),
            port
        );
        let _ = axum::serve(listener, app).await;
        SERVER_BOUND_OK.store(false, Ordering::SeqCst);
    }
}

fn check_query_auth(params: &HashMap<String, String>) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    let key = params.get("key").map(|s| s.as_str()).unwrap_or("");
    if verify_access_key_or_pin(key) {
        if let Some(cid) = params.get("cid") {
            record_companion_heartbeat(cid);
        }
        Ok(())
    } else {
        Err((
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "PIN or QR Session Key required" })),
        ))
    }
}

async fn serve_mobile_ui() -> Html<&'static str> {
    Html(render_companion_director_html())
}

async fn serve_stage_ui(Path(slot_id): Path<String>) -> Html<String> {
    Html(render_stage_receiver_html(&slot_id))
}

async fn ws_stage_handler(
    Path(slot_id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    let key = params.get("key").map(|s| s.as_str()).unwrap_or("");
    if !verify_access_key_or_pin(key) {
        return (
            StatusCode::UNAUTHORIZED,
            "PIN or QR Session Key required",
        )
            .into_response();
    }
    let cid = params.get("cid").cloned().unwrap_or_else(|| "guest".to_string());
    ws.on_upgrade(move |socket| handle_stage_ws(socket, slot_id, cid))
        .into_response()
}

async fn handle_stage_ws(mut socket: WebSocket, slot_id: String, cid: String) {
    let Some(rt) = get_slot_runtime(&slot_id) else {
        return;
    };
    ensure_slot_worker_running(rt.clone());
    let mut rx = rt.tx.subscribe();

    // Send initial slot state immediately
    if let Ok(slot) = rt.slot.lock() {
        let mut public_slot = slot.clone();
        public_slot.preview_data_url = None;
        let payload = serde_json::json!({
            "type": "slot_state",
            "slot": public_slot,
        });
        let _ = socket.send(Message::Text(payload.to_string())).await;
    }

    loop {
        record_companion_heartbeat(&cid);
        tokio::select! {
            packet = rx.recv() => {
                match packet {
                    Ok(StageBroadcastPacket::BinaryFrame(bytes)) => {
                        if socket.send(Message::Binary((*bytes).clone())).await.is_err() {
                            break;
                        }
                    }
                    Ok(StageBroadcastPacket::JsonText(txt)) => {
                        if socket.send(Message::Text(txt)).await.is_err() {
                            break;
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => {
                        // Drop lagged frames to keep latency under 100ms
                        continue;
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                        break;
                    }
                }
            }
            client_msg = socket.recv() => {
                match client_msg {
                    Some(Ok(Message::Ping(p))) => {
                        if socket.send(Message::Pong(p)).await.is_err() {
                            break;
                        }
                    }
                    Some(Ok(Message::Close(_))) | None | Some(Err(_)) => {
                        break;
                    }
                    _ => {}
                }
            }
        }
    }
}

async fn api_status(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let mut status = get_companion_status();
    // Redact plaintext PIN and session token from HTTP responses
    status.session_token = String::new();
    status.active_pin = String::new();
    Ok(Json(serde_json::to_value(status).unwrap_or_default()))
}

async fn api_network_interfaces(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<NetworkAdapterInfo>>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    Ok(Json(list_network_interfaces()))
}

async fn api_auth_check(Query(params): Query<HashMap<String, String>>) -> impl IntoResponse {
    match check_query_auth(&params) {
        Ok(()) => (StatusCode::OK, Json(serde_json::json!({ "authorized": true }))),
        Err(e) => e,
    }
}

#[derive(Deserialize)]
struct VerifyPinBody {
    pin: String,
}

async fn api_auth_verify(Json(body): Json<VerifyPinBody>) -> impl IntoResponse {
    let trimmed = body.pin.trim();
    if !trimmed.is_empty() && verify_access_key_or_pin(trimmed) {
        let sec = get_security_config();
        (
            StatusCode::OK,
            Json(serde_json::json!({
                "authorized": true,
                "session_token": sec.session_token
            })),
        )
    } else {
        (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "authorized": false })),
        )
    }
}

async fn api_displays(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<crate::display::types::NativeDisplayInfo>>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let displays = crate::display::windows_capture::enumerate_real_windows_displays();
    Ok(Json(displays))
}

async fn api_flash(
    Path(id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> Result<(StatusCode, String), (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    println!("Mobile companion triggered flash on display: {}", id);
    if let Some(ref app_handle) = state.app_handle {
        let displays = crate::display::windows_capture::enumerate_real_windows_displays();
        if let Some(target) = displays.iter().find(|d| d.id == id || d.os_index.to_string() == id) {
            if let Some(ref bounds) = target.bounds {
                let display_title = format!("{} ({}x{})", target.custom_alias, target.width, target.height);
                let _ = crate::trigger_flash_native(
                    app_handle.clone(),
                    display_title,
                    bounds.x,
                    bounds.y,
                    bounds.width,
                    bounds.height,
                );
            }
        }
    }
    Ok((StatusCode::OK, format!("Flashed {id}")))
}

async fn api_windows(
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> Result<Json<Vec<crate::display::window_manager::CapturableWindow>>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let displays = state
        .app_handle
        .as_ref()
        .map(|h| crate::get_connected_displays(h.clone()));
    let wins = tokio::task::spawn_blocking(move || list_capturable_windows(displays))
        .await
        .unwrap_or_default();
    Ok(Json(wins))
}

#[derive(Deserialize)]
struct RouteWinReq {
    hwnd_id: String,
    display_id: String,
    borderless_fullscreen: Option<bool>,
    pin_to_stage: Option<bool>,
}

async fn api_route_window(
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
    Json(req): Json<RouteWinReq>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let displays = state
        .app_handle
        .as_ref()
        .map(|h| crate::get_connected_displays(h.clone()))
        .unwrap_or_else(crate::display::windows_capture::enumerate_real_windows_displays);

    let target = displays
        .iter()
        .find(|d| d.id == req.display_id || d.os_index.to_string() == req.display_id);

    let Some(disp) = target else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Target display not found" })),
        ));
    };

    let (tx, ty, tw, th) = if let Some(ref b) = disp.bounds {
        (b.x, b.y, b.width, b.height)
    } else {
        (0, 0, disp.width, disp.height)
    };

    let borderless = req.borderless_fullscreen.unwrap_or(true);
    let pin = req.pin_to_stage.unwrap_or(true);

    match route_window_to_display(&req.hwnd_id, tx, ty, tw, th, borderless, pin) {
        Ok(msg) => Ok(Json(serde_json::json!({ "ok": true, "message": msg }))),
        Err(err) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err })),
        )),
    }
}

#[derive(Deserialize)]
struct RestoreWinReq {
    hwnd_id: String,
}

async fn api_restore_window(
    Query(params): Query<HashMap<String, String>>,
    Json(req): Json<RestoreWinReq>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    match restore_window_behind(&req.hwnd_id) {
        Ok(msg) => Ok(Json(serde_json::json!({ "ok": true, "message": msg }))),
        Err(err) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err })),
        )),
    }
}

async fn api_recall_windows(
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let displays = state
        .app_handle
        .as_ref()
        .map(|h| crate::get_connected_displays(h.clone()))
        .unwrap_or_else(crate::display::windows_capture::enumerate_real_windows_displays);

    let rescued = recall_stray_windows_to_primary(&displays).unwrap_or(0);
    Ok(Json(serde_json::json!({ "ok": true, "rescued": rescued })))
}

async fn api_list_slots(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<super::stagelink::StageLinkSlot>>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    Ok(Json(list_stage_slots(false)))
}

async fn api_upsert_slot(
    Query(params): Query<HashMap<String, String>>,
    Json(input): Json<CreateOrUpdateSlotInput>,
) -> Result<Json<super::stagelink::StageLinkSlot>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let created = tokio::task::spawn_blocking(move || upsert_stage_slot(input))
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "Slot creation failed" })),
            )
        })?;
    Ok(Json(created))
}

async fn api_delete_slot(
    Path(id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let removed = remove_stage_slot(&id);
    Ok(Json(serde_json::json!({ "removed": removed })))
}

#[derive(Deserialize)]
struct FreezeBody {
    frozen: bool,
}

async fn api_freeze_slot(
    Path(id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
    Json(body): Json<FreezeBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let res = set_slot_freeze(&id, body.frozen);
    Ok(Json(serde_json::json!({ "slot": res })))
}

#[derive(Deserialize)]
struct BlackoutBody {
    blackout: bool,
}

async fn api_blackout_slot(
    Path(id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
    Json(body): Json<BlackoutBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let res = set_slot_blackout(&id, body.blackout);
    Ok(Json(serde_json::json!({ "slot": res })))
}

async fn api_flash_slot(
    Path(id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let res = trigger_slot_flash(&id);
    Ok(Json(serde_json::json!({ "slot": res })))
}

#[derive(Deserialize)]
struct WhisperBody {
    message: String,
    tone: Option<String>,
    duration_seconds: Option<u32>,
}

async fn api_whisper_slot(
    Path(id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
    Json(body): Json<WhisperBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let res = send_stage_whisper(
        &id,
        body.message,
        body.tone.unwrap_or_else(|| "WARN".to_string()),
        body.duration_seconds,
    );
    Ok(Json(serde_json::json!({ "slot": res })))
}

async fn api_clear_whisper_slot(
    Path(id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    check_query_auth(&params)?;
    let res = clear_stage_whisper(&id);
    Ok(Json(serde_json::json!({ "slot": res })))
}
