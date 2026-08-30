# UI/UX Design Specification & Themes
# System: Xteon
> **Pro AV Design System: Dual-Mode Planner Studio, Live Monitor, High-Performance SVG Vector Engine & Mobile Companion UX**

---

## 1. Dual-Mode Interface Architecture

Xteon features a persistent **Mode Switcher** in the top navigation bar, allowing operators to seamlessly toggle between **Planner Studio** (offline design) and **Live Monitor** (active rig diagnostics).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] Xteon | [ 📐 PLANNER STUDIO ] [ 🔴 LIVE MONITOR ] | [Sunday Rig ▼]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. High-Performance SVG Vector & Icon Architecture

To guarantee **retina-sharp visual clarity at 300% zoom** without sacrificing **60 FPS fluid canvas performance**, all visual assets, connector jacks, rack faceplates, and status indicators are engineered as lightweight, zero-dependency inline SVG vectors.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     HIGH-PERFORMANCE SVG VECTOR SYSTEM                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Zero Network / Asset Overhead:                                           │
│    Compiled directly into bundle as pure SVG paths (<45 KB total bundle).   │
│ 2. GPU-Accelerated Hardware Splines:                                        │
│    Cable bezier curves rendered via GPU canvas paths for 60 FPS panning.    │
│ 3. Semantic Color Tokens:                                                   │
│    Styled via CSS `currentColor` for instant theme transformations.         │
│ 4. Dynamic Level of Detail (LOD):                                           │
│    Automatic asset simplification based on canvas viewport zoom level.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Hardware Port & Connector SVG Vector Matrix

| Connector Type | Vector Silhouette & Pin Detail | Theme Accent Token |
| :--- | :--- | :---: |
| **HDMI Port** | Asymmetric chamfered trapezoid with internal gold contact row | `#8B5CF6` (`port-hdmi`) |
| **DisplayPort** | Asymmetric single-notched housing with locking clip teeth | `#3B82F6` (`port-dp`) |
| **BNC / SDI Port** | Circular bayonet lug barrel with central coaxial dielectric pin | `#EC4899` (`port-sdi`) |
| **RJ45 / EtherCON** | Industrial square EtherCON housing with top latch & 8-pin array | `#10B981` (`port-ethernet`) |
| **opticalCON / Fiber** | Dual-core LC duplex socket with protective spring-loaded flap | `#F97316` (`port-fiber`) |
| **USB-C / TB4** | Symmetrical oval stadium pill with dual-sided pin contact bar | `#06B6D4` (`port-usbc`) |
| **VGA / DVI (Legacy)** | 15-pin 3-row D-Subminiature shell with knurled thumbscrew posts | `#64748B` (`port-legacy`) |

---

### 2.2 Dynamic Vector Level of Detail (LOD) for 60 FPS Canvas Panning

To ensure smooth performance when navigating massive 100+ device arena rigs, Xteon dynamically adjusts the rendering complexity based on the zoom factor:

```
Zoom Level: 25% (Bird's Eye)       Zoom Level: 100% (Standard)        Zoom Level: 200% (Deep Zoom)
┌────────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
│ 🔀 Kramer 1x4  [4 Out] │         │ 🔀 KRAMER VM-4H2  🟢OK │         │ 🔀 KRAMER VM-4H2 2.0   │
└────────────────────────┘         │ In: [HDMI]             │         │ ┌────────────────────┐ │
                                   │ Out: [4x HDMI]         │         │ │ HDMI 2.0 IN (Gold) │ │
                                   └────────────────────────┘         │ ├────────────────────┤ │
                                                                      │ │ Out 1: 45m Cat6    │ │
                                                                      │ │ Out 2: 30m SDI     │ │
                                                                      │ └────────────────────┘ │
                                                                      └────────────────────────┘
  (Clean Mini Silhouette)             (Full Port Badges)                (Pin-Level Telemetry)
```

1. **Macro Overview (< 40% Zoom):** Nodes collapse into minimalist geometric vector silhouettes showing node label and input/output counts.
2. **Standard View (40% – 120% Zoom):** Renders the complete rack chassis, brand badges, active color-coded port jacks, and live video thumbnails.
3. **Micro Inspection (> 120% Zoom):** Reveals full granular pinouts, exact physical jack labels (*"HDMI IN 1 - 18Gbps"*), audio VU meter gradients, and live cable bitrate telemetry.

---

### 2.3 Color-Blind Accessible Status Geometry

To ensure full accessibility for operators with color vision deficiencies (Deuteranopia / Protanopia), all status indicators use distinctive **geometric shapes** in addition to color coding:

* 🟢 **Circle (`●`):** Normal / Optimal (<75% bandwidth, active lock).
* 🟡 **Triangle (`▲`):** Warning / Distance Risk (>75% bandwidth, long copper run).
* 🔴 **Octagon (`🛑`):** Critical Error / Bandwidth Overrun / Disconnected.
* 🔷 **Diamond (`◆`):** Standby / Sleep Mode.

---

## 3. Mode 1: Offline Planner Studio Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] Xteon | [ 📐 PLANNER STUDIO ] [ 🔴 LIVE MONITOR ] | [Export Sheets ▼]│
├──────────────┬──────────────────────────────────────────────┬───────────────┤
│ PALETTE      │  [+] [-] [Reset] [Snap: ON] [Validate Rig]   │ PROPERTIES    │
│              │                                              │               │
│ 🖥️ Sources   │    ┌────────────────────────┐                │ [1x4 Splitter]│
│ • Server PC  │    │ 💻 Media Server        │                │ Model: Kramer │
│ • Laptop     │    │ [Port 1: DP 1.4]       │                │ In: 1x HDMI 2 │
│              │    └───────────┬────────────┘                │ Out: 4x HDMI  │
│ 🔀 Distro    │                │ (DP to HDMI Active Cable)   │               │
│ • 1x4 Split  │                ▼                             │ CABLE PROP    │
│ • 8x8 Matrix │    ┌────────────────────────┐                │ Type: Cat6    │
│ • HDBaseT TX │    │ 🔀 1x4 HDMI Splitter   │                │ Length: 45m   │
│ • SDI Conv.  │    ├──┬─────────┬─────────┬─┘                │ Bandwidth:    │
│ • NovaStar   │    │  │         │         │                  │ 12.54 Gbps    │
│              │    │  │         │         └── (Cat6 HDBaseT) │               │
│ 📺 Sinks     │    │  │         └── (12G-SDI - 30m)          │ 🟢 STATUS:    │
│ • LED Wall   │    │  ▼                                      │ All signals   │
│ • Projector  │    │ 📺 [Stage Left IMAG]                    │ within spec   │
│ • Confidence │    ▼                                         │               │
│ • Foyer TV   │   📺 [Pastor Confidence Monitor]             │               │
├──────────────┴──────────────────────────────────────────────┴───────────────┤
│ 📋 RIG SUMMARY: 1 Server • 1 Splitter • 3 Displays • 4 Cables | [Export BOM]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Mode 2: Live Monitor & Diagnostics Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] Xteon | [ 📐 PLANNER STUDIO ] [ 🔴 LIVE MONITOR ] | [QR] [BLACKOUT]  │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ LIVE RIG (4) │  [+] [-] [Reset View] [Snap Grid: ON]   [Zone: Sanctuary]    │
│              │                                                              │
│ 🟢 Display 1 │    ┌────────────────────────┐   ┌────────────────────────┐   │
│  Stage L     │    │ 🟢 STAGE LEFT IMAG     │   │ 🟢 STAGE RIGHT IMAG    │   │
│              │    │ [HDMI 2.0] [1080p60]   │   │ [HDMI 2.0] [1080p60]   │   │
│ 🟢 Display 2 │    │ ┌────────────────────┐ │   │ ┌────────────────────┐ │   │
│  Stage R     │    │ │                    │ │   │ │                    │ │   │
│              │    │ │    LIVE PREVIEW    │ │   │ │    LIVE PREVIEW    │ │   │
│ 🟢 Display 3 │    │ │                    │ │   │ │                    │ │   │
│  Pastor Conf │    │ └────────────────────┘ │   │ └────────────────────┘ │   │
│              │    │ ⚡ Flash | 🎛️ Test | 🔇 │   │ ⚡ Flash | 🎛️ Test | 🔇 │   │
│ 🔀 1x4 Split ├────┴────────────────────────┴───┴────────────────────────────┤
│ 📋 DIAGNOSTICS: Display 1 (Samsung 75") | EDID: SAM0A24 | 1920x1080 @ 60Hz   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. The Plan-to-Live Reconciliation Wizard ("Diff & Match")

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ✨ PLAN-TO-LIVE RECONCILIATION DETECTED                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4 Live Displays detected. Matches your pre-production plan: "Sunday Worship"│
│                                                                             │
│  PLANNED NODE               LIVE HARDWARE DETECTED        MATCH CONFIDENCE  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Center Stage LED Wall   NovaStar MCTRL4K (DP 1.4)     [ 🟢 99% Match ]  │
│  2. Stage Left IMAG         Samsung 75" UHD (HDMI 2.0)    [ 🟢 96% Match ]  │
│  3. Stage Right IMAG        Samsung 75" UHD (HDMI 2.0)    [ 🟢 96% Match ]  │
│  4. Pastor Confidence       Dell 24" 1080p (USB-C DP)     [ 🟢 98% Match ]  │
│                                                                             │
│  [ ⚡ Flash Live Screen 2 ]               [ ⚡ Flash Live Screen 3 ]          │
├─────────────────────────────────────────────────────────────────────────────┤
│   [ Dismiss & Use Raw OS ]                 [ ✅ Apply Planned Rig (1-Click) ]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Pro AV Theme Tokens

* **FOH Stage Dark (Default):** Pitch OLED black `#0A0B0E` container, `#14171F` card body, neon status accents (`#10B981` OK, `#F59E0B` Warning, `#EF4444` Alert, `#06B6D4` Neon Cyan).
* **Daylight Festival Mode:** Crisp white `#FFFFFF` surface with `#0F172A` deep slate text, high-contrast 2px `#CBD5E1` card borders for outdoor direct sunlight.
* **Broadcast Neutral:** 18% Mid-Gray `#2B2B2B` background calibrated for broadcast control rooms.
