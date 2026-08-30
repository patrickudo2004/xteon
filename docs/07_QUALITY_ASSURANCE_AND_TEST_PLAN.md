# Quality Assurance & Hardware Test Plan
# System: Xteon (Extension + Eon)
> **Multi-GPU Test Matrix, Rig Planner Validation, StreamDeck & Live Production Reliability Suite**

---

## 1. QA Strategy & Zero-Crash Mandate

Xteon operates across both the **Pre-Production Design Phase** and the **Live Production Show-Day Phase**. Quality assurance must validate both the mathematical accuracy of the offline planning engine, the responsiveness of external hardware integrations (StreamDeck/OSC), and the zero-latency, zero-crash reliability of the live capture engine.

---

## 2. Comprehensive Test Cases & Verification Procedures

### TC-01: Rapid Display Hotplug & Unplug Stress Test
* **Objective:** Verify dynamic enumeration and handle cleanup during rapid cable patching.
* **Procedure:** Execute 50 rapid sequential plug/unplug cycles across HDMI, DP, and USB-C.
* **Pass Criteria:** Memory remains under 50MB baseline; UI updates topology within **250ms**.

---

### TC-02: Mixed DPI & Mixed Refresh Rate Synchronization
* **Objective:** Ensure capture and canvas correctly scale mixed resolution/DPI displays without stretching.
* **Pass Criteria:** Previews maintain 100% aspect ratio accuracy across 4K @ 150% DPI, 1080p @ 100% DPI, and 9:16 portrait rasters.

---

### TC-03: 72-Hour Live Production Soak & GPU Contention Test
* **Objective:** Validate zero-interference when running alongside primary live media renderers (Resolume/ProPresenter @ 85% GPU load).
* **Pass Criteria:** Primary renderer drops **0 frames**; Xteon GPU utilization stays **< 1.5%**; zero memory leaks over 72 hours.

---

### TC-04: Intermediate Distribution Splitter & MST Hub Discovery
* **Objective:** Verify detection and handling of 1x4/1x8 HDMI splitters and DisplayPort MST hubs.
* **Test Setup:** Connect Host GPU to a 1x4 HDMI Distribution Amplifier feeding 3 identical 1080p monitors. Drop a 1x4 Splitter Node in Xteon.
* **Pass Criteria:** Routes single GPU texture across all 3 cloned virtual sink cards with synchronized flash tests.

---

### TC-05: Smart Cable Bandwidth & Distance Calculation Accuracy
* **Objective:** Mathematically validate the Rust bandwidth calculation engine against VESA and SMPTE standards.
* **Test Matrix:**
  * 1080p @ 60Hz 8-bit SDR -> Computes $3.20\text{ Gbps}$ ($\pm 0.05$).
  * 4K UHD @ 60Hz 10-bit HDR -> Computes $15.68\text{ Gbps}$ ($\pm 0.1$).
  * 25m Copper HDMI 2.0 -> Flags 🟡 *Distance Warning (Max recommended 7.5m)*.
  * 4K @ 60Hz over 3G-SDI -> Flags 🔴 *Bandwidth Error (Max 1080p60 on 3G-SDI)*.
* **Pass Criteria:** 100% calculation accuracy against standard formulas in **< 10ms**.

---

### TC-06: Plan-to-Live Reconciliation Bipartite Matching Algorithm
* **Objective:** Verify automatic matching between pre-production plan and live physical displays.
* **Pass Criteria:** Correctly matches 4K display as Center LED (99% confidence), USB-C monitor as Prompter (98% confidence), and offers 1-click **"⚡ Flash"** buttons to verify identical HDMI monitors.

---

### TC-07: Cable Run Sheet & Equipment BOM Export Integrity
* **Objective:** Validate PDF and CSV export generation from the planning canvas.
* **Pass Criteria:** Generated documents contain accurate port mappings, cable lengths, equipment quantities, and zero missing node references.

---

### TC-08: Mobile Companion Local Wi-Fi Latency & Handshake
* **Objective:** Validate mobile streaming performance across local 2.4GHz / 5GHz Wi-Fi networks.
* **Pass Criteria:** Mobile preview latency **< 120ms**; remote screen flash triggers in **< 50ms**.

---

### TC-09: Bitfocus Companion & StreamDeck OSC Command Dispatching
* **Objective:** Verify external OSC UDP trigger execution on port 9000.
* **Test Commands:**
  * Send `/xteon/flash/display_01` -> Triggers 3.5s flash on Screen 1.
  * Send `/xteon/blackout/toggle` -> Toggles master emergency blackout within **15ms**.
* **Pass Criteria:** 100% command execution with **< 20ms** dispatch latency.

---

### TC-10: Global "Panic" Master Blackout Hotkey
* **Objective:** Verify global keyboard shortcut interception when Xteon is in the background.
* **Procedure:** Focus on another application (e.g. Chrome/Notepad) and press `Ctrl+Shift+B` (or `Cmd+Shift+B`).
* **Pass Criteria:** Xteon instantly deploys blackout shields across all external displays without stealing active keyboard focus from the foreground app.

---

### TC-11: Portable `.xteon` File Save, Open & OS Association
* **Objective:** Verify project serialization and native file loading.
* **Pass Criteria:** Double-clicking a `.xteon` file launches Xteon and restores the exact stage topology, cable routes, custom aliases, and equipment properties.

---

### TC-12: Color-Blind Accessibility Shape Verification
* **Objective:** Ensure all UI elements use both color and geometric shapes (`●` Circle OK, `▲` Triangle Warning, `🛑` Octagon Error).
* **Pass Criteria:** All status states remain unambiguous under simulated Deuteranopia, Protanopia, and Tritanopia filters.
