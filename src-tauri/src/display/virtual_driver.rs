use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize, Clone, Debug)]
pub struct VirtualDriverStatus {
    pub installed: bool,
    pub is_glidex_present: bool,
    pub display_active: bool,
    pub driver_path: String,
    pub message: String,
}

// Embedded assets so Xteon is 100% self-contained (zero network dependency)
const EMBEDDED_DEVCON: &[u8] = include_bytes!("../../resources/virtual_display_driver/devcon.exe");
const EMBEDDED_CAT: &[u8] = include_bytes!("../../resources/virtual_display_driver/mttvdd.cat");
const EMBEDDED_DLL: &[u8] = include_bytes!("../../resources/virtual_display_driver/MttVDD.dll");
const EMBEDDED_INF: &[u8] = include_bytes!("../../resources/virtual_display_driver/MttVDD.inf");
const EMBEDDED_XML: &[u8] = include_bytes!("../../resources/virtual_display_driver/vdd_settings.xml");
const EMBEDDED_INSTALL_BAT: &[u8] = include_bytes!("../../resources/virtual_display_driver/install_driver.bat");
const EMBEDDED_UNINSTALL_BAT: &[u8] = include_bytes!("../../resources/virtual_display_driver/uninstall_driver.bat");

const TARGET_DRIVER_DIR: &str = r"C:\VirtualDisplayDriver";

/// Ensure that all required driver files exist in C:\VirtualDisplayDriver
pub fn stage_virtual_driver_files() -> Result<PathBuf, String> {
    let target = Path::new(TARGET_DRIVER_DIR);
    if !target.exists() {
        fs::create_dir_all(target)
            .map_err(|e| format!("Failed to create directory {}: {}", TARGET_DRIVER_DIR, e))?;
    }

    let files: [(&str, &[u8]); 7] = [
        ("devcon.exe", EMBEDDED_DEVCON),
        ("mttvdd.cat", EMBEDDED_CAT),
        ("MttVDD.dll", EMBEDDED_DLL),
        ("MttVDD.inf", EMBEDDED_INF),
        ("vdd_settings.xml", EMBEDDED_XML),
        ("install_driver.bat", EMBEDDED_INSTALL_BAT),
        ("uninstall_driver.bat", EMBEDDED_UNINSTALL_BAT),
    ];

    for (name, content) in files {
        let dest = target.join(name);
        // Write if missing or empty
        let needs_write = match fs::metadata(&dest) {
            Ok(meta) => meta.len() == 0,
            Err(_) => true,
        };
        if needs_write {
            let _ = fs::write(&dest, content);
        }
    }

    Ok(target.to_path_buf())
}

/// Check if Root\MttVDD or any known virtual display adapter is present
pub fn check_virtual_driver_status() -> VirtualDriverStatus {
    let _ = stage_virtual_driver_files();

    #[cfg(windows)]
    {
        use std::process::Command;

        let devcon_path = format!(r"{}\devcon.exe", TARGET_DRIVER_DIR);
        let mut installed = false;
        let mut is_glidex_present = false;

        // Check Root\MttVDD
        if let Ok(output) = Command::new(&devcon_path)
            .args(["status", r"Root\MttVDD"])
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout).to_lowercase();
            if text.contains("running") || text.contains("matching device") {
                installed = true;
            }
        }

        // Check if ASUS GlideX or any other virtual display driver adapter exists
        if let Ok(output) = Command::new(&devcon_path)
            .args(["find", "=Display"])
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout).to_lowercase();
            if text.contains("mttvdd") {
                installed = true;
            }
            if text.contains("glidex") {
                is_glidex_present = true;
            }
        }

        // Check if a secondary screen is actively attached to desktop
        let displays = super::windows_capture::enumerate_real_windows_displays();
        let display_active = displays.iter().any(|d| d.os_index > 1);

        let message = if installed && display_active {
            "Virtual Extended Display is ACTIVE and ready to stream to connected receivers.".to_string()
        } else if installed {
            "Virtual Display Driver is installed. Toggle 'Activate Extended Display' to create Screen 2.".to_string()
        } else if is_glidex_present {
            "GlideX graphics hardware detected. Click 'Install Virtual Display Engine' for native Xteon integration.".to_string()
        } else {
            "Virtual Display Driver not installed. Click 'Install Virtual Display Engine' to enable driverless GlideX-style secondary screens.".to_string()
        };

        VirtualDriverStatus {
            installed,
            is_glidex_present,
            display_active,
            driver_path: TARGET_DRIVER_DIR.to_string(),
            message,
        }
    }

    #[cfg(not(windows))]
    {
        VirtualDriverStatus {
            installed: false,
            is_glidex_present: false,
            display_active: false,
            driver_path: String::new(),
            message: "Virtual Display Driver is designed for Windows 10/11.".to_string(),
        }
    }
}

/// Trigger the elevated installer for the Virtual Display Driver
pub fn install_virtual_display_driver() -> Result<String, String> {
    stage_virtual_driver_files()?;

    #[cfg(windows)]
    {
        use std::process::Command;

        let bat_path = format!(r"{}\install_driver.bat", TARGET_DRIVER_DIR);

        // Run batch file with Administrator prompt (RunAs)
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                &format!(
                    "Start-Process -FilePath '{}' -Verb RunAs -Wait",
                    bat_path
                ),
            ])
            .output()
            .map_err(|e| format!("Failed to spawn driver installer: {}", e))?;

        if output.status.success() {
            // Briefly switch to extend
            let _ = Command::new("DisplaySwitch.exe").arg("/extend").spawn();
            Ok("Virtual Display Driver setup initiated. Check User Account Control (UAC) if prompted.".to_string())
        } else {
            Err("Administrator elevation was declined or cancelled.".to_string())
        }
    }

    #[cfg(not(windows))]
    {
        Err("Virtual Display Driver installer is only available on Windows 10/11.".to_string())
    }
}

/// Trigger the elevated uninstaller for the Virtual Display Driver
pub fn uninstall_virtual_display_driver() -> Result<String, String> {
    #[cfg(windows)]
    {
        use std::process::Command;

        let bat_path = format!(r"{}\uninstall_driver.bat", TARGET_DRIVER_DIR);

        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                &format!(
                    "Start-Process -FilePath '{}' -Verb RunAs -Wait",
                    bat_path
                ),
            ])
            .output()
            .map_err(|e| format!("Failed to spawn driver uninstaller: {}", e))?;

        if output.status.success() {
            Ok("Uninstalled Virtual Display Driver.".to_string())
        } else {
            Err("Administrator elevation was declined or cancelled.".to_string())
        }
    }

    #[cfg(not(windows))]
    {
        Err("Virtual Display Driver uninstaller is only available on Windows 10/11.".to_string())
    }
}

/// Activate or deactivate the Virtual Display
pub fn set_virtual_display_active(enable: bool) -> Result<String, String> {
    #[cfg(windows)]
    {
        use std::process::Command;

        let devcon_path = format!(r"{}\devcon.exe", TARGET_DRIVER_DIR);
        let action = if enable { "enable" } else { "disable" };

        let _ = Command::new(&devcon_path)
            .args([action, r"Root\MttVDD"])
            .output();

        if enable {
            let _ = Command::new("DisplaySwitch.exe").arg("/extend").spawn();
            Ok("Activated Virtual Extended Display (Display 2).".to_string())
        } else {
            Ok("Deactivated Virtual Extended Display.".to_string())
        }
    }

    #[cfg(not(windows))]
    {
        let _ = enable;
        Err("Virtual display is only supported on Windows.".to_string())
    }
}
