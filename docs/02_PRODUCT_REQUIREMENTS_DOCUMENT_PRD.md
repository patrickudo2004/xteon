# Product Requirements Document (PRD)
# Product: Xteon
> **Real-Time Display Topology, Pre-Production Rig Planner & Live Hardware Intelligence Workspace**

---

## Document Control

| Field | Description |
| :--- | :--- |
| **Version** | 1.2.0 |
| **Author** | Xteon Product & Systems Architecture Team |
| **Status** | Approved Specification |
| **Target Release** | v1.0.0 General Availability |
| **Platforms** | Windows 10/11 (x64/ARM64), macOS 12.3+ (Apple Silicon/Intel), Linux (X11/Wayland) |

---

## 1. Product Vision & Unified Workflow

Xteon unifies the entire lifecycle of professional video display engineering into a single cross-platform desktop application:
1. **The Pre-Production Phase (Offline Planner Mode):** Design complex video distribution rigs, calculate signal bandwidths and cable lengths, and generate cable patch sheets and equipment lists before stepping foot in the venue.
2. **The Show-Day Phase (Live Monitor & Diagnostics Mode):** Automatically detect connected displays, reconcile them with the pre-production plan, monitor GPU-accelerated live video previews, inspect intermediate distribution hardware, and line-check screens using the mobile companion.

---

## 2. Functional Requirements (FR)

### 2.1 Hardware Discovery & EDID Introspection (FR-01 to FR-06)

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-01** | **Universal Display Enumeration** | Detect all active, inactive, and virtual displays connected to the host system without arbitrary display limits (supporting 1 to 32+ screens). | Must |
| **FR-02** | **Hotplug Event Listener** | Dynamically detect display connection and disconnection events in real time (<250ms) without requiring manual refresh or app restart. | Must |
| **FR-03** | **Port Type Recognition** | Identify and display exact physical/logical connection interfaces: HDMI (1.4/2.0/2.1), DisplayPort (1.2/1.4/2.0), USB-C DP-Alt, Thunderbolt 3/4, DVI, VGA, SDI (via DeckLink/AJA), NDI stream, or Wireless (Miracast/AirPlay). | Must |
| **FR-04** | **EDID & Hardware Metadata Extraction** | Query manufacturer name (e.g. Samsung, LG, Novastar, Barco), model number, serial number, manufacture date, and physical panel size (inches/cm). | Must |
| **FR-05** | **Resolution & Refresh Rate Reporting** | Display active resolution, native panel resolution, refresh rate (Hz), aspect ratio, orientation (Landscape/Portrait), and DPI scale factor. | Must |
| **FR-06** | **Color Space & HDR Status** | Detect color format (RGB 8-bit, 10-bit, YCbCr 4:2:2/4:4:4), color profile (sRGB, Rec.709, DCI-P3, Rec.2020), and HDR status (HDR10, Dolby Vision, SDR). | Should |

---

### 2.2 Distribution Hardware & Complex Topology Parsing (FR-07 to FR-10)

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-07** | **DisplayPort MST Tree Discovery** | Parse DisplayPort Multi-Stream Transport (MST) branch device topologies to identify multi-stream hubs, daisy chains, and subordinate sinks. | Must |
| **FR-08** | **Active IP & USB Matrix Discovery** | Discover and query network-connected video matrix switchers (Blackmagic Videohub via Telnet/Ethernet, Kramer Protocol 3000, Extron SIS, NovaStar LED processors) to map physical routing. | Should |
| **FR-09** | **EDID Distribution Fingerprinting** | Identify distribution amplifiers, extenders, and cross-converters (Kramer, Extron, Decimator, Gefen, HDFury, AJA) by decoding CEA-861 vendor blocks. | Must |
| **FR-10** | **Smart Passive Splitter Injection** | Allow users to drop virtual 1x2, 1x4, and 1x8 Splitter / Extender nodes onto a live GPU output to branch a single raster into multiple labeled virtual sinks with synchronized flash testing. | Must |

---

### 2.3 Live Video Preview Engine (FR-11 to FR-15)

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-11** | **Real-Time GPU Mini-Preview** | Render a live, hardware-accelerated video thumbnail of the content currently rendered on each external screen. | Must |
| **FR-12** | **Adaptive Framerate Throttling** | Provide user-selectable preview framerates (5 FPS, 10 FPS, 15 FPS, 30 FPS) with auto-throttling to maintain host system performance under load. | Must |
| **FR-13** | **Zero-Copy GPU Downsampling** | Downscale display framebuffers directly in VRAM (e.g. 4K down to 384x216) before streaming to UI, ensuring near-zero CPU footprint. | Must |
| **FR-14** | **HDCP Protected Content Handling** | Detect HDCP-protected content gracefully, rendering an informative badge (*"HDCP Active - Protected Stream"*) instead of crashing or corrupting memory. | Must |
| **FR-15** | **Aspect Ratio Preservation** | Correctly scale ultrawide (21:9, 32:9), portrait (9:16), and custom LED wall rasters without image distortion. | Must |

---

### 2.4 Offline Pre-Production Rig Planner ("Cisco Packet Tracer for AV") (FR-16 to FR-22)

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-16** | **Offline 2D Design Studio** | Interactive infinite canvas allowing users to design complete multi-display rigs with zero physical displays connected. | Must |
| **FR-17** | **Virtual AV Component Palette** | Drag-and-drop catalog of standard AV hardware: Sources, Distribution (Splitters, Matrices), Extenders (HDBaseT, Fiber), Converters (Decimators), LED Processors (NovaStar, Brompton), and Sinks (LED Walls, Projectors, TVs). | Must |
| **FR-18** | **Smart Cable & Signal Bandwidth Calculator** | Selectable cable types (Copper HDMI 2.0/2.1, Fiber HDMI, DP 1.4, 3G/12G-SDI, Cat6 HDBaseT, NDI) with automated bandwidth and distance validation (e.g. flagging 4K60 copper HDMI over 20m as unstable). | Must |
| **FR-19** | **Custom LED Wall Pixel Pitch Calculator** | Configure LED wall dimensions, cabinet pixel pitch (e.g. P2.6, P3.91), total raster resolution, power draw, and required LED processor port count. | Should |
| **FR-20** | **Automated Cable Run & Patch Sheet Generator** | One-click export of structured Cable Run Sheets detailing source port, cable type, length, intermediate converters, and target screen destination. | Must |
| **FR-21** | **Equipment Bill of Materials (BOM) Exporter** | Generate an exportable equipment manifest (PDF/CSV) listing all required splitters, extenders, converters, and cable counts for packing flight cases. | Must |
| **FR-22** | **Rig Schematic Export (PDF/PNG)** | Export high-resolution, branded stage layout diagrams to share with event producers, venue techs, and stagehands. | Must |

---

### 2.5 Plan-to-Live Reconciliation Engine (FR-23 to FR-25)

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-23** | **Plan-to-Live Diff & Match Engine** | When connecting to physical hardware, compare detected live displays with the active pre-production plan, calculating match confidence based on EDID, port type, and resolution. | Must |
| **FR-24** | **One-Click Configuration Application** | Single-click application of planned aliases, stage canvas coordinates, and distribution tags to live hardware. | Must |
| **FR-25** | **Manual Reconciliation Resolver** | Visual drag-and-drop interface to resolve mismatches if live display counts or port assignments differ from the planned diagram. | Must |

---

### 2.6 Live Production Tools, Integrations & Mobile Companion (FR-26 to FR-34)

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-26** | **Screen Flash Identifier** | Instantly flash a high-contrast, border-pulsing overlay showing the screen index, custom alias, and resolution directly on the target physical screen for 3.5 seconds. | Must |
| **FR-27** | **Test Pattern Generator** | Send standard calibration test patterns to any selected output: SMPTE Color Bars, Alignment Grid / Crosshairs, Solid Colors (White/Black/Red/Green/Blue), and Lip-Sync Flash. | Must |
| **FR-28** | **Audio Output & VU Meter** | Detect active audio streams routed over HDMI/DP/SDI and display live stereo/multi-channel VU audio level meters alongside the video preview. | Should |
| **FR-29** | **Emergency Blackout / Freeze Shield** | A one-click emergency override to black out or freeze an external output if unintended content (e.g. personal email, mouse cursor) appears on a live screen. | Must |
| **FR-30** | **Signal Health & Handshake Monitor** | Continuous monitoring of signal stability with visual badges: 🟢 *Healthy*, 🟡 *Handshake Degraded / Low FPS*, 🔴 *Signal Dropped / Cable Disconnected*. | Must |
| **FR-31** | **Embedded Local Mobile Server** | Desktop app runs a local, lightweight HTTPS/WSS server accessible over local Wi-Fi without requiring internet access or cloud servers. | Must |
| **FR-32** | **Mobile Live Multi-Screen Deck & Remote Flash** | Responsive mobile interface providing swipeable cards, live screen thumbnails (<120ms latency), and one-tap remote screen flashing while walking the venue. | Must |
| **FR-33** | **Bitfocus Companion & StreamDeck Control API** | Local REST / WebSocket / OSC (Open Sound Control) API to trigger screen flashing, emergency blackout, test patterns, and preset switches directly from Elgato StreamDeck hardware keys. | Should |
| **FR-34** | **Global Keyboard Shortcuts & Panic Hotkey** | Configurable global hotkeys (e.g. `Ctrl+Shift+B` for Emergency Blackout on all external screens, `1-9` for Quick Flash screen). | Must |

---

### 2.7 System, Themes, File Format & Accessibility (FR-35 to FR-38)

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-35** | **Pro AV High-Contrast Themes & SVG Engine** | Support **FOH Stage Dark**, **Daylight Stage Mode**, and **Broadcast Neutral 18% Gray** powered by zero-overhead inline SVG vectors with dynamic Level of Detail (LOD). | Must |
| **FR-36** | **Color-Blind Accessible Status Geometry** | Distinct geometric shapes (`●` Circle OK, `▲` Triangle Warning, `🛑` Octagon Error) ensuring 100% clarity for color-blind operators. | Must |
| **FR-37** | **Portable `.xteon` Rig File Format** | Native file association for `.xteon` files, allowing production teams to share complete stage rigs and cable sheets via USB or email with 1-click loading. | Must |
| **FR-38** | **System Tray & Mini Floating Widget** | Minimize to system tray/menu bar with an optional always-on-top compact floating thumbnail bar for multi-tasking operators. | Should |
