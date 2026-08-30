import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import {
  AppMode,
  ThemeMode,
  DeviceCategory,
  DeviceType,
  DeviceNodeData,
  CableEdgeData,
  LiveDisplay,
  LiveCamera,
  CameraCategory,
  PortType,
  RigProject,
  BandwidthValidation,
  PortDefinition,
  LEDWallParams,
} from '../types';
import { INDUSTRY_TEMPLATES } from '../utils/industryTemplates';

// Helper for classifying cameras into Pro External Ingest, Internal Sensors, or Virtual Software Bridges
export const classifyCameraDevice = (label: string): CameraCategory => {
  const l = label.toLowerCase();

  // 1. Internal Sensors (Laptop CMOS sensors)
  if (
    l.includes('integrated') ||
    l.includes('built-in') ||
    l.includes('builtin') ||
    l.includes('internal') ||
    l.includes('facetime') ||
    l.includes('front camera') ||
    l.includes('user facing') ||
    l.includes('easycamera') ||
    l.includes('chicony') ||
    l.includes('realtek camera') ||
    l.includes('ov5693')
  ) {
    return 'INTERNAL_WEBCAM';
  }

  // 2. Virtual Software Bridges (OBS, Screen capture drivers, etc.)
  if (
    l.includes('obs') ||
    l.includes('screen-capture') ||
    l.includes('screen capture') ||
    l.includes('screencap') ||
    l.includes('virtual') ||
    l.includes('unity') ||
    l.includes('vmix') ||
    l.includes('manycam') ||
    l.includes('splitcam') ||
    l.includes('snap camera')
  ) {
    return 'VIRTUAL_BRIDGE';
  }

  // 3. Pro / External Ingest Sources (Iriun wireless phone cam, HDMI/SDI capture cards, USB cams, NDI)
  return 'EXTERNAL_PRO';
};

// Helper for detecting protocol, vendor, and friendly alias for connected video cameras
export const detectCameraProtocol = (
  label: string
): { portType: PortType; vendor: string; defaultAlias: string } => {
  const l = label.toLowerCase();
  if (l.includes('iriun')) {
    return { portType: 'WIRELESS', vendor: 'Iriun', defaultAlias: 'Iriun 4K Wireless Phone Cam' };
  }
  if (l.includes('droidcam')) {
    return { portType: 'WIRELESS', vendor: 'Dev47Apps', defaultAlias: 'DroidCam Wireless Mobile Cam' };
  }
  if (l.includes('camo')) {
    return { portType: 'WIRELESS', vendor: 'Reincubate', defaultAlias: 'Camo High-Res Mobile Cam' };
  }
  if (l.includes('epoccam')) {
    return { portType: 'WIRELESS', vendor: 'Elgato', defaultAlias: 'EpocCam Wireless Cam' };
  }
  if (l.includes('ndi')) {
    return { portType: 'NDI_GBE', vendor: 'NewTek / NDI', defaultAlias: 'NDI IP Broadcast Video Source' };
  }
  if (l.includes('obs')) {
    return { portType: 'NDI_GBE', vendor: 'OBS Studio', defaultAlias: 'OBS Virtual Studio Feed' };
  }
  if (l.includes('decklink') || l.includes('blackmagic')) {
    return { portType: 'SDI_3G', vendor: 'Blackmagic Design', defaultAlias: 'Blackmagic SDI Studio Camera' };
  }
  if (l.includes('magewell')) {
    return { portType: 'SDI_3G', vendor: 'Magewell', defaultAlias: 'Magewell SDI Capture Stream' };
  }
  if (l.includes('cam link') || l.includes('elgato')) {
    return { portType: 'HDMI_2_0', vendor: 'Elgato', defaultAlias: 'Elgato 4K HDMI Camera Link' };
  }
  if (l.includes('avermedia')) {
    return { portType: 'HDMI_2_0', vendor: 'AVerMedia', defaultAlias: 'AVerMedia Live Gamer Capture' };
  }
  if (l.includes('logitech') || l.includes('brio') || l.includes('c920') || l.includes('c922')) {
    return { portType: 'USB_C_DP', vendor: 'Logitech', defaultAlias: 'Logitech Pro USB Stage Cam' };
  }
  if (l.includes('razer')) {
    return { portType: 'USB_C_DP', vendor: 'Razer', defaultAlias: 'Razer Kiyo Streaming Cam' };
  }
  if (l.includes('integrated') || l.includes('built-in') || l.includes('internal')) {
    return { portType: 'USB_C_DP', vendor: 'Host Workstation', defaultAlias: 'Laptop Integrated Webcam' };
  }
  return { portType: 'USB_C_DP', vendor: 'DirectShow Video', defaultAlias: label || 'External Video Camera' };
};

// Helper for pushing live normalized displays to the local Mobile Companion server
export const pushDisplaysToCompanion = async (displays: LiveDisplay[]) => {
  if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const payload = displays.map((d, idx) => ({
        id: d.id,
        os_index: d.osIndex || idx + 1,
        name: d.name,
        custom_alias: d.customAlias,
        stage_zone: d.stageZone,
        port_type: d.portType,
        width: d.activeResolution.width,
        height: d.activeResolution.height,
        refresh_rate_hz: d.refreshRateHz,
        is_primary: idx === 0 || d.osIndex === 1,
        is_frozen: d.isFrozen || false,
        bounds_x: d.bounds?.x,
        bounds_y: d.bounds?.y,
      }));
      await invoke('sync_mobile_companion_displays', { displays: payload });
    } catch (_) {}
  }
};

// Helper for generating initial port definitions for any device
export const createDefaultPorts = (
  deviceType: DeviceType
): { inputPorts: PortDefinition[]; outputPorts: PortDefinition[]; label: string; customModelName: string; resolution: { width: number; height: number }; refreshRateHz: number; category: DeviceCategory } => {
  switch (deviceType) {
    // --- SOURCES ---
    case 'LAPTOP':
      return {
        category: 'SOURCE',
        label: 'Presentation Laptop',
        customModelName: 'MacBook Pro / Dell XPS (FOH)',
        inputPorts: [],
        outputPorts: [
          { id: 'p-out-1', name: 'HDMI 2.0 Out', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-2', name: 'USB-C / DP Out', type: 'USB_C_DP', direction: 'OUTPUT', maxBandwidthGbps: 20.0 },
        ],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      };

    case 'MEDIA_SERVER':
      return {
        category: 'SOURCE',
        label: 'FOH Media Server',
        customModelName: 'Custom RTX 4080 Rig (ProPresenter / Resolume)',
        inputPorts: [],
        outputPorts: [
          { id: 'p-out-1', name: 'DP 1.4 Out 1 (Main Wall)', type: 'DP_1_4', direction: 'OUTPUT', maxBandwidthGbps: 32.4 },
          { id: 'p-out-2', name: 'HDMI 2.0 Out 2 (Stage Aux)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-3', name: 'HDMI 2.0 Out 3 (Prompter)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-4', name: 'DP 1.4 Out 4 (Multiview)', type: 'DP_1_4', direction: 'OUTPUT', maxBandwidthGbps: 32.4 },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'CAMERA_PTZ':
    case 'CAMERA_SDI':
      return {
        category: 'SOURCE',
        label: deviceType === 'CAMERA_PTZ' ? 'PTZ Robotic Camera' : 'Studio Broadcast Camera',
        customModelName: deviceType === 'CAMERA_PTZ' ? 'Birddog P4K / Panasonic AW-UE150' : 'Sony FX6 / Blackmagic URSA',
        inputPorts: [],
        outputPorts: [
          { id: 'p-out-1', name: '12G-SDI Program', type: 'SDI_12G', direction: 'OUTPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-out-2', name: 'HDMI 2.0 Monitor', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-3', name: 'NDI / IP Video', type: 'NDI_GBE', direction: 'OUTPUT', maxBandwidthGbps: 1.0 },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'PLAYBACK_RECORDER':
      return {
        category: 'SOURCE',
        label: 'HyperDeck Video Recorder',
        customModelName: 'Blackmagic HyperDeck Studio 4K Pro',
        inputPorts: [
          { id: 'p-in-1', name: '12G-SDI In', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-in-2', name: 'HDMI 2.0 In', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: '12G-SDI Playback', type: 'SDI_12G', direction: 'OUTPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-out-2', name: 'HDMI 2.0 Playback', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-3', name: '12G-SDI Loop Out', type: 'SDI_12G', direction: 'OUTPUT', maxBandwidthGbps: 11.88 },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'WIRELESS_GATEWAY':
      return {
        category: 'SOURCE',
        label: 'Wireless Presentation Gateway',
        customModelName: 'ASUS GlideX / Barco ClickShare CX-50',
        inputPorts: [
          { id: 'p-in-1', name: 'Wi-Fi 6 / Miracast Stream', type: 'WIRELESS', direction: 'INPUT', maxBandwidthGbps: 5.0 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'HDMI 2.0 Out', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
        ],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      };

    // --- SWITCHERS & MIXERS ---
    case 'SEAMLESS_SWITCHER':
      return {
        category: 'SWITCHER',
        label: 'Seamless Presentation Switcher',
        customModelName: 'Roland V-160HD / Barco S3-4K',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI In 1 (Presenter)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-2', name: 'HDMI In 2 (Backup PC)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-3', name: '12G-SDI In 3 (Cam 1)', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-in-4', name: '12G-SDI In 4 (Cam 2)', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'PGM Out (Main Stage)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-2', name: 'AUX 1 (Confidence)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-3', name: 'Multiview Out', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
        ],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      };

    case 'PRODUCTION_SWITCHER':
      return {
        category: 'SWITCHER',
        label: 'Production Vision Switcher',
        customModelName: 'Blackmagic ATEM Constellation 4K',
        inputPorts: [
          { id: 'p-in-1', name: 'SDI In 1 (Host PC)', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-in-2', name: 'SDI In 2 (Cam 1)', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-in-3', name: 'SDI In 3 (Cam 2)', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-in-4', name: 'SDI In 4 (Graphics)', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'PGM 1 Out', type: 'SDI_12G', direction: 'OUTPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-out-2', name: 'PGM 2 Out', type: 'SDI_12G', direction: 'OUTPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-out-3', name: 'AUX 1 Out', type: 'SDI_12G', direction: 'OUTPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-out-4', name: 'Multiview Out', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'MATRIX_4X4':
    case 'MATRIX_8X8':
    case 'MATRIX_16X16':
      const matrixSize = deviceType === 'MATRIX_4X4' ? 4 : deviceType === 'MATRIX_8X8' ? 8 : 16;
      return {
        category: 'SWITCHER',
        label: `${matrixSize}x${matrixSize} Matrix Router`,
        customModelName: `Extron DTP CrossPoint ${matrixSize}x${matrixSize} 4K`,
        inputPorts: Array.from({ length: matrixSize }, (_, i) => ({
          id: `p-in-${i + 1}`,
          name: `Input ${i + 1}`,
          type: 'HDMI_2_0',
          direction: 'INPUT',
          maxBandwidthGbps: 18.0,
        })),
        outputPorts: Array.from({ length: matrixSize }, (_, i) => ({
          id: `p-out-${i + 1}`,
          name: `Output ${i + 1}`,
          type: 'HDMI_2_0',
          direction: 'OUTPUT',
          maxBandwidthGbps: 18.0,
        })),
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    // --- DISTRIBUTION & CONVERTERS ---
    case 'SPLITTER_1X2':
    case 'SPLITTER_1X4':
    case 'SPLITTER_1X8':
    case 'SPLITTER_1X16':
      const splitCount = deviceType === 'SPLITTER_1X2' ? 2 : deviceType === 'SPLITTER_1X4' ? 4 : deviceType === 'SPLITTER_1X8' ? 8 : 16;
      return {
        category: 'DISTRIBUTION',
        label: `1x${splitCount} HDMI Distribution Amp`,
        customModelName: `Kramer VM-${splitCount}H2 4K60`,
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI 2.0 In', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: Array.from({ length: splitCount }, (_, i) => ({
          id: `p-out-${i + 1}`,
          name: `Out ${i + 1}`,
          type: 'HDMI_2_0',
          direction: 'OUTPUT',
          maxBandwidthGbps: 18.0,
        })),
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'DECIMATOR_MD_HX':
    case 'DECIMATOR_12G_CROSS':
      return {
        category: 'CONVERTER',
        label: deviceType === 'DECIMATOR_12G_CROSS' ? 'Decimator 12G-CROSS Converter' : 'Decimator MD-HX Cross-Converter',
        customModelName: deviceType === 'DECIMATOR_12G_CROSS' ? 'Decimator 12G-CROSS 4K' : 'Decimator MD-HX Miniature Cross Converter',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI In', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-2', name: 'SDI In', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'SDI Out (Pair 1)', type: 'SDI_12G', direction: 'OUTPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-out-2', name: 'SDI Out (Pair 2)', type: 'SDI_12G', direction: 'OUTPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-out-3', name: 'HDMI Out Scaled', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
        ],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      };

    case 'HDBASET_TX':
    case 'HDBASET_RX':
      return {
        category: 'CONVERTER',
        label: deviceType === 'HDBASET_TX' ? 'HDBaseT 4K Transmitter (TX)' : 'HDBaseT 4K Receiver (RX)',
        customModelName: 'Atlona AT-HDR-EX-70C Extender',
        inputPorts: [
          {
            id: 'p-in-1',
            name: deviceType === 'HDBASET_TX' ? 'HDMI 2.0 In' : 'HDBaseT CAT6 In',
            type: deviceType === 'HDBASET_TX' ? 'HDMI_2_0' : 'HDBASET_CAT6',
            direction: 'INPUT',
            maxBandwidthGbps: 18.0,
          },
        ],
        outputPorts: [
          {
            id: 'p-out-1',
            name: deviceType === 'HDBASET_TX' ? 'HDBaseT CAT6 Link' : 'HDMI 2.0 Out',
            type: deviceType === 'HDBASET_TX' ? 'HDBASET_CAT6' : 'HDMI_2_0',
            direction: 'OUTPUT',
            maxBandwidthGbps: 18.0,
          },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'FIBER_TRANSCEIVER':
      return {
        category: 'CONVERTER',
        label: 'Optical Fiber HDMI Transceiver',
        customModelName: 'AJA FiDO 12G Optical Extender',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI / SDI In', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'Single-Mode Optical Fiber Out', type: 'FIBER_HDMI', direction: 'OUTPUT', maxBandwidthGbps: 32.0 },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'WIRELESS_VIDEO_TX':
      return {
        category: 'CONVERTER',
        label: 'Zero-Delay Wireless TX/RX',
        customModelName: 'Teradek Bolt 4K LT / Hollyland Mars 4K',
        inputPorts: [
          { id: 'p-in-1', name: '12G-SDI / HDMI In', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'Wireless 5GHz/6GHz Beam', type: 'WIRELESS', direction: 'OUTPUT', maxBandwidthGbps: 12.0 },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    // --- PROCESSORS & LED CONTROLLERS ---
    case 'NOVASTAR_VX4S':
    case 'NOVASTAR_MCTRL4K':
    case 'NOVASTAR_MX40_PRO':
      const novaPorts = deviceType === 'NOVASTAR_MX40_PRO' ? 20 : deviceType === 'NOVASTAR_MCTRL4K' ? 16 : 4;
      return {
        category: 'PROCESSOR',
        label: deviceType === 'NOVASTAR_MX40_PRO' ? 'NovaStar MX40 Pro COEX' : deviceType === 'NOVASTAR_MCTRL4K' ? 'NovaStar MCTRL4K UHD' : 'NovaStar VX4S All-in-One',
        customModelName: deviceType === 'NOVASTAR_MX40_PRO' ? 'NovaStar MX40 Pro (8K COEX)' : 'NovaStar MCTRL4K UHD Master',
        inputPorts: [
          { id: 'p-in-1', name: 'DP 1.4 Main In', type: 'DP_1_4', direction: 'INPUT', maxBandwidthGbps: 32.4 },
          { id: 'p-in-2', name: 'HDMI 2.0 In', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-3', name: '12G-SDI In', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
        ],
        outputPorts: Array.from({ length: novaPorts }, (_, i) => ({
          id: `p-out-${i + 1}`,
          name: `Port ${i + 1} (Gigabit Link)`,
          type: 'HDBASET_CAT6',
          direction: 'OUTPUT',
          maxBandwidthGbps: 1.0,
        })),
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'BROMPTON_S8':
    case 'BROMPTON_SX40':
      const bromptonOutputs = deviceType === 'BROMPTON_SX40' ? 4 : 8;
      return {
        category: 'PROCESSOR',
        label: deviceType === 'BROMPTON_SX40' ? 'Brompton Tessera SX40 4K' : 'Brompton Tessera S8 Processor',
        customModelName: deviceType === 'BROMPTON_SX40' ? 'Brompton Tessera SX40 4K HDR' : 'Brompton Tessera S8',
        inputPorts: [
          { id: 'p-in-1', name: '12G-SDI In', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-in-2', name: 'HDMI 2.0 In', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: Array.from({ length: bromptonOutputs }, (_, i) => ({
          id: `p-out-${i + 1}`,
          name: `10G Optical Trunk ${i + 1}`,
          type: 'FIBER_HDMI',
          direction: 'OUTPUT',
          maxBandwidthGbps: 10.0,
        })),
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'DATAPATH_FX4':
      return {
        category: 'PROCESSOR',
        label: 'Datapath Fx4 Video Wall Scaler',
        customModelName: 'Datapath Fx4-DisplayPort Multi-Display Controller',
        inputPorts: [
          { id: 'p-in-1', name: 'DP 1.2 4K In', type: 'DP_1_4', direction: 'INPUT', maxBandwidthGbps: 21.6 },
          { id: 'p-in-2', name: 'HDMI 1.4 In', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 10.2 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'Display 1 Out (Quadrant 1)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-2', name: 'Display 2 Out (Quadrant 2)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-3', name: 'Display 3 Out (Quadrant 3)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-4', name: 'Display 4 Out (Quadrant 4)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    // --- SINKS / OUTPUT DISPLAYS ---
    case 'COMMERCIAL_TV':
    case 'FOYER_DISPLAY':
      return {
        category: 'SINK',
        label: deviceType === 'FOYER_DISPLAY' ? 'Foyer / Overflow Display' : 'Commercial Flat Panel TV',
        customModelName: 'Samsung 65" QM65B Pro 4K UHD',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI In 1 (Primary)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-2', name: 'HDMI In 2 (Backup)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-3', name: 'HDMI In 3 (Wireless Cast)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'HDMI eARC / Loop Out', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'CONFIDENCE_MONITOR':
      return {
        category: 'SINK',
        label: 'Downstage Confidence Monitor (DSM)',
        customModelName: 'LG 55" Commercial Teleprompter',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI In 1 (Speaker Notes)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-2', name: '3G-SDI In (Timer)', type: 'SDI_3G', direction: 'INPUT', maxBandwidthGbps: 2.97 },
        ],
        outputPorts: [],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      };

    case 'PROJECTOR':
      return {
        category: 'SINK',
        label: 'Venue Laser Projector',
        customModelName: 'Panasonic PT-MZ20K 20,000 Lumen Laser',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI 2.0 In (Main)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-2', name: '12G-SDI In (Direct Feed)', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-in-3', name: 'HDBaseT / DIGITAL LINK In', type: 'HDBASET_CAT6', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'SDI Monitor Loop Out', type: 'SDI_12G', direction: 'OUTPUT', maxBandwidthGbps: 11.88 },
        ],
        resolution: { width: 1920, height: 1200 },
        refreshRateHz: 60,
      };

    case 'LED_WALL':
      return {
        category: 'SINK',
        label: 'Direct-View LED Video Wall',
        customModelName: 'Unilumin Upad IV 2.6mm High-Refresh Wall',
        inputPorts: [
          { id: 'p-in-1', name: 'Trunk Port 1 (Cols 1-4)', type: 'HDBASET_CAT6', direction: 'INPUT', maxBandwidthGbps: 1.0 },
          { id: 'p-in-2', name: 'Trunk Port 2 (Cols 5-8)', type: 'HDBASET_CAT6', direction: 'INPUT', maxBandwidthGbps: 1.0 },
          { id: 'p-in-3', name: 'Trunk Port 3 (Cols 9-12)', type: 'HDBASET_CAT6', direction: 'INPUT', maxBandwidthGbps: 1.0 },
          { id: 'p-in-4', name: 'Trunk Port 4 (Cols 13-16)', type: 'HDBASET_CAT6', direction: 'INPUT', maxBandwidthGbps: 1.0 },
        ],
        outputPorts: [],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'STUDIO_MULTIVIEW':
      return {
        category: 'SINK',
        label: 'Studio Multiview Wall Monitor',
        customModelName: 'Dell 43" 4K Multi-Client Ultra HD Monitor',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI 1 (Multiview)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-2', name: 'HDMI 2 (PGM Live)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-3', name: 'DP 1 (Teleprompter)', type: 'DP_1_4', direction: 'INPUT', maxBandwidthGbps: 32.4 },
        ],
        outputPorts: [],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      };

    case 'STREAMING_ENCODER':
      return {
        category: 'SINK',
        label: 'Live Streaming Encoder',
        customModelName: 'AJA HELO Plus H.264 Live Streamer',
        inputPorts: [
          { id: 'p-in-1', name: '12G-SDI PGM Feed', type: 'SDI_12G', direction: 'INPUT', maxBandwidthGbps: 11.88 },
          { id: 'p-in-2', name: 'HDMI 2.0 Feed', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'RTMP / SRT Cloud Output', type: 'NDI_GBE', direction: 'OUTPUT', maxBandwidthGbps: 1.0 },
        ],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      };

    default:
      return {
        category: 'DISTRIBUTION',
        label: 'Generic AV Device',
        customModelName: 'Standard Pro AV Interface',
        inputPorts: [{ id: 'p-in-1', name: 'HDMI In', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 }],
        outputPorts: [{ id: 'p-out-1', name: 'HDMI Out', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 }],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      };
  }
};

// Cable physics validation
export const validateCableSignal = (
  width: number,
  height: number,
  refreshHz: number,
  colorBits: number,
  cableType: PortType,
  lengthM: number
): BandwidthValidation => {
  const pixelClock = width * height * refreshHz;
  const rawBitsPerSec = pixelClock * colorBits * 3 * 1.25;
  const bandwidthGbps = Number((rawBitsPerSec / 1_000_000_000).toFixed(2));

  let maxPortGbps = 18.0;
  let maxDistanceM = 15;

  switch (cableType) {
    case 'HDMI_2_0':
      maxPortGbps = 18.0;
      maxDistanceM = 10;
      break;
    case 'HDMI_2_1':
      maxPortGbps = 48.0;
      maxDistanceM = 5;
      break;
    case 'DP_1_4':
      maxPortGbps = 32.4;
      maxDistanceM = 3;
      break;
    case 'SDI_3G':
      maxPortGbps = 2.97;
      maxDistanceM = 100;
      break;
    case 'SDI_12G':
      maxPortGbps = 11.88;
      maxDistanceM = 70;
      break;
    case 'HDBASET_CAT6':
      maxPortGbps = 18.0;
      maxDistanceM = 100;
      break;
    case 'FIBER_HDMI':
      maxPortGbps = 48.0;
      maxDistanceM = 300;
      break;
    case 'WIRELESS':
      maxPortGbps = 12.0;
      maxDistanceM = 30;
      break;
    default:
      maxPortGbps = 18.0;
      maxDistanceM = 15;
  }

  if (bandwidthGbps > maxPortGbps) {
    return {
      bandwidthGbps,
      maxPortGbps,
      maxDistanceMeters: maxDistanceM,
      status: 'ERROR_BANDWIDTH',
      message: `Bandwidth saturated: Requires ${bandwidthGbps} Gbps, but ${cableType.replace('_', ' ')} caps at ${maxPortGbps} Gbps.`,
    };
  }

  if (lengthM > maxDistanceM) {
    return {
      bandwidthGbps,
      maxPortGbps,
      maxDistanceMeters: maxDistanceM,
      status: 'WARNING_DISTANCE',
      message: `Distance threshold exceeded (${lengthM}m > ${maxDistanceM}m max for passive copper). Recommend Fiber Optical HDMI or HDBaseT.`,
    };
  }

  return {
    bandwidthGbps,
    maxPortGbps,
    maxDistanceMeters: maxDistanceM,
    status: 'VALID',
    message: `Optimal signal lock (${bandwidthGbps} Gbps / ${maxPortGbps} Gbps max, ${lengthM}m).`,
  };
};

interface RigState {
  appMode: AppMode;
  themeMode: ThemeMode;
  setAppMode: (mode: AppMode) => void;
  setThemeMode: (theme: ThemeMode) => void;

  // Planner Graph state (Blank by default)
  nodes: Node<DeviceNodeData>[];
  edges: Edge<CableEdgeData>[];
  selectedElement: { type: 'node' | 'edge'; id: string } | null;
  createNewPlan: () => void;
  loadSampleRig: () => void;

  onNodesChange: (changes: NodeChange<Node<DeviceNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge<CableEdgeData>>[]) => void;
  onConnect: (connection: Connection) => void;
  addDeviceNode: (type: DeviceType, pos?: { x: number; y: number }) => void;
  updateNodeData: (id: string, partial: Partial<DeviceNodeData>) => void;
  updateEdgeData: (id: string, partial: Partial<CableEdgeData>) => void;
  removeElement: (type: 'node' | 'edge', id: string) => void;
  selectElement: (type: 'node' | 'edge' | null, id: string | null) => void;

  // Dynamic Port Management
  addInputPort: (nodeId: string, port: Partial<PortDefinition>) => void;
  removeInputPort: (nodeId: string, portId: string) => void;
  addOutputPort: (nodeId: string, port: Partial<PortDefinition>) => void;
  removeOutputPort: (nodeId: string, portId: string) => void;
  setSplitterMultiplier: (nodeId: string, count: number) => void;
  setMatrixDimensions: (nodeId: string, inCount: number, outCount: number) => void;
  setTVInputCount: (nodeId: string, count: number) => void;

  // Dynamic Pathway Management
  updateEdgeCableType: (edgeId: string, cableType: PortType) => void;
  updateEdgeLength: (edgeId: string, lengthMeters: number) => void;

  // Live Map Selection & Alias Management
  selectedLiveElement: { type: 'node' | 'edge'; id: string } | null;
  selectLiveElement: (type: 'node' | 'edge' | null, id: string | null) => void;
  resetDisplayToDefault: (displayId: string) => void;
  resetAllDisplaysToDefault: () => void;
  resetCameraToDefault: (cameraId: string) => void;

  // Live Hardware & Convergence state
  liveDisplays: LiveDisplay[];
  liveCameras: LiveCamera[];
  activeFlashingDisplayId: string | null;
  activeTestPattern: string | null;
  activeTestDisplayId: string | null;
  reconciliationModalOpen: boolean;
  mobileModalOpen: boolean;
  audioConsentOpen: boolean;
  audioMonitoringAllowed: boolean;
  isLiveAudioActive: boolean;
  showCursorInPreviews: boolean;

  flashDisplay: (displayId: string) => void;
  setTestPattern: (displayId: string | null, pattern: string | null) => void;
  toggleDisplayFreeze: (displayId: string) => void;
  toggleLiveFeed: (displayId: string) => void;
  setAllLiveFeeds: (enabled: boolean) => void;
  updateDisplayAlias: (displayId: string, alias: string) => void;
  updateDisplayStageZone: (displayId: string, zone: string) => void;

  // Live Camera Controls & Ingest Management
  showHiddenCameras: boolean;
  cameraIngestModalOpen: boolean;
  setShowHiddenCameras: (show: boolean) => void;
  setCameraIngestModalOpen: (open: boolean) => void;
  refreshLiveCameras: () => Promise<void>;
  toggleCameraLiveFeed: (cameraId: string) => void;
  toggleCameraFreeze: (cameraId: string) => void;
  updateCameraAlias: (cameraId: string, alias: string) => void;
  updateCameraStageZone: (cameraId: string, zone: string) => void;
  toggleHideCamera: (cameraId: string) => void;
  toggleMuteCamera: (cameraId: string) => void;
  unhideAllCameras: () => void;
  engageAllProCameras: () => void;
  disengageAllCameras: () => void;
  setCameraCategory: (cameraId: string, category: CameraCategory) => void;

  setReconciliationModalOpen: (open: boolean) => void;
  setMobileModalOpen: (open: boolean) => void;
  setAudioConsentOpen: (open: boolean) => void;
  setAudioMonitoringAllowed: (allowed: boolean) => void;
  startSystemAudioCapture: () => Promise<void>;
  stopSystemAudioCapture: () => void;
  setShowCursorInPreviews: (show: boolean) => void;
  refreshLiveDisplays: () => Promise<void>;
  pollLiveThumbnails: () => Promise<void>;

  testPatternModalOpen: boolean;
  setTestPatternModalOpen: (open: boolean) => void;
  openTestPatternModal: (displayId: string) => void;

  // Panel Dock States (Collapsible & Detachable)
  paletteDockState: 'DOCKED' | 'COLLAPSED' | 'DETACHED';
  setPaletteDockState: (state: 'DOCKED' | 'COLLAPSED' | 'DETACHED') => void;
  inspectorDockState: 'DOCKED' | 'COLLAPSED' | 'DETACHED';
  setInspectorDockState: (state: 'DOCKED' | 'COLLAPSED' | 'DETACHED') => void;
  liveMapInspectorDockState: 'DOCKED' | 'COLLAPSED' | 'DETACHED';
  setLiveMapInspectorDockState: (state: 'DOCKED' | 'COLLAPSED' | 'DETACHED') => void;

  // Project Metadata & File Management
  projectName: string;
  projectVenue: string;
  projectAuthor: string;
  isDirty: boolean;
  recentProjects: Array<{ name: string; date: string; nodeCount: number; data: string }>;
  setProjectName: (name: string) => void;
  setProjectVenue: (venue: string) => void;
  setProjectAuthor: (author: string) => void;
  addRecentProject: (name: string, dataStr: string) => void;
  savePlanToFile: () => Promise<void>;
  loadPlanFromFile: () => Promise<void>;
  loadTemplate: (templateId: string) => void;
  forkLiveRigToPlanner: () => void;

  // Live Map Resizable Sidebar
  liveMapRightWidth: number;
  setLiveMapRightWidth: (w: number) => void;

  // Project Import/Export
  exportProject: () => RigProject;
  importProject: (proj: RigProject) => void;
}

let isCapturingInProgress = false;
let wasapiAudioInterval: any = null;

// Helper to compute live convergence matching across planned sink nodes
const computeConvergence = (nodes: Node<DeviceNodeData>[], liveDisplays: LiveDisplay[]): Node<DeviceNodeData>[] => {
  const sinks = nodes.filter((n) => n.data.category === 'SINK');
  let displayIndex = 0;

  return nodes.map((node) => {
    if (node.data.category !== 'SINK') return node;

    // Match with available real display sequentially or by alias
    const matchedDisp = liveDisplays[displayIndex];
    if (matchedDisp) {
      displayIndex++;
      const isResMatch = !node.data.resolution || (node.data.resolution.width === matchedDisp.activeResolution.width);
      return {
        ...node,
        data: {
          ...node.data,
          matchedLiveDisplayId: matchedDisp.id,
          convergenceStatus: isResMatch ? 'MATCHED' : 'MISMATCH_RES',
        },
      };
    } else {
      return {
        ...node,
        data: {
          ...node.data,
          matchedLiveDisplayId: undefined,
          convergenceStatus: 'UNLINKED',
        },
      };
    }
  });
};

export const useRigStore = create<RigState>((set, get) => ({
  appMode: 'PLANNER',
  themeMode: 'DARK_FOH',
  setAppMode: (mode) => set({ appMode: mode }),
  setThemeMode: (theme) => set({ themeMode: theme }),

  // Project Metadata & File State
  projectName: 'Untitled_Rig_Plan',
  projectVenue: 'Main Stage',
  projectAuthor: 'Technical Director',
  isDirty: false,
  recentProjects: (() => {
    try {
      return JSON.parse(localStorage.getItem('xteon_recent_projects') || '[]');
    } catch {
      return [];
    }
  })(),
  liveMapRightWidth: 340,
  setLiveMapRightWidth: (w) => set({ liveMapRightWidth: w }),

  // Panel Dock States (Collapsible & Detachable)
  paletteDockState: 'DOCKED',
  setPaletteDockState: (st) => set({ paletteDockState: st }),
  inspectorDockState: 'DOCKED',
  setInspectorDockState: (st) => set({ inspectorDockState: st }),
  liveMapInspectorDockState: 'DOCKED',
  setLiveMapInspectorDockState: (st) => set({ liveMapInspectorDockState: st }),

  testPatternModalOpen: false,
  setTestPatternModalOpen: (open) => set({ testPatternModalOpen: open }),
  openTestPatternModal: (displayId) => set({ activeTestDisplayId: displayId, testPatternModalOpen: true }),

  setProjectName: (name) => set({ projectName: name, isDirty: true }),
  setProjectVenue: (venue) => set({ projectVenue: venue, isDirty: true }),
  setProjectAuthor: (author) => set({ projectAuthor: author, isDirty: true }),

  addRecentProject: (name, dataStr) => {
    try {
      const parsed = JSON.parse(dataStr);
      const nodeCount = parsed.nodes?.length || 0;
      const recent = [
        { name, date: new Date().toLocaleDateString(), nodeCount, data: dataStr },
        ...get().recentProjects.filter((p) => p.name !== name),
      ].slice(0, 5);
      localStorage.setItem('xteon_recent_projects', JSON.stringify(recent));
      set({ recentProjects: recent });
    } catch (e) {}
  },

  // Pure Blank Canvas by default
  nodes: [],
  edges: [],
  selectedElement: null,
  selectedLiveElement: null,

  selectLiveElement: (type, id) => {
    if (!type || !id) {
      set({ selectedLiveElement: null });
    } else {
      set({ selectedLiveElement: { type, id } });
    }
  },

  resetDisplayToDefault: (displayId) => {
    set({
      liveDisplays: get().liveDisplays.map((disp) => {
        if (disp.id === displayId) {
          return {
            ...disp,
            customAlias: disp.name,
            stageZone: disp.osIndex === 1 ? 'FOH Booth' : 'Stage Area',
          };
        }
        return disp;
      }),
    });
  },

  resetAllDisplaysToDefault: () => {
    set({
      liveDisplays: get().liveDisplays.map((disp) => ({
        ...disp,
        customAlias: disp.name,
        stageZone: disp.osIndex === 1 ? 'FOH Booth' : 'Stage Area',
      })),
    });
  },

  createNewPlan: () => {
    set({
      nodes: [],
      edges: [],
      selectedElement: null,
      projectName: 'Untitled_Rig_Plan',
      isDirty: false,
    });
  },

  loadTemplate: (templateId) => {
    const t = INDUSTRY_TEMPLATES.find((item) => item.id === templateId);
    if (t) {
      get().importProject(t.project);
      set({
        projectName: t.project.meta.projectName,
        projectVenue: t.project.meta.venue || 'Main Stage',
        projectAuthor: t.project.meta.author || 'Xteon Pro AV',
        isDirty: true,
      });
      get().addRecentProject(t.project.meta.projectName, JSON.stringify(t.project));
    }
  },

  savePlanToFile: async () => {
    const proj = get().exportProject();
    const jsonStr = JSON.stringify(proj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const safeTitle = (get().projectName || 'Xteon_Rig_Plan').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}.xteon`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    get().addRecentProject(safeTitle, jsonStr);
    set({ isDirty: false });
  },

  loadPlanFromFile: async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xteon,.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          get().importProject(parsed);
          const safeName = file.name.replace(/\.(xteon|json)$/i, '');
          set({
            projectName: parsed.meta?.projectName || parsed.name || safeName,
            projectVenue: parsed.meta?.venue || parsed.venue || 'Main Stage',
            projectAuthor: parsed.meta?.author || parsed.author || 'Technical Director',
            isDirty: false,
          });
          get().addRecentProject(safeName, JSON.stringify(parsed));
        } catch (err) {
          alert('Invalid .xteon file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  forkLiveRigToPlanner: () => {
    const displays = get().liveDisplays;
    const cameras = get().liveCameras.filter((c) => !c.isHidden);

    if ((!displays || displays.length === 0) && (!cameras || cameras.length === 0)) {
      alert('No live displays or active cameras detected to fork.');
      return;
    }

    const hostDisplay = displays.find((d) => d.customAlias.includes('Primary') || d.osIndex === 1) || displays[0] || {
      id: 'disp-host-default',
      osIndex: 1,
      name: 'Host Workstation Display',
      customAlias: 'Host Workstation Primary Screen',
      stageZone: 'FOH Control Booth',
      portType: 'DP_1_4' as PortType,
      vendor: 'Host PC',
      model: 'Primary Display',
      serial: 'HOST-01',
      activeResolution: { width: 1920, height: 1080 },
      nativeResolution: { width: 1920, height: 1080 },
      refreshRateHz: 60,
    };

    const externalDisplays = displays.filter((d) => d.id !== hostDisplay.id);

    // Build Host Workstation Node with input ports for CAMERAS and output ports for EXTERNAL SCREENS
    const hostInputPorts: PortDefinition[] = cameras.map((cam, idx) => ({
      id: `host-in-cam-${cam.id}`,
      name: `Capture In ${idx + 1} (${cam.customAlias || cam.name})`,
      type: cam.portType,
      direction: 'INPUT',
      maxBandwidthGbps: cam.portType === 'SDI_12G' ? 12.0 : cam.portType === 'HDMI_2_0' ? 18.0 : 10.0,
    }));

    const hostOutputPorts: PortDefinition[] = externalDisplays.map((disp, idx) => ({
      id: `host-out-${disp.id}`,
      name: `GPU Out ${idx + 1} (${disp.portType.replace('_', ' ')})`,
      type: disp.portType as PortType,
      direction: 'OUTPUT',
      maxBandwidthGbps: disp.portType === 'DP_1_4' ? 32.4 : disp.portType === 'HDMI_2_1' ? 48.0 : disp.portType === 'WIRELESS' ? 10.0 : 18.0,
    }));

    const hostX = cameras.length > 0 ? 460 : 80;
    const hostY = Math.max(120, Math.max(externalDisplays.length, cameras.length) * 90);

    const hostNode: Node<DeviceNodeData> = {
      id: 'forked-host-pc',
      type: 'deviceNode',
      position: { x: hostX, y: hostY },
      data: {
        id: 'forked-host-pc',
        category: 'SOURCE',
        deviceType: 'LAPTOP',
        label: hostDisplay.customAlias || 'Host Laptop & Primary Screen',
        customModelName: `${hostDisplay.vendor} ${hostDisplay.model} (Host PC)`,
        stageZone: hostDisplay.stageZone || 'FOH Control Booth',
        inputPorts: hostInputPorts,
        outputPorts: hostOutputPorts,
        resolution: hostDisplay.activeResolution,
        refreshRateHz: hostDisplay.refreshRateHz,
        matchedLiveDisplayId: hostDisplay.id,
        convergenceStatus: 'MATCHED',
      },
    };

    const newNodes: Node<DeviceNodeData>[] = [hostNode];
    const newEdges: Edge<CableEdgeData>[] = [];

    // 1. Create Camera Source Nodes (on the left side)
    cameras.forEach((cam, idx) => {
      const camNodeId = `forked-cam-${cam.id}`;
      const camDeviceType: DeviceType =
        cam.portType === 'SDI_3G' || cam.portType === 'SDI_12G'
          ? 'CAMERA_SDI'
          : cam.portType === 'WIRELESS'
          ? 'WIRELESS_GATEWAY'
          : 'CAMERA_PTZ';

      const outputPort: PortDefinition = {
        id: `cam-out-${cam.id}`,
        name: `${cam.portType.replace('_', ' ')} Out`,
        type: cam.portType,
        direction: 'OUTPUT',
        maxBandwidthGbps: 18.0,
      };

      newNodes.push({
        id: camNodeId,
        type: 'deviceNode',
        position: { x: 60, y: 80 + idx * 190 },
        data: {
          id: camNodeId,
          category: 'SOURCE',
          deviceType: camDeviceType,
          label: cam.customAlias || cam.name,
          customModelName: `${cam.vendor} (${cam.name})`,
          stageZone: cam.stageZone,
          inputPorts: [],
          outputPorts: [outputPort],
          resolution: cam.resolution,
          refreshRateHz: cam.refreshRateHz,
          convergenceStatus: 'MATCHED',
        },
      });

      const cableType: PortType = cam.portType;
      const lengthM = cam.portType === 'WIRELESS' ? 15 : 5;
      const val = validateCableSignal(
        cam.resolution.width,
        cam.resolution.height,
        cam.refreshRateHz,
        8,
        cableType,
        lengthM
      );

      newEdges.push({
        id: `edge-fork-cam-${cam.id}`,
        source: camNodeId,
        target: 'forked-host-pc',
        sourceHandle: `cam-out-${cam.id}`,
        targetHandle: `host-in-cam-${cam.id}`,
        type: 'customCable',
        data: {
          id: `edge-fork-cam-${cam.id}`,
          sourceNodeId: camNodeId,
          sourcePortId: `cam-out-${cam.id}`,
          targetNodeId: 'forked-host-pc',
          targetPortId: `host-in-cam-${cam.id}`,
          cableType,
          lengthMeters: lengthM,
          calculatedBandwidthGbps: val.bandwidthGbps,
          status: val.status,
          warningMessage: val.message,
        },
      });
    });

    // 2. Create Sink Nodes for External Displays (on the right side)
    externalDisplays.forEach((disp, idx) => {
      const sinkNodeId = `forked-disp-${disp.id}`;
      const inputPort: PortDefinition = {
        id: `sink-in-${disp.id}`,
        name: `${disp.portType.replace('_', ' ')} In`,
        type: disp.portType as PortType,
        direction: 'INPUT',
        maxBandwidthGbps: 18.0,
      };

      const sinkX = cameras.length > 0 ? 880 : 580;

      newNodes.push({
        id: sinkNodeId,
        type: 'deviceNode',
        position: { x: sinkX, y: 80 + idx * 190 },
        data: {
          id: sinkNodeId,
          category: 'SINK',
          deviceType: disp.portType === 'WIRELESS' ? 'CONFIDENCE_MONITOR' : 'COMMERCIAL_TV',
          label: disp.customAlias,
          customModelName: `${disp.vendor} ${disp.model}`,
          stageZone: disp.stageZone,
          inputPorts: [inputPort],
          outputPorts: [],
          resolution: disp.activeResolution,
          refreshRateHz: disp.refreshRateHz,
          matchedLiveDisplayId: disp.id,
          convergenceStatus: 'MATCHED',
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

    set({
      nodes: newNodes,
      edges: newEdges,
      appMode: 'PLANNER',
      selectedElement: null,
      isDirty: true,
      projectName: `Forked_Live_Rig_${new Date().toISOString().split('T')[0]}`,
    });
  },

  loadSampleRig: () => {
    const serverNode: Node<DeviceNodeData> = {
      id: 'node-server-1',
      type: 'deviceNode',
      position: { x: 80, y: 150 },
      data: {
        id: 'node-server-1',
        category: 'SOURCE',
        deviceType: 'MEDIA_SERVER',
        label: 'FOH Media Server',
        customModelName: 'Custom RTX 4080 Rig (ProPresenter / Resolume)',
        stageZone: 'FOH Control Booth',
        inputPorts: [],
        outputPorts: [
          { id: 'p-out-1', name: 'DP 1.4 Out 1 (Main Wall)', type: 'DP_1_4', direction: 'OUTPUT', maxBandwidthGbps: 32.4 },
          { id: 'p-out-2', name: 'HDMI 2.0 Out 2 (Stage Aux)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-3', name: 'HDMI 2.0 Out 3 (Prompter)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
        ],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      },
    };

    const splitterNode: Node<DeviceNodeData> = {
      id: 'node-splitter-1',
      type: 'deviceNode',
      position: { x: 480, y: 180 },
      data: {
        id: 'node-splitter-1',
        category: 'DISTRIBUTION',
        deviceType: 'SPLITTER_1X4',
        label: '1x4 HDMI Distribution Amp',
        customModelName: 'Kramer VM-4H2 4K60',
        stageZone: 'FOH Rack 1',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI 2.0 In', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: [
          { id: 'p-out-1', name: 'Out 1 (Main Stage TV)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-2', name: 'Out 2 (Stage Left IMAG)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-3', name: 'Out 3 (Stage Right IMAG)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-out-4', name: 'Out 4 (DSM Confidence)', type: 'HDMI_2_0', direction: 'OUTPUT', maxBandwidthGbps: 18.0 },
        ],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      },
    };

    const mainTvNode: Node<DeviceNodeData> = {
      id: 'node-tv-1',
      type: 'deviceNode',
      position: { x: 880, y: 40 },
      data: {
        id: 'node-tv-1',
        category: 'SINK',
        deviceType: 'COMMERCIAL_TV',
        label: 'Main Stage Center TV',
        customModelName: 'Samsung 75" QM75B Pro 4K',
        stageZone: 'Upstage Center',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI In 1 (Primary)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
          { id: 'p-in-2', name: 'HDMI In 2 (Backup)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: [],
        resolution: { width: 3840, height: 2160 },
        refreshRateHz: 60,
      },
    };

    const sideTvNode: Node<DeviceNodeData> = {
      id: 'node-tv-2',
      type: 'deviceNode',
      position: { x: 880, y: 220 },
      data: {
        id: 'node-tv-2',
        category: 'SINK',
        deviceType: 'COMMERCIAL_TV',
        label: 'Stage Left IMAG TV',
        customModelName: 'Samsung 65" QM65B Pro 4K',
        stageZone: 'Stage Left',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI In 1 (Primary)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: [],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      },
    };

    const confidenceNode: Node<DeviceNodeData> = {
      id: 'node-conf-1',
      type: 'deviceNode',
      position: { x: 880, y: 400 },
      data: {
        id: 'node-conf-1',
        category: 'SINK',
        deviceType: 'CONFIDENCE_MONITOR',
        label: 'Pastor Confidence DSM',
        customModelName: 'LG 55" Commercial DSM',
        stageZone: 'Downstage Center',
        inputPorts: [
          { id: 'p-in-1', name: 'HDMI In 1 (Speaker Notes)', type: 'HDMI_2_0', direction: 'INPUT', maxBandwidthGbps: 18.0 },
        ],
        outputPorts: [],
        resolution: { width: 1920, height: 1080 },
        refreshRateHz: 60,
      },
    };

    const sampleEdges: Edge<CableEdgeData>[] = [
      {
        id: 'edge-1',
        source: 'node-server-1',
        target: 'node-splitter-1',
        sourceHandle: 'p-out-2',
        targetHandle: 'p-in-1',
        type: 'customCable',
        data: {
          id: 'edge-1',
          sourceNodeId: 'node-server-1',
          sourcePortId: 'p-out-2',
          targetNodeId: 'node-splitter-1',
          targetPortId: 'p-in-1',
          cableType: 'HDMI_2_0',
          lengthMeters: 5,
          calculatedBandwidthGbps: 4.5,
          status: 'VALID',
        },
      },
      {
        id: 'edge-2',
        source: 'node-splitter-1',
        target: 'node-tv-1',
        sourceHandle: 'p-out-1',
        targetHandle: 'p-in-1',
        type: 'customCable',
        data: {
          id: 'edge-2',
          sourceNodeId: 'node-splitter-1',
          sourcePortId: 'p-out-1',
          targetNodeId: 'node-tv-1',
          targetPortId: 'p-in-1',
          cableType: 'FIBER_HDMI',
          lengthMeters: 30,
          calculatedBandwidthGbps: 15.68,
          status: 'VALID',
        },
      },
      {
        id: 'edge-3',
        source: 'node-splitter-1',
        target: 'node-tv-2',
        sourceHandle: 'p-out-2',
        targetHandle: 'p-in-1',
        type: 'customCable',
        data: {
          id: 'edge-3',
          sourceNodeId: 'node-splitter-1',
          sourcePortId: 'p-out-2',
          targetNodeId: 'node-tv-2',
          targetPortId: 'p-in-1',
          cableType: 'HDBASET_CAT6',
          lengthMeters: 45,
          calculatedBandwidthGbps: 4.5,
          status: 'VALID',
        },
      },
      {
        id: 'edge-4',
        source: 'node-splitter-1',
        target: 'node-conf-1',
        sourceHandle: 'p-out-4',
        targetHandle: 'p-in-1',
        type: 'customCable',
        data: {
          id: 'edge-4',
          sourceNodeId: 'node-splitter-1',
          sourcePortId: 'p-out-4',
          targetNodeId: 'node-conf-1',
          targetPortId: 'p-in-1',
          cableType: 'HDMI_2_0',
          lengthMeters: 12,
          calculatedBandwidthGbps: 4.5,
          status: 'VALID',
        },
      },
    ];

    const rawNodes = [serverNode, splitterNode, mainTvNode, sideTvNode, confidenceNode];
    const converged = computeConvergence(rawNodes, get().liveDisplays);

    set({
      nodes: converged,
      edges: sampleEdges,
      selectedElement: null,
    });
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    const newEdgeId = `edge-${Date.now()}`;
    const sourceNode = get().nodes.find((n) => n.id === connection.source);
    const targetNode = get().nodes.find((n) => n.id === connection.target);

    const sourcePort = sourceNode?.data.outputPorts.find((p) => p.id === connection.sourceHandle);
    const cableType: PortType = sourcePort?.type || 'HDMI_2_0';

    const val = validateCableSignal(
      sourceNode?.data.resolution?.width || 1920,
      sourceNode?.data.resolution?.height || 1080,
      sourceNode?.data.refreshRateHz || 60,
      sourceNode?.data.colorDepthBits || 8,
      cableType,
      10
    );

    const newEdge: Edge<CableEdgeData> = {
      id: newEdgeId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'customCable',
      data: {
        id: newEdgeId,
        sourceNodeId: connection.source,
        sourcePortId: connection.sourceHandle || 'p-out-1',
        targetNodeId: connection.target,
        targetPortId: connection.targetHandle || 'p-in-1',
        cableType,
        lengthMeters: 10,
        calculatedBandwidthGbps: val.bandwidthGbps,
        status: val.status,
        warningMessage: val.message,
      },
    };

    set({
      edges: addEdge(newEdge, get().edges),
      selectedElement: { type: 'edge', id: newEdgeId },
    });
  },

  addDeviceNode: (type, pos = { x: 400, y: 250 }) => {
    const id = `node-${type.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const defaults = createDefaultPorts(type);

    const newNode: Node<DeviceNodeData> = {
      id,
      type: 'deviceNode',
      position: pos,
      data: {
        id,
        category: defaults.category,
        deviceType: type,
        label: defaults.label,
        customModelName: defaults.customModelName,
        stageZone: 'Stage Area',
        inputPorts: defaults.inputPorts,
        outputPorts: defaults.outputPorts,
        resolution: defaults.resolution,
        refreshRateHz: defaults.refreshRateHz,
        colorDepthBits: 8,
      },
    };

    const updatedNodes = computeConvergence([...get().nodes, newNode], get().liveDisplays);
    set({
      nodes: updatedNodes,
      selectedElement: { type: 'node', id },
    });
  },

  updateNodeData: (id, partial) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...partial },
          };
        }
        return node;
      }),
    });
  },

  updateEdgeData: (id, partial) => {
    set({
      edges: get().edges.map((edge) => {
        if (edge.id === id) {
          const updatedData = { ...edge.data, ...partial } as CableEdgeData;
          const sourceNode = get().nodes.find((n) => n.id === edge.source);
          const validation = validateCableSignal(
            sourceNode?.data.resolution?.width || 1920,
            sourceNode?.data.resolution?.height || 1080,
            sourceNode?.data.refreshRateHz || 60,
            sourceNode?.data.colorDepthBits || 8,
            updatedData.cableType,
            updatedData.lengthMeters
          );
          updatedData.calculatedBandwidthGbps = validation.bandwidthGbps;
          updatedData.status = validation.status;
          updatedData.warningMessage = validation.message;

          return {
            ...edge,
            data: updatedData,
          };
        }
        return edge;
      }),
    });
  },

  removeElement: (type, id) => {
    if (type === 'node') {
      const remainingNodes = get().nodes.filter((n) => n.id !== id);
      set({
        nodes: computeConvergence(remainingNodes, get().liveDisplays),
        edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        selectedElement: null,
      });
    } else {
      set({
        edges: get().edges.filter((e) => e.id !== id),
        selectedElement: null,
      });
    }
  },

  selectElement: (type, id) => {
    if (!type || !id) {
      set({ selectedElement: null });
    } else {
      set({ selectedElement: { type, id } });
    }
  },

  // Dynamic Port Management
  addInputPort: (nodeId, port) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const portIndex = node.data.inputPorts.length + 1;
          const newPort: PortDefinition = {
            id: `p-in-${Date.now().toString().slice(-4)}`,
            name: port.name || `HDMI In ${portIndex}`,
            type: port.type || 'HDMI_2_0',
            direction: 'INPUT',
            maxBandwidthGbps: port.maxBandwidthGbps || 18.0,
          };
          return {
            ...node,
            data: {
              ...node.data,
              inputPorts: [...node.data.inputPorts, newPort],
            },
          };
        }
        return node;
      }),
    });
  },

  removeInputPort: (nodeId, portId) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              inputPorts: node.data.inputPorts.filter((p) => p.id !== portId),
            },
          };
        }
        return node;
      }),
      edges: get().edges.filter((e) => e.target !== nodeId || e.targetHandle !== portId),
    });
  },

  addOutputPort: (nodeId, port) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const portIndex = node.data.outputPorts.length + 1;
          const newPort: PortDefinition = {
            id: `p-out-${Date.now().toString().slice(-4)}`,
            name: port.name || `Out ${portIndex}`,
            type: port.type || 'HDMI_2_0',
            direction: 'OUTPUT',
            maxBandwidthGbps: port.maxBandwidthGbps || 18.0,
          };
          return {
            ...node,
            data: {
              ...node.data,
              outputPorts: [...node.data.outputPorts, newPort],
            },
          };
        }
        return node;
      }),
    });
  },

  removeOutputPort: (nodeId, portId) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              outputPorts: node.data.outputPorts.filter((p) => p.id !== portId),
            },
          };
        }
        return node;
      }),
      edges: get().edges.filter((e) => e.source !== nodeId || e.sourceHandle !== portId),
    });
  },

  setSplitterMultiplier: (nodeId, count) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const newOutputs: PortDefinition[] = Array.from({ length: count }, (_, i) => ({
            id: `p-out-${i + 1}`,
            name: `Out ${i + 1}`,
            type: 'HDMI_2_0',
            direction: 'OUTPUT',
            maxBandwidthGbps: 18.0,
          }));
          return {
            ...node,
            data: {
              ...node.data,
              deviceType: `SPLITTER_1X${count}` as DeviceType,
              label: `1x${count} HDMI Distribution Amp`,
              outputPorts: newOutputs,
            },
          };
        }
        return node;
      }),
    });
  },

  setMatrixDimensions: (nodeId, inCount, outCount) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const newInputs: PortDefinition[] = Array.from({ length: inCount }, (_, i) => ({
            id: `p-in-${i + 1}`,
            name: `Input ${i + 1}`,
            type: 'HDMI_2_0',
            direction: 'INPUT',
            maxBandwidthGbps: 18.0,
          }));
          const newOutputs: PortDefinition[] = Array.from({ length: outCount }, (_, i) => ({
            id: `p-out-${i + 1}`,
            name: `Output ${i + 1}`,
            type: 'HDMI_2_0',
            direction: 'OUTPUT',
            maxBandwidthGbps: 18.0,
          }));
          return {
            ...node,
            data: {
              ...node.data,
              label: `${inCount}x${outCount} Matrix Router`,
              inputPorts: newInputs,
              outputPorts: newOutputs,
            },
          };
        }
        return node;
      }),
    });
  },

  setTVInputCount: (nodeId, count) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const newInputs: PortDefinition[] = Array.from({ length: count }, (_, i) => ({
            id: `p-in-${i + 1}`,
            name: i === 0 ? 'HDMI In 1 (Primary)' : i === 1 ? 'HDMI In 2 (Backup)' : `HDMI In ${i + 1}`,
            type: 'HDMI_2_0',
            direction: 'INPUT',
            maxBandwidthGbps: 18.0,
          }));
          return {
            ...node,
            data: {
              ...node.data,
              inputPorts: newInputs,
            },
          };
        }
        return node;
      }),
    });
  },

  updateEdgeCableType: (edgeId, cableType) => {
    get().updateEdgeData(edgeId, { cableType });
  },

  updateEdgeLength: (edgeId, lengthMeters) => {
    get().updateEdgeData(edgeId, { lengthMeters });
  },

  // Live Hardware & Convergence State
  liveDisplays: [],
  liveCameras: [],
  showHiddenCameras: false,
  cameraIngestModalOpen: false,
  activeFlashingDisplayId: null,
  activeTestPattern: null,
  activeTestDisplayId: null,
  reconciliationModalOpen: false,
  mobileModalOpen: false,
  audioConsentOpen: false,
  audioMonitoringAllowed: true,
  isLiveAudioActive: false,
  showCursorInPreviews: true,

  setShowHiddenCameras: (show) => set({ showHiddenCameras: show }),
  setCameraIngestModalOpen: (open) => set({ cameraIngestModalOpen: open }),
  setAudioConsentOpen: (open) => set({ audioConsentOpen: open }),
  setAudioMonitoringAllowed: (allowed) => set({ audioMonitoringAllowed: allowed }),
  setShowCursorInPreviews: (show) => set({ showCursorInPreviews: show }),

  toggleLiveFeed: (displayId) => {
    set({
      liveDisplays: get().liveDisplays.map((disp) => {
        if (disp.id === displayId) {
          const current = disp.isLiveFeedEnabled !== false;
          return { ...disp, isLiveFeedEnabled: !current };
        }
        return disp;
      }),
    });
  },

  setAllLiveFeeds: (enabled) => {
    set({
      liveDisplays: get().liveDisplays.map((disp) => ({
        ...disp,
        isLiveFeedEnabled: enabled,
      })),
    });
  },

  startSystemAudioCapture: async () => {
    if (wasapiAudioInterval) {
      clearInterval(wasapiAudioInterval);
      wasapiAudioInterval = null;
    }

    set({ isLiveAudioActive: true, audioMonitoringAllowed: true });

    // 100% Native Windows WASAPI Core Audio Peak Metering via Rust
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');

      wasapiAudioInterval = setInterval(async () => {
        if (!get().isLiveAudioActive) return;
        try {
          const peak: number = await invoke('get_system_audio_level');
          // Map linear peak (0.0 to 1.0) directly to decibels: silence if 0.0, otherwise 20*log10(peak)
          const db = peak <= 0.001 ? -60.0 : Math.max(-60.0, Math.min(0.0, 20 * Math.log10(peak * 1.5)));

          set({
            liveDisplays: get().liveDisplays.map((disp) => ({
              ...disp,
              audioLevelDb: db,
            })),
          });
        } catch {
          // Ignore polling errors
        }
      }, 40); // 25 FPS native audio peak query
    }
  },

  stopSystemAudioCapture: () => {
    if (wasapiAudioInterval) {
      clearInterval(wasapiAudioInterval);
      wasapiAudioInterval = null;
    }
    set({
      isLiveAudioActive: false,
      liveDisplays: get().liveDisplays.map((disp) => ({ ...disp, audioLevelDb: -60.0 })),
    });
  },

  flashDisplay: async (displayId) => {
    set({ activeFlashingDisplayId: displayId });
    const target = get().liveDisplays.find((d) => d.id === displayId);

    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ && target?.bounds) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const displayName = target.customAlias || target.name || `Screen ${target.osIndex}`;
        await invoke('trigger_flash', {
          displayId: `${displayName} (${target.activeResolution.width}x${target.activeResolution.height})`,
          x: target.bounds.x,
          y: target.bounds.y,
          width: target.bounds.width,
          height: target.bounds.height,
        });
      } catch (err) {
        console.warn('Native flash trigger fallback:', err);
      }
    }

    setTimeout(() => {
      if (get().activeFlashingDisplayId === displayId) {
        set({ activeFlashingDisplayId: null });
      }
    }, 8000);
  },

  setTestPattern: async (displayId, pattern) => {
    set({ activeTestDisplayId: displayId, activeTestPattern: pattern });
    const target = get().liveDisplays.find((d) => d.id === displayId);

    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        if (pattern && target?.bounds) {
          await invoke('show_test_pattern', {
            displayId,
            patternType: pattern,
            x: target.bounds.x,
            y: target.bounds.y,
            width: target.bounds.width,
            height: target.bounds.height,
          });
        } else {
          await invoke('close_test_pattern');
        }
      } catch (err) {
        console.warn('Native test pattern fallback:', err);
      }
    }
  },

  toggleDisplayFreeze: (displayId) => {
    set({
      liveDisplays: get().liveDisplays.map((disp) => {
        if (disp.id === displayId) {
          return { ...disp, isFrozen: !disp.isFrozen };
        }
        return disp;
      }),
    });
  },

  updateDisplayAlias: (displayId, alias) => {
    const updated = get().liveDisplays.map((disp) => {
      if (disp.id === displayId) {
        return { ...disp, customAlias: alias };
      }
      return disp;
    });
    set({ liveDisplays: updated });
    pushDisplaysToCompanion(updated);
  },

  updateDisplayStageZone: (displayId, zone) => {
    const updated = get().liveDisplays.map((disp) => {
      if (disp.id === displayId) {
        return { ...disp, stageZone: zone };
      }
      return disp;
    });
    set({ liveDisplays: updated });
    pushDisplaysToCompanion(updated);
  },

  refreshLiveCameras: async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        const currentCameras = get().liveCameras;

        // Load persisted preferences if available
        let savedPrefs: {
          hiddenIds?: string[];
          unhiddenIds?: string[];
          engagedIds?: string[];
          customAliases?: Record<string, string>;
          stageZones?: Record<string, string>;
        } = {};
        try {
          const raw = localStorage.getItem('xteon_camera_prefs');
          if (raw) savedPrefs = JSON.parse(raw);
        } catch (_) {}

        const mappedCameras: LiveCamera[] = videoInputs.map((device, idx) => {
          const id = device.deviceId || `cam-${idx + 1}`;
          const existing = currentCameras.find((c) => c.id === id);
          const rawLabel = device.label || (idx === 0 ? 'Integrated Webcam' : `External Camera ${idx + 1}`);
          const protocol = detectCameraProtocol(rawLabel);
          const category = classifyCameraDevice(rawLabel);

          // Default privacy: Internal webcams & Virtual bridges are hidden by default unless user unhid them
          let isHidden = category === 'INTERNAL_WEBCAM' || category === 'VIRTUAL_BRIDGE';
          if (existing?.isHidden !== undefined) {
            isHidden = existing.isHidden;
          } else if (savedPrefs.unhiddenIds?.includes(id)) {
            isHidden = false;
          } else if (savedPrefs.hiddenIds?.includes(id)) {
            isHidden = true;
          }

          // Default privacy: Standby (disabled live stream) by default for ALL cameras on discovery
          let isLiveFeedEnabled = false;
          if (existing?.isLiveFeedEnabled !== undefined) {
            isLiveFeedEnabled = existing.isLiveFeedEnabled;
          } else if (savedPrefs.engagedIds?.includes(id)) {
            isLiveFeedEnabled = true;
          }

          const defaultAlias = protocol.defaultAlias;
          const customAlias = existing?.customAlias || savedPrefs.customAliases?.[id] || defaultAlias;
          const stageZone =
            existing?.stageZone ||
            savedPrefs.stageZones?.[id] ||
            (protocol.portType === 'WIRELESS'
              ? 'Roaming Stage'
              : category === 'INTERNAL_WEBCAM'
              ? 'FOH Booth'
              : 'Stage Left');

          return {
            id,
            name: rawLabel,
            customAlias,
            stageZone,
            portType: protocol.portType,
            category,
            vendor: protocol.vendor,
            resolution: existing?.resolution || { width: 1920, height: 1080 },
            refreshRateHz: existing?.refreshRateHz || 60,
            status: 'ONLINE',
            isFrozen: existing?.isFrozen || false,
            isLiveFeedEnabled,
            isHidden,
            isMuted: existing?.isMuted || false,
          };
        });

        set({ liveCameras: mappedCameras });
      }
    } catch (e) {
      console.warn('Live camera query error:', e);
    }
  },

  toggleCameraLiveFeed: (cameraId: string) => {
    const updated = get().liveCameras.map((cam) => {
      if (cam.id === cameraId) {
        return { ...cam, isLiveFeedEnabled: !cam.isLiveFeedEnabled };
      }
      return cam;
    });
    set({ liveCameras: updated });

    // Persist engaged preferences
    try {
      const engagedIds = updated.filter((c) => c.isLiveFeedEnabled).map((c) => c.id);
      const raw = localStorage.getItem('xteon_camera_prefs') || '{}';
      const parsed = JSON.parse(raw);
      localStorage.setItem('xteon_camera_prefs', JSON.stringify({ ...parsed, engagedIds }));
    } catch (_) {}
  },

  toggleCameraFreeze: (cameraId: string) => {
    set({
      liveCameras: get().liveCameras.map((cam) => {
        if (cam.id === cameraId) {
          return { ...cam, isFrozen: !cam.isFrozen };
        }
        return cam;
      }),
    });
  },

  toggleHideCamera: (cameraId: string) => {
    const updated = get().liveCameras.map((cam) => {
      if (cam.id === cameraId) {
        const nextHidden = !cam.isHidden;
        // If hiding, also shut down stream to free camera hardware & turn off LED
        return {
          ...cam,
          isHidden: nextHidden,
          isLiveFeedEnabled: nextHidden ? false : cam.isLiveFeedEnabled,
        };
      }
      return cam;
    });
    set({ liveCameras: updated });

    // Persist hidden preferences
    try {
      const hiddenIds = updated.filter((c) => c.isHidden).map((c) => c.id);
      const unhiddenIds = updated.filter((c) => !c.isHidden).map((c) => c.id);
      const raw = localStorage.getItem('xteon_camera_prefs') || '{}';
      const parsed = JSON.parse(raw);
      localStorage.setItem('xteon_camera_prefs', JSON.stringify({ ...parsed, hiddenIds, unhiddenIds }));
    } catch (_) {}
  },

  toggleMuteCamera: (cameraId: string) => {
    set({
      liveCameras: get().liveCameras.map((cam) => {
        if (cam.id === cameraId) {
          return { ...cam, isMuted: !cam.isMuted };
        }
        return cam;
      }),
    });
  },

  unhideAllCameras: () => {
    const updated = get().liveCameras.map((cam) => ({ ...cam, isHidden: false }));
    set({ liveCameras: updated });
    try {
      const raw = localStorage.getItem('xteon_camera_prefs') || '{}';
      const parsed = JSON.parse(raw);
      localStorage.setItem('xteon_camera_prefs', JSON.stringify({ ...parsed, hiddenIds: [] }));
    } catch (_) {}
  },

  engageAllProCameras: () => {
    const updated = get().liveCameras.map((cam) => {
      if (cam.category === 'EXTERNAL_PRO' && !cam.isHidden) {
        return { ...cam, isLiveFeedEnabled: true };
      }
      return cam;
    });
    set({ liveCameras: updated });
  },

  disengageAllCameras: () => {
    const updated = get().liveCameras.map((cam) => ({ ...cam, isLiveFeedEnabled: false }));
    set({ liveCameras: updated });
  },

  setCameraCategory: (cameraId: string, category: CameraCategory) => {
    set({
      liveCameras: get().liveCameras.map((cam) => {
        if (cam.id === cameraId) {
          return { ...cam, category };
        }
        return cam;
      }),
    });
  },

  updateCameraAlias: (cameraId: string, alias: string) => {
    const updated = get().liveCameras.map((cam) => {
      if (cam.id === cameraId) {
        return { ...cam, customAlias: alias };
      }
      return cam;
    });
    set({ liveCameras: updated });

    try {
      const raw = localStorage.getItem('xteon_camera_prefs') || '{}';
      const parsed = JSON.parse(raw);
      const customAliases = parsed.customAliases || {};
      customAliases[cameraId] = alias;
      localStorage.setItem('xteon_camera_prefs', JSON.stringify({ ...parsed, customAliases }));
    } catch (_) {}
  },

  updateCameraStageZone: (cameraId: string, zone: string) => {
    const updated = get().liveCameras.map((cam) => {
      if (cam.id === cameraId) {
        return { ...cam, stageZone: zone };
      }
      return cam;
    });
    set({ liveCameras: updated });

    try {
      const raw = localStorage.getItem('xteon_camera_prefs') || '{}';
      const parsed = JSON.parse(raw);
      const stageZones = parsed.stageZones || {};
      stageZones[cameraId] = zone;
      localStorage.setItem('xteon_camera_prefs', JSON.stringify({ ...parsed, stageZones }));
    } catch (_) {}
  },

  resetCameraToDefault: (cameraId: string) => {
    set({
      liveCameras: get().liveCameras.map((cam) => {
        if (cam.id === cameraId) {
          const protocol = detectCameraProtocol(cam.name);
          const category = classifyCameraDevice(cam.name);
          return {
            ...cam,
            category,
            customAlias: protocol.defaultAlias,
            stageZone:
              protocol.portType === 'WIRELESS'
                ? 'Roaming Stage'
                : category === 'INTERNAL_WEBCAM'
                ? 'FOH Booth'
                : 'Stage Left',
            isHidden: category === 'INTERNAL_WEBCAM' || category === 'VIRTUAL_BRIDGE',
          };
        }
        return cam;
      }),
    });
  },

  setReconciliationModalOpen: (open) => set({ reconciliationModalOpen: open }),
  setMobileModalOpen: (open) => set({ mobileModalOpen: open }),

  refreshLiveDisplays: async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const realDisplays: any = await invoke('get_connected_displays');
        if (realDisplays && realDisplays.length > 0) {
          const currentDisplays = get().liveDisplays;
          // Sort displays: Primary screen first, then external/wireless displays sequentially
          const sorted = [...realDisplays].sort((a: any, b: any) => {
            const aIsPrimary = a.os_index === 1 || a.name?.toLowerCase().includes('primary') || a.id?.includes('1');
            const bIsPrimary = b.os_index === 1 || b.name?.toLowerCase().includes('primary') || b.id?.includes('1');
            if (aIsPrimary && !bIsPrimary) return -1;
            if (!aIsPrimary && bIsPrimary) return 1;
            return (a.os_index || 0) - (b.os_index || 0);
          });

          const mappedDisplays: LiveDisplay[] = sorted.map((d: any, idx: number) => {
            const existing = currentDisplays.find((c) => c.id === d.id);
            const isPrimary = idx === 0 || d.os_index === 1;
            const defaultAlias = isPrimary
              ? 'Host Workstation Primary Screen'
              : d.port_type === 'WIRELESS'
              ? 'Wireless Screen / Phone'
              : `External Display ${idx + 1}`;

            return {
              id: d.id,
              osIndex: idx + 1, // Normalized clean sequential index (1, 2, 3...)
              name: d.name,
              customAlias: existing?.customAlias || defaultAlias,
              stageZone: existing?.stageZone || (isPrimary ? 'FOH Control Booth' : 'Stage Area'),
              portType: d.port_type as any,
              vendor: d.vendor,
              model: d.model,
              serial: d.serial,
              activeResolution: { width: d.width, height: d.height },
              nativeResolution: { width: d.width, height: d.height },
              refreshRateHz: d.refresh_rate_hz,
              isHdr: d.is_hdr,
              colorSpace: d.color_space,
              audioLevelDb: existing?.audioLevelDb || -60.0,
              status: d.status as any,
              bounds: d.bounds
                ? {
                    x: d.bounds.x,
                    y: d.bounds.y,
                    width: d.bounds.width,
                    height: d.bounds.height,
                  }
                : undefined,
              isFrozen: existing?.isFrozen || false,
              isLiveFeedEnabled: existing?.isLiveFeedEnabled !== false,
            };
          });

          // Compute continuous convergence match between plan & real displays
          const convergedNodes = computeConvergence(get().nodes, mappedDisplays);

          set({
            liveDisplays: mappedDisplays,
            nodes: convergedNodes,
          });

          pushDisplaysToCompanion(mappedDisplays);
        }
      }
    } catch (e) {
      console.warn('Tauri hardware query fallback:', e);
    }
  },

  pollLiveThumbnails: async () => {
    if (isCapturingInProgress || (get().appMode !== 'LIVE' && get().appMode !== 'LIVE_MAP')) return;
    isCapturingInProgress = true;

    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const displays = get().liveDisplays;
        const targets = displays
          .filter((d) => d.bounds && !d.isFrozen && d.isLiveFeedEnabled !== false)
          .map((d) => ({
            id: d.id,
            x: d.bounds!.x,
            y: d.bounds!.y,
            width: d.bounds!.width,
            height: d.bounds!.height,
          }));

        if (targets.length > 0) {
          const results: Array<{ id: string; image_url: string }> = await invoke('capture_all_screens', {
            targets,
            showCursor: get().showCursorInPreviews,
          });

          if (results && results.length > 0) {
            const frameMap = new Map(results.map((r) => [r.id, r.image_url]));
            set({
              liveDisplays: get().liveDisplays.map((d) => {
                const img = frameMap.get(d.id);
                return img ? { ...d, liveThumbnailUrl: img } : d;
              }),
            });
          }
        }
      }
    } catch (e) {
      // Ignore capture errors
    } finally {
      isCapturingInProgress = false;
    }
  },

  exportProject: () => {
    return {
      version: '1.2.0',
      meta: {
        projectName: 'Xteon Staging Rig Plan',
        venue: 'Main Stage',
        author: 'Technical Director',
        date: new Date().toISOString(),
      },
      nodes: get().nodes.map((n) => ({
        id: n.id,
        type: n.type || 'deviceNode',
        position: n.position,
        data: n.data,
      })),
      edges: get().edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        data: e.data as CableEdgeData,
      })),
    };
  },

  importProject: (proj) => {
    if (proj && proj.nodes && proj.edges) {
      const converged = computeConvergence(proj.nodes as any, get().liveDisplays);
      set({
        nodes: converged,
        edges: proj.edges as any,
        selectedElement: null,
      });
    }
  },
}));

// Automatically query real hardware displays and cameras on load and start live thumbnail capture loop
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useRigStore.getState().refreshLiveDisplays().then(() => {
      useRigStore.getState().pollLiveThumbnails();
    });
    useRigStore.getState().refreshLiveCameras();
  }, 100);

  // Listen for hardware camera hotplug events (plugging in USB webcam or connecting Iriun phone)
  if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', () => {
      useRigStore.getState().refreshLiveCameras();
    });
  }

  // High-Speed 50ms polling loop (~20 FPS) for zero-lag mouse tracking
  setInterval(() => {
    useRigStore.getState().pollLiveThumbnails();
  }, 50);
}
