use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{Html, IntoResponse, Json},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::net::UdpSocket;
use std::sync::{Arc, Mutex, LazyLock};
use tower_http::cors::{Any, CorsLayer};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionServerStatus {
    pub is_running: bool,
    pub port: u16,
    pub host: String,
    pub active_pin: String,
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

static SYNCED_DISPLAYS: LazyLock<Mutex<Vec<CompanionDisplayPayload>>> = LazyLock::new(|| Mutex::new(Vec::new()));

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
    // Fallback to normalized hardware enumeration
    let raw = crate::display::windows_capture::enumerate_real_windows_displays();
    raw.into_iter().enumerate().map(|(idx, d)| {
        let (bx, by) = if let Some(ref b) = d.bounds { (Some(b.x), Some(b.y)) } else { (None, None) };
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
    }).collect()
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
      --header-bg: #0B0F19;
      --card: #111624;
      --card-border: #1E2738;
      --cyan: #06B6D4;
      --amber: #F59E0B;
      --emerald: #10B981;
      --rose: #F43F5E;
      --text: #F8FAFC;
      --muted: #94A3B8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
    body { background: var(--bg); color: var(--text); padding: 14px; min-height: 100vh; display: flex; flex-direction: column; gap: 14px; }
    .header { background: var(--header-bg); border: 1px solid var(--card-border); padding: 12px 16px; border-radius: 14px; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #06B6D4, #3B82F6); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; color: #000; }
    .title { font-weight: 800; font-size: 15px; color: var(--text); letter-spacing: 0.5px; }
    .subtitle { font-size: 11px; color: var(--muted); }
    .badge-live { font-size: 11px; background: rgba(16, 185, 129, 0.15); color: var(--emerald); padding: 4px 10px; border-radius: 999px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; gap: 6px; }
    .pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--emerald); box-shadow: 0 0 8px var(--emerald); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .card { background: var(--card); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 12px; transition: border-color 0.2s; }
    .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .tag-screen { font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
    .tag-primary { background: rgba(6, 182, 212, 0.15); color: var(--cyan); border: 1px solid rgba(6, 182, 212, 0.3); }
    .tag-wireless { background: rgba(245, 158, 11, 0.15); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.3); }
    .tag-external { background: rgba(59, 130, 246, 0.15); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); }
    .card-title { font-size: 15px; font-weight: 800; color: var(--text); line-height: 1.3; margin-top: 4px; }
    .card-zone { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .card-specs { font-size: 11px; color: var(--muted); background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
    .btn-flash { background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(245, 158, 11, 0.08)); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.4); padding: 12px 16px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s; }
    .btn-flash:active { background: rgba(245, 158, 11, 0.3); transform: scale(0.98); }
    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--cyan); color: #000; padding: 10px 20px; border-radius: 999px; font-weight: 800; font-size: 12px; opacity: 0; transition: opacity 0.2s; pointer-events: none; box-shadow: 0 4px 20px rgba(6,182,212,0.4); }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="logo">XT</div>
      <div>
        <div class="title">XTEON MOBILE</div>
        <div class="subtitle">Live Display Director</div>
      </div>
    </div>
    <div class="badge-live">
      <div class="pulse-dot"></div>
      <span>CONNECTED</span>
    </div>
  </div>

  <div id="displays-list" class="grid">
    <div class="card"><div class="card-zone">Synchronizing with Live Monitor...</div></div>
  </div>

  <div id="toast" class="toast">⚡ Flash Signal Triggered</div>

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
        
        if (!displays || displays.length === 0) {
          container.innerHTML = '<div class="card"><div class="card-zone">No active displays detected</div></div>';
          return;
        }

        container.innerHTML = displays.map(d => {
          const isPrimary = d.is_primary || d.os_index === 1;
          const isWireless = (d.port_type || '').toUpperCase() === 'WIRELESS';
          const tagClass = isPrimary ? 'tag-primary' : (isWireless ? 'tag-wireless' : 'tag-external');
          const tagLabel = isPrimary ? 'PRIMARY WORKSTATION' : (isWireless ? 'WIRELESS MOBILE' : d.port_type);
          const alias = d.custom_alias || d.name || ('Screen ' + d.os_index);
          const zone = d.stage_zone ? ('📍 ' + d.stage_zone) : '📍 Stage Area';

          return `
            <div class="card">
              <div class="card-top">
                <div>
                  <span class="tag-screen ${tagClass}">Screen ${d.os_index} • ${tagLabel}</span>
                  <div class="card-title">${alias}</div>
                  <div class="card-zone">${zone}</div>
                </div>
              </div>
              <div class="card-specs">
                📐 ${d.width}x${d.height} @ ${d.refresh_rate_hz}Hz • ${d.port_type}
              </div>
              <button class="btn-flash" onclick="flashDisplay('${d.id}')">
                ⚡ Flash Screen ${d.os_index}
              </button>
            </div>
          `;
        }).join('');
      } catch (e) {
        console.error('Display sync failed:', e);
      }
    }

    async function flashDisplay(id) {
      showToast('⚡ Flashing screen identification...');
      try {
        await fetch('/api/flash/' + encodeURIComponent(id), { method: 'POST' });
      } catch(e) {}
    }

    loadDisplays();
    setInterval(loadDisplays, 2000);
  </script>
</body>
</html>"#)
}

async fn api_status(_state: State<AppState>) -> impl IntoResponse {
    let status = get_companion_status();
    Json(status)
}

async fn api_displays() -> impl IntoResponse {
    let displays = get_synced_displays();
    Json(displays)
}

async fn api_flash(Path(id): Path<String>, State(state): State<AppState>) -> impl IntoResponse {
    println!("Mobile companion triggered flash on display: {}", id);
    if let Some(ref app_handle) = state.app_handle {
        let synced = get_synced_displays();
        let target = synced.iter().find(|d| d.id == id || d.os_index.to_string() == id);
        
        let raw_displays = crate::display::windows_capture::enumerate_real_windows_displays();
        let fallback_target = raw_displays.iter().find(|d| d.id == id || d.os_index.to_string() == id);

        if let Some(target) = target {
            let (bx, by, bw, bh) = if let (Some(x), Some(y)) = (target.bounds_x, target.bounds_y) {
                (x, y, target.width, target.height)
            } else if let Some(fb) = fallback_target.and_then(|f| f.bounds.as_ref()) {
                (fb.x, fb.y, fb.width, fb.height)
            } else {
                (0, 0, target.width, target.height)
            };

            let display_title = format!("Screen {}: {} ({}x{})", target.os_index, target.custom_alias, target.width, target.height);
            let _ = crate::trigger_flash_native(
                app_handle.clone(),
                display_title,
                bx,
                by,
                bw,
                bh,
            );
        } else if let Some(target) = fallback_target {
            if let Some(ref bounds) = target.bounds {
                let display_title = format!("Screen {}: {} ({}x{})", target.os_index, target.custom_alias, target.width, target.height);
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

