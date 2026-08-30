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
fn get_connected_displays() -> Vec<NativeDisplayInfo> {
    enumerate_real_windows_displays()
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
            close_all_overlays
        ])
        .run(tauri::generate_context!())
        .expect("error while running xteon application");
}

