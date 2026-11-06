use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::{LazyLock, Mutex};

use super::types::NativeDisplayInfo;
use super::windows_capture::enumerate_real_windows_displays;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapturableWindow {
    pub hwnd_id: String,
    pub title: String,
    pub process_name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub is_minimized: bool,
    pub is_maximized: bool,
    pub is_borderless_snapped: bool,
    pub is_pinned_stage: bool,
    pub is_xteon_self: bool,
    pub display_id: Option<String>,
    pub display_os_index: Option<u32>,
}

#[derive(Debug, Clone)]
pub enum WindowCaptureOutcome {
    Frame {
        jpeg_bytes: Vec<u8>,
        width: u32,
        height: u32,
        checksum: u64,
    },
    Unchanged {
        checksum: u64,
    },
    Minimized,
    NotFound,
}

#[allow(dead_code)]
#[derive(Debug, Clone)]
struct SavedWindowStyle {
    style: i32,
    ex_style: i32,
    orig_x: i32,
    orig_y: i32,
    orig_w: i32,
    orig_h: i32,
    was_maximized: bool,
}

static SAVED_WINDOW_STYLES: LazyLock<Mutex<HashMap<isize, SavedWindowStyle>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

static PINNED_STAGE_WINDOWS: LazyLock<Mutex<HashSet<String>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

pub fn fnv1a_hash_64(bytes: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325;
    let len = bytes.len();
    let step = if len > 1024 { 12 } else { 3 };
    let mut i = 0;
    while i + 2 < len {
        // Sample all 3 channels (R, G, B) of pixel so green/cyan/amber countdown clock changes are reliably detected
        let chunk = (bytes[i] as u64) | ((bytes[i + 1] as u64) << 8) | ((bytes[i + 2] as u64) << 16);
        hash ^= chunk;
        hash = hash.wrapping_mul(0x100000001b3);
        i += step;
    }
    // Fold tail bytes and length into hash so short slices or partial chunks are never skipped
    for &b in &bytes[len.saturating_sub(12)..] {
        hash ^= b as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash ^= len as u64;
    hash = hash.wrapping_mul(0x100000001b3);
    hash
}

pub fn set_window_pinned_stage(hwnd_id: &str, pinned: bool) -> bool {
    if let Ok(mut set) = PINNED_STAGE_WINDOWS.lock() {
        if pinned {
            set.insert(hwnd_id.to_string());
        } else {
            set.remove(hwnd_id);
        }
        return pinned;
    }
    false
}

pub fn is_window_pinned(hwnd_id: &str) -> bool {
    if let Ok(set) = PINNED_STAGE_WINDOWS.lock() {
        return set.contains(hwnd_id);
    }
    false
}

fn match_window_to_display(
    wx: i32,
    wy: i32,
    ww: u32,
    wh: u32,
    displays: &[NativeDisplayInfo],
) -> (Option<String>, Option<u32>) {
    let cx = wx + (ww as i32) / 2;
    let cy = wy + (wh as i32) / 2;

    for d in displays {
        if let Some(ref b) = d.bounds {
            if cx >= b.x
                && cx < b.x + (b.width as i32)
                && cy >= b.y
                && cy < b.y + (b.height as i32)
            {
                return (Some(d.id.clone()), Some(d.os_index));
            }
        }
    }

    // Fallback: overlap check if center slightly outside bounds
    for d in displays {
        if let Some(ref b) = d.bounds {
            let ox = (wx.max(b.x)) < ((wx + ww as i32).min(b.x + b.width as i32));
            let oy = (wy.max(b.y)) < ((wy + wh as i32).min(b.y + b.height as i32));
            if ox && oy {
                return (Some(d.id.clone()), Some(d.os_index));
            }
        }
    }

    (None, None)
}

#[cfg(windows)]
mod win_impl {
    use super::*;
    use std::io::Cursor;
    use windows_sys::Win32::Foundation::{BOOL, CloseHandle, HWND, LPARAM, RECT};
    use windows_sys::Win32::Graphics::Dwm::{
        DWMWA_CLOAKED, DWMWA_EXTENDED_FRAME_BOUNDS, DwmGetWindowAttribute,
    };
    use windows_sys::Win32::Graphics::Gdi::{
        BITMAPINFO, BITMAPINFOHEADER, BI_RGB, BitBlt, CreateCompatibleBitmap, CreateCompatibleDC,
        DIB_RGB_COLORS, DeleteDC, DeleteObject, GetDC, GetDIBits, GetWindowDC, ReleaseDC, SRCCOPY,
        SelectObject,
    };
    use windows_sys::Win32::Storage::Xps::PrintWindow;
    use windows_sys::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION, QueryFullProcessImageNameW,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GWL_EXSTYLE, GWL_STYLE, GetClassNameW, GetWindowLongW, GetWindowRect,
        GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId, HWND_TOP, IsIconic,
        IsWindow, IsWindowVisible, IsZoomed, SW_MAXIMIZE, SW_RESTORE, SW_SHOWNOACTIVATE,
        SWP_FRAMECHANGED, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SWP_SHOWWINDOW,
        SetWindowLongW, SetWindowPos, ShowWindow, WS_CAPTION, WS_EX_APPWINDOW, WS_EX_TOOLWINDOW,
        WS_MAXIMIZEBOX, WS_MINIMIZEBOX, WS_POPUP, WS_SYSMENU, WS_THICKFRAME,
    };

    const PW_RENDERFULLCONTENT_FLAG: u32 = 0x00000002;

    fn query_process_exe_name(pid: u32) -> String {
        if pid == 0 {
            return String::new();
        }
        unsafe {
            let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
            if handle.is_null() {
                return format!("PID {}", pid);
            }
            let mut buf = [0u16; 512];
            let mut size = buf.len() as u32;
            let ok = QueryFullProcessImageNameW(handle, 0, buf.as_mut_ptr(), &mut size);
            CloseHandle(handle);
            if ok != 0 && size > 0 {
                let full_path = String::from_utf16_lossy(&buf[..size as usize]);
                return full_path
                    .rsplit(['\\', '/'])
                    .next()
                    .unwrap_or(&full_path)
                    .to_string();
            }
            format!("PID {}", pid)
        }
    }

    fn is_window_cloaked(hwnd: HWND) -> bool {
        unsafe {
            let mut cloaked: u32 = 0;
            let hr = DwmGetWindowAttribute(
                hwnd,
                DWMWA_CLOAKED as _,
                &mut cloaked as *mut _ as *mut _,
                std::mem::size_of::<u32>() as u32,
            );
            hr == 0 && cloaked != 0
        }
    }

    fn get_visible_frame_rect(hwnd: HWND) -> Option<RECT> {
        unsafe {
            let mut ext_rect: RECT = std::mem::zeroed();
            let hr = DwmGetWindowAttribute(
                hwnd,
                DWMWA_EXTENDED_FRAME_BOUNDS as _,
                &mut ext_rect as *mut _ as *mut _,
                std::mem::size_of::<RECT>() as u32,
            );
            if hr == 0 && ext_rect.right > ext_rect.left && ext_rect.bottom > ext_rect.top {
                return Some(ext_rect);
            }
            let mut rect: RECT = std::mem::zeroed();
            if GetWindowRect(hwnd, &mut rect) != 0 {
                return Some(rect);
            }
            None
        }
    }

    unsafe extern "system" fn enum_windows_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let vec_ptr = lparam as *mut Vec<HWND>;
        if vec_ptr.is_null() {
            return 0;
        }

        if IsWindowVisible(hwnd) == 0 {
            return 1;
        }

        if is_window_cloaked(hwnd) {
            return 1;
        }

        let title_len = GetWindowTextLengthW(hwnd);
        if title_len <= 0 {
            return 1;
        }

        let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
        let is_tool = (ex_style & (WS_EX_TOOLWINDOW as i32)) != 0;
        let is_app = (ex_style & (WS_EX_APPWINDOW as i32)) != 0;
        if is_tool && !is_app {
            return 1;
        }

        let mut class_buf = [0u16; 128];
        let class_len = GetClassNameW(hwnd, class_buf.as_mut_ptr(), class_buf.len() as i32);
        if class_len > 0 {
            let class_name = String::from_utf16_lossy(&class_buf[..class_len as usize]);
            if matches!(
                class_name.as_str(),
                "Progman"
                    | "WorkerW"
                    | "Shell_TrayWnd"
                    | "Shell_SecondaryTrayWnd"
                    | "Windows.UI.Core.CoreWindow"
            ) {
                return 1;
            }
        }

        (*vec_ptr).push(hwnd);
        1
    }

    pub fn enumerate_windows(displays: &[NativeDisplayInfo]) -> Vec<CapturableWindow> {
        let mut raw_hwnds: Vec<HWND> = Vec::new();
        let self_pid = std::process::id();

        unsafe {
            EnumWindows(
                Some(enum_windows_proc),
                &mut raw_hwnds as *mut Vec<HWND> as LPARAM,
            );
        }

        let snapped_set: HashSet<isize> = SAVED_WINDOW_STYLES
            .lock()
            .map(|m| m.keys().copied().collect())
            .unwrap_or_default();

        let pinned_set: HashSet<String> = PINNED_STAGE_WINDOWS
            .lock()
            .map(|s| s.clone())
            .unwrap_or_default();

        let mut out = Vec::new();

        for hwnd in raw_hwnds {
            unsafe {
                let len = GetWindowTextLengthW(hwnd);
                if len <= 0 {
                    continue;
                }
                let mut title_buf = vec![0u16; (len + 1) as usize];
                let read = GetWindowTextW(hwnd, title_buf.as_mut_ptr(), len + 1);
                if read <= 0 {
                    continue;
                }
                let title = String::from_utf16_lossy(&title_buf[..read as usize])
                    .trim()
                    .to_string();
                if title.is_empty()
                    || title == "Program Manager"
                    || title == "Windows Input Experience"
                    || title == "Settings" && is_window_cloaked(hwnd)
                    || title.starts_with("⚡ Xteon Screen Identifier")
                    || title.starts_with("🎛️ Xteon Test Pattern")
                {
                    continue;
                }

                let is_minimized = IsIconic(hwnd) != 0;
                let is_maximized = IsZoomed(hwnd) != 0;

                let (x, y, width, height) = if is_minimized {
                    (0, 0, 0, 0)
                } else if let Some(rect) = get_visible_frame_rect(hwnd) {
                    let w = (rect.right - rect.left).max(0) as u32;
                    let h = (rect.bottom - rect.top).max(0) as u32;
                    if w < 100 || h < 60 {
                        continue;
                    }
                    (rect.left, rect.top, w, h)
                } else {
                    continue;
                };

                let mut pid: u32 = 0;
                GetWindowThreadProcessId(hwnd, &mut pid);
                let process_name = query_process_exe_name(pid);
                let is_xteon_self = pid == self_pid;

                let hwnd_isize = hwnd as isize;
                let hwnd_id = hwnd_isize.to_string();

                let (display_id, display_os_index) = if is_minimized {
                    (None, None)
                } else {
                    match_window_to_display(x, y, width, height, displays)
                };

                out.push(CapturableWindow {
                    is_pinned_stage: pinned_set.contains(&hwnd_id),
                    is_borderless_snapped: snapped_set.contains(&hwnd_isize),
                    hwnd_id,
                    title,
                    process_name,
                    x,
                    y,
                    width,
                    height,
                    is_minimized,
                    is_maximized,
                    is_xteon_self,
                    display_id,
                    display_os_index,
                });
            }
        }

        out
    }

    pub fn capture_window_jpeg(
        hwnd_id: &str,
        max_target_width: u32,
        jpeg_quality: u8,
        prev_checksum: Option<u64>,
    ) -> WindowCaptureOutcome {
        let Ok(hwnd_val) = hwnd_id.parse::<isize>() else {
            return WindowCaptureOutcome::NotFound;
        };
        let hwnd = hwnd_val as HWND;

        unsafe {
            if IsWindow(hwnd) == 0 {
                return WindowCaptureOutcome::NotFound;
            }
            if IsIconic(hwnd) != 0 {
                return WindowCaptureOutcome::Minimized;
            }

            let mut win_rect: RECT = std::mem::zeroed();
            if GetWindowRect(hwnd, &mut win_rect) == 0 {
                return WindowCaptureOutcome::NotFound;
            }

            let raw_w = (win_rect.right - win_rect.left).max(0) as u32;
            let raw_h = (win_rect.bottom - win_rect.top).max(0) as u32;
            if raw_w < 16 || raw_h < 16 || raw_w > 16384 || raw_h > 16384 {
                return WindowCaptureOutcome::NotFound;
            }

            // Compute DWM visible crop inset to strip invisible Windows 10/11 drop-shadow borders
            let mut ext_rect: RECT = win_rect;
            let _ = DwmGetWindowAttribute(
                hwnd,
                DWMWA_EXTENDED_FRAME_BOUNDS as _,
                &mut ext_rect as *mut _ as *mut _,
                std::mem::size_of::<RECT>() as u32,
            );
            let crop_left = (ext_rect.left - win_rect.left).clamp(0, raw_w as i32 / 4) as u32;
            let crop_top = (ext_rect.top - win_rect.top).clamp(0, raw_h as i32 / 4) as u32;
            let crop_right = (win_rect.right - ext_rect.right).clamp(0, raw_w as i32 / 4) as u32;
            let crop_bottom = (win_rect.bottom - ext_rect.bottom).clamp(0, raw_h as i32 / 4) as u32;

            let vis_w = raw_w
                .saturating_sub(crop_left + crop_right)
                .max(16)
                .min(raw_w);
            let vis_h = raw_h
                .saturating_sub(crop_top + crop_bottom)
                .max(16)
                .min(raw_h);

            let hdc_screen = GetDC(std::ptr::null_mut());
            if hdc_screen.is_null() {
                return WindowCaptureOutcome::NotFound;
            }

            let hdc_mem = CreateCompatibleDC(hdc_screen);
            if hdc_mem.is_null() {
                ReleaseDC(std::ptr::null_mut(), hdc_screen);
                return WindowCaptureOutcome::NotFound;
            }

            let h_bitmap = CreateCompatibleBitmap(hdc_screen, raw_w as i32, raw_h as i32);
            if h_bitmap.is_null() {
                DeleteDC(hdc_mem);
                ReleaseDC(std::ptr::null_mut(), hdc_screen);
                return WindowCaptureOutcome::NotFound;
            }

            let old_obj = SelectObject(hdc_mem, h_bitmap as _);

            // Capture hardware-accelerated DWM surface even when occluded behind other windows
            let mut captured = PrintWindow(hwnd, hdc_mem, PW_RENDERFULLCONTENT_FLAG);
            if captured == 0 {
                captured = PrintWindow(hwnd, hdc_mem, 0);
            }
            if captured == 0 {
                let hdc_win = GetWindowDC(hwnd);
                if !hdc_win.is_null() {
                    let _ = BitBlt(
                        hdc_mem,
                        0,
                        0,
                        raw_w as i32,
                        raw_h as i32,
                        hdc_win,
                        0,
                        0,
                        SRCCOPY,
                    );
                    ReleaseDC(hwnd, hdc_win);
                }
            }

            // Unselect bitmap before GetDIBits per Win32 GDI contract
            SelectObject(hdc_mem, old_obj);

            let mut bmi: BITMAPINFO = std::mem::zeroed();
            bmi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
            bmi.bmiHeader.biWidth = raw_w as i32;
            bmi.bmiHeader.biHeight = raw_h as i32; // bottom-up DIB
            bmi.bmiHeader.biPlanes = 1;
            bmi.bmiHeader.biBitCount = 32;
            bmi.bmiHeader.biCompression = BI_RGB as u32;

            let mut raw_bgra: Vec<u8> = vec![0u8; (raw_w * raw_h * 4) as usize];
            let lines = GetDIBits(
                hdc_screen,
                h_bitmap,
                0,
                raw_h,
                raw_bgra.as_mut_ptr() as *mut _,
                &mut bmi,
                DIB_RGB_COLORS,
            );

            // Mandatory GDI cleanup on all code paths
            DeleteObject(h_bitmap as _);
            DeleteDC(hdc_mem);
            ReleaseDC(std::ptr::null_mut(), hdc_screen);

            if lines == 0 {
                return WindowCaptureOutcome::NotFound;
            }

            let clamp_max = max_target_width.clamp(320, 1920);
            let (target_w, target_h) = if vis_w > clamp_max {
                let scale = clamp_max as f32 / vis_w as f32;
                (clamp_max, ((vis_h as f32 * scale).round() as u32).max(2))
            } else {
                (vis_w, vis_h)
            };

            let mut rgb_buffer = vec![0u8; (target_w * target_h * 3) as usize];
            let x_ratio = (vis_w as u64 * 65536) / target_w as u64;
            let y_ratio = (vis_h as u64 * 65536) / target_h as u64;

            for ty in 0..target_h {
                let sample_vis_y = crop_top + (((ty as u64 * y_ratio) >> 16) as u32);
                let sy = raw_h.saturating_sub(1).saturating_sub(sample_vis_y) as usize;
                let src_row = sy * (raw_w as usize) * 4;
                let dst_row = (ty as usize) * (target_w as usize) * 3;

                for tx in 0..target_w {
                    let sx = (crop_left as usize) + (((tx as u64 * x_ratio) >> 16) as usize);
                    let src_idx = src_row + sx * 4;
                    let dst_idx = dst_row + (tx as usize) * 3;

                    rgb_buffer[dst_idx] = raw_bgra[src_idx + 2];
                    rgb_buffer[dst_idx + 1] = raw_bgra[src_idx + 1];
                    rgb_buffer[dst_idx + 2] = raw_bgra[src_idx];
                }
            }

            let checksum = fnv1a_hash_64(&rgb_buffer);
            if prev_checksum == Some(checksum) {
                return WindowCaptureOutcome::Unchanged { checksum };
            }

            let mut jpeg_bytes = Vec::with_capacity((target_w * target_h / 4) as usize);
            let mut writer = Cursor::new(&mut jpeg_bytes);
            let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
                &mut writer,
                jpeg_quality.clamp(40, 95),
            );
            if encoder
                .encode(
                    &rgb_buffer,
                    target_w,
                    target_h,
                    image::ExtendedColorType::Rgb8,
                )
                .is_err()
            {
                return WindowCaptureOutcome::NotFound;
            }

            WindowCaptureOutcome::Frame {
                jpeg_bytes,
                width: target_w,
                height: target_h,
                checksum,
            }
        }
    }

    pub fn restore_window_in_background(hwnd_id: &str) -> Result<String, String> {
        let hwnd_val = hwnd_id
            .parse::<isize>()
            .map_err(|_| "Invalid window handle".to_string())?;
        let hwnd = hwnd_val as HWND;

        unsafe {
            if IsWindow(hwnd) == 0 {
                return Err("Target window is no longer open".to_string());
            }
            ShowWindow(hwnd, SW_SHOWNOACTIVATE);
            // Place window at the bottom of the Z-order so it restores behind active FOH applications
            SetWindowPos(
                hwnd,
                1 as HWND, // HWND_BOTTOM
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_SHOWWINDOW,
            );
        }
        Ok("Window restored in background without stealing FOH focus".to_string())
    }

    pub fn route_window_to_bounds(
        hwnd_id: &str,
        target_x: i32,
        target_y: i32,
        target_w: u32,
        target_h: u32,
        borderless_fullscreen: bool,
        pin_to_stage: bool,
    ) -> Result<String, String> {
        let hwnd_val = hwnd_id
            .parse::<isize>()
            .map_err(|_| "Invalid window handle".to_string())?;
        let hwnd = hwnd_val as HWND;

        unsafe {
            if IsWindow(hwnd) == 0 {
                return Err("Target window is no longer open".to_string());
            }

            // Prevent trapping Xteon's own main control window in borderless mode
            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, &mut pid);
            let allow_borderless = borderless_fullscreen && pid != std::process::id();

            // Restore first if minimized or maximized so cross-DPI display move and saved rect are accurate
            let was_iconic = IsIconic(hwnd) != 0;
            let was_zoomed = IsZoomed(hwnd) != 0;
            if was_iconic || was_zoomed {
                ShowWindow(hwnd, SW_RESTORE);
            }

            // Save original window chrome & coordinates before first snap
            if let Ok(mut saved_map) = SAVED_WINDOW_STYLES.lock() {
                if !saved_map.contains_key(&hwnd_val) {
                    let mut orig_rect: RECT = std::mem::zeroed();
                    GetWindowRect(hwnd, &mut orig_rect);
                    let cur_style = GetWindowLongW(hwnd, GWL_STYLE);
                    let cur_ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);

                    saved_map.insert(
                        hwnd_val,
                        SavedWindowStyle {
                            style: cur_style,
                            ex_style: cur_ex_style,
                            orig_x: orig_rect.left,
                            orig_y: orig_rect.top,
                            orig_w: (orig_rect.right - orig_rect.left).max(640),
                            orig_h: (orig_rect.bottom - orig_rect.top).max(480),
                            was_maximized: was_zoomed,
                        },
                    );
                }
            }

            if allow_borderless {
                let cur_style = GetWindowLongW(hwnd, GWL_STYLE);
                let strip_mask = (WS_CAPTION
                    | WS_THICKFRAME
                    | WS_MINIMIZEBOX
                    | WS_MAXIMIZEBOX
                    | WS_SYSMENU) as i32;
                let new_style = (cur_style & !strip_mask) | (WS_POPUP as i32);
                SetWindowLongW(hwnd, GWL_STYLE, new_style);

                SetWindowPos(
                    hwnd,
                    HWND_TOP,
                    target_x,
                    target_y,
                    target_w as i32,
                    target_h as i32,
                    SWP_FRAMECHANGED | SWP_SHOWWINDOW | SWP_NOACTIVATE,
                );
            } else {
                // Restore normal window chrome if previously borderless
                if let Ok(mut saved_map) = SAVED_WINDOW_STYLES.lock() {
                    if let Some(saved) = saved_map.remove(&hwnd_val) {
                        SetWindowLongW(hwnd, GWL_STYLE, saved.style);
                        SetWindowLongW(hwnd, GWL_EXSTYLE, saved.ex_style);
                    }
                }

                SetWindowPos(
                    hwnd,
                    HWND_TOP,
                    target_x + 40,
                    target_y + 40,
                    (target_w.saturating_sub(80)).max(640) as i32,
                    (target_h.saturating_sub(80)).max(480) as i32,
                    SWP_FRAMECHANGED | SWP_SHOWWINDOW | SWP_NOACTIVATE,
                );
                ShowWindow(hwnd, SW_MAXIMIZE);
            }

            set_window_pinned_stage(hwnd_id, pin_to_stage);
        }

        Ok(format!(
            "Routed window {} to ({}, {}) {}x{}",
            hwnd_id, target_x, target_y, target_w, target_h
        ))
    }

    pub fn restore_single_window_to_primary(
        hwnd_id: &str,
        primary_x: i32,
        primary_y: i32,
        primary_w: u32,
        primary_h: u32,
    ) -> Result<(), String> {
        let hwnd_val = hwnd_id
            .parse::<isize>()
            .map_err(|_| "Invalid window handle".to_string())?;
        let hwnd = hwnd_val as HWND;

        unsafe {
            if IsWindow(hwnd) == 0 {
                return Err("Window closed".to_string());
            }

            if IsIconic(hwnd) != 0 || IsZoomed(hwnd) != 0 {
                ShowWindow(hwnd, SW_RESTORE);
            }

            let mut target_w = ((primary_w as f32 * 0.72) as i32).clamp(640, 1440);
            let mut target_h = ((primary_h as f32 * 0.75) as i32).clamp(480, 900);

            if let Ok(mut saved_map) = SAVED_WINDOW_STYLES.lock() {
                if let Some(saved) = saved_map.remove(&hwnd_val) {
                    SetWindowLongW(hwnd, GWL_STYLE, saved.style);
                    SetWindowLongW(hwnd, GWL_EXSTYLE, saved.ex_style);
                    target_w = saved.orig_w.clamp(480, primary_w as i32 - 40);
                    target_h = saved.orig_h.clamp(360, primary_h as i32 - 60);
                }
            }

            let dest_x = primary_x + ((primary_w as i32 - target_w) / 2).max(24);
            let dest_y = primary_y + ((primary_h as i32 - target_h) / 2).max(24);

            SetWindowPos(
                hwnd,
                HWND_TOP,
                dest_x,
                dest_y,
                target_w,
                target_h,
                SWP_FRAMECHANGED | SWP_SHOWWINDOW | SWP_NOACTIVATE,
            );

            set_window_pinned_stage(hwnd_id, false);
        }

        Ok(())
    }
}

#[cfg(target_os = "macos")]
mod mac_impl {
    use super::*;
    use std::process::Command;

    pub fn enumerate_windows(displays: &[NativeDisplayInfo]) -> Vec<CapturableWindow> {
        let script = r#"
            set output to ""
            tell application "System Events"
                set procs to every application process whose visible is true
                repeat with p in procs
                    set pName to name of p
                    try
                        repeat with w in windows of p
                            set wName to name of w
                            set {wx, wy} to position of w
                            set {ww, wh} to size of w
                            if wName is not "" and ww > 80 and wh > 60 then
                                set output to output & pName & "|||" & wName & "|||" & wx & "|||" & wy & "|||" & ww & "|||" & wh & linefeed
                            end if
                        end repeat
                    end try
                end repeat
            end tell
            return output
        "#;

        let Ok(res) = Command::new("osascript").arg("-e").arg(script).output() else {
            return Vec::new();
        };
        if !res.status.success() {
            return Vec::new();
        }

        let pinned_set: HashSet<String> = PINNED_STAGE_WINDOWS
            .lock()
            .map(|s| s.clone())
            .unwrap_or_default();

        let text = String::from_utf8_lossy(&res.stdout);
        let mut out = Vec::new();
        for (idx, line) in text.lines().enumerate() {
            let parts: Vec<&str> = line.split("|||").collect();
            if parts.len() == 6 {
                let proc_name = parts[0].trim().to_string();
                let title = parts[1].trim().to_string();
                let x = parts[2].trim().parse::<i32>().unwrap_or(0);
                let y = parts[3].trim().parse::<i32>().unwrap_or(0);
                let width = parts[4].trim().parse::<u32>().unwrap_or(800);
                let height = parts[5].trim().parse::<u32>().unwrap_or(600);
                let hwnd_id = format!("mac::{proc_name}::{title}::{idx}");
                let (display_id, display_os_index) =
                    match_window_to_display(x, y, width, height, displays);

                out.push(CapturableWindow {
                    is_pinned_stage: pinned_set.contains(&hwnd_id),
                    is_xteon_self: proc_name.to_lowercase().contains("xteon"),
                    hwnd_id,
                    title,
                    process_name: proc_name,
                    x,
                    y,
                    width,
                    height,
                    is_minimized: false,
                    is_maximized: false,
                    is_borderless_snapped: false,
                    display_id,
                    display_os_index,
                });
            }
        }
        out
    }

    pub fn move_mac_window(
        hwnd_id: &str,
        x: i32,
        y: i32,
        w: u32,
        h: u32,
    ) -> Result<String, String> {
        let parts: Vec<&str> = hwnd_id.split("::").collect();
        if parts.len() < 3 {
            return Err("Invalid macOS window identifier".to_string());
        }
        let proc_name = parts[1].replace('\\', "\\\\").replace('"', "\\\"");
        let win_title = parts[2].replace('\\', "\\\\").replace('"', "\\\"");
        let script = format!(
            r#"tell application "System Events" to tell process "{proc_name}"
                try
                    set position of window "{win_title}" to {{{x}, {y}}}
                    set size of window "{win_title}" to {{{w}, {h}}}
                end try
            end tell"#
        );
        let _ = Command::new("osascript").arg("-e").arg(script).output();
        Ok(format!("Moved {win_title} to ({x}, {y})"))
    }
}

pub fn enumerate_real_displays_fallback() -> Vec<NativeDisplayInfo> {
    enumerate_real_windows_displays()
}

pub fn list_capturable_windows(displays_override: Option<Vec<NativeDisplayInfo>>) -> Vec<CapturableWindow> {
    let displays = displays_override.unwrap_or_else(enumerate_real_windows_displays);

    #[cfg(windows)]
    {
        return win_impl::enumerate_windows(&displays);
    }

    #[cfg(target_os = "macos")]
    {
        return mac_impl::enumerate_windows(&displays);
    }

    #[cfg(not(any(windows, target_os = "macos")))]
    {
        let _ = displays;
        Vec::new()
    }
}

pub fn capture_window_frame_jpeg(
    hwnd_id: &str,
    max_target_width: u32,
    jpeg_quality: u8,
    prev_checksum: Option<u64>,
) -> WindowCaptureOutcome {
    #[cfg(windows)]
    {
        return win_impl::capture_window_jpeg(hwnd_id, max_target_width, jpeg_quality, prev_checksum);
    }

    #[cfg(not(windows))]
    {
        let _ = (hwnd_id, max_target_width, jpeg_quality, prev_checksum);
        WindowCaptureOutcome::NotFound
    }
}

pub fn restore_window_behind(hwnd_id: &str) -> Result<String, String> {
    #[cfg(windows)]
    {
        return win_impl::restore_window_in_background(hwnd_id);
    }

    #[cfg(target_os = "macos")]
    {
        let parts: Vec<&str> = hwnd_id.split("::").collect();
        if parts.len() >= 3 {
            let proc_name = parts[1].replace('\\', "\\\\").replace('"', "\\\"");
            let win_title = parts[2].replace('\\', "\\\\").replace('"', "\\\"");
            let script = format!(
                r#"tell application "System Events" to tell process "{proc_name}"
                    try
                        set miniaturized of window "{win_title}" to false
                    end try
                end tell"#
            );
            let _ = std::process::Command::new("osascript").arg("-e").arg(script).output();
            return Ok("Window un-minimized on macOS".to_string());
        }
        return Err("Invalid macOS window identifier".to_string());
    }

    #[cfg(not(any(windows, target_os = "macos")))]
    {
        let _ = hwnd_id;
        Err("Restore window behind is supported on Windows and macOS".to_string())
    }
}

pub fn route_window_to_display(
    hwnd_id: &str,
    target_x: i32,
    target_y: i32,
    target_w: u32,
    target_h: u32,
    borderless_fullscreen: bool,
    pin_to_stage: bool,
) -> Result<String, String> {
    #[cfg(windows)]
    {
        return win_impl::route_window_to_bounds(
            hwnd_id,
            target_x,
            target_y,
            target_w,
            target_h,
            borderless_fullscreen,
            pin_to_stage,
        );
    }

    #[cfg(target_os = "macos")]
    {
        set_window_pinned_stage(hwnd_id, pin_to_stage);
        let _ = borderless_fullscreen;
        return mac_impl::move_mac_window(hwnd_id, target_x, target_y, target_w, target_h);
    }

    #[cfg(not(any(windows, target_os = "macos")))]
    {
        let _ = (
            hwnd_id,
            target_x,
            target_y,
            target_w,
            target_h,
            borderless_fullscreen,
            pin_to_stage,
        );
        Err("OS window routing requires Windows or macOS".to_string())
    }
}

pub fn unroute_window_to_primary(
    hwnd_id: &str,
    displays: &[NativeDisplayInfo],
) -> Result<String, String> {
    let primary = displays
        .iter()
        .find(|d| d.os_index == 1)
        .or_else(|| displays.first());

    let (px, py, pw, ph) = if let Some(b) = primary.and_then(|p| p.bounds.as_ref()) {
        (b.x, b.y, b.width, b.height)
    } else {
        (0, 0, 1920, 1080)
    };

    #[cfg(windows)]
    {
        win_impl::restore_single_window_to_primary(hwnd_id, px, py, pw, ph)?;
        return Ok("Window returned to FOH primary screen".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        set_window_pinned_stage(hwnd_id, false);
        return mac_impl::move_mac_window(hwnd_id, px + 80, py + 60, (pw * 3 / 4).max(640), (ph * 3 / 4).max(480));
    }

    #[cfg(not(any(windows, target_os = "macos")))]
    {
        let _ = (hwnd_id, px, py, pw, ph);
        Err("OS window recall requires Windows or macOS".to_string())
    }
}

pub fn recall_stray_windows_to_primary(displays: &[NativeDisplayInfo]) -> Result<usize, String> {
    let windows = list_capturable_windows(Some(displays.to_vec()));
    let primary = displays
        .iter()
        .find(|d| d.os_index == 1)
        .or_else(|| displays.first());

    let (px, py, pw, ph) = if let Some(b) = primary.and_then(|p| p.bounds.as_ref()) {
        (b.x, b.y, b.width, b.height)
    } else {
        (0, 0, 1920, 1080)
    };

    let mut rescued = 0usize;
    for win in windows {
        // Pull external stage display windows (os_index > 1) AND windows left stranded in ghost/unplugged monitor coordinates
        let is_external_or_stranded = !win.is_minimized
            && !win.is_pinned_stage
            && !win.is_xteon_self
            && win.display_os_index != Some(1);

        if is_external_or_stranded {
            #[cfg(windows)]
            {
                if win_impl::restore_single_window_to_primary(&win.hwnd_id, px, py, pw, ph).is_ok() {
                    rescued += 1;
                }
            }
            #[cfg(target_os = "macos")]
            {
                if mac_impl::move_mac_window(&win.hwnd_id, px + 80, py + 60, (pw * 3 / 4).max(640), (ph * 3 / 4).max(480)).is_ok() {
                    rescued += 1;
                }
            }
        }
    }

    Ok(rescued)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_real_window_enumeration_and_fnv_hash() {
        let windows = list_capturable_windows(None);
        // Should execute cleanly against live OS without panicking
        println!("Live OS windows discovered: {}", windows.len());
        let h1 = fnv1a_hash_64(&[10, 20, 30, 40, 50, 60]);
        let h2 = fnv1a_hash_64(&[10, 20, 30, 99, 50, 60]);
        assert_ne!(h1, h2, "Checksum should detect pixel delta");
    }
}
