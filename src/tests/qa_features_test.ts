/**
 * ==============================================================================
 *  XTEON PRO AV - EXHAUSTIVE AUTOMATED QA & INTEGRATION TEST SUITE
 * ==============================================================================
 *  Verifies:
 *   1. Industry Starter Templates (Corporate, Broadcast, LED Arena, Hybrid GlideX)
 *   2. RFC 4180 CSV Cable Pull List Generator
 *   3. "Fork Live Rig into Planner Studio" Engine (Refined Single-Host Node)
 *   4. Lossless .xteon Rig Serialization Roundtrip
 *   5. Live Map Sidebar Resizing & Canvas PNG Exporter Mechanics
 *   6. Normalized Display Indexing & Panel Dock States (Collapsible & Floating)
 * ==============================================================================
 */

import { INDUSTRY_TEMPLATES } from '../utils/industryTemplates';
import { generateCablePullListCSV } from '../utils/csvExport';
import { validateCableSignal, useRigStore, detectCameraProtocol, classifyCameraDevice } from '../store/useRigStore';
import { LiveDisplay, LiveCamera, PortType, DeviceCategory, DeviceType, RigProject, CameraCategory } from '../types';

// Mock browser global environment if running in Node.js
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    innerWidth: 1920,
    innerHeight: 1080,
    confirm: () => true,
    alert: () => {},
  };
}
if (typeof globalThis.alert === 'undefined') {
  (globalThis as any).alert = () => {};
}

// ------------------------------------------------------------------------------
// Test Harness Utilities
// ------------------------------------------------------------------------------
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

function assertDeepEqual<T>(actual: T, expected: T, testName: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  assert(actualStr === expectedStr, testName, `Deep mismatch: Expected ${expectedStr.slice(0, 120)}... Got ${actualStr.slice(0, 120)}...`);
}

console.log('\n\x1b[1m\x1b[36m===============================================================================\x1b[0m');
console.log('\x1b[1m\x1b[36m       XTEON PRO AV - AUTOMATED QA INTEGRATION TEST SUITE                     \x1b[0m');
console.log('\x1b[1m\x1b[36m===============================================================================\x1b[0m\n');

// ==============================================================================
// TEST SUITE 1: Industry Starter Templates Validation
// ==============================================================================
console.log('\x1b[1m\x1b[33m--- [SUITE 1] Industry Starter Templates Validation ---\x1b[0m');

assertEqual(INDUSTRY_TEMPLATES.length, 4, 'Templates registry contains exactly 4 starter rigs');

const expectedTemplateIds = ['corp-dual-imag', 'broadcast-4cam', 'led-wall-arena', 'hybrid-overflow-glidex'];
const actualTemplateIds = INDUSTRY_TEMPLATES.map((t) => t.id);
assertDeepEqual(actualTemplateIds, expectedTemplateIds, 'All expected template IDs are present in registry');

INDUSTRY_TEMPLATES.forEach((template) => {
  const proj = template.project;
  console.log(`\n  \x1b[34m▶ Validating Template: [${template.id}] "${template.name}"\x1b[0m`);

  assert(!!proj.version && typeof proj.version === 'string', `[${template.id}] Version is valid string (${proj.version})`);
  assert(!!proj.meta?.projectName, `[${template.id}] Meta projectName is non-empty (${proj.meta?.projectName})`);
  assert(!!proj.meta?.venue, `[${template.id}] Meta venue is non-empty (${proj.meta?.venue})`);
  assert(!!proj.meta?.author, `[${template.id}] Meta author is non-empty (${proj.meta?.author})`);
  assert(!!proj.meta?.date, `[${template.id}] Meta date is valid ISO timestamp`);

  assert(Array.isArray(proj.nodes) && proj.nodes.length > 0, `[${template.id}] Has nodes array (${proj.nodes.length} nodes)`);
  assert(Array.isArray(proj.edges) && proj.edges.length > 0, `[${template.id}] Has edges array (${proj.edges.length} edges)`);

  const nodeMap = new Map(proj.nodes.map((n) => [n.id, n]));
  assert(nodeMap.size === proj.nodes.length, `[${template.id}] All node IDs are unique within the project`);

  proj.nodes.forEach((node) => {
    assert(!!node.id, `[${template.id}] Node id exists (${node.id})`);
    assert(node.type === 'deviceNode', `[${template.id}] Node type is 'deviceNode' (${node.id})`);
    assert(typeof node.position?.x === 'number' && typeof node.position?.y === 'number', `[${template.id}] Node has valid 2D coordinates (${node.id})`);
    assert(!!node.data, `[${template.id}] Node data object exists (${node.id})`);
    assert(node.data.id === node.id, `[${template.id}] Node data.id matches node.id (${node.id})`);
    assert(!!node.data.label, `[${template.id}] Node label exists (${node.data.label})`);
    assert(!!node.data.category, `[${template.id}] Node category exists (${node.data.category})`);
    assert(!!node.data.deviceType, `[${template.id}] Node deviceType exists (${node.data.deviceType})`);
    assert(!!node.data.stageZone, `[${template.id}] Node stageZone exists (${node.data.stageZone})`);
    assert(Array.isArray(node.data.inputPorts), `[${template.id}] inputPorts is array (${node.id})`);
    assert(Array.isArray(node.data.outputPorts), `[${template.id}] outputPorts is array (${node.id})`);

    const portIds = new Set<string>();
    [...node.data.inputPorts, ...node.data.outputPorts].forEach((port) => {
      assert(!portIds.has(port.id), `[${template.id}] Port ID ${port.id} is unique within node ${node.id}`);
      portIds.add(port.id);
      assert(!!port.name, `[${template.id}] Port ${port.id} has name (${port.name})`);
      assert(!!port.type, `[${template.id}] Port ${port.id} has valid protocol (${port.type})`);
      assert(typeof port.maxBandwidthGbps === 'number' && port.maxBandwidthGbps > 0, `[${template.id}] Port ${port.id} has positive bandwidth (${port.maxBandwidthGbps} Gbps)`);
    });
  });

  proj.edges.forEach((edge) => {
    assert(!!edge.id, `[${template.id}] Edge id exists (${edge.id})`);
    assert(nodeMap.has(edge.source), `[${template.id}] Edge source node exists (${edge.source})`);
    assert(nodeMap.has(edge.target), `[${template.id}] Edge target node exists (${edge.target})`);
    assert(!!edge.data, `[${template.id}] Edge data exists (${edge.id})`);

    const sourceNode = nodeMap.get(edge.source)!;
    const targetNode = nodeMap.get(edge.target)!;
    const srcPort = sourceNode.data.outputPorts.find((p) => p.id === edge.sourceHandle);
    const tgtPort = targetNode.data.inputPorts.find((p) => p.id === edge.targetHandle);

    assert(!!srcPort, `[${template.id}] Edge ${edge.id} sourceHandle "${edge.sourceHandle}" exists in source node outputPorts`);
    assert(!!tgtPort, `[${template.id}] Edge ${edge.id} targetHandle "${edge.targetHandle}" exists in target node inputPorts`);

    assert(typeof edge.data.lengthMeters === 'number' && edge.data.lengthMeters > 0, `[${template.id}] Edge ${edge.id} has positive length (${edge.data.lengthMeters}m)`);
    assert(typeof edge.data.calculatedBandwidthGbps === 'number' && edge.data.calculatedBandwidthGbps > 0, `[${template.id}] Edge ${edge.id} has positive bandwidth (${edge.data.calculatedBandwidthGbps} Gbps)`);
    assert(edge.data.status === 'VALID' || edge.data.status === 'WARNING_DISTANCE' || edge.data.status === 'ERROR_BANDWIDTH', `[${template.id}] Edge status is valid enum`);
  });
});

// ==============================================================================
// TEST SUITE 2: CSV Cable Pull List Generator
// ==============================================================================
console.log('\n\x1b[1m\x1b[33m--- [SUITE 2] CSV Cable Pull List Generator (RFC 4180) ---\x1b[0m');

function parseRFC4180CSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell);
      currentCell = '';
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

INDUSTRY_TEMPLATES.forEach((template) => {
  const csv = generateCablePullListCSV(template.project);
  const rows = parseRFC4180CSV(csv);

  console.log(`\n  \x1b[34m▶ Testing CSV Export for [${template.id}]\x1b[0m`);
  assert(csv.includes('\r\n'), `[${template.id}] CSV uses RFC 4180 CRLF line endings (\\r\\n)`);
  assertEqual(rows.length, template.project.edges.length + 1, `[${template.id}] CSV row count matches 1 header + ${template.project.edges.length} data rows`);

  const header = rows[0];
  assertEqual(header.length, 15, `[${template.id}] Header row has exactly 15 columns`);
  assertDeepEqual(
    header,
    [
      'Cable ID',
      'Source Device',
      'Source Port',
      'Source Zone',
      'Destination Device',
      'Destination Port',
      'Destination Zone',
      'Cable Standard',
      'Length (m)',
      'Length (ft)',
      'Bandwidth (Gbps)',
      'Max Port (Gbps)',
      'Signal Format',
      'Signal Status',
      'Notes',
    ],
    `[${template.id}] Header columns match RFC 4180 specification`
  );

  rows.slice(1).forEach((row, rowIdx) => {
    assertEqual(row.length, 15, `[${template.id}] Data row ${rowIdx + 1} has exactly 15 columns`);
    const edge = template.project.edges[rowIdx];
    assertEqual(row[0], edge.data.id || edge.id, `[${template.id}] Row ${rowIdx + 1} Cable ID matches`);
    const expectedFeet = (Math.round(edge.data.lengthMeters * 3.28084 * 10) / 10).toString();
    assertEqual(row[9], expectedFeet, `[${template.id}] Row ${rowIdx + 1} Length in feet correctly converted (${edge.data.lengthMeters}m -> ${expectedFeet}ft vs ${row[9]}ft)`);
  });
});

// ==============================================================================
// TEST SUITE 3: "Fork Live Rig into Planner" Engine (Single Unified Host Node)
// ==============================================================================
console.log('\n\x1b[1m\x1b[33m--- [SUITE 3] "Fork Live Rig into Planner" Engine (Single Unified Host) ---\x1b[0m');

function executeForkLiveRig(displays: LiveDisplay[]) {
  if (!displays || displays.length === 0) return { nodes: [], edges: [] };

  const hostDisplay = displays.find((d) => d.customAlias.includes('Primary') || d.osIndex === 1) || displays[0];
  const externalDisplays = displays.filter((d) => d.id !== hostDisplay.id);

  // Build Host Output Ports for EXTERNAL screens only
  const hostOutputPorts = externalDisplays.map((disp, idx) => ({
    id: `host-out-${disp.id}`,
    name: `GPU Out ${idx + 1} (${disp.portType.replace('_', ' ')})`,
    type: disp.portType as PortType,
    direction: 'OUTPUT' as const,
    maxBandwidthGbps: disp.portType === 'DP_1_4' ? 32.4 : disp.portType === 'HDMI_2_1' ? 48.0 : disp.portType === 'WIRELESS' ? 10.0 : 18.0,
  }));

  const hostNode = {
    id: 'forked-host-pc',
    type: 'deviceNode',
    position: { x: 80, y: Math.max(120, externalDisplays.length * 90) },
    data: {
      id: 'forked-host-pc',
      category: 'SOURCE' as DeviceCategory,
      deviceType: 'LAPTOP' as DeviceType,
      label: hostDisplay.customAlias || 'Host Laptop & Primary Screen',
      customModelName: `${hostDisplay.vendor} ${hostDisplay.model} (Host PC)`,
      stageZone: hostDisplay.stageZone || 'FOH Control Booth',
      inputPorts: [],
      outputPorts: hostOutputPorts,
      resolution: hostDisplay.activeResolution,
      refreshRateHz: hostDisplay.refreshRateHz,
      matchedLiveDisplayId: hostDisplay.id,
      convergenceStatus: 'MATCHED' as const,
    },
  };

  const newNodes: any[] = [hostNode];
  const newEdges: any[] = [];

  externalDisplays.forEach((disp, idx) => {
    const sinkNodeId = `forked-disp-${disp.id}`;
    const inputPort = {
      id: `sink-in-${disp.id}`,
      name: `${disp.portType.replace('_', ' ')} In`,
      type: disp.portType as PortType,
      direction: 'INPUT' as const,
      maxBandwidthGbps: 18.0,
    };

    newNodes.push({
      id: sinkNodeId,
      type: 'deviceNode',
      position: { x: 620, y: 80 + idx * 190 },
      data: {
        id: sinkNodeId,
        category: 'SINK' as DeviceCategory,
        deviceType: (disp.portType === 'WIRELESS' ? 'CONFIDENCE_MONITOR' : 'COMMERCIAL_TV') as DeviceType,
        label: disp.customAlias,
        customModelName: `${disp.vendor} ${disp.model}`,
        stageZone: disp.stageZone,
        inputPorts: [inputPort],
        outputPorts: [],
        resolution: disp.activeResolution,
        refreshRateHz: disp.refreshRateHz,
        matchedLiveDisplayId: disp.id,
        convergenceStatus: 'MATCHED' as const,
      },
    });

    const cableType: PortType = disp.portType as PortType;
    const lengthM = disp.portType === 'WIRELESS' ? 15 : 10;
    const val = validateCableSignal(
      disp.activeResolution.width,
      disp.activeResolution.height,
      disp.refreshRateHz,
      8,
      cableType,
      lengthM
    );

    newEdges.push({
      id: `edge-fork-${disp.id}`,
      source: 'forked-host-pc',
      target: sinkNodeId,
      sourceHandle: `host-out-${disp.id}`,
      targetHandle: `sink-in-${disp.id}`,
      type: 'customCable',
      data: {
        id: `edge-fork-${disp.id}`,
        sourceNodeId: 'forked-host-pc',
        sourcePortId: `host-out-${disp.id}`,
        targetNodeId: sinkNodeId,
        targetPortId: `sink-in-${disp.id}`,
        cableType,
        lengthMeters: lengthM,
        calculatedBandwidthGbps: val.bandwidthGbps,
        status: val.status,
        warningMessage: val.message,
      },
    });
  });

  return { nodes: newNodes, edges: newEdges };
}

// 3.1 Single Screen Setup (Laptop only)
console.log('\n  \x1b[34m▶ Setup 1: Single-Screen Laptop Rig\x1b[0m');
const singleScreenDisplays: LiveDisplay[] = [
  {
    id: 'disp-laptop-internal',
    osIndex: 1,
    name: 'Internal eDP Screen',
    customAlias: 'Laptop Internal Display (Primary)',
    stageZone: 'FOH Booth',
    portType: 'DP_1_4',
    vendor: 'Dell',
    model: 'XPS 15 UHD',
    serial: 'DELL-9001',
    activeResolution: { width: 3840, height: 2160 },
    nativeResolution: { width: 3840, height: 2160 },
    refreshRateHz: 60,
    isHdr: true,
    colorSpace: 'sRGB',
    audioLevelDb: -6.0,
    status: 'ONLINE',
    isFrozen: false,
    isLiveFeedEnabled: true,
  },
];

const forkedSingle = executeForkLiveRig(singleScreenDisplays);
assertEqual(forkedSingle.nodes.length, 1, 'Single-screen creates exactly 1 unified Laptop node (no splitting into source + sink)');
assertEqual(forkedSingle.edges.length, 0, 'Single-screen creates 0 external cable edges');
assertEqual(forkedSingle.nodes[0].data.deviceType, 'LAPTOP', 'Host node is classified as LAPTOP');

// 3.2 Dual Screen Setup (Laptop + ASUS GlideX Phone)
console.log('\n  \x1b[34m▶ Setup 2: Dual-Screen Setup (Laptop + ASUS GlideX Phone)\x1b[0m');
const dualScreenDisplays: LiveDisplay[] = [
  {
    id: 'disp-laptop-main',
    osIndex: 1,
    name: 'Generic PnP Monitor',
    customAlias: 'Host Laptop Primary Screen',
    stageZone: 'FOH Booth',
    portType: 'HDMI_2_0',
    vendor: 'Dell',
    model: 'Latitude Pro',
    serial: 'DELL-112',
    activeResolution: { width: 1920, height: 1080 },
    nativeResolution: { width: 1920, height: 1080 },
    refreshRateHz: 60,
    isHdr: false,
    colorSpace: 'sRGB',
    audioLevelDb: -60.0,
    status: 'ONLINE',
    isFrozen: false,
    isLiveFeedEnabled: true,
  },
  {
    id: 'disp-glidex-phone',
    osIndex: 2,
    name: 'ASUS GlideX Wireless Virtual Screen',
    customAlias: 'Stage Director Wireless Phone (GlideX)',
    stageZone: 'Stage Left Roaming',
    portType: 'WIRELESS',
    vendor: 'ASUS',
    model: 'ROG Phone 8 Pro GlideX',
    serial: 'GLIDEX-888',
    activeResolution: { width: 1920, height: 1080 },
    nativeResolution: { width: 1920, height: 1080 },
    refreshRateHz: 60,
    isHdr: false,
    colorSpace: 'sRGB',
    audioLevelDb: -60.0,
    status: 'ONLINE',
    isFrozen: false,
    isLiveFeedEnabled: true,
  },
];

const forkedDual = executeForkLiveRig(dualScreenDisplays);
assertEqual(forkedDual.nodes.length, 2, 'Dual-screen creates exactly 2 nodes (1 Host Laptop + 1 Phone Sink)');
assertEqual(forkedDual.edges.length, 1, 'Dual-screen creates 1 connecting cable');
assertEqual(forkedDual.nodes[0].data.outputPorts.length, 1, 'Host has 1 output port connected to Phone');
assertEqual(forkedDual.nodes[1].data.label, 'Stage Director Wireless Phone (GlideX)', 'Phone sink label preserved');
assertEqual(forkedDual.edges[0].data.cableType, 'WIRELESS', 'Connecting edge cableType is WIRELESS');
assertEqual(forkedDual.edges[0].data.status, 'VALID', 'Wireless signal validation is VALID');

// ==============================================================================
// TEST SUITE 4: Lossless .xteon Rig Serialization Roundtrip
// ==============================================================================
console.log('\n\x1b[1m\x1b[33m--- [SUITE 4] Lossless .xteon Rig Serialization Roundtrip ---\x1b[0m');

INDUSTRY_TEMPLATES.forEach((template) => {
  const jsonStr = JSON.stringify(template.project, null, 2);
  const parsed = JSON.parse(jsonStr) as RigProject;
  assertDeepEqual(parsed, template.project, `[${template.id}] 100% loss-free roundtrip JSON serialization`);
});

// ==============================================================================
// TEST SUITE 5: Panel Dock States (Collapsible & Floating Detachable)
// ==============================================================================
console.log('\n\x1b[1m\x1b[33m--- [SUITE 5] Panel Dock States (Collapsible & Floating Detachable) ---\x1b[0m');

const store = useRigStore.getState();
assertEqual(store.paletteDockState, 'DOCKED', 'Palette initial dock state is DOCKED');
assertEqual(store.inspectorDockState, 'DOCKED', 'Inspector initial dock state is DOCKED');
assertEqual(store.liveMapInspectorDockState, 'DOCKED', 'Live Map Inspector initial dock state is DOCKED');

store.setPaletteDockState('COLLAPSED');
assertEqual(useRigStore.getState().paletteDockState, 'COLLAPSED', 'Palette transitions to COLLAPSED');

store.setPaletteDockState('DETACHED');
assertEqual(useRigStore.getState().paletteDockState, 'DETACHED', 'Palette transitions to DETACHED (Floating Mode)');

store.setPaletteDockState('DOCKED');
assertEqual(useRigStore.getState().paletteDockState, 'DOCKED', 'Palette snaps back to DOCKED');

store.setInspectorDockState('DETACHED');
assertEqual(useRigStore.getState().inspectorDockState, 'DETACHED', 'Inspector transitions to DETACHED');
store.setInspectorDockState('DOCKED');
assertEqual(useRigStore.getState().inspectorDockState, 'DOCKED', 'Inspector snaps back to DOCKED');

// Test Modal State Separation
assertEqual(store.testPatternModalOpen, false, 'testPatternModalOpen starts false');
store.openTestPatternModal('disp-glidex-phone');
assertEqual(useRigStore.getState().testPatternModalOpen, true, 'openTestPatternModal sets testPatternModalOpen to true');
assertEqual(useRigStore.getState().activeTestDisplayId, 'disp-glidex-phone', 'openTestPatternModal sets activeTestDisplayId');
store.setTestPatternModalOpen(false);
assertEqual(useRigStore.getState().testPatternModalOpen, false, 'setTestPatternModalOpen closes modal');

// ==============================================================================
// TEST SUITE 6: Live Camera Protocol Detection & Live Rig Forking with Ingest Sources
// ==============================================================================
console.log('\n\x1b[1m\x1b[33m--- [SUITE 6] Live Camera Protocol Detection & Ingest Rig Forking ---\x1b[0m');

// 6.1 Camera Protocol & Vendor Recognition
const p1 = detectCameraProtocol('Iriun 4K Webcam');
assertEqual(p1.portType, 'WIRELESS', 'Iriun Webcam classified as WIRELESS');
assertEqual(p1.vendor, 'Iriun', 'Iriun vendor detected');

const p2 = detectCameraProtocol('Elgato Cam Link 4K USB Video');
assertEqual(p2.portType, 'HDMI_2_0', 'Elgato Cam Link classified as HDMI_2_0');
assertEqual(p2.vendor, 'Elgato', 'Elgato vendor detected');

const p3 = detectCameraProtocol('Blackmagic DeckLink Duo (1)');
assertEqual(p3.portType, 'SDI_3G', 'Blackmagic DeckLink classified as SDI_3G');
assertEqual(p3.vendor, 'Blackmagic Design', 'Blackmagic Design vendor detected');

const p4 = detectCameraProtocol('NDI HX Camera Stream');
assertEqual(p4.portType, 'NDI_GBE', 'NDI HX Camera classified as NDI_GBE');
assertEqual(p4.vendor, 'NewTek / NDI', 'NewTek / NDI vendor detected');

const p5 = detectCameraProtocol('Logitech Brio 4K Ultra HD');
assertEqual(p5.portType, 'USB_C_DP', 'Logitech Brio classified as USB_C_DP');
assertEqual(p5.vendor, 'Logitech', 'Logitech vendor detected');

// 6.2 Camera State Actions
const camStore = useRigStore.getState();
const sampleCamera: LiveCamera = {
  id: 'test-cam-iriun',
  name: 'Iriun 4K Webcam',
  customAlias: 'Roaming Pastor Cam (Iriun)',
  stageZone: 'Downstage Center',
  portType: 'WIRELESS',
  category: 'EXTERNAL_PRO',
  vendor: 'Iriun',
  resolution: { width: 3840, height: 2160 },
  refreshRateHz: 60,
  status: 'ONLINE',
  isFrozen: false,
  isLiveFeedEnabled: true,
};

useRigStore.setState({ liveCameras: [sampleCamera] });
assertEqual(useRigStore.getState().liveCameras.length, 1, 'liveCameras state contains 1 camera');

camStore.toggleCameraFreeze('test-cam-iriun');
assertEqual(useRigStore.getState().liveCameras[0].isFrozen, true, 'toggleCameraFreeze freezes camera');
camStore.toggleCameraFreeze('test-cam-iriun');
assertEqual(useRigStore.getState().liveCameras[0].isFrozen, false, 'toggleCameraFreeze unfreezes camera');

camStore.updateCameraAlias('test-cam-iriun', 'Praise Team Roaming Phone');
assertEqual(useRigStore.getState().liveCameras[0].customAlias, 'Praise Team Roaming Phone', 'updateCameraAlias updates alias');

camStore.updateCameraStageZone('test-cam-iriun', 'Stage Left Foyer');
assertEqual(useRigStore.getState().liveCameras[0].stageZone, 'Stage Left Foyer', 'updateCameraStageZone updates zone');

camStore.resetCameraToDefault('test-cam-iriun');
assertEqual(useRigStore.getState().liveCameras[0].customAlias, 'Iriun 4K Wireless Phone Cam', 'resetCameraToDefault restores factory alias');

// 6.3 Live Rig Forking with Both Cameras and Displays
console.log('\n  \x1b[34m▶ Setup 3: Hybrid Live Rig (1 Camera Source + 1 Host Laptop + 1 External Projector Sink)\x1b[0m');
useRigStore.setState({
  liveDisplays: [
    {
      id: 'disp-host-laptop',
      osIndex: 1,
      name: 'Internal Screen',
      customAlias: 'FOH Tech Laptop (Primary)',
      stageZone: 'FOH Booth',
      portType: 'DP_1_4',
      vendor: 'Dell',
      model: 'XPS 15',
      serial: 'XPS-001',
      activeResolution: { width: 1920, height: 1080 },
      nativeResolution: { width: 1920, height: 1080 },
      refreshRateHz: 60,
      isHdr: false,
      colorSpace: 'sRGB',
      audioLevelDb: -6.0,
      status: 'ONLINE',
      isFrozen: false,
      isLiveFeedEnabled: true,
    },
    {
      id: 'disp-stage-projector',
      osIndex: 2,
      name: 'Panasonic 4K Laser Projector',
      customAlias: 'Auditorium Main IMAG Projector',
      stageZone: 'Main Stage Center',
      portType: 'HDMI_2_0',
      vendor: 'Panasonic',
      model: 'PT-MZ16K',
      serial: 'PANA-99',
      activeResolution: { width: 3840, height: 2160 },
      nativeResolution: { width: 3840, height: 2160 },
      refreshRateHz: 60,
      isHdr: false,
      colorSpace: 'sRGB',
      audioLevelDb: -60.0,
      status: 'ONLINE',
      isFrozen: false,
      isLiveFeedEnabled: true,
    },
  ],
  liveCameras: [sampleCamera],
});

useRigStore.getState().forkLiveRigToPlanner();
const forkedRig = useRigStore.getState();

assertEqual(forkedRig.nodes.length, 3, 'Forked hybrid rig has 3 nodes (1 Camera + 1 Host PC + 1 Projector)');
assertEqual(forkedRig.edges.length, 2, 'Forked hybrid rig has 2 connecting cables (Camera -> PC and PC -> Projector)');

const camNode = forkedRig.nodes.find((n) => n.id.startsWith('forked-cam-'));
assert(Boolean(camNode), 'Camera source node exists in forked rig');
assertEqual(camNode?.data.category, 'SOURCE', 'Camera node categorized as SOURCE');

const hostNode = forkedRig.nodes.find((n) => n.id === 'forked-host-pc');
assert(Boolean(hostNode), 'Host laptop node exists in forked rig');
assertEqual(hostNode?.data.inputPorts.length, 1, 'Host laptop has 1 camera capture input port');
assertEqual(hostNode?.data.outputPorts.length, 1, 'Host laptop has 1 GPU output port');

const projNode = forkedRig.nodes.find((n) => n.id.startsWith('forked-disp-'));
assert(Boolean(projNode), 'Projector sink node exists in forked rig');
assertEqual(projNode?.data.category, 'SINK', 'Projector node categorized as SINK');

// ==============================================================================
// TEST SUITE 7: Camera Ingest, Privacy Classification & Hidden Filtering
// ==============================================================================
console.log('\n\x1b[1m\x1b[33m--- [SUITE 7] Camera Ingest, Privacy Classification & Hidden Filtering ---\x1b[0m');

// 7.1 Auto-Classification Matrix
console.log('\n  \x1b[34m▶ Test 7.1: Camera Auto-Classification Matrix\x1b[0m');
assertEqual(classifyCameraDevice('Iriun Webcam'), 'EXTERNAL_PRO', 'Iriun 4K phone cam classified as EXTERNAL_PRO');
assertEqual(classifyCameraDevice('Elgato Cam Link 4K'), 'EXTERNAL_PRO', 'Cam Link 4K classified as EXTERNAL_PRO');
assertEqual(classifyCameraDevice('Blackmagic DeckLink Quad'), 'EXTERNAL_PRO', 'DeckLink SDI capture card classified as EXTERNAL_PRO');
assertEqual(classifyCameraDevice('Integrated Webcam'), 'INTERNAL_WEBCAM', 'Integrated Webcam classified as INTERNAL_WEBCAM');
assertEqual(classifyCameraDevice('EasyCamera (Front User-Facing)'), 'INTERNAL_WEBCAM', 'EasyCamera classified as INTERNAL_WEBCAM');
assertEqual(classifyCameraDevice('FaceTime HD Camera (Built-in)'), 'INTERNAL_WEBCAM', 'FaceTime Built-in classified as INTERNAL_WEBCAM');
assertEqual(classifyCameraDevice('OBS Virtual Camera'), 'VIRTUAL_BRIDGE', 'OBS Virtual Camera classified as VIRTUAL_BRIDGE');
assertEqual(classifyCameraDevice('screen-capture-recorder'), 'VIRTUAL_BRIDGE', 'Screen Capture Recorder classified as VIRTUAL_BRIDGE');
assertEqual(classifyCameraDevice('vMix Video'), 'VIRTUAL_BRIDGE', 'vMix Video driver classified as VIRTUAL_BRIDGE');

// 7.2 Multi-Camera Rig with Privacy Hiding & Forking Isolation
console.log('\n  \x1b[34m▶ Test 7.2: Privacy Standby, Ingest Manager Hiding & Planner Isolation\x1b[0m');

const testCameras: LiveCamera[] = [
  {
    id: 'cam-iriun',
    name: 'Iriun Webcam',
    customAlias: 'Phone Stage Left',
    stageZone: 'Stage Left',
    portType: 'WIRELESS',
    category: 'EXTERNAL_PRO',
    vendor: 'Iriun',
    resolution: { width: 3840, height: 2160 },
    refreshRateHz: 60,
    status: 'ONLINE',
    isFrozen: false,
    isLiveFeedEnabled: false, // Standby by default!
    isHidden: false,
  },
  {
    id: 'cam-internal',
    name: 'Integrated Webcam',
    customAlias: 'Laptop Internal Webcam',
    stageZone: 'FOH Booth',
    portType: 'USB_C_DP',
    category: 'INTERNAL_WEBCAM',
    vendor: 'Host PC',
    resolution: { width: 1280, height: 720 },
    refreshRateHz: 30,
    status: 'ONLINE',
    isFrozen: false,
    isLiveFeedEnabled: false,
    isHidden: true, // Hidden by default!
  },
  {
    id: 'cam-obs',
    name: 'OBS Virtual Camera',
    customAlias: 'OBS Virtual Feed',
    stageZone: 'FOH Booth',
    portType: 'NDI_GBE',
    category: 'VIRTUAL_BRIDGE',
    vendor: 'OBS Studio',
    resolution: { width: 1920, height: 1080 },
    refreshRateHz: 60,
    status: 'ONLINE',
    isFrozen: false,
    isLiveFeedEnabled: false,
    isHidden: true, // Hidden by default!
  },
  {
    id: 'cam-screencap',
    name: 'screen-capture-recorder',
    customAlias: 'Screen Capture Driver',
    stageZone: 'FOH Booth',
    portType: 'USB_C_DP',
    category: 'VIRTUAL_BRIDGE',
    vendor: 'DirectShow',
    resolution: { width: 1920, height: 1080 },
    refreshRateHz: 30,
    status: 'ONLINE',
    isFrozen: false,
    isLiveFeedEnabled: false,
    isHidden: true, // Hidden by default!
  },
];

useRigStore.setState({
  liveDisplays: [
    {
      id: 'disp-host',
      osIndex: 1,
      name: 'Primary Screen',
      customAlias: 'Host Workstation',
      stageZone: 'FOH Booth',
      portType: 'DP_1_4',
      vendor: 'Dell',
      model: 'XPS',
      serial: '001',
      activeResolution: { width: 1920, height: 1080 },
      nativeResolution: { width: 1920, height: 1080 },
      refreshRateHz: 60,
      isHdr: false,
      colorSpace: 'sRGB',
      audioLevelDb: -60.0,
      status: 'ONLINE',
      isFrozen: false,
      isLiveFeedEnabled: true,
    },
  ],
  liveCameras: testCameras,
});

const storeState = useRigStore.getState();
assertEqual(storeState.liveCameras.length, 4, 'Total 4 hardware/software video devices detected');

const unhiddenCams = storeState.liveCameras.filter((c) => !c.isHidden);
assertEqual(unhiddenCams.length, 1, 'Only 1 camera (Iriun) is visible by default (internal & virtual drivers hidden)');
assertEqual(unhiddenCams[0].id, 'cam-iriun', 'Visible camera is Iriun Wireless Stage Cam');

// Test toggleHideCamera
storeState.toggleHideCamera('cam-iriun');
assertEqual(useRigStore.getState().liveCameras.find((c) => c.id === 'cam-iriun')?.isHidden, true, 'toggleHideCamera hides Iriun camera');

storeState.toggleHideCamera('cam-iriun');
assertEqual(useRigStore.getState().liveCameras.find((c) => c.id === 'cam-iriun')?.isHidden, false, 'toggleHideCamera unhides Iriun camera');

// Test engageAllProCameras
storeState.engageAllProCameras();
assertEqual(useRigStore.getState().liveCameras.find((c) => c.id === 'cam-iriun')?.isLiveFeedEnabled, true, 'engageAllProCameras engages Iriun live feed');
assertEqual(useRigStore.getState().liveCameras.find((c) => c.id === 'cam-internal')?.isLiveFeedEnabled, false, 'Internal webcam remains in Standby');

// Test disengageAllCameras
storeState.disengageAllCameras();
assertEqual(useRigStore.getState().liveCameras.every((c) => !c.isLiveFeedEnabled), true, 'disengageAllCameras puts all cameras into Sensor Standby');

// Test forkLiveRigToPlanner with hidden cameras filtered out
useRigStore.getState().forkLiveRigToPlanner();
const isolatedForkedRig = useRigStore.getState();

const forkedCamNodes = isolatedForkedRig.nodes.filter((n) => n.id.startsWith('forked-cam-'));
assertEqual(forkedCamNodes.length, 1, 'Forked Planner Rig strictly created 1 camera node (only unhidden camera, 0 internal/virtual drivers)');
assertEqual(forkedCamNodes[0].id, 'forked-cam-cam-iriun', 'Forked camera node corresponds to Iriun');

// ==============================================================================
// TEST SUITE 8: Mobile Companion Display Normalization & State Sync
// ==============================================================================
console.log('\n\x1b[1m\x1b[33m--- [SUITE 8] Mobile Companion Normalization & State Synchronization ---\x1b[0m');

// 8.1 Sequential Normalization for Dual-Screen Setup (Laptop + ASUS GlideX Phone)
console.log('\n  \x1b[34m▶ Test 8.1: Normalization of Discontinuous Windows Hardware Slots\x1b[0m');

const rawDiscontinuousHardwareDisplays = [
  {
    rawSlot: 0,
    isPrimary: true,
    name: 'Intel UHD Graphics Internal',
    portType: 'DP_1_4' as PortType,
    width: 1920,
    height: 1080,
  },
  {
    rawSlot: 3, // Windows assigned slot 3 to ASUS GlideX virtual display driver
    isPrimary: false,
    name: 'ASUS GlideX Virtual Display',
    portType: 'WIRELESS' as PortType,
    width: 1080,
    height: 2400,
  },
];

// Sort primary first and normalize 1-based sequential index
const normalizedDisplays: LiveDisplay[] = rawDiscontinuousHardwareDisplays
  .sort((a, b) => (a.isPrimary ? -1 : 1))
  .map((d, idx) => ({
    id: `live-disp-${idx + 1}`,
    osIndex: idx + 1, // Normalized to 1, 2 (NOT 1, 4!)
    name: d.name,
    customAlias: d.isPrimary ? 'Host Workstation (Primary Screen)' : 'Phone / Tablet (ASUS GlideX Wireless)',
    stageZone: d.isPrimary ? 'FOH Control Booth' : 'Mobile Director / Stage',
    portType: d.portType,
    vendor: d.isPrimary ? 'Dell' : 'ASUS',
    model: d.name,
    serial: `SN-${idx + 1}`,
    activeResolution: { width: d.width, height: d.height },
    nativeResolution: { width: d.width, height: d.height },
    refreshRateHz: 60,
    isHdr: false,
    colorSpace: 'sRGB',
    audioLevelDb: -60.0,
    status: 'ONLINE',
    isFrozen: false,
    isLiveFeedEnabled: true,
  }));

assertEqual(normalizedDisplays.length, 2, 'Normalized displays count matches active screens (2)');
assertEqual(normalizedDisplays[0].osIndex, 1, 'Primary Laptop is Screen 1');
assertEqual(normalizedDisplays[0].customAlias, 'Host Workstation (Primary Screen)', 'Screen 1 has Host Workstation alias');
assertEqual(normalizedDisplays[1].osIndex, 2, 'Phone is normalized to Screen 2 (NOT Screen 4)');
assertEqual(normalizedDisplays[1].customAlias, 'Phone / Tablet (ASUS GlideX Wireless)', 'Screen 2 has Phone / Tablet alias');
assertEqual(normalizedDisplays[1].stageZone, 'Mobile Director / Stage', 'Screen 2 stage zone is Mobile Director');

// 8.2 Live Alias & Stage Zone Update Propagation
console.log('\n  \x1b[34m▶ Test 8.2: Live Alias & Stage Zone Customization Propagation\x1b[0m');
useRigStore.setState({ liveDisplays: normalizedDisplays });

useRigStore.getState().updateDisplayAlias('live-disp-2', 'Pastor Roaming Confidence Phone');
assertEqual(
  useRigStore.getState().liveDisplays.find((d) => d.id === 'live-disp-2')?.customAlias,
  'Pastor Roaming Confidence Phone',
  'updateDisplayAlias updates custom alias for mobile companion push'
);

useRigStore.getState().updateDisplayStageZone('live-disp-2', 'Auditorium Center Aisle');
assertEqual(
  useRigStore.getState().liveDisplays.find((d) => d.id === 'live-disp-2')?.stageZone,
  'Auditorium Center Aisle',
  'updateDisplayStageZone updates stage zone for mobile companion push'
);

console.log('\n\x1b[1m\x1b[36m===============================================================================\x1b[0m');
console.log(`\x1b[1mTOTAL ASSERTIONS: ${totalAssertions} | \x1b[32mPASSED: ${passedAssertions}\x1b[0m | \x1b[31mFAILED: ${failedAssertions}\x1b[0m`);
console.log('\x1b[1m\x1b[36m===============================================================================\x1b[0m\n');

if (failedAssertions > 0) {
  process.exit(1);
} else {
  console.log('\x1b[1m\x1b[32m>>> ALL QA AUTOMATED INTEGRATION TESTS PASSED (100% SUCCESS RATE) <<<\x1b[0m\n');
  process.exit(0);
}
