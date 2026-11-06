// Automated Integration QA Suite for Xteon Wireless StageLink & OS Window Director
import fs from 'fs';
import { useRigStore } from '../store/useRigStore';
import { generateCablePullListCSV } from '../utils/csvExport';
import { generateCableLabelCSV } from '../utils/labelExport';
import { StageLinkSlot } from '../types';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

function assertEqual<T>(actual: T, expected: T, testName: string) {
  totalAssertions++;
  if (actual === expected) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${testName} (Expected: ${String(expected)}, Got: ${String(actual)})`);
  }
}

// Shim browser globals before store evaluation
(globalThis as any).window = {
  innerWidth: 1920,
  innerHeight: 1080,
  confirm: () => true,
  alert: () => {},
};
(globalThis as any).alert = () => {};

async function runStageLinkTests() {
  console.log('\n===============================================================================');
  console.log('       XTEON STAGELINK & OS WINDOW DIRECTOR AUTOMATED QA SUITE');
  console.log('===============================================================================\n');

  // --- TEST GROUP 1: ZERO-MOCK & ANTI-HARDCODE VERIFICATION ---
  console.log('--- TEST GROUP 1: Zero-Mock & Anti-Hardcode Invariants ---');

  const store = useRigStore.getState();
  assertEqual(store.appSettings.companionPin, '', 'Default companionPin is empty string (no hardcoded credentials)');
  assertEqual(store.appSettings.companionPinLockEnabled, true, 'Default companionPinLockEnabled is true');
  assertEqual(store.stageLinkSlots.length, 0, 'StageLink slots start strictly empty (0 mock slots)');
  assertEqual(store.osWindows.length, 0, 'OS Windows start strictly empty (0 mock windows)');
  assertEqual(store.stageLinkModalOpen, false, 'StageLink modal starts closed');
  assertEqual(store.editingStageSlotId, null, 'Editing slot starts null');
  assertEqual(store.qrStageSlotId, null, 'QR slot starts null');

  // Static codebase check: verify '842-190' does NOT exist as a default anywhere
  const storeSource = fs.readFileSync('src/store/useRigStore.ts', 'utf8');
  assert(!storeSource.includes("companionPin: '842-190'"), 'useRigStore does not contain default companionPin 842-190');
  const settingsSource = fs.readFileSync('src/components/modals/SettingsModal.tsx', 'utf8');
  assert(!settingsSource.includes("'842-190'"), 'SettingsModal does not contain 842-190 fallback');

  // --- TEST GROUP 2: STAGELINK MODAL & IPC HARNESS ---
  console.log('\n--- TEST GROUP 2: StageLink Modal & Mocked IPC Channel ---');

  store.openStageLinkModal('stage-test-edit');
  assertEqual(useRigStore.getState().stageLinkModalOpen, true, 'openStageLinkModal opens modal');
  assertEqual(useRigStore.getState().editingStageSlotId, 'stage-test-edit', 'openStageLinkModal sets editingStageSlotId');

  store.closeStageLinkModal();
  assertEqual(useRigStore.getState().stageLinkModalOpen, false, 'closeStageLinkModal closes modal');
  assertEqual(useRigStore.getState().editingStageSlotId, null, 'closeStageLinkModal clears editingStageSlotId');

  store.openQrForStageSlot('stage-pulpit-1');
  assertEqual(useRigStore.getState().mobileModalOpen, true, 'openQrForStageSlot opens mobile companion modal');
  assertEqual(useRigStore.getState().qrStageSlotId, 'stage-pulpit-1', 'openQrForStageSlot stores target slot ID');

  store.setMobileModalOpen(false);
  assertEqual(useRigStore.getState().qrStageSlotId, null, 'Closing mobile modal resets qrStageSlotId to null');

  // Attach deterministic Tauri v2 IPC mock harness for StageLink actions
  const invokedCommands: Array<{ cmd: string; args: any }> = [];

  (window as any).__TAURI_INTERNALS__ = {
    invoke: async (cmd: string, args: any) => {
      invokedCommands.push({ cmd, args });

      if (cmd === 'upsert_stagelink_slot') {
        return {
          id: args.input.id || 'stage-1',
          name: args.input.name,
          stage_zone: args.input.stage_zone,
          source_mode: args.input.source_mode,
          primary_source_id: args.input.primary_source_id,
          primary_source_label: args.input.primary_source_label,
          secondary_source_id: args.input.secondary_source_id,
          secondary_source_label: args.input.secondary_source_label,
          split_layout: args.input.split_layout || 'SIDE_70_30',
          target_fps: args.input.target_fps || 20,
          max_width: args.input.max_width || 1280,
          jpeg_quality: 78,
          is_frozen: false,
          is_blackout: false,
          is_flashing: false,
          active_whisper: null,
          connected_clients: 0,
          source_minimized: false,
          source_missing: false,
          live_fps: 20,
          last_frame_kb: 45,
          preview_data_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        } as StageLinkSlot;
      }

      if (cmd === 'get_stagelink_slots') {
        return useRigStore.getState().stageLinkSlots;
      }

      if (cmd === 'delete_stagelink_slot') {
        return true;
      }

      if (cmd === 'set_stagelink_slot_freeze') {
        const slot = useRigStore.getState().stageLinkSlots.find((s) => s.id === args.slotId);
        return slot ? { ...slot, is_frozen: args.frozen } : null;
      }

      if (cmd === 'set_stagelink_slot_blackout') {
        const slot = useRigStore.getState().stageLinkSlots.find((s) => s.id === args.slotId);
        return slot ? { ...slot, is_blackout: args.blackout } : null;
      }

      if (cmd === 'flash_stagelink_slot') {
        const slot = useRigStore.getState().stageLinkSlots.find((s) => s.id === args.slotId);
        return slot ? { ...slot, is_flashing: true } : null;
      }

      if (cmd === 'send_stagelink_whisper') {
        const slot = useRigStore.getState().stageLinkSlots.find((s) => s.id === args.slotId);
        return slot
          ? {
              ...slot,
              active_whisper: {
                id: 'w-1',
                message: args.message,
                tone: args.tone,
                created_at_ms: Date.now(),
                expires_at_ms: args.durationSeconds ? Date.now() + args.durationSeconds * 1000 : null,
              },
            }
          : null;
      }

      if (cmd === 'clear_stagelink_whisper') {
        const slot = useRigStore.getState().stageLinkSlots.find((s) => s.id === args.slotId);
        return slot ? { ...slot, active_whisper: null } : null;
      }

      if (cmd === 'list_os_windows') {
        return useRigStore.getState().osWindows;
      }

      if (cmd === 'route_os_window') {
        return 'Window routed successfully';
      }

      if (cmd === 'unroute_os_window') {
        return 'Window unrouted successfully';
      }

      if (cmd === 'set_os_window_pinned') {
        return args.pinned;
      }

      if (cmd === 'restore_os_window_behind') {
        return 'Restored';
      }

      if (cmd === 'recall_stray_os_windows') {
        return 2;
      }

      if (cmd === 'trigger_os_display_extend') {
        return 'Switched to OS Extend display mode';
      }

      if (cmd === 'open_os_display_settings') {
        return 'Opened OS Display Settings';
      }

      if (cmd === 'get_window_thumbnails') {
        return {
          '10928': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        };
      }

      if (cmd === 'set_host_sleep_inhibit') {
        return true;
      }

      if (cmd === 'spawn_virtual_extended_display') {
        return 'Created Xteon Virtual Extended Stage Display';
      }

      if (cmd === 'close_virtual_extended_display') {
        return true;
      }

      if (cmd === 'get_virtual_driver_status') {
        return {
          installed: true,
          is_glidex_present: true,
          display_active: false,
          driver_path: 'C:\\VirtualDisplayDriver',
          message: 'Virtual Display Driver is installed. Toggle to activate.',
        };
      }

      if (cmd === 'install_os_virtual_display_driver') {
        return 'Virtual Display Driver setup initiated. Check User Account Control (UAC) if prompted.';
      }

      if (cmd === 'toggle_virtual_display_active') {
        return args.enable ? 'Activated Virtual Extended Display (Display 2).' : 'Deactivated Virtual Extended Display.';
      }

      return null;
    },
  };

  // --- TEST GROUP 3: STAGELINK SLOTS CRUD & FLIGHT RECORDER ---
  console.log('\n--- TEST GROUP 3: StageLink Slots CRUD & Telemetry ---');

  // Create Window Slot (e.g. Kairon Countdown Timer)
  const slot1 = await store.upsertStageLinkSlot({
    id: 'stage-kairon',
    name: 'Pulpit Countdown Timer',
    stage_zone: 'Pulpit Altar',
    source_mode: 'WINDOW',
    primary_source_id: 'W:10928',
    primary_source_label: 'Kairon Stage Display - v2.1',
    target_fps: 20,
    max_width: 1280,
  });

  assertEqual(slot1?.id, 'stage-kairon', 'Created slot has correct ID');
  assertEqual(slot1?.source_mode, 'WINDOW', 'Created slot has WINDOW source mode');
  assertEqual(useRigStore.getState().stageLinkSlots.length, 1, 'Store contains 1 StageLink slot');

  // Verify Flight Recorder logged DISPLAY event
  const logs = useRigStore.getState().eventLogs;
  assert(logs.some((l) => l.message.includes('Wireless StageLink slot') && l.category === 'DISPLAY'), 'Flight Recorder logged slot creation');

  // Test Freeze / Blackout / Flash
  await store.setStageLinkSlotFreeze('stage-kairon', true);
  assertEqual(useRigStore.getState().stageLinkSlots[0].is_frozen, true, 'Slot freeze state updated');

  await store.setStageLinkSlotBlackout('stage-kairon', true);
  assertEqual(useRigStore.getState().stageLinkSlots[0].is_blackout, true, 'Slot blackout state updated');

  await store.flashStageLinkSlot('stage-kairon');
  assertEqual(useRigStore.getState().stageLinkSlots[0].is_flashing, true, 'Slot flash state updated');

  // Test Stage Whisper
  await store.sendStageLinkWhisper('stage-kairon', 'Wrap up sermon in 2 minutes', 'WARN', 120);
  assertEqual(useRigStore.getState().stageLinkSlots[0].active_whisper?.message, 'Wrap up sermon in 2 minutes', 'Stage whisper message sent');
  assertEqual(useRigStore.getState().stageLinkSlots[0].active_whisper?.tone, 'WARN', 'Stage whisper tone is WARN');

  await store.clearStageLinkWhisper('stage-kairon');
  assertEqual(useRigStore.getState().stageLinkSlots[0].active_whisper, null, 'Stage whisper cleared');

  // Create 2nd Slot (SPLIT Mode: Presentation App 70% + Timer 30%)
  const slot2 = await store.upsertStageLinkSlot({
    id: 'stage-split-pulpit',
    name: 'Pulpit Split Confidence',
    stage_zone: 'Pulpit Altar',
    source_mode: 'SPLIT',
    primary_source_id: 'W:10930',
    primary_source_label: 'Presentation App - Lyrics & Notes',
    secondary_source_id: 'W:10928',
    secondary_source_label: 'Kairon Timer',
    split_layout: 'SIDE_70_30',
    target_fps: 20,
    max_width: 1920,
  });

  assertEqual(slot2?.source_mode, 'SPLIT', '2nd slot has SPLIT source mode');
  assertEqual(slot2?.split_layout, 'SIDE_70_30', '2nd slot has SIDE_70_30 split layout');
  assertEqual(useRigStore.getState().stageLinkSlots.length, 2, 'Store contains 2 StageLink slots');

  // --- TEST GROUP 4: OS WINDOW DIRECTOR ---
  console.log('\n--- TEST GROUP 4: OS Window Director Routing & Emergency Recall ---');

  // Seed live display and OS window
  useRigStore.setState({
    liveDisplays: [
      {
        id: 'disp-host',
        osIndex: 1,
        name: 'Internal eDP Screen',
        customAlias: 'Host Laptop',
        stageZone: 'FOH Booth',
        portType: 'INTERNAL_DISPLAY',
        vendor: 'Apple',
        model: 'Studio',
        serial: 'TEST-01',
        activeResolution: { width: 1920, height: 1080 },
        nativeResolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
        isHdr: false,
        colorSpace: 'sRGB',
        audioLevelDb: -20,
        status: 'ONLINE',
        isFrozen: false,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        isLiveFeedEnabled: true,
      },
      {
        id: 'disp-stage',
        osIndex: 2,
        name: 'Main Stage Screen',
        customAlias: 'Stage Display',
        stageZone: 'Stage Left',
        portType: 'HDMI_2_0',
        vendor: 'Samsung',
        model: 'StagePro',
        serial: 'TEST-02',
        activeResolution: { width: 1920, height: 1080 },
        nativeResolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
        isHdr: false,
        colorSpace: 'sRGB',
        audioLevelDb: -24,
        status: 'ONLINE',
        isFrozen: false,
        bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
        isLiveFeedEnabled: true,
      },
    ],
    osWindows: [
      {
        hwnd_id: '10928',
        title: 'Kairon Timer',
        process_name: 'kairon.exe',
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        is_minimized: false,
        is_maximized: false,
        is_borderless_snapped: false,
        is_pinned_stage: false,
        is_xteon_self: false,
        display_id: 'disp-host',
        display_os_index: 1,
      },
    ],
  });

  // Target display not found should return false
  const routeFail = await store.routeOsWindow('10928', 'disp-non-existent', true, true);
  assertEqual(routeFail, false, 'Routing to non-existent display returns false');

  // Target valid display should invoke route_os_window with camelCase params
  const routeSuccess = await store.routeOsWindow('10928', 'disp-stage', true, true);
  assertEqual(routeSuccess, true, 'Routing to valid display returns true');

  const routeCall = invokedCommands.find((c) => c.cmd === 'route_os_window');
  assert(Boolean(routeCall), 'Invoked route_os_window command');
  assertEqual(routeCall?.args?.hwndId, '10928', 'Passed correct hwndId');
  assertEqual(routeCall?.args?.displayId, 'disp-stage', 'Passed correct displayId');
  assertEqual(routeCall?.args?.borderlessFullscreen, true, 'Passed correct borderlessFullscreen');
  assertEqual(routeCall?.args?.pinToStage, true, 'Passed correct pinToStage');

  // Emergency Recall Stray Windows
  const recalled = await store.recallStrayOsWindows();
  assertEqual(recalled, 2, 'recallStrayOsWindows returned 2 rescued windows');

  const recallCall = invokedCommands.find((c) => c.cmd === 'recall_stray_os_windows');
  assert(Boolean(recallCall), 'Invoked recall_stray_os_windows command');

  // --- TEST GROUP 5: FORK LIVE RIG TO PLANNER WITH WIRELESS STAGELINK NODES ---
  console.log('\n--- TEST GROUP 5: Fork Live Rig to Planner with StageLink Nodes ---');

  // Reset planner nodes
  useRigStore.setState({ nodes: [], edges: [] });

  // Fork the live rig containing the host display + stage display + 2 StageLink slots
  store.forkLiveRigToPlanner();

  const forkedNodes = useRigStore.getState().nodes;
  const forkedEdges = useRigStore.getState().edges;

  assert(forkedNodes.length >= 4, `Forked topology generated ${forkedNodes.length} nodes (>= 4 expected)`);
  assert(forkedEdges.length >= 3, `Forked topology generated ${forkedEdges.length} edges (>= 3 expected)`);

  // Verify Wireless StageLink nodes exist
  const stageNode1 = forkedNodes.find((n) => n.id === 'forked-stage-stage-kairon');
  assert(Boolean(stageNode1), 'Planner contains forked-stage-stage-kairon node');
  assertEqual(stageNode1?.data.category, 'SINK', 'StageLink planner node category is SINK');
  assertEqual(stageNode1?.data.deviceType, 'CONFIDENCE_MONITOR', 'StageLink planner node deviceType is CONFIDENCE_MONITOR');
  assert(Boolean(stageNode1?.data.label.includes('Pulpit Countdown Timer')), 'StageLink planner node preserves custom name');

  // Verify Wireless Edge
  const wirelessEdge = forkedEdges.find((e) => e.id === 'edge-fork-stage-stage-kairon');
  assert(Boolean(wirelessEdge), 'Planner contains wireless stage edge');
  assertEqual(wirelessEdge?.data?.cableType, 'WIRELESS', 'Cable type is WIRELESS');
  assertEqual(wirelessEdge?.data?.status, 'VALID', 'Wireless connection status is VALID');

  // Verify Cable Labels & Pull List include StageLink Wireless link
  const currentProject = store.exportProject();
  const cableCsv = generateCablePullListCSV(currentProject);
  assert(cableCsv.includes('WIRELESS'), 'Cable Pull List CSV includes WIRELESS cable connection');
  assert(cableCsv.includes('Pulpit Countdown Timer'), 'Cable Pull List CSV includes StageLink sink name');

  const labelCsv = generateCableLabelCSV(currentProject);
  assert(labelCsv.includes('Pulpit Countdown Timer'), 'Cable Labels CSV includes StageLink sink name');

  // --- TEST GROUP 6: THEME & WEBKIT/GEMINI.MD INVARIANTS ---
  console.log('\n--- TEST GROUP 6: Cross-Platform WebKit & Theme CSS Invariants ---');

  const cssContent = fs.readFileSync('src/index.css', 'utf8');
  assert(cssContent.includes("@import '@xyflow/react/dist/style.css';"), "src/index.css imports '@xyflow/react/dist/style.css' at root");
  assert(cssContent.includes('.theme-dark'), 'src/index.css defines .theme-dark');
  assert(cssContent.includes('.theme-daylight'), 'src/index.css defines .theme-daylight');
  assert(cssContent.includes('.theme-broadcast'), 'src/index.css defines .theme-broadcast');
  assert(cssContent.includes('--badge-cyan-bg'), 'src/index.css defines --badge-cyan-bg');
  assert(cssContent.includes('--badge-amber-bg'), 'src/index.css defines --badge-amber-bg');
  assert(cssContent.includes('--badge-emerald-bg'), 'src/index.css defines --badge-emerald-bg');

  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  assert(viteConfig.includes('safari16'), 'vite.config.ts maintains safari16 target for non-Windows platforms');

  const mainTsx = fs.readFileSync('src/main.tsx', 'utf8');
  assert(mainTsx.includes('<ErrorBoundary>'), 'src/main.tsx wraps root webview in <ErrorBoundary>');

  // --- TEST GROUP 7: STAGELINK V2 MASTER INVARIANTS & MULTI-DEVICE MANAGEMENT ---
  console.log('\n--- TEST GROUP 7: StageLink V2 Master Invariants & Multi-Device Management ---');

  // 1. Native OS Display Extend Command
  const extendRes = await store.triggerOsDisplayExtend();
  assertEqual(extendRes, 'Switched to OS Extend display mode', 'triggerOsDisplayExtend dispatches native OS command');
  const extendCall = invokedCommands.find((c) => c.cmd === 'trigger_os_display_extend');
  assert(Boolean(extendCall), 'Invoked trigger_os_display_extend command');

  // 2. Native OS Display Settings Command
  const settingsRes = await store.openOsDisplaySettings();
  assertEqual(settingsRes, 'Opened OS Display Settings', 'openOsDisplaySettings dispatches native OS settings');
  const settingsCall = invokedCommands.find((c) => c.cmd === 'open_os_display_settings');
  assert(Boolean(settingsCall), 'Invoked open_os_display_settings command');

  // 3. Live Window Thumbnails Command
  const thumbs = await store.getWindowThumbnails(['10928']);
  assert(Boolean(thumbs['10928']), 'getWindowThumbnails returns valid base64 preview thumbnail for hwnd 10928');

  // 4. Host Sleep Inhibition Command
  const sleepInhibit = await store.setHostSleepInhibit(true);
  assertEqual(sleepInhibit, true, 'setHostSleepInhibit(true) dispatches Win32/macOS/Linux keep-awake');

  // 5. Multi-Variety Device Configuration & Editing
  const editedSlot = await store.upsertStageLinkSlot({
    id: 'stage-kairon',
    name: 'Pulpit Confidence Screen Pro',
    stage_zone: 'Pulpit Altar Main',
    source_mode: 'SPLIT',
    primary_source_id: 'W:10930',
    primary_source_label: 'ProPresenter Lyrics & Scripture',
    secondary_source_id: 'W:10928',
    secondary_source_label: 'Kairon Timer',
    split_layout: 'SIDE_70_30',
    target_fps: 30,
    max_width: 1920,
  });
  assertEqual(editedSlot?.name, 'Pulpit Confidence Screen Pro', 'Device Drawer edited name successfully');
  assertEqual(editedSlot?.stage_zone, 'Pulpit Altar Main', 'Device Drawer edited stage zone successfully');
  assertEqual(editedSlot?.source_mode, 'SPLIT', 'Device Drawer switched mode to SPLIT successfully');
  assertEqual(editedSlot?.target_fps, 30, 'Device Drawer updated framerate to 30 FPS');
  assertEqual(editedSlot?.max_width, 1920, 'Device Drawer updated max resolution to 1080p (1920px)');

  // 6. Stop Sharing Stream (Standby Transition without Deleting Device)
  await store.stopStageLinkStream('stage-kairon');
  const currentSlots = useRigStore.getState().stageLinkSlots;
  const stoppedSlot = currentSlots.find((s) => s.id === 'stage-kairon');
  assertEqual(stoppedSlot?.primary_source_id, '', 'stopStageLinkStream cleared primary source ID to standby');
  assertEqual(stoppedSlot?.primary_source_label, '', 'stopStageLinkStream cleared primary source label to standby');
  assert(currentSlots.length >= 1, 'Device slot remains alive and configured in dashboard during standby');

  // 7. Rust Backend Keep-Awake Engine Verification (Universal HTTP NoSleep video loop)
  const webViewsSource = fs.readFileSync('src-tauri/src/server/web_views.rs', 'utf8');
  assert(webViewsSource.includes('<video id="nosleep-video"'), 'web_views.rs contains <video id="nosleep-video"> element for HTTP keep-awake');
  assert(webViewsSource.includes('requestWakeLockSafe()'), 'web_views.rs contains requestWakeLockSafe() with video fallback');

  // 8. Rust Backend Forced Keyframe Heartbeat (Prevents timer freeze)
  const stagelinkSource = fs.readFileSync('src-tauri/src/server/stagelink.rs', 'utf8');
  assert(stagelinkSource.includes('is_heartbeat = now.saturating_sub(last_forced_keyframe_ms) >= 1500'), 'stagelink.rs contains 1500ms forced keyframe heartbeat');
  assert(stagelinkSource.includes('ensure_default_slot_exists'), 'stagelink.rs contains ensure_default_slot_exists() for immediate receiver connection');

  // 9. Rust Backend Default /stage route
  const companionSource = fs.readFileSync('src-tauri/src/server/companion.rs', 'utf8');
  assert(companionSource.includes('serve_stage_default_ui'), 'companion.rs contains default /stage route');
  assert(companionSource.includes('ws_stage_default_handler'), 'companion.rs contains default /ws/stage handler');

  // 10. Clean Recycled Slot Index Verification
  assert(stagelinkSource.includes('for i in 1..=50'), 'stagelink.rs contains recycled slot allocation logic (stage-1, stage-2)');

  // 11. Virtual Extended Display IPC Commands
  const spawnVirt = await store.spawnVirtualExtendedDisplay(1920, 1080);
  assertEqual(spawnVirt, true, 'spawnVirtualExtendedDisplay dispatches native window creation');
  const spawnCall = invokedCommands.find((c) => c.cmd === 'spawn_virtual_extended_display');
  assert(Boolean(spawnCall), 'Invoked spawn_virtual_extended_display command');

  const closeVirt = await store.closeVirtualExtendedDisplay();
  assertEqual(closeVirt, true, 'closeVirtualExtendedDisplay dispatches native window close');
  const closeCall = invokedCommands.find((c) => c.cmd === 'close_virtual_extended_display');
  assert(Boolean(closeCall), 'Invoked close_virtual_extended_display command');

  // 12. Dynamic Slot Allocation & Zero-Install Desktop Stream Invariants
  assert(stagelinkSource.includes('allocate_slot_for_new_client'), 'stagelink.rs contains allocate_slot_for_new_client for multi-device detection');
  assert(companionSource.includes('allocate_slot_for_new_client'), 'companion.rs uses allocate_slot_for_new_client');
  assert(stagelinkSource.includes('Desktop Screen (Host Laptop)'), 'stagelink.rs presets zero-install desktop screen streaming');

  // 13. Virtual Stage Display View File Structure
  const virtViewSource = fs.readFileSync('src/components/stage/VirtualStageDisplayView.tsx', 'utf8');
  assert(virtViewSource.includes('XTEON VIRTUAL EXTENDED DISPLAY (DISPLAY 2)'), 'VirtualStageDisplayView defines Display 2 header');
  assert(virtViewSource.includes('STAGE SERVICE TIMER'), 'VirtualStageDisplayView provides live countdown timer');
  assert(virtViewSource.includes('FOH STAGE MESSAGE'), 'VirtualStageDisplayView supports live stage whisper messages');

  // 14. App.tsx Virtual Display Route
  const appTsxSource = fs.readFileSync('src/App.tsx', 'utf8');
  assert(appTsxSource.includes("label === 'xteon_virtual_display'"), 'src/App.tsx routes xteon_virtual_display window');
  assert(appTsxSource.includes('<VirtualStageDisplayView />'), 'src/App.tsx renders VirtualStageDisplayView');

  // 15. Rust lib.rs Virtual Extended Display Handlers
  const libRsSource = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');
  assert(libRsSource.includes('spawn_virtual_extended_display'), 'lib.rs exposes spawn_virtual_extended_display command');
  assert(libRsSource.includes('display-virtual-stage'), 'lib.rs dynamically injects display-virtual-stage into get_connected_displays');

  // 16. GlideX-Style Virtual Display Driver Invariants
  const vddStatus = await store.refreshVirtualDriverStatus();
  assertEqual(vddStatus?.installed, true, 'refreshVirtualDriverStatus reports driver installed');
  assertEqual(vddStatus?.is_glidex_present, true, 'refreshVirtualDriverStatus detects existing display adapters');

  const installDriverRes = await store.installVirtualDisplayDriver();
  assert(installDriverRes.includes('Virtual Display Driver setup initiated'), 'installVirtualDisplayDriver initiates elevated setup');
  const installCall = invokedCommands.find((c) => c.cmd === 'install_os_virtual_display_driver');
  assert(Boolean(installCall), 'Invoked install_os_virtual_display_driver command');

  const toggleRes = await store.toggleVirtualDisplayActive(true);
  assert(toggleRes.includes('Activated Virtual Extended Display'), 'toggleVirtualDisplayActive(true) enables Display 2');
  const toggleCall = invokedCommands.find((c) => c.cmd === 'toggle_virtual_display_active');
  assert(Boolean(toggleCall), 'Invoked toggle_virtual_display_active command');
  assertEqual(toggleCall?.args?.enable, true, 'Passed enable: true parameter to toggle_virtual_display_active');

  // 17. Embedded Driver Package Verification
  const virtDriverRs = fs.readFileSync('src-tauri/src/display/virtual_driver.rs', 'utf8');
  assert(virtDriverRs.includes('devcon.exe'), 'virtual_driver.rs embeds devcon.exe');
  assert(virtDriverRs.includes('MttVDD.dll'), 'virtual_driver.rs embeds MttVDD.dll');
  assert(virtDriverRs.includes('MttVDD.inf'), 'virtual_driver.rs embeds MttVDD.inf');
  assert(virtDriverRs.includes('install_driver.bat'), 'virtual_driver.rs embeds install_driver.bat');

  assert(fs.existsSync('src-tauri/resources/virtual_display_driver/devcon.exe'), 'Bundled devcon.exe exists in resources');
  assert(fs.existsSync('src-tauri/resources/virtual_display_driver/MttVDD.dll'), 'Bundled MttVDD.dll exists in resources');
  assert(fs.existsSync('src-tauri/resources/virtual_display_driver/MttVDD.inf'), 'Bundled MttVDD.inf exists in resources');
  assert(fs.existsSync('src-tauri/resources/virtual_display_driver/mttvdd.cat'), 'Bundled mttvdd.cat exists in resources');
  assert(fs.existsSync('src-tauri/resources/virtual_display_driver/install_driver.bat'), 'Bundled install_driver.bat exists in resources');

  // 18. StageDisplaysView Virtual Display Controls
  const stageDisplaysViewSrc = fs.readFileSync('src/components/stage/StageDisplaysView.tsx', 'utf8');
  assert(stageDisplaysViewSrc.includes('External Monitor & Virtual Stage Screen'), 'StageDisplaysView contains External Monitor & Virtual Stage Screen header');
  assert(stageDisplaysViewSrc.includes('Setup Virtual Display Engine (One-Time Setup)'), 'StageDisplaysView provides Setup Virtual Display Engine button');
  assert(stageDisplaysViewSrc.includes('handleToggleVirtualDisplay'), 'StageDisplaysView connects handleToggleVirtualDisplay');

  // --- FINAL REPORT ---
  console.log('\n===============================================================================');
  console.log(`  QA SUMMARY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED (Failed: ${failedAssertions})`);
  console.log('===============================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runStageLinkTests().catch((err) => {
  console.error('Fatal error running StageLink tests:', err);
  process.exit(1);
});
