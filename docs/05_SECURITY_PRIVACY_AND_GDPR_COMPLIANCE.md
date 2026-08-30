# Security, Privacy & GDPR Compliance Specification
# System: Xteon
> **Local-First Architecture, Zero-Telemetry Principles & Broadcast NDA Compliance**

---

## 1. Core Security & Privacy Philosophy

In professional broadcast, corporate keynotes, and media production, workstations frequently handle confidential, unreleased, and proprietary material (e.g., unreleased product launches, financial presentations, executive video feeds, confidential live streams).

**Xteon is engineered under a strict "Local-First & Zero-Trust" paradigm:**
1. **Zero External Telemetry:** Xteon does not transmit any video frames, display metadata, EDID strings, network telemetry, or analytics to external cloud servers.
2. **Zero Cloud Dependencies:** All processing, capture downsampling, EDID decoding, and companion streaming occurs strictly on the local machine and local LAN.
3. **Broadcast NDA Ready:** Fully compliant with strict corporate and studio Non-Disclosure Agreements (NDAs).

---

## 2. OS Screen Recording Permissions & Sandbox Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       OS PERMISSION & ACCESS PIPELINE                       │
├────────────────────────┬────────────────────────┬───────────────────────────┤
│ macOS (TCC Framework)  │ Windows 10/11 (DXGI)   │ Linux (Wayland / X11)     │
│ • ScreenCaptureKit     │ • DXGI Desktop Dup     │ • PipeWire Portal         │
│ • User-Approved TCC    │ • Standard User Token  │ • User Session Token      │
│ • No Root/Admin Needed │ • No UAC Elevation Req │ • No SUID/Root Needed     │
└────────────────────────┴────────────────────────┴───────────────────────────┘
```

### 2.1 macOS Permission Onboarding
* macOS requires explicit user authorization under **System Settings > Privacy & Security > Screen Recording**.
* Xteon uses `CGPreflightScreenCaptureAccess()` and `CGRequestScreenCaptureAccess()` on first launch.
* If permissions are not granted, Xteon gracefully displays an onboarding screen with an interactive step-by-step graphic and a direct button that launches the macOS System Settings pane (`x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`).
* Xteon never circumvents or bypasses OS privacy sandboxes.

### 2.2 Windows 10/11 Security
* DXGI Desktop Duplication API and Windows Graphics Capture run entirely within standard non-elevated user privilege levels.
* Xteon does **not** require Administrator/UAC elevation to inspect displays or capture framebuffers.

### 2.3 Linux Sandboxing (Flatpak / AppImage / Wayland)
* Under Wayland, screen capture requests are routed through `xdg-desktop-portal` and `PipeWire`, prompting the native desktop environment's permission dialog.

---

## 3. Local Mobile Companion Security & Authentication

The embedded Axum server on the host desktop facilitates mobile monitoring across the local venue Wi-Fi.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MOBILE COMPANION SECURITY PROTOCOL                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Host Generates Ephemeral 256-bit Session Key & 6-Digit Dynamic PIN       │
│ 2. Desktop UI renders QR Code encoding local LAN URL + HMAC Token           │
│ 3. Mobile Device Scans QR -> Establishes TLS (HTTPS) Handshake              │
│ 4. Host Validates PIN/Token -> Upgrades to Encrypted WebSocket (WSS)        │
│ 5. Session automatically expires on Desktop Close or 4 Hours Inactivity     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Security Safeguards:
1. **Local LAN Binding Only:** The server only responds to devices within the same private subnet (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) or local ad-hoc hotspot. Port forwarding (UPnP/NAT-PMP) is strictly disabled.
2. **Ephemeral PIN & Token Validation:** Unauthenticated connection attempts are immediately rejected with HTTP 401.
3. **Brute-Force Rate Limiting:** After 5 failed PIN entry attempts, the client IP is locked out for 15 minutes.
4. **Transport Layer Security:** All mobile traffic is encrypted via TLS 1.3 / WSS using locally generated self-signed certificates.

---

## 4. GDPR & CCPA Compliance Declaration

| Regulation | Requirement | Xteon Compliance Implementation |
| :--- | :--- | :--- |
| **GDPR Art. 5(1)(c)** | **Data Minimisation** | Xteon does not collect, store, or process Personally Identifiable Information (PII). Only local hardware IDs (EDID strings) are processed in volatile RAM. |
| **GDPR Art. 5(1)(e)** | **Storage Limitation** | Video frames are downsampled in GPU memory (VRAM) and immediately overwritten by the next frame. No frames are written to disk. |
| **GDPR Art. 25** | **Privacy by Design** | No analytics SDKs, tracking pixels, crash telemetry reporting, or advertising identifiers are included in the binary. |
| **GDPR Art. 32** | **Security of Processing** | Local companion communication is encrypted with TLS 1.3/AES-256-GCM. |
| **CCPA / CPRA** | **No Sale of Personal Data** | Xteon does not collect, broker, or sell any consumer or user data. |

---

## 5. Local Data Storage & Persistence

All persistent configuration is stored strictly in the user's standard operating system application directory:
* **Windows:** `%APPDATA%\Xteon\config.json`
* **macOS:** `~/Library/Application Support/Xteon/config.json`
* **Linux:** `~/.config/xteon/config.json`

### Stored Data Items:
* User-defined display aliases (e.g., *"Stage Left IMAG"*).
* 2D Canvas coordinate positions and saved layout presets (`.json`).
* Selected theme preference (Dark FOH / Daylight / Broadcast Neutral).
* Framerate throttle preferences (5 FPS / 10 FPS / 15 FPS).

*No logs, images, video captures, or network activity records are written to disk.*
