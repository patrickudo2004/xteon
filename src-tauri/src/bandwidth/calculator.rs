use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandwidthResult {
    pub bandwidth_gbps: f64,
    pub max_port_gbps: f64,
    pub max_distance_meters: f64,
    pub status: String,
    pub message: String,
}

pub fn calculate_signal_bandwidth(
    width: u32,
    height: u32,
    fps: u32,
    color_depth_bits: u32,
    cable_type: &str,
    length_meters: f64,
) -> BandwidthResult {
    // Exact uncompressed Pro AV bandwidth with 8b/10b & 16b/18b coding overheads
    let pixel_clock = width as f64 * height as f64 * fps as f64;
    let raw_bits_per_sec = pixel_clock * (color_depth_bits as f64 * 3.0) * 1.25;
    let bandwidth_gbps = (raw_bits_per_sec / 1_000_000_000.0 * 100.0).round() / 100.0;

    let (max_port_gbps, max_distance_meters) = match cable_type {
        "HDMI_2_0" => (18.0, 10.0),
        "HDMI_2_1" => (48.0, 5.0),
        "FIBER_HDMI" => (48.0, 300.0),
        "DP_1_4" => (32.4, 3.0),
        "DP_2_0" => (80.0, 2.0),
        "SDI_3G" => (2.97, 100.0),
        "SDI_12G" => (11.88, 70.0),
        "HDBASET_CAT6" => (18.0, 100.0),
        "USB_C_DP" => (20.0, 2.0),
        "WIRELESS" => (12.0, 30.0),
        _ => (18.0, 10.0),
    };

    if bandwidth_gbps > max_port_gbps {
        BandwidthResult {
            bandwidth_gbps,
            max_port_gbps,
            max_distance_meters,
            status: "ERROR_BANDWIDTH".to_string(),
            message: format!(
                "Bandwidth Exceeded: Required {:.2} Gbps exceeds {} max capacity of {:.2} Gbps.",
                bandwidth_gbps, cable_type, max_port_gbps
            ),
        }
    } else if length_meters > max_distance_meters {
        BandwidthResult {
            bandwidth_gbps,
            max_port_gbps,
            max_distance_meters,
            status: "WARNING_DISTANCE".to_string(),
            message: format!(
                "Distance Warning: {:.1}m exceeds maximum recommended length of {:.1}m for {}.",
                length_meters, max_distance_meters, cable_type
            ),
        }
    } else {
        BandwidthResult {
            bandwidth_gbps,
            max_port_gbps,
            max_distance_meters,
            status: "VALID".to_string(),
            message: format!(
                "Optimal Signal Lock: {:.2} Gbps / {:.2} Gbps capacity ({:.1}m).",
                bandwidth_gbps, max_port_gbps, length_meters
            ),
        }
    }
}
