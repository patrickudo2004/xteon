# Xteon (Extension + Eon)
> **The Real-Time Display Topology, Pre-Production Rig Planner & Live Hardware Intelligence Workspace for Pro AV & Media Production**

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](#)
[![Tech Stack](https://img.shields.io/badge/Core-Rust%20%2B%20Tauri%20v2-orange.svg)](#)
[![UI](https://img.shields.io/badge/UI-React%20%2B%20React%20Flow%20%2B%20Tailwind-61dafb.svg)](#)
[![Integrations](https://img.shields.io/badge/Integrations-StreamDeck%20%7C%20Bitfocus%20Companion%20%7C%20OSC-purple.svg)](#)
[![License](https://img.shields.io/badge/License-Commercial%20%2F%20Proprietary-red.svg)](#)

---

## 1. Executive Summary

**Xteon** (*Extension + Eon*) is the industry-first, unified **Offline Pre-Production Rig Planner** and **Real-Time Live Display Topology Workspace** designed for media production teams, AV engineers, church tech directors, broadcast operators, and touring video crews.

In high-stakes live productions, video routing is complex: a single media server connects to external splitters, HDBaseT extenders, SDI converters, LED wall processors, and matrix switchers driving dozens of screens across an arena or sanctuary.

**Xteon bridges the entire production lifecycle across two synchronized modes:**
1. **📐 Offline Rig Planner Mode ("Cisco Packet Tracer for Pro AV"):** Allows media directors to design, simulate, and calculate complex multi-display rigs weeks in advance with zero connected hardware. Features a drag-and-drop virtual component library (splitters, matrixes, extenders, converters, LED processors), a smart cable bandwidth & distance validator, and automated export of **Cable Patch Sheets** and **Equipment Bill of Materials (BOM)** for crews.
2. **🔴 Live Monitor & Diagnostics Mode:** On show day, Xteon automatically detects all live displays, reconciles them with the pre-production plan ("Plan-to-Live Reconciliation"), renders **GPU-accelerated live video previews**, monitors signal health and audio VU meters, provides one-click screen flash identifiers, and hosts a zero-config **Untethered Mobile Wi-Fi Companion** for walking the venue.

---

## 2. The 5 Pro AV Essentials Built-In

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE 5 "PRO AV ESSENTIALS" IN XTEON                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. 🎛️ Bitfocus Companion & StreamDeck Control (OSC & Local REST API)        │
│    Physical tactile buttons for Flash, Blackout, Test Patterns & Presets.   │
│                                                                             │
│ 2. 🚨 Global "Panic" Master Blackout Hotkey                                 │
│    Instant keyboard trigger (Ctrl+Shift+B) even when Xteon is in background.│
│                                                                             │
│ 3. 📁 Portable `.xteon` Project File Format & OS Association                │
│    Double-clickable project files to share rigs, patch sheets & BOMs.       │
│                                                                             │
│ 4. 👁️ Color-Blind Accessible Status Geometry                                 │
│    Distinct shapes (🟢 Circle OK, 🟡 Triangle Warning, 🛑 Octagon Error).   │
│                                                                             │
│ 5. 📦 Zero-Dependency Packaging & Tauri v2 Auto-Updater                     │
│    Native signed .msi/.exe (Windows), .dmg (macOS), .AppImage (Linux).      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Pillars & The Unified Workflow

```
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                         THE XTEON UNIFIED WORKFLOW                          │
   └──────────────────────────────────────┬──────────────────────────────────────┘
                                          │
    ┌─────────────────────────────────────┴─────────────────────────────────────┐
    │                                                                           │
┌───▼─────────────────────────────────────┐   ┌─────────────────────────────────▼───┐
│     PLAN (Offline Rig Studio)           │   │    DEPLOY & MONITOR (Live Mode)     │
│ • Design 2D stage topologies ahead      │   │ • Plug in at venue -> Auto-detect   │
│ • Drag splitters, extenders & matrices  │──>│ • "Plan-to-Live" Reconciliation     │
│ • Validate cable bandwidth & distances  │   │ • GPU Live Mini-Previews @ 10 FPS   │
│ • Export Cable Patch Sheets & Crew BOM  │   │ • Mobile Wi-Fi Companion walk-around│
│ • Save to portable .xteon file          │   │ • StreamDeck / OSC hardware control │
└─────────────────────────────────────────┘   └─────────────────────────────────────┘
```

* **Universal Distribution Intelligence:** Recognizes complex routing paths, including 1x4/1x8 HDMI splitters, DisplayPort MST hubs, USB-C/Thunderbolt docks, HDBaseT extenders, SDI converters (Decimator/Blackmagic), and IP matrix switchers.
* **Zero-Interference Footprint:** Under 1.5% GPU utilization and <50MB RAM footprint, ensuring primary live media renderers (Resolume, ProPresenter, OBS, vMix, disguise) never drop a frame.
* **100% Local-First & Zero-Telemetry:** No video frames or display data ever leave the local network. Secure and fully compliant with broadcast NDAs and GDPR.

---

## 4. Documentation Index

The complete software engineering, architectural, and operational specification suite is organized below:

| # | Document | Purpose & Key Topics |
| :--- | :--- | :--- |
| **01** | [**Project Initiation Document (PID)**](docs/01_PROJECT_INITIATION_DOCUMENT_PID.md) | Business case, ROI, target personas, dual-mode scope, StreamDeck/OSC integrations, and risk mitigation. |
| **02** | [**Product Requirements Document (PRD)**](docs/02_PRODUCT_REQUIREMENTS_DOCUMENT_PRD.md) | 38 Functional Requirements (FR-01 to FR-38), NFRs, MoSCoW prioritization, distribution parsing, StreamDeck API, and `.xteon` format. |
| **03** | [**System Architecture & Tech Stack**](docs/03_SYSTEM_ARCHITECTURE_AND_TECH_STACK.md) | Native OS capture engines (DXGI, SCK, PipeWire), EDID parser, MST tree discovery, OSC / REST server, Bandwidth Calculator engine, and Tauri v2 + Rust architecture. |
| **04** | [**UI/UX Design Specification & Themes**](docs/04_UI_UX_DESIGN_SPECIFICATION.md) | Design system, FOH Stage Dark / Daylight themes, High-Performance SVG vectors, Dynamic LOD, Color-Blind Accessibility, and Mobile Companion UX. |
| **05** | [**Security, Privacy & GDPR Compliance**](docs/05_SECURITY_PRIVACY_AND_GDPR_COMPLIANCE.md) | Local-first zero-telemetry policy, OS screen recording permission handling, local TLS/WSS PIN pairing, and GDPR/CCPA alignment. |
| **06** | [**Legal Terms, EULA & Disclaimers**](docs/06_LEGAL_TERMS_AND_EULA.md) | End User License Agreement, Terms of Service, live broadcast liability disclaimers, and open-source attributions. |
| **07** | [**Quality Assurance & Hardware Test Plan**](docs/07_QUALITY_ASSURANCE_AND_TEST_PLAN.md) | Multi-GPU matrix, distribution splitter testing, StreamDeck/OSC stress tests, global hotkey verification, and automated CI/CD pipeline. |

---

## 5. Technology Stack Summary

* **Backend / Host Layer:** Rust 2021, Tauri v2, Tokio, Axum (Local WebSocket/WebRTC Companion Server), `rosc` (Open Sound Control protocol).
* **Native Capture Drivers:** 
  * Windows: DirectX Desktop Duplication API (DXGI) & Windows Graphics Capture (WGC) + Win32 CCD API.
  * macOS: ScreenCaptureKit (SCK) & IOKit / CoreGraphics.
  * Linux: PipeWire (`xdg-desktop-portal`) & DRM/KMS / libdrm.
* **Frontend Webview:** React 18, TypeScript, Tailwind CSS, Lucide Icons, React Flow (Infinite 2D Spatial Canvas & Planner Studio), Zustand (State Management).
* **Calculation Engines:** AV Signal Bandwidth & Distance Calculator (Rust-compiled native core).
* **Mobile Companion:** Progressive Web App (PWA) served locally over LAN Wi-Fi with QR code pairing and zero internet dependencies.

---

## 6. Installation & Multi-Platform Releases

Xteon is packaged natively for Windows, macOS, and Linux with built-in auto-updates:

### 🪟 Windows (10 / 11 64-bit)
* **Installer:** Download `Xteon_1.2.0_x64-setup.exe` or `Xteon_1.2.0_x64_en-US.msi` from [Releases](https://github.com/patrickudo2004/xteon/releases).
* **Direct Execution:** Standalone portable binary `xteon.exe` available with zero prerequisite installers.

### 🍏 macOS (Apple Silicon M1/M2/M3 & Intel x86_64)
* **Disk Image:** Download `Xteon_1.2.0_universal.dmg` from [Releases](https://github.com/patrickudo2004/xteon/releases).
* Drag `Xteon.app` to your `/Applications` folder.

### 🐧 Linux (Ubuntu, Debian, Fedora, Arch)
* **AppImage:** Download `Xteon_1.2.0_amd64.AppImage`, run `chmod +x Xteon_1.2.0_amd64.AppImage`, and execute.
* **Debian / Ubuntu Package:** Download `xteon_1.2.0_amd64.deb` and install via `sudo dpkg -i xteon_1.2.0_amd64.deb`.

---

## 7. In-App Auto-Updater

Xteon features automatic background update detection and cryptographic signature verification powered by the Tauri v2 Updater:
1. Click the **Updates** button in the top navigation bar or navigate to Settings.
2. Xteon checks [patrickudo2004/xteon/releases](https://github.com/patrickudo2004/xteon/releases) for new version manifests (`latest.json`).
3. View release notes, track real-time download progress, and click **Relaunch Now** to install seamlessly without losing canvas state.

---

## 8. Development & Building from Source

### Prerequisites
* **Node.js:** v18.0+ / v20.x
* **Rust:** Stable toolchain (`rustup default stable`)
* **Tauri CLI:** v2.x (`npm install -g @tauri-apps/cli`)

### Setup Instructions
```bash
# Clone the repository
git clone https://github.com/patrickudo2004/xteon.git
cd xteon

# Install frontend dependencies
npm install

# Run in Development Mode (Vite + Tauri)
npm run tauri dev

# Run Automated Pro AV QA Test Suite (718 Assertions)
npm test

# Build Production Release Package for your current OS
npm run build
npx tauri build
```

---

## 9. Author & License

* **Project Owner & Lead:** Patrick Udoh ([patrickudo2004@gmail.com](mailto:patrickudo2004@gmail.com))
* **GitHub Repository:** [https://github.com/patrickudo2004/xteon](https://github.com/patrickudo2004/xteon)
* **License:** Proprietary / Commercial Pro AV License. All Rights Reserved.
