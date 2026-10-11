# Xteon
> **The Real-Time Display Topology, Pre-Production Rig Planner & Live Hardware Intelligence Workspace for Pro AV & Media Production**

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](#)
[![Tech Stack](https://img.shields.io/badge/Core-Rust%20%2B%20Tauri%20v2-orange.svg)](#)
[![UI](https://img.shields.io/badge/UI-React%20%2B%20React%20Flow%20%2B%20Tailwind-61dafb.svg)](#)
[![QA](https://img.shields.io/badge/QA%20Tests-759%20Passed%20(100%25)-brightgreen.svg)](#)
[![Integrations](https://img.shields.io/badge/Integrations-StreamDeck%20%7C%20Bitfocus%20Companion%20%7C%20OSC-purple.svg)](#)
[![License](https://img.shields.io/badge/License-Commercial%20%2F%20Proprietary-red.svg)](#)

---

## 1. Executive Summary

**Xteon** is the industry-first, unified **Offline Pre-Production Rig Planner**, **Live Graph Topology Workspace**, and **Real-Time Display & Camera Intelligence Monitor** engineered for live events, houses of worship, touring concert crews, broadcast trucks, corporate AV engineers, and media server operators.

In high-stakes productions, video distribution and stage camera routing is complex: media servers and presentation workstations connect to external splitters, HDBaseT extenders, SDI converters, LED wall processors, matrix routers, stage confidence monitors, and wireless roving cameras.

**Xteon unifies the entire production lifecycle across three synchronized modes:**

1. 🎨 **Planner Studio ("CAD for Pro AV"):** Design, route, and calculate complex multi-screen video and camera rigs weeks in advance with zero connected hardware.
   * Drag-and-drop component library (Laptops, Cameras, Splitters, Matrix Switchers, Extenders, Converters, LED Walls, Projectors, Stage TVs).
   * Dynamic Custom Port Manager (add, remove, and reconfigure HDMI, DisplayPort, SDI, NDI, Fiber, and USB-C ports on any node).
   * 4 Industry Starter Templates (Corporate Dual IMAG, Broadcast 4-Camera, LED Wall Arena, Hybrid GlideX Overflow).
   * Automated **15-Column CSV Cable Pull List Generator** (RFC 4180 compliant with metric/imperial lengths and crew routing sheets).
   * Portable `.xteon` project file format for 1-click sharing.

2. 🗺️ **Live Map Topology & Virtual Distribution Branching:** Interactive 2D topological graph of your live physical setup.
   * Single unified Host Workstation node connected to live physical screens and unhidden camera feeds.
   * **Virtual Distribution Branching (Splitters & DAs):** Solve HDMI point-to-point hardware isolation. Branch any GPU output into a 1x2, 1x4 (e.g. Antiference), or 1x8 DA, or CAT6 HDBaseT PoC chain, naming each TV (`Dining Hall TV`, `Main Stage`), designating zones, and tracking cable lengths with mirrored video feeds.
   * Real-time cable signal bandwidth status (Valid, Warning, Exceeded) and length degradation tracking.
   * High-contrast Pro AV themes (FOH Dark & High-Noon Daylight) with interactive Inspector and Palette dock/float controls.

3. 🔴 **Live Monitor & Diagnostics:** Comprehensive show-day mission control.
   * **GPU-Accelerated Screen Previews:** Live low-latency thumbnails with cursor toggle and audio VU metering.
   * **Momentary Screen Flash Identifier:** 1-click borderless flash cards to instantly spot physical display positions across large venues.
   * **SMPTE Bars, Overscan & PLUGE Black Level Calibration:** Integrated test pattern generator with 100% boundary lines, 95% Action Safe, 90% Title Safe, and -4%/0%/+4% super-black calibration bars.
   * **Emergency Master Blackout (`Ctrl+Shift+B`):** Global instantaneous panic blackout shield protecting presentation hosts.
   * **"Fork Live Rig into Planner":** 1-click reverse-synthesis engine converting live hardware topologies into an editable Planner CAD canvas.

---

## 2. Show-Day Safety Shields

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SHOW-DAY SAFETY SHIELDS IN XTEON                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. ☕ Keep-Awake Presentation Shield ("Caffeine Lock")                      │
│    Prevents OS display sleep, screensavers, and power timeouts during live  │
│    presentations and keynotes with an active Navbar toggle.                 │
│                                                                             │
│ 2. 🚨 Presentation Privacy Guard (Mirroring Alert)                          │
│    Automatically flags when displays are set to Clone/Mirror instead of     │
│    Extend, preventing private desktop and presenter notes leakage.          │
│                                                                             │
│ 3. 🔊 Non-Destructive Audio Route Guard                                     │
│    Intercepts HDMI audio handshakes from newly plugged TVs and prevents     │
│    unexpected audio hijacking, with polite toasts and strict-lock modes.    │
│                                                                             │
│ 4. 📺 Smart TV Anti-Dimming Heartbeat & 1:1 Pixel Calibration               │
│    Generates periodic sub-pixel luminance micro-activity to prevent Samsung │
│    and LG TVs from dimming during static slides; built-in TV cheat-sheets.  │
│                                                                             │
│ 5. 📋 Blackbox Flight Recorder (Hardware Audit Log)                         │
│    Chronological event log of hotplugs, disconnects, audio reroutes, and    │
│    safety triggers with 1-click Show Incident Report clipboard export.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Centralized Preferences & Settings Subsystem

Access via the **⚙️ Settings** button in the top navigation bar (`Ctrl+,` / `Cmd+,`):
* **Audio Protection:** Toggle Audio Route Guard, select *Polite Notification* vs *Strict Lock*, and configure primary soundcard fallback.
* **Displays & Smart TVs:** Enable/disable Anti-Dimming Heartbeats, Window Position Guardians (anti-reshuffle), and inspect active distribution branches.
* **Performance:** Set preview target FPS (10, 20, 30, 60 FPS), cursor rendering, and hardware acceleration throttling.
* **Privacy & Companion:** Presentation privacy mirroring alerts, internal webcam auto-standby, and Mobile Companion LAN PIN protection.

---

## 4. Camera Ingest & Privacy Subsystem

Xteon includes a multi-path video camera ingest pipeline:

* **Universal Connection Support:** Automatically detects cameras over wired HDMI/SDI capture cards (Elgato Cam Link, Blackmagic DeckLink, AVerMedia, Magewell), USB cameras (Logitech Brio, Razer Kiyo), NDI IP streams, and wireless mobile links (Iriun 4K, DroidCam, Camo, EpocCam).
* **Privacy Standby by Default:** Internal laptop webcams and software virtual drivers (OBS Virtual Camera, screen capture utilities) are automatically classified and placed into **Sensor Standby** with video streams detached so hardware privacy LEDs stay off.
* **Camera Ingest Manager Drawer:** Dedicated side panel to view all connected video sources, unhide stage cameras, customize aliases, assign stage zones, and engage live video feeds.

---

## 5. Mobile Companion (Local Untethered Wi-Fi Director)

Walk the sanctuary, auditorium, or arena floor while controlling stage screens from your smartphone:

* **Zero Internet Required:** Embedded high-performance HTTP/WebSocket server running on LAN port `8765` with PIN authentication.
* **1-to-1 Parity with Live Monitor:** Synchronized screen numbering (**Screen 1**: Primary Workstation, **Screen 2**: Wireless Phone/External Display), custom aliases, stage zones, resolutions, and refresh rates.
* **Instant Tactile Flash:** Tap **"⚡ Flash Screen"** on your mobile phone to pop the screen identifier overlay on the stage display.

---

## 6. Multi-Platform Downloads & Installation Matrix (v1.3.0)

| Operating System | Architecture | Package Format | Direct Download Link | Instructions |
| :--- | :--- | :--- | :--- | :--- |
| **🪟 Windows 10 / 11** | 64-bit (`x64`) | **NSIS Installer (`.exe`)** | [⬇️ Download `Xteon_1.3.0_x64-setup.exe`](https://github.com/patrickudo2004/xteon/releases/latest/download/Xteon_1.3.0_x64-setup.exe) | Standard installer with Start Menu & desktop shortcuts |
| **🪟 Windows 10 / 11** | 64-bit (`x64`) | **Windows Installer (`.msi`)** | [⬇️ Download `Xteon_1.3.0_x64_en-US.msi`](https://github.com/patrickudo2004/xteon/releases/latest/download/Xteon_1.3.0_x64_en-US.msi) | Enterprise / silent deployment package for AV IT managers |
| **🍏 macOS** | Universal (`Apple Silicon M1-M4 & Intel x86_64`) | **Apple Disk Image (`.dmg`)** | [⬇️ Download `Xteon_1.3.0_universal.dmg`](https://github.com/patrickudo2004/xteon/releases/latest/download/Xteon_1.3.0_universal.dmg) | Mount DMG and drag `Xteon.app` to `/Applications` |
| **🍏 macOS** | Universal (`Apple Silicon & Intel`) | **Application Bundle (`.tar.gz`)** | [⬇️ Download `Xteon.app.tar.gz`](https://github.com/patrickudo2004/xteon/releases/latest/download/Xteon.app.tar.gz) | Standalone app bundle for automated deployment / MDM |
| **🐧 Linux (All Distros)** | 64-bit (`x86_64`) | **Universal Linux (`.AppImage`)** | [⬇️ Download `Xteon_1.3.0_amd64.AppImage`](https://github.com/patrickudo2004/xteon/releases/latest/download/Xteon_1.3.0_amd64.AppImage) | Run `chmod +x Xteon_1.3.0_amd64.AppImage && ./Xteon_1.3.0_amd64.AppImage` |
| **🐧 Linux (Debian / Ubuntu)** | 64-bit (`amd64`) | **Debian Package (`.deb`)** | [⬇️ Download `xteon_1.3.0_amd64.deb`](https://github.com/patrickudo2004/xteon/releases/latest/download/xteon_1.3.0_amd64.deb) | Install via `sudo dpkg -i xteon_1.3.0_amd64.deb` |

> [!NOTE]
> All releases, release notes, and cryptographic signing manifests (`latest.json`) are published on [GitHub Releases](https://github.com/patrickudo2004/xteon/releases).

---

## 7. In-App Auto-Updater

Xteon features automatic background update detection and cryptographic signature verification powered by the Tauri v2 Updater:
1. Click the **Updates** button in the top navigation bar.
2. Xteon connects to [patrickudo2004/xteon/releases](https://github.com/patrickudo2004/xteon/releases) to fetch release notes and version status via `latest.json`.
3. Download updates in-app with byte telemetry progress and click **Relaunch Now** to upgrade instantly.

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

# Run Automated Pro AV QA Test Suite (759 Assertions across 9 Suites)
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
