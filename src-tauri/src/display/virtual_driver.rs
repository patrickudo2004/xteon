use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

const MTT_VDD_INF: &[u8] = include_bytes!("../../resources/drivers/vdd/MttVDD.inf");
const MTT_VDD_DLL: &[u8] = include_bytes!("../../resources/drivers/vdd/MttVDD.dll");
const MTT_VDD_CAT: &[u8] = include_bytes!("../../resources/drivers/vdd/mttvdd.cat");
const DEVCON_EXE: &[u8] = include_bytes!("../../resources/drivers/vdd/devcon.exe");
const VDD_SETTINGS_XML: &[u8] = include_bytes!("../../resources/drivers/vdd/vdd_settings.xml");

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualDriverStatus {
    pub is_installed: bool,
    pub is_active: bool,
    pub display_count: usize,
    pub message: String,
}

pub fn get_vdd_unpack_dir() -> PathBuf {
    let base = std::env::var("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            let user_profile = std::env::var("USERPROFILE").unwrap_or_else(|_| "C:".to_string());
            PathBuf::from(user_profile).join("AppData").join("Local")
        });
    base.join("xteon").join("drivers").join("vdd")
}

pub fn unpack_driver_assets() -> Result<PathBuf, String> {
    let dir = get_vdd_unpack_dir();
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create VDD directory: {e}"))?;

    let files: [(&str, &[u8]); 5] = [
        ("MttVDD.inf", MTT_VDD_INF),
        ("MttVDD.dll", MTT_VDD_DLL),
        ("mttvdd.cat", MTT_VDD_CAT),
        ("devcon.exe", DEVCON_EXE),
        ("vdd_settings.xml", VDD_SETTINGS_XML),
    ];

    for (name, data) in files {
        let dest = dir.join(name);
        let write_needed = match fs::metadata(&dest) {
            Ok(meta) => meta.len() != data.len() as u64,
            Err(_) => true,
        };
        if write_needed {
            fs::write(&dest, data).map_err(|e| format!("Failed to unpack {name}: {e}"))?;
        }
    }

    Ok(dir)
}

pub async fn query_virtual_driver_status() -> VirtualDriverStatus {
    tokio::task::spawn_blocking(|| {
        #[cfg(windows)]
        {
            let mut cmd = std::process::Command::new("pnputil.exe");
            cmd.args(["/enum-devices", "/instanceid", "Root\\MttVDD"]);
            cmd.creation_flags(CREATE_NO_WINDOW);

            let is_installed = match cmd.output() {
                Ok(out) => {
                    let text = String::from_utf8_lossy(&out.stdout).to_lowercase();
                    text.contains("instance id:") || text.contains("mttvdd")
                }
                Err(_) => false,
            };

            // Count real displays currently detected by Windows
            let mut disp_cmd = std::process::Command::new("powershell.exe");
            disp_cmd.args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "@([System.Windows.Forms.Screen]::AllScreens).Count",
            ]);
            disp_cmd.creation_flags(CREATE_NO_WINDOW);

            let display_count = match disp_cmd.output() {
                Ok(out) => {
                    let text = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    text.parse::<usize>().unwrap_or(1)
                }
                Err(_) => 1,
            };

            let is_active = is_installed && display_count > 1;

            let msg = if is_active {
                format!("Virtual Display Driver Active • Screen 2 ready ({display_count} displays)")
            } else if is_installed {
                "Virtual Display Driver Installed • Ready to enable".to_string()
            } else {
                "Virtual Display Driver Not Installed".to_string()
            };

            VirtualDriverStatus {
                is_installed,
                is_active,
                display_count,
                message: msg,
            }
        }
        #[cfg(not(windows))]
        {
            VirtualDriverStatus {
                is_installed: false,
                is_active: false,
                display_count: 1,
                message: "Virtual Display Driver only supported on Windows".to_string(),
            }
        }
    })
    .await
    .unwrap_or_else(|_| VirtualDriverStatus {
        is_installed: false,
        is_active: false,
        display_count: 1,
        message: "Status query timed out".to_string(),
    })
}

pub async fn install_virtual_driver() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        let dir = unpack_driver_assets()?;

        #[cfg(windows)]
        {
            let dir_str = dir.to_string_lossy().to_string();

            // Run elevated PowerShell command with UAC prompt once to register driver
            let script = format!(
                "$p = '{dir_str}'; \
                 Start-Process -FilePath 'pnputil.exe' -ArgumentList @('/add-driver', 'MttVDD.inf', '/install') -WorkingDirectory $p -Wait -WindowStyle Hidden; \
                 Start-Process -FilePath (Join-Path $p 'devcon.exe') -ArgumentList @('install', 'MttVDD.inf', 'Root\\MttVDD') -WorkingDirectory $p -Wait -WindowStyle Hidden; \
                 Start-Process -FilePath (Join-Path $p 'devcon.exe') -ArgumentList @('enable', 'Root\\MttVDD') -WorkingDirectory $p -Wait -WindowStyle Hidden;"
            );

            let mut cmd = std::process::Command::new("powershell.exe");
            cmd.args([
                "-NoProfile",
                "-Command",
                &format!("Start-Process powershell -ArgumentList '-NoProfile -NonInteractive -Command \"{script}\"' -Verb RunAs -Wait"),
            ]);
            cmd.creation_flags(CREATE_NO_WINDOW);

            let status = cmd
                .status()
                .map_err(|e| format!("Failed to launch driver installer: {e}"))?;

            if !status.success() {
                return Err("Driver installation cancelled or denied Administrator permissions.".to_string());
            }

            // Trigger Windows Extend Mode
            let _ = std::process::Command::new("DisplaySwitch.exe")
                .arg("/extend")
                .creation_flags(CREATE_NO_WINDOW)
                .spawn();

            Ok("Virtual Extended Display Driver installed and activated successfully!".to_string())
        }
        #[cfg(not(windows))]
        {
            Err("Virtual Display Driver only supported on Windows".to_string())
        }
    })
    .await
    .map_err(|e| format!("Installer task crashed: {e}"))?
}

pub async fn toggle_virtual_display_active(enable: bool) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let dir = unpack_driver_assets()?;

        #[cfg(windows)]
        {
            let devcon_path = dir.join("devcon.exe");
            let action = if enable { "enable" } else { "disable" };

            let mut cmd = std::process::Command::new(&devcon_path);
            cmd.args([action, "Root\\MttVDD"]);
            cmd.current_dir(&dir);
            cmd.creation_flags(CREATE_NO_WINDOW);

            let out = cmd
                .output()
                .map_err(|e| format!("Failed to execute devcon {action}: {e}"))?;

            let text = String::from_utf8_lossy(&out.stdout).to_string();

            if enable {
                let _ = std::process::Command::new("DisplaySwitch.exe")
                    .arg("/extend")
                    .creation_flags(CREATE_NO_WINDOW)
                    .spawn();
            }

            Ok(format!("Virtual Display {action}: {text}"))
        }
        #[cfg(not(windows))]
        {
            Err("Virtual Display Driver only supported on Windows".to_string())
        }
    })
    .await
    .map_err(|e| format!("Toggle task crashed: {e}"))?
}

pub async fn uninstall_virtual_driver() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        let dir = get_vdd_unpack_dir();

        #[cfg(windows)]
        {
            let dir_str = dir.to_string_lossy().to_string();
            let script = format!(
                "$p = '{dir_str}'; \
                 if (Test-Path (Join-Path $p 'devcon.exe')) {{ \
                   Start-Process -FilePath (Join-Path $p 'devcon.exe') -ArgumentList @('remove', 'Root\\MttVDD') -WorkingDirectory $p -Wait -WindowStyle Hidden; \
                 }} \
                 Start-Process -FilePath 'pnputil.exe' -ArgumentList @('/delete-driver', 'MttVDD.inf', '/uninstall', '/force') -Wait -WindowStyle Hidden;"
            );

            let mut cmd = std::process::Command::new("powershell.exe");
            cmd.args([
                "-NoProfile",
                "-Command",
                &format!("Start-Process powershell -ArgumentList '-NoProfile -NonInteractive -Command \"{script}\"' -Verb RunAs -Wait"),
            ]);
            cmd.creation_flags(CREATE_NO_WINDOW);

            let status = cmd
                .status()
                .map_err(|e| format!("Failed to launch uninstaller: {e}"))?;

            if !status.success() {
                return Err("Driver uninstallation cancelled or denied Administrator permissions.".to_string());
            }

            let _ = fs::remove_dir_all(&dir);

            Ok("Virtual Display Driver completely uninstalled from Windows.".to_string())
        }
        #[cfg(not(windows))]
        {
            Err("Virtual Display Driver only supported on Windows".to_string())
        }
    })
    .await
    .map_err(|e| format!("Uninstaller task crashed: {e}"))?
}
