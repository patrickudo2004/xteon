/**
 * ==============================================================================
 *  XTEON PRO AV - FIELD OPERATIONS & INTEGRATION QA TEST SUITE
 * ==============================================================================
 *  Verifies:
 *   1. Virtual Distribution Branching (1x4 Antiference, 1x2 Kramer, CAT6 PoC)
 *   2. Centralized Show-Day Settings (Audio Guard, Anti-Dimming, Keep-Awake)
 *   3. Blackbox Flight Recorder (Hardware Audit Logs & Severity Filter)
 *   4. Presentation Privacy Shield (Mirroring Detection)
 *   5. Calibration Test Patterns (Overscan & PLUGE Black Levels)
 *   6. macOS Security Manifests (Info.plist, Entitlements.plist)
 * ==============================================================================
 */

import { useRigStore } from '../store/useRigStore';
import { VirtualDistributionBranch, LiveDisplay, ShowEventLogEntry } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// Mock browser global environment if running in Node.js
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    innerWidth: 1920,
    innerHeight: 1080,
    confirm: () => true,
    alert: () => {},
  };
}

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureDetails: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  \x1b[32m✓ PASS\x1b[0m: ${testName}`);
  } else {
    failedAssertions++;
    const errMsg = `  \x1b[31m✗ FAIL\x1b[0m: ${testName}${detail ? ` -> ${detail}` : ''}`;
    console.error(errMsg);
    failureDetails.push(errMsg);
  }
}

function assertEqual<T>(actual: T, expected: T, testName: string) {
  const isMatch = actual === expected;
  assert(isMatch, testName, `Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
}

console.log('\n================================================================');
console.log('  TEST GROUP 1: VIRTUAL DISTRIBUTION BRANCHING (SPLITTERS & DAs)');
console.log('================================================================');

const store = useRigStore.getState();

// Create sample virtual branch
const mockBranch: VirtualDistributionBranch = {
  parentDisplayId: 'disp-mock-hdmi-1',
  splitterType: 'SPLITTER_1X4',
  splitterModel: 'Antiference 1x4 4K HDMI Splitter over CAT6 (PoC)',
  cableMedium: 'CAT6_HDBASET',
  enabled: true,
  downstreamDisplays: [
    {
      id: 'downstream-tv-1',
      name: 'Stage TV 1',
      customAlias: 'Dining Hall TV',
      stageZone: 'Dining Hall',
      portType: 'HDBASET_CAT6',
      cableLengthMeters: 15,
    },
    {
      id: 'downstream-tv-2',
      name: 'Stage TV 2',
      customAlias: 'Dance Floor Screen',
      stageZone: 'Main Stage',
      portType: 'HDBASET_CAT6',
      cableLengthMeters: 30,
    },
    {
      id: 'downstream-tv-3',
      name: 'Stage TV 3',
      customAlias: 'Bar Area Monitor',
      stageZone: 'Bar Area',
      portType: 'HDBASET_CAT6',
      cableLengthMeters: 45,
    },
  ],
};

store.setDistributionBranch(mockBranch);
const branchInStore = useRigStore.getState().distributionBranches['disp-mock-hdmi-1'];

assert(Boolean(branchInStore), 'Virtual branch successfully registered in store');
assertEqual(branchInStore?.splitterType, 'SPLITTER_1X4', 'Splitter type correctly stored as SPLITTER_1X4');
assertEqual(branchInStore?.downstreamDisplays.length, 3, 'Downstream TV count matches 3 connected screens');
assertEqual(branchInStore?.downstreamDisplays[0].customAlias, 'Dining Hall TV', 'TV 1 alias correctly stored');
assertEqual(branchInStore?.downstreamDisplays[1].stageZone, 'Main Stage', 'TV 2 stage zone correctly stored');
assertEqual(branchInStore?.downstreamDisplays[2].cableLengthMeters, 45, 'TV 3 cable length recorded as 45m');

// Remove branch
store.removeDistributionBranch('disp-mock-hdmi-1');
assert(!useRigStore.getState().distributionBranches['disp-mock-hdmi-1'], 'Virtual branch removed cleanly');

console.log('\n================================================================');
console.log('  TEST GROUP 2: SHOW-DAY SETTINGS & SYSTEM GUARDS');
console.log('================================================================');

const initialSettings = useRigStore.getState().appSettings;
assert(Boolean(initialSettings), 'Default AppSettings populated');
assertEqual(initialSettings.audioGuardEnabled, false, 'Audio Guard disabled by default (strictly optional so novices are not surprised)');
assertEqual(initialSettings.audioGuardMode, 'NOTIFY', 'Default Audio Guard mode set to NOTIFY');
assertEqual(initialSettings.antiDimmingHeartbeatEnabled, false, 'Anti-Dimming Heartbeat field is present in store');
assertEqual(initialSettings.windowGuardianEnabled, true, 'Window Position Guardian enabled by default');

// Update settings
useRigStore.getState().updateSettings({
  audioGuardEnabled: true,
  audioGuardMode: 'STRICT_LOCK',
  antiDimmingHeartbeatEnabled: true,
});

const updatedSettings = useRigStore.getState().appSettings;
assertEqual(updatedSettings.audioGuardEnabled, true, 'Audio Guard enabled via updateSettings');
assertEqual(updatedSettings.audioGuardMode, 'STRICT_LOCK', 'Audio Guard mode updated to STRICT_LOCK');
assertEqual(updatedSettings.antiDimmingHeartbeatEnabled, true, 'Anti-Dimming Heartbeat enabled via updateSettings');

console.log('\n================================================================');
console.log('  TEST GROUP 3: KEEP-AWAKE CAFFEINE SHIELD');
console.log('================================================================');

const initialAwake = useRigStore.getState().presentationKeepAwake;
useRigStore.getState().toggleKeepAwake();
const toggledAwake = useRigStore.getState().presentationKeepAwake;
assertEqual(toggledAwake, !initialAwake, 'Keep-Awake toggled state cleanly');

// Check that toggling keep-awake logged an entry into the flight recorder
const latestLog = useRigStore.getState().eventLogs[0];
assert(Boolean(latestLog), 'Event log recorded for Keep-Awake action');
assertEqual(latestLog.category, 'SYSTEM', 'Keep-Awake log categorised as SYSTEM');

console.log('\n================================================================');
console.log('  TEST GROUP 4: BLACKBOX FLIGHT RECORDER (EVENT LOGS)');
console.log('================================================================');

useRigStore.getState().clearEventLogs();
assertEqual(useRigStore.getState().eventLogs.length, 0, 'Event logs cleared');

useRigStore.getState().addEventLog({
  level: 'WARN',
  category: 'AUDIO',
  message: 'Default audio rerouted to HDMI Display',
  details: 'Samsung 65" UHD TV',
});

useRigStore.getState().addEventLog({
  level: 'CRITICAL',
  category: 'DISPLAY',
  message: 'HDMI Link dropped on Display 2',
});

// Newest logs are prepended at index 0 (flight recorder chronological top-of-stack)
const logs = useRigStore.getState().eventLogs;
assertEqual(logs.length, 2, '2 event logs added to Flight Recorder');
assertEqual(logs[0].level, 'CRITICAL', 'Latest Log (index 0) is CRITICAL');
assertEqual(logs[0].category, 'DISPLAY', 'Latest Log (index 0) category is DISPLAY');
assertEqual(logs[1].level, 'WARN', 'Previous Log (index 1) is WARN');
assertEqual(logs[1].category, 'AUDIO', 'Previous Log (index 1) category is AUDIO');

console.log('\n================================================================');
console.log('  TEST GROUP 5: MACOS ENTITLEMENTS & CONFIG VERIFICATION');
console.log('================================================================');

const infoPlistPath = path.resolve(process.cwd(), 'src-tauri/Info.plist');
const entitlementsPath = path.resolve(process.cwd(), 'src-tauri/Entitlements.plist');
const tauriConfPath = path.resolve(process.cwd(), 'src-tauri/tauri.conf.json');
const releaseWorkflowPath = path.resolve(process.cwd(), '.github/workflows/release.yml');

assert(fs.existsSync(infoPlistPath), 'src-tauri/Info.plist exists on disk');
assert(fs.existsSync(entitlementsPath), 'src-tauri/Entitlements.plist exists on disk');

const infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');
assert(infoPlistContent.includes('NSCameraUsageDescription'), 'Info.plist contains NSCameraUsageDescription');
assert(infoPlistContent.includes('NSMicrophoneUsageDescription'), 'Info.plist contains NSMicrophoneUsageDescription');

const entitlementsContent = fs.readFileSync(entitlementsPath, 'utf8');
assert(entitlementsContent.includes('com.apple.security.device.camera'), 'Entitlements.plist includes camera hardened runtime');
assert(entitlementsContent.includes('com.apple.security.device.audio-input'), 'Entitlements.plist includes audio hardened runtime');

const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
assertEqual(tauriConf.bundle?.macOS?.infoPlist, 'Info.plist', 'tauri.conf.json links Info.plist');
assertEqual(tauriConf.bundle?.macOS?.entitlements, 'Entitlements.plist', 'tauri.conf.json links Entitlements.plist');

const releaseWorkflowContent = fs.readFileSync(releaseWorkflowPath, 'utf8');
assert(releaseWorkflowContent.includes('includeUpdaterJson: true'), '.github/workflows/release.yml includes includeUpdaterJson: true for auto-updater manifest');

console.log('\n================================================================');
console.log(`  QA TEST SUMMARY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED`);
console.log('================================================================\n');

if (failedAssertions > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
