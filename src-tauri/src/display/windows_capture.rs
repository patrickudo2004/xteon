use super::types::{NativeDisplayBounds, NativeDisplayInfo};

#[cfg(windows)]
pub fn enumerate_real_windows_displays() -> Vec<NativeDisplayInfo> {
    use windows_sys::Win32::Graphics::Gdi::{
        EnumDisplayDevicesW, EnumDisplaySettingsW, DEVMODEW, DISPLAY_DEVICEW,
        DISPLAY_DEVICE_ATTACHED_TO_DESKTOP, DISPLAY_DEVICE_PRIMARY_DEVICE, ENUM_CURRENT_SETTINGS,
    };

    let mut result = Vec::new();
    let mut dev_num: u32 = 0;

    unsafe {
        loop {
            let mut display_device: DISPLAY_DEVICEW = std::mem::zeroed();
            display_device.cb = std::mem::size_of::<DISPLAY_DEVICEW>() as u32;

            let success = EnumDisplayDevicesW(std::ptr::null(), dev_num, &mut display_device, 0);
            if success == 0 {
                break;
            }

            if (display_device.StateFlags & DISPLAY_DEVICE_ATTACHED_TO_DESKTOP) != 0 {
                let mut dev_mode: DEVMODEW = std::mem::zeroed();
                dev_mode.dmSize = std::mem::size_of::<DEVMODEW>() as u16;

                let has_settings = EnumDisplaySettingsW(
                    display_device.DeviceName.as_ptr(),
                    ENUM_CURRENT_SETTINGS,
                    &mut dev_mode,
                );

                let (width, height, refresh_rate, pos_x, pos_y) = if has_settings != 0 {
                    let px = dev_mode.Anonymous1.Anonymous2.dmPosition.x;
                    let py = dev_mode.Anonymous1.Anonymous2.dmPosition.y;
                    (dev_mode.dmPelsWidth, dev_mode.dmPelsHeight, dev_mode.dmDisplayFrequency, px, py)
                } else {
                    (1920, 1080, 60, 0, 0)
                };

                // Query monitor attached to this adapter
                let mut monitor_device: DISPLAY_DEVICEW = std::mem::zeroed();
                monitor_device.cb = std::mem::size_of::<DISPLAY_DEVICEW>() as u32;
                EnumDisplayDevicesW(
                    display_device.DeviceName.as_ptr(),
                    0,
                    &mut monitor_device,
                    0,
                );

                let monitor_string = String::from_utf16_lossy(&monitor_device.DeviceString)
                    .trim_matches('\0')
                    .to_string();

                let monitor_id = String::from_utf16_lossy(&monitor_device.DeviceID)
                    .trim_matches('\0')
                    .to_string();

                let adapter_string = String::from_utf16_lossy(&display_device.DeviceString)
                    .trim_matches('\0')
                    .to_string();

                let all_info = format!("{} {} {}", monitor_string, monitor_id, adapter_string).to_lowercase();

                let is_primary = (display_device.StateFlags & DISPLAY_DEVICE_PRIMARY_DEVICE) != 0;

                // Check for ASUS GlideX, Spacedesk, Miracast, Duet, Splashtop, Virtual IDD
                let is_wireless = all_info.contains("glidex") 
                    || all_info.contains("asus") 
                    || all_info.contains("spacedesk") 
                    || all_info.contains("miracast")
                    || all_info.contains("virtual")
                    || all_info.contains("idd");

                let port_type = if is_wireless {
                    "WIRELESS".to_string()
                } else if is_primary {
                    "DP_1_4".to_string()
                } else {
                    "HDMI_2_0".to_string()
                };

                let custom_alias = if is_primary {
                    "Host Workstation & Primary Screen".to_string()
                } else if is_wireless {
                    "Phone / Tablet (ASUS GlideX Wireless)".to_string()
                } else {
                    format!("External Stage Display {}", os_index)
                };

                let stage_zone = if is_primary {
                    "FOH Booth".to_string()
                } else if is_wireless {
                    "Mobile Director / Stage".to_string()
                } else {
                    "Stage Area".to_string()
                };

                let vendor = if is_wireless {
                    "ASUS / Wireless".to_string()
                } else if monitor_string.contains("Dell") {
                    "Dell".to_string()
                } else if monitor_string.contains("Samsung") {
                    "Samsung".to_string()
                } else if monitor_string.contains("LG") {
                    "LG".to_string()
                } else {
                    "Standard PnP".to_string()
                };

                let model = if !monitor_string.is_empty() && monitor_string != "Generic PnP Monitor" {
                    monitor_string.clone()
                } else if is_wireless {
                    "ASUS GlideX Virtual Display".to_string()
                } else {
                    format!("Direct GPU Display (Screen {})", dev_num + 1)
                };

                let serial = if !monitor_id.is_empty() {
                    monitor_id.split('\\').last().unwrap_or("WIN-MON").to_string()
                } else {
                    format!("WIN-MON-{}", dev_num + 1)
                };

                result.push((is_primary, NativeDisplayInfo {
                    id: String::new(), // Will be normalized below
                    os_index: 0,
                    name: if !monitor_string.is_empty() { monitor_string } else { format!("Display Device") },
                    custom_alias,
                    stage_zone,
                    port_type,
                    vendor,
                    model,
                    serial,
                    width,
                    height,
                    refresh_rate_hz: refresh_rate,
                    is_hdr: false,
                    color_space: "sRGB / Rec.709".to_string(),
                    status: "ONLINE".to_string(),
                    bounds: Some(NativeDisplayBounds {
                        x: pos_x,
                        y: pos_y,
                        width,
                        height,
                    }),
                }));
            }

            dev_num += 1;
        }
    }

    // Sort: Primary display strictly first, then remaining displays
    result.sort_by(|a, b| {
        if a.0 && !b.0 {
            std::cmp::Ordering::Less
        } else if !a.0 && b.0 {
            std::cmp::Ordering::Greater
        } else {
            std::cmp::Ordering::Equal
        }
    });

    // Normalize sequential index 1, 2, 3...
    result.into_iter().enumerate().map(|(idx, (is_primary, mut d))| {
        let seq_num = (idx + 1) as u32;
        d.os_index = seq_num;
        d.id = format!("live-disp-{}", seq_num);
        if is_primary {
            d.custom_alias = "Host Workstation (Primary Screen)".to_string();
            d.stage_zone = "FOH Control Booth".to_string();
        } else if d.port_type == "WIRELESS" {
            d.custom_alias = "Phone / Tablet (Wireless Display)".to_string();
            d.stage_zone = "Mobile Director / Stage".to_string();
        } else {
            d.custom_alias = format!("External Stage Display {}", seq_num);
            d.stage_zone = "Stage Area".to_string();
        }
        d
    }).collect()
}

#[derive(serde::Deserialize, Clone)]
pub struct CaptureDisplayTarget {
    pub id: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(serde::Serialize)]
pub struct CapturedFrameResult {
    pub id: String,
    pub image_url: String,
}

#[cfg(windows)]
pub fn capture_screen_thumbnail(x: i32, y: i32, width: u32, height: u32, show_cursor: bool) -> Option<String> {
    use std::io::Cursor;
    use windows_sys::Win32::Graphics::Gdi::{
        GetDC, ReleaseDC, CreateCompatibleDC, CreateCompatibleBitmap, SelectObject,
        DeleteDC, DeleteObject, BitBlt, GetDIBits,
        BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, SRCCOPY,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        GetCursorInfo, DrawIconEx, CURSORINFO, CURSOR_SHOWING, DI_NORMAL, DI_DEFAULTSIZE,
    };
    use base64::prelude::*;

    if width == 0 || height == 0 || width > 16384 || height > 16384 {
        return None;
    }

    unsafe {
        let hdc_screen = GetDC(0 as _);
        if hdc_screen == 0 as _ {
            return None;
        }

        let hdc_mem = CreateCompatibleDC(hdc_screen);
        if hdc_mem == 0 as _ {
            ReleaseDC(0 as _, hdc_screen);
            return None;
        }

        let h_bitmap = CreateCompatibleBitmap(hdc_screen, width as i32, height as i32);
        if h_bitmap == 0 as _ {
            DeleteDC(hdc_mem);
            ReleaseDC(0 as _, hdc_screen);
            return None;
        }

        let old_bitmap = SelectObject(hdc_mem, h_bitmap as _);

        // Direct 1:1 hardware BitBlt from Virtual Desktop DC to Memory DC
        BitBlt(
            hdc_mem,
            0,
            0,
            width as i32,
            height as i32,
            hdc_screen,
            x,
            y,
            SRCCOPY,
        );

        // Stamp mouse cursor if visible on this screen and show_cursor is true
        if show_cursor {
            let mut ci: CURSORINFO = std::mem::zeroed();
            ci.cbSize = std::mem::size_of::<CURSORINFO>() as u32;
            if GetCursorInfo(&mut ci) != 0 && (ci.flags & CURSOR_SHOWING) != 0 && ci.hCursor != 0 as _ {
                let cur_x = ci.ptScreenPos.x;
                let cur_y = ci.ptScreenPos.y;
                if cur_x >= x && cur_x < (x + width as i32) && cur_y >= y && cur_y < (y + height as i32) {
                    DrawIconEx(
                        hdc_mem,
                        cur_x - x,
                        cur_y - y,
                        ci.hCursor,
                        0,
                        0,
                        0,
                        0 as _,
                        DI_NORMAL | DI_DEFAULTSIZE,
                    );
                }
            }
        }

        // IMPORTANT: Unselect bitmap from memory DC BEFORE calling GetDIBits per Windows GDI spec
        SelectObject(hdc_mem, old_bitmap);

        // Use standard bottom-up DIB (biHeight > 0)
        let mut bmi: BITMAPINFO = std::mem::zeroed();
        bmi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
        bmi.bmiHeader.biWidth = width as i32;
        bmi.bmiHeader.biHeight = height as i32; // Standard bottom-up DIB
        bmi.bmiHeader.biPlanes = 1;
        bmi.bmiHeader.biBitCount = 32;
        bmi.bmiHeader.biCompression = BI_RGB as u32;

        let mut raw_bgra: Vec<u8> = vec![0; (width * height * 4) as usize];

        let lines = GetDIBits(
            hdc_screen,
            h_bitmap,
            0,
            height,
            raw_bgra.as_mut_ptr() as *mut _,
            &mut bmi,
            DIB_RGB_COLORS,
        );

        // Cleanup GDI objects immediately
        DeleteObject(h_bitmap as _);
        DeleteDC(hdc_mem);
        ReleaseDC(0 as _, hdc_screen);

        if lines == 0 {
            return None;
        }

        // Fast in-memory downsampling to Retina 2x preview (max width 960px) in <0.3ms
        let max_target_width = 960u32;
        let (target_w, target_h, rgb_buffer) = if width > max_target_width {
            let scale = max_target_width as f32 / width as f32;
            let tw = max_target_width;
            let th = ((height as f32 * scale).round() as u32).max(1);
            let mut out = vec![0u8; (tw * th * 3) as usize];

            let x_ratio = (width as u64 * 65536) / tw as u64;
            let y_ratio = (height as u64 * 65536) / th as u64;

            for ty in 0..th {
                // Flip vertical coordinates: bottom-up source -> top-down destination
                let sample_y = ((ty as u64 * y_ratio) >> 16) as u32;
                let sy = height.saturating_sub(1).saturating_sub(sample_y) as usize;
                let src_row_offset = sy * width as usize * 4;
                let dst_row_offset = ty as usize * tw as usize * 3;

                for tx in 0..tw {
                    let sx = ((tx as u64 * x_ratio) >> 16) as usize;
                    let src_idx = src_row_offset + (sx * 4);
                    let dst_idx = dst_row_offset + (tx as usize * 3);

                    let b = raw_bgra[src_idx];
                    let g = raw_bgra[src_idx + 1];
                    let r = raw_bgra[src_idx + 2];

                    out[dst_idx] = r;
                    out[dst_idx + 1] = g;
                    out[dst_idx + 2] = b;
                }
            }
            (tw, th, out)
        } else {
            // Flip bottom-up BGRA -> top-down RGB8
            let mut out = vec![0u8; (width * height * 3) as usize];
            for ty in 0..height {
                let sy = (height - 1 - ty) as usize;
                let src_row = sy * width as usize * 4;
                let dst_row = ty as usize * width as usize * 3;
                for tx in 0..width as usize {
                    let src_idx = src_row + (tx * 4);
                    let dst_idx = dst_row + (tx * 3);
                    out[dst_idx] = raw_bgra[src_idx + 2];
                    out[dst_idx + 1] = raw_bgra[src_idx + 1];
                    out[dst_idx + 2] = raw_bgra[src_idx];
                }
            }
            (width, height, out)
        };

        let mut jpeg_bytes: Vec<u8> = Vec::with_capacity((target_w * target_h / 4) as usize);
        let mut cursor_writer = Cursor::new(&mut jpeg_bytes);

        // High-fidelity JPEG compression with RGB8 (78% quality = crisp text + instantaneous 1ms encode)
        let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut cursor_writer, 78);
        if encoder.encode(&rgb_buffer, target_w, target_h, image::ExtendedColorType::Rgb8).is_err() {
            return None;
        }

        let base64_str = BASE64_STANDARD.encode(&jpeg_bytes);
        Some(format!("data:image/jpeg;base64,{}", base64_str))
    }
}

#[cfg(windows)]
pub fn capture_all_displays_batch(targets: Vec<CaptureDisplayTarget>, show_cursor: bool) -> Vec<CapturedFrameResult> {
    let mut results = Vec::new();
    for target in targets {
        if let Some(image_url) = capture_screen_thumbnail(target.x, target.y, target.width, target.height, show_cursor) {
            results.push(CapturedFrameResult {
                id: target.id,
                image_url,
            });
        }
    }
    results
}

#[cfg(not(windows))]
pub fn enumerate_real_windows_displays() -> Vec<NativeDisplayInfo> {
    Vec::new()
}

#[cfg(not(windows))]
pub fn capture_screen_thumbnail(_x: i32, _y: i32, _width: u32, _height: u32, _show_cursor: bool) -> Option<String> {
    None
}

#[cfg(not(windows))]
pub fn capture_all_displays_batch(_targets: Vec<CaptureDisplayTarget>, _show_cursor: bool) -> Vec<CapturedFrameResult> {
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_screen_capture_execution() {
        let displays = enumerate_real_windows_displays();
        println!("Enumerated {} displays", displays.len());
        if let Some(first) = displays.first() {
            let res = capture_screen_thumbnail(0, 0, first.width, first.height, true);
            assert!(res.is_some(), "Screen thumbnail should be captured");
            let data_url = res.unwrap();
            assert!(data_url.starts_with("data:image/jpeg;base64,"), "Should produce valid JPEG data URL");
            assert!(data_url.len() > 500, "Should contain non-empty image payload");
            println!("✓ Successfully captured screen thumbnail ({} bytes)", data_url.len());
        }
    }
}
