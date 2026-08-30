export type AppMode = 'PLANNER' | 'LIVE_MAP' | 'LIVE';
export type ThemeMode = 'DARK_FOH' | 'DAYLIGHT' | 'BROADCAST';

export type PortType = 
  | 'HDMI_2_0' 
  | 'HDMI_2_1' 
  | 'DP_1_4' 
  | 'DP_2_0' 
  | 'SDI_3G' 
  | 'SDI_12G' 
  | 'HDBASET_CAT6' 
  | 'FIBER_HDMI' 
  | 'USB_C_DP' 
  | 'NDI_GBE' 
  | 'WIRELESS'
  | 'VIRTUAL'
  | 'VGA_LEGACY';

export interface PortDefinition {
  id: string;
  name: string;
  type: PortType;
  direction: 'INPUT' | 'OUTPUT';
  maxBandwidthGbps: number;
  connectedEdgeId?: string;
}

export type DeviceCategory = 'SOURCE' | 'SWITCHER' | 'DISTRIBUTION' | 'CONVERTER' | 'PROCESSOR' | 'SINK';

export type DeviceType = 
  // Sources
  | 'LAPTOP'
  | 'MEDIA_SERVER'
  | 'CAMERA_SDI'
  | 'CAMERA_PTZ'
  | 'PLAYBACK_RECORDER'
  | 'WIRELESS_GATEWAY'
  // Switchers
  | 'SEAMLESS_SWITCHER'
  | 'PRODUCTION_SWITCHER'
  | 'MATRIX_4X4'
  | 'MATRIX_8X8'
  | 'MATRIX_16X16'
  // Distribution & Converters
  | 'SPLITTER_1X2'
  | 'SPLITTER_1X4'
  | 'SPLITTER_1X8'
  | 'SPLITTER_1X16'
  | 'DECIMATOR_MD_HX'
  | 'DECIMATOR_12G_CROSS'
  | 'BLACKMAGIC_MICRO'
  | 'HDBASET_TX'
  | 'HDBASET_RX'
  | 'FIBER_TRANSCEIVER'
  | 'WIRELESS_VIDEO_TX'
  // Processors
  | 'NOVASTAR_VX4S'
  | 'NOVASTAR_MCTRL4K'
  | 'NOVASTAR_MX40_PRO'
  | 'BROMPTON_S8'
  | 'BROMPTON_SX40'
  | 'DATAPATH_FX4'
  // Sinks
  | 'COMMERCIAL_TV'
  | 'LED_WALL'
  | 'PROJECTOR'
  | 'CONFIDENCE_MONITOR'
  | 'FOYER_DISPLAY'
  | 'STUDIO_MULTIVIEW'
  | 'STREAMING_ENCODER';

export interface LEDWallParams {
  cabinetPitchMm: number; // e.g. 2.6, 2.97, 3.91
  cabinetWidthPx: number; // e.g. 192, 168, 128
  cabinetHeightPx: number;
  gridColumns: number;
  gridRows: number;
  totalWidthMm: number;
  totalHeightMm: number;
  totalPixels: number;
  requiredPorts: number;
}

export interface DeviceNodeData {
  id: string;
  category: DeviceCategory;
  deviceType: DeviceType;
  label: string;
  customModelName: string;
  stageZone: string;
  inputPorts: PortDefinition[];
  outputPorts: PortDefinition[];
  resolution?: { width: number; height: number };
  refreshRateHz?: number;
  colorDepthBits?: number;
  ledParams?: LEDWallParams;
  notes?: string;
  matchedLiveDisplayId?: string;
  convergenceStatus?: 'UNLINKED' | 'MATCHED' | 'MISMATCH_RES' | 'STANDBY';
  [key: string]: unknown;
}

export interface CableEdgeData {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  cableType: PortType;
  lengthMeters: number;
  calculatedBandwidthGbps: number;
  status: 'VALID' | 'WARNING_DISTANCE' | 'ERROR_BANDWIDTH';
  warningMessage?: string;
  [key: string]: unknown;
}

export interface LiveDisplay {
  id: string;
  osIndex: number;
  name: string;
  customAlias: string;
  stageZone: string;
  portType: PortType;
  vendor: string;
  model: string;
  serial: string;
  activeResolution: { width: number; height: number };
  nativeResolution: { width: number; height: number };
  refreshRateHz: number;
  isHdr: boolean;
  colorSpace: string;
  bounds?: { x: number; y: number; width: number; height: number };
  liveThumbnailUrl?: string;
  audioLevelDb: number; // -60 to 0
  status: 'ONLINE' | 'STANDBY' | 'DISCONNECTED';
  isFrozen: boolean;
  isLiveFeedEnabled?: boolean;
}

export type CameraCategory = 'EXTERNAL_PRO' | 'INTERNAL_WEBCAM' | 'VIRTUAL_BRIDGE';

export interface LiveCamera {
  id: string; // MediaDeviceInfo deviceId
  name: string; // Hardware name / label e.g. "Iriun Webcam"
  customAlias: string; // User alias e.g. "Pastor Center Stage Cam"
  stageZone: string; // e.g. "Auditorium Back"
  portType: PortType; // 'WIRELESS', 'USB_C_DP', 'SDI_3G', 'HDMI_2_0', 'NDI_GBE'
  category: CameraCategory;
  vendor: string;
  resolution: { width: number; height: number };
  refreshRateHz: number;
  status: 'ONLINE' | 'STANDBY' | 'DISCONNECTED';
  isFrozen: boolean;
  isLiveFeedEnabled?: boolean;
  isHidden?: boolean;
  isMuted?: boolean;
}

export interface RigProject {
  version: string;
  meta: {
    projectName: string;
    venue: string;
    author: string;
    date: string;
    notes?: string;
  };
  nodes: {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: DeviceNodeData;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    data: CableEdgeData;
  }[];
}

export interface BandwidthValidation {
  bandwidthGbps: number;
  maxPortGbps: number;
  maxDistanceMeters: number;
  status: 'VALID' | 'WARNING_DISTANCE' | 'ERROR_BANDWIDTH';
  message: string;
}
