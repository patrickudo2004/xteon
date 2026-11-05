use serde::{Deserialize, Serialize};
use std::net::UdpSocket;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkAdapterInfo {
    pub name: String,
    pub ip: String,
    pub kind: String, // "WIFI" | "HOTSPOT" | "USB_TETHER" | "ETHERNET" | "VIRTUAL"
    pub is_preferred: bool,
}

fn classify_adapter(name: &str, desc: &str, ip: &str) -> (String, i32) {
    let combined = format!("{} {}", name, desc).to_lowercase();

    // De-prioritize WSL, Hyper-V, Docker, VMware, VirtualBox internal bridges
    if combined.contains("wsl")
        || combined.contains("hyper-v")
        || combined.contains("vethernet")
        || combined.contains("virtualbox")
        || combined.contains("vmware")
        || combined.contains("docker")
        || combined.contains("loopback")
        || combined.contains("npcap")
    {
        return ("VIRTUAL".to_string(), 10);
    }

    // Windows Mobile Hotspot / macOS Internet Sharing / Local Direct Wi-Fi
    if ip.starts_with("192.168.137.")
        || combined.contains("wi-fi direct")
        || combined.contains("local area connection*")
        || combined.contains("hotspot")
        || combined.contains("bridge100")
    {
        return ("HOTSPOT".to_string(), 95);
    }

    // Android RNDIS / Apple Mobile Device USB Tethering / USB-NCM
    if combined.contains("rndis")
        || combined.contains("remote ndis")
        || combined.contains("usbncm")
        || combined.contains("usb ncm")
        || combined.contains("usb ethernet")
        || combined.contains("apple mobile device")
        || combined.contains("iphone")
        || combined.contains("android")
        || ip.starts_with("172.20.10.")
        || ip.starts_with("192.168.42.")
    {
        return ("USB_TETHER".to_string(), 92);
    }

    // Standard Venue Wi-Fi / WLAN
    if combined.contains("wi-fi")
        || combined.contains("wifi")
        || combined.contains("wireless")
        || combined.contains("wlan")
        || combined.contains("802.11")
        || name == "en0"
    {
        return ("WIFI".to_string(), 100);
    }

    // Wired Gigabit / Studio LAN
    ("ETHERNET".to_string(), 85)
}

#[cfg(windows)]
fn enumerate_os_adapters() -> Vec<(NetworkAdapterInfo, i32)> {
    use windows_sys::Win32::Foundation::ERROR_BUFFER_OVERFLOW;
    use windows_sys::Win32::NetworkManagement::IpHelper::{
        GAA_FLAG_SKIP_ANYCAST, GAA_FLAG_SKIP_DNS_SERVER, GAA_FLAG_SKIP_MULTICAST,
        GetAdaptersAddresses, IP_ADAPTER_ADDRESSES_LH,
    };
    use windows_sys::Win32::Networking::WinSock::{AF_INET, SOCKADDR_IN};

    let mut out = Vec::new();
    let flags = GAA_FLAG_SKIP_ANYCAST | GAA_FLAG_SKIP_MULTICAST | GAA_FLAG_SKIP_DNS_SERVER;
    let mut size: u32 = 16384;
    let mut buffer: Vec<u8> = vec![0u8; size as usize];

    unsafe {
        let mut ret = GetAdaptersAddresses(
            AF_INET as u32,
            flags,
            std::ptr::null(),
            buffer.as_mut_ptr() as *mut IP_ADAPTER_ADDRESSES_LH,
            &mut size,
        );

        if ret == ERROR_BUFFER_OVERFLOW {
            buffer.resize(size as usize, 0);
            ret = GetAdaptersAddresses(
                AF_INET as u32,
                flags,
                std::ptr::null(),
                buffer.as_mut_ptr() as *mut IP_ADAPTER_ADDRESSES_LH,
                &mut size,
            );
        }

        if ret != 0 {
            return out;
        }

        let mut curr = buffer.as_ptr() as *const IP_ADAPTER_ADDRESSES_LH;
        while !curr.is_null() {
            let adapter = &*curr;
            // OperStatus == 1 is IfOperStatusUp, IfType != 24 (IF_TYPE_SOFTWARE_LOOPBACK)
            if adapter.OperStatus == 1 && adapter.IfType != 24 {
                let friendly = pwstr_to_string(adapter.FriendlyName);
                let desc = pwstr_to_string(adapter.Description);

                let mut uni = adapter.FirstUnicastAddress;
                while !uni.is_null() {
                    let u_ref = &*uni;
                    let sa = u_ref.Address.lpSockaddr;
                    if !sa.is_null() && (*sa).sa_family == AF_INET {
                        let sin = &*(sa as *const SOCKADDR_IN);
                        let addr_u32 = u32::from_be(sin.sin_addr.S_un.S_addr);
                        let b0 = ((addr_u32 >> 24) & 0xFF) as u8;
                        let b1 = ((addr_u32 >> 16) & 0xFF) as u8;
                        let b2 = ((addr_u32 >> 8) & 0xFF) as u8;
                        let b3 = (addr_u32 & 0xFF) as u8;

                        // Skip loopback 127.x and dead APIPA 169.254.x
                        if b0 != 127 && !(b0 == 169 && b1 == 254) && b0 != 0 {
                            let ip = format!("{b0}.{b1}.{b2}.{b3}");
                            let (kind, score) = classify_adapter(&friendly, &desc, &ip);
                            let display_name = if !friendly.is_empty() {
                                friendly.clone()
                            } else {
                                desc.clone()
                            };
                            out.push((
                                NetworkAdapterInfo {
                                    name: display_name,
                                    ip,
                                    kind,
                                    is_preferred: false,
                                },
                                score,
                            ));
                        }
                    }
                    uni = u_ref.Next;
                }
            }
            curr = adapter.Next;
        }
    }

    out
}

#[cfg(windows)]
unsafe fn pwstr_to_string(ptr: *mut u16) -> String {
    if ptr.is_null() {
        return String::new();
    }
    let mut len = 0usize;
    while *ptr.add(len) != 0 && len < 512 {
        len += 1;
    }
    String::from_utf16_lossy(std::slice::from_raw_parts(ptr, len))
}

#[cfg(not(windows))]
fn enumerate_os_adapters() -> Vec<(NetworkAdapterInfo, i32)> {
    use std::process::Command;
    let mut out = Vec::new();

    // Try Linux `ip -4 -o addr show`
    if let Ok(res) = Command::new("ip").args(["-4", "-o", "addr", "show"]).output() {
        if res.status.success() {
            let text = String::from_utf8_lossy(&res.stdout);
            for line in text.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 4 {
                    let iface = parts[1];
                    if let Some(ip) = parts[3].split('/').next() {
                        if !ip.starts_with("127.") && !ip.starts_with("169.254.") {
                            let (kind, score) = classify_adapter(iface, iface, ip);
                            out.push((
                                NetworkAdapterInfo {
                                    name: iface.to_string(),
                                    ip: ip.to_string(),
                                    kind,
                                    is_preferred: false,
                                },
                                score,
                            ));
                        }
                    }
                }
            }
        }
    }

    // Try macOS `ifconfig` if empty
    if out.is_empty() {
        if let Ok(res) = Command::new("ifconfig").output() {
            if res.status.success() {
                let text = String::from_utf8_lossy(&res.stdout);
                let mut current_iface = String::new();
                for line in text.lines() {
                    if !line.starts_with('\t') && !line.starts_with(' ') {
                        if let Some((iface, _)) = line.split_once(':') {
                            current_iface = iface.trim().to_string();
                        }
                    } else if let Some(rest) = line.trim().strip_prefix("inet ") {
                        if let Some(ip) = rest.split_whitespace().next() {
                            if !ip.starts_with("127.") && !ip.starts_with("169.254.") {
                                let (kind, score) =
                                    classify_adapter(&current_iface, &current_iface, ip);
                                out.push((
                                    NetworkAdapterInfo {
                                        name: current_iface.clone(),
                                        ip: ip.to_string(),
                                        kind,
                                        is_preferred: false,
                                    },
                                    score,
                                ));
                            }
                        }
                    }
                }
            }
        }
    }

    out
}

pub fn list_network_interfaces() -> Vec<NetworkAdapterInfo> {
    let mut discovered = enumerate_os_adapters();

    // Check which IP the OS routing table prefers if internet/gateway exists, boosting its score slightly
    let routed_ip = UdpSocket::bind("0.0.0.0:0")
        .ok()
        .and_then(|sock| {
            sock.connect("192.168.1.1:80")
                .or_else(|_| sock.connect("10.0.0.1:80"))
                .or_else(|_| sock.connect("8.8.8.8:80"))
                .ok()?;
            sock.local_addr().ok()
        })
        .map(|a| a.ip().to_string())
        .filter(|ip| ip != "0.0.0.0" && !ip.starts_with("127."));

    for (adapter, score) in &mut discovered {
        if routed_ip.as_deref() == Some(adapter.ip.as_str()) && adapter.kind != "VIRTUAL" {
            *score += 15;
        }
    }

    discovered.sort_by(|a, b| b.1.cmp(&a.1));

    // Deduplicate by IP
    let mut seen = std::collections::HashSet::new();
    let mut final_list: Vec<NetworkAdapterInfo> = discovered
        .into_iter()
        .filter_map(|(item, _)| {
            if seen.insert(item.ip.clone()) {
                Some(item)
            } else {
                None
            }
        })
        .collect();

    if final_list.is_empty() {
        if let Some(ip) = routed_ip {
            final_list.push(NetworkAdapterInfo {
                name: "Primary Network".to_string(),
                ip,
                kind: "WIFI".to_string(),
                is_preferred: true,
            });
        } else {
            final_list.push(NetworkAdapterInfo {
                name: "Localhost Loopback (Offline)".to_string(),
                ip: "127.0.0.1".to_string(),
                kind: "VIRTUAL".to_string(),
                is_preferred: true,
            });
        }
    } else if let Some(first) = final_list.first_mut() {
        first.is_preferred = true;
    }

    final_list
}

pub fn get_preferred_lan_ip() -> String {
    list_network_interfaces()
        .into_iter()
        .next()
        .map(|a| a.ip)
        .unwrap_or_else(|| "127.0.0.1".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_real_network_interfaces_discovery() {
        let adapters = list_network_interfaces();
        assert!(!adapters.is_empty(), "Should always return at least one interface");
        assert!(adapters[0].is_preferred, "First sorted interface must be marked preferred");
        println!("Discovered adapters: {:?}", adapters);
    }
}
