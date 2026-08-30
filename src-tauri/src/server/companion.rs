use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{Html, IntoResponse, Json},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::net::UdpSocket;
use std::sync::{Arc, Mutex};
use tauri::Emitter;
use tower_http::cors::{Any, CorsLayer};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionServerStatus {
    pub is_running: bool,
    pub port: u16,
    pub host: String,
    pub active_pin: String,
    pub client_count: usize,
}

#[derive(Clone)]
pub struct AppState {
    pub app_handle: Option<tauri::AppHandle>,
}

pub fn get_local_lan_ip() -> String {
    if let Ok(socket) = UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:80").is_ok() {
            if let Ok(addr) = socket.local_addr() {
                let ip = addr.ip().to_string();
                if ip != "0.0.0.0" {
                    return ip;
                }
            }
        }
    }
    "127.0.0.1".to_string()
}

pub fn get_companion_status() -> CompanionServerStatus {
    CompanionServerStatus {
        is_running: true,
        port: 8765,
        host: get_local_lan_ip(),
        active_pin: "842-190".to_string(),
        client_count: 1,
    }
}

pub async fn start_companion_server_with_handle(app_handle: tauri::AppHandle) {
    let port = 8765;
    let state = AppState {
        app_handle: Some(app_handle),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(serve_mobile_ui))
        .route("/api/status", get(api_status))
        .route("/api/displays", get(api_displays))
        .route("/api/flash/:id", post(api_flash))
        .layer(cors)
        .with_state(state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    println!("🚀 [Xteon Companion] Live HTTP Server listening on http://{}:{}", get_local_lan_ip(), port);

    if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
        let _ = axum::serve(listener, app).await;
    }
}

async fn serve_mobile_ui() -> Html<&'static str> {
    Html(r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Xteon Mobile Companion</title>
  <style>
    :root {
      --bg: #07090E;
      --card: #121622;
      --border: #232B3E;
      --cyan: #06B6D4;
      --amber: #F59E0B;
      --emerald: #10B981;
      --text: #F1F5F9;
      --muted: #64748B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 16px; min-height: 100vh; display: flex; flex-direction: column; gap: 16px; }
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .title { font-weight: 800; font-size: 16px; color: var(--cyan); letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
    .badge { font-size: 11px; background: rgba(16, 185, 129, 0.15); color: var(--emerald); padding: 3px 8px; border-radius: 999px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.3); }
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .card-title { font-size: 14px; font-weight: 700; color: var(--text); }
    .card-sub { font-size: 12px; color: var(--muted); }
    .btn-flash { background: rgba(245, 158, 11, 0.12); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.3); padding: 12px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .btn-flash:active { background: rgba(245, 158, 11, 0.25); transform: scale(0.98); }
    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--cyan); color: #000; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 12px; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">⚡ XTEON COMPANION</div>
    <div class="badge">LIVE CONNECTED</div>
  </div>

  <div id="displays-list" class="grid">
    <div class="card"><div class="card-sub">Scanning displays...</div></div>
  </div>

  <div id="toast" class="toast">Action sent!</div>

  <script>
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.style.opacity = '1';
      setTimeout(() => t.style.opacity = '0', 2000);
    }

    async function loadDisplays() {
      try {
        const res = await fetch('/api/displays');
        const displays = await res.json();
        const container = document.getElementById('displays-list');
        container.innerHTML = displays.map(d => `
          <div class="card">
            <div>
              <div class="card-title">Screen ${d.os_index}: ${d.custom_alias || d.name}</div>
              <div class="card-sub">${d.width}x${d.height} @ ${d.refresh_rate_hz}Hz • ${d.port_type}</div>
            </div>
            <button class="btn-flash" onclick="flashDisplay('${d.id}')">⚡ Flash Screen (${d.os_index})</button>
          </div>
        `).join('');
      } catch (e) {}
    }

    async function flashDisplay(id) {
      showToast('⚡ Flashing screen...');
      await fetch('/api/flash/' + id, { method: 'POST' });
    }

    loadDisplays();
    setInterval(loadDisplays, 3000);
  </script>
</body>
</html>"#)
}

async fn api_status(_state: State<AppState>) -> impl IntoResponse {
    let status = get_companion_status();
    Json(status)
}

async fn api_displays() -> impl IntoResponse {
    let displays = crate::display::windows_capture::enumerate_real_windows_displays();
    Json(displays)
}

async fn api_flash(Path(id): Path<String>, State(state): State<AppState>) -> impl IntoResponse {
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
    (StatusCode::OK, format!("Flashed {}", id))
}
