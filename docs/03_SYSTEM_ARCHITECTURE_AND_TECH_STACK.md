# System Architecture & Tech Stack Document
# System: Xteon (Extension + Eon)
> **Dual-Engine Architecture: Pre-Production Rig Planner, Live Diagnostics Engine & Hardware Integrations**

---

## 1. System Overview & Dual-Engine Topology

Xteon combines a **Real-Time Native OS Hardware Engine** with an **Offline Pre-Production CAD & Graph Studio**, built upon a lightweight **Rust Core** and a **Tauri v2 Webview** UI.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            XTEON UNIFIED WORKSPACE                          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     FRONTEND LAYER (Tauri v2 / React 18)              │  │
│  │  • Dual-Mode Switcher: [ 📐 PLANNER STUDIO ] | [ 🔴 LIVE MONITOR ]    │  │
│  │  • React Flow 2D Canvas (Hardware Topology & Stage Mind Map)          │  │
│  │  • Virtual Component Palette (Splitters, Extenders, Matrices, Sinks)  │  │
│  │  • Signal Bandwidth & Distance Warning Badges                         │  │
│  │  • Plan-to-Live Reconciliation Wizard ("Diff & Match")                │  │
│  │  • Patch Sheet & BOM PDF Exporter Engine                              │  │
│  │  • High-Performance Inline SVG Vector Engine with Dynamic LOD        │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │ High-Speed Tauri IPC Bridge          │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                       NATIVE RUST CORE ENGINE                         │  │
│  │  ┌─────────────────────────────────┐ ┌─────────────────────────────┐  │  │
│  │  │   OFFLINE PLANNING SUBSYSTEM    │ │    LIVE HARDWARE SUBSYSTEM   │  │  │
│  │  │ • Topology Graph & Port Model   │ │ • ScreenCaptureKit / DXGI   │  │  │
│  │  │ • Bandwidth & Distance Engine   │ │ • CCD / EDID Decoder Engine │  │  │
│  │  │ • LED Pixel Pitch Calculator    │ │ • MST Hub & IP Matrix Parser│  │  │
│  │  │ • Patch Sheet & BOM Generator   │ │ • Zero-Copy GPU Downscaler  │  │  │
│  │  └─────────────────────────────────┘ └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ PLAN-TO-LIVE RECONCILIATION & BIPARTITE MATCHING ENGINE          │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ HARDWARE INTEGRATIONS & SERVERS                                 │  │  │
│  │  │ • Local Companion WebSocket Server (Axum @ 0.0.0.0:8443)       │  │  │
│  │  │ • Bitfocus Companion & StreamDeck OSC Server (Port 9000 UDP)    │  │  │
│  │  │ • Global Panic Hotkey Listener (tauri-plugin-global-shortcut)   │  │  │
│  │  │ • Portable .xteon Rig File Serialization & Deserialization      │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────┬────────────────────┬────────────────────┬──────────────┘  │
└─────────────────┼────────────────────┼────────────────────┼─────────────────┘
                  │                    │                    │
                  ▼                    ▼                    ▼
        ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
        │   WINDOWS SUBSYS │ │   MACOS SUBSYS   │ │   LINUX SUBSYS   │
        │ • DXGI / WGC DDA │ │ • ScreenCaptureKit│ │ • PipeWire / XShm│
        │ • Win32 CCD APIs │ │ • IOKit & EDID   │ │ • DRM/KMS libdrm │
        │ • SetupAPI EDID  │ │ • CoreGraphics   │ │ • XRandR / Portal│
        └──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 2. Bitfocus Companion & StreamDeck Integration (OSC / REST)

Xteon embeds a high-throughput, non-blocking **OSC (Open Sound Control)** UDP listener (via the Rust crate `rosc`) and local REST API on port `9000`.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BITFOCUS COMPANION & STREAMDECK TOPOLOGY                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Elgato StreamDeck Console ] ──> [ Bitfocus Companion Instance ]          │
│                                           │ (OSC over UDP: 127.0.0.1:9000)  │
│                                           ▼                                 │
│  [ Xteon Native OSC Dispatcher ] ─────────────────────────────────────────┐ │
│  • /xteon/flash/{displayId}       -> Momentary Screen Flash               │ │
│  • /xteon/blackout/toggle         -> Master Emergency Blackout Shield     │ │
│  • /xteon/blackout/{displayId}    -> Individual Display Blackout          │ │
│  • /xteon/testpattern/{patternId} -> Trigger SMPTE Color Bars / Grid      │ │
│  • /xteon/preset/load/{presetName}-> Switch Active Stage Rig Preset       │ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Portable `.xteon` Project File Schema

A `.xteon` file is a compressed or clean JSON payload representing a complete production rig:

```json
{
  "version": "1.2.0",
  "meta": {
    "projectName": "Easter 2026 Sanctuary Rig",
    "author": "David M.",
    "venue": "Main Sanctuary",
    "updatedAt": "2026-08-28T15:15:00Z"
  },
  "nodes": [
    {
      "id": "node_server_01",
      "type": "MEDIA_SERVER",
      "label": "FOH Media Workstation",
      "stageZone": "FOH Booth",
      "position": { "x": 100, "y": 200 },
      "outputPorts": [
        { "id": "p1", "type": "DP_1_4", "connectedEdgeId": "edge_01" }
      ]
    },
    {
      "id": "node_splitter_01",
      "type": "SPLITTER_1X4",
      "label": "Kramer VM-4H2",
      "stageZone": "FOH Rack",
      "position": { "x": 450, "y": 200 }
    }
  ],
  "edges": [
    {
      "id": "edge_01",
      "sourceNodeId": "node_server_01",
      "targetNodeId": "node_splitter_01",
      "cableType": "FIBER_HDMI",
      "lengthMeters": 45,
      "calculatedBandwidthGbps": 12.54,
      "status": "VALID"
    }
  ]
}
```

---

## 4. Signal Bandwidth & Transmission Distance Engine

The Rust core executes real-time validation upon graph modifications:
$$R = H_{\text{total}} \times V_{\text{total}} \times \text{FPS} \times \left(\frac{\text{Bits Per Pixel}}{8}\right) \times 8 \text{ bits/byte}$$

* **HDMI 2.0 (18 Gbps):** Validates copper runs $\le 7.5\text{m}$; flags runs $> 7.5\text{m}$ with distance warnings.
* **Fiber HDMI 2.1 (48 Gbps):** Validates runs up to $100\text{m}+$.
* **3G-SDI vs 12G-SDI:** Automatically enforces bandwidth limits ($2.97\text{ Gbps}$ vs $11.88\text{ Gbps}$).
* **HDBaseT Cat6A:** Validates $100\text{m}$ threshold.

---

## 5. Plan-to-Live Reconciliation Engine

Weighted bipartite matching algorithm mapping live detected EDID/ports to planned nodes:
$$\text{Score}(L, P) = w_{\text{res}} \cdot \text{Sim}_{\text{res}}(L, P) + w_{\text{port}} \cdot \text{Sim}_{\text{port}}(L, P) + w_{\text{edid}} \cdot \text{Sim}_{\text{edid}}(L, P)$$
* Auto-applies matching if confidence $\ge 85\%$.
* Launches visual drag-and-drop resolver if ambiguities occur.
