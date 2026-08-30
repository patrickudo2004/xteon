use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeDisplayBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeDisplayInfo {
    pub id: String,
    pub os_index: u32,
    pub name: String,
    pub custom_alias: String,
    pub stage_zone: String,
    pub port_type: String,
    pub vendor: String,
    pub model: String,
    pub serial: String,
    pub width: u32,
    pub height: u32,
    pub refresh_rate_hz: u32,
    pub is_hdr: bool,
    pub color_space: String,
    pub status: String,
    pub bounds: Option<NativeDisplayBounds>,
}
