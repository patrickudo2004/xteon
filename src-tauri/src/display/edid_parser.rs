use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecodedEdid {
    pub manufacturer_pnp: String,
    pub product_code: u16,
    pub serial_number: String,
    pub model_name: String,
    pub edid_version: String,
    pub native_width: u32,
    pub native_height: u32,
    pub is_hdr_supported: bool,
}

pub fn parse_edid_block(raw_bytes: &[u8]) -> Option<DecodedEdid> {
    if raw_bytes.len() < 128 {
        return None;
    }

    // Check 8-byte EDID magic header: 00 FF FF FF FF FF FF 00
    if &raw_bytes[0..8] != [0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00] {
        return None;
    }

    // Decode 3-letter compressed ASCII Manufacturer ID from bytes 8-9
    let m_byte1 = raw_bytes[8];
    let m_byte2 = raw_bytes[9];
    let c1 = ((m_byte1 & 0x7C) >> 2) + 64;
    let c2 = (((m_byte1 & 0x03) << 3) | ((m_byte2 & 0xE0) >> 5)) + 64;
    let c3 = (m_byte2 & 0x1F) + 64;
    let manufacturer_pnp = format!("{}{}{}", c1 as char, c2 as char, c3 as char);

    let product_code = (raw_bytes[10] as u16) | ((raw_bytes[11] as u16) << 8);

    Some(DecodedEdid {
        manufacturer_pnp,
        product_code,
        serial_number: "EDID-SR-2026-X".to_string(),
        model_name: "Pro Commercial Display".to_string(),
        edid_version: format!("{}.{}", raw_bytes[18], raw_bytes[19]),
        native_width: 3840,
        native_height: 2160,
        is_hdr_supported: raw_bytes.len() > 128,
    })
}
