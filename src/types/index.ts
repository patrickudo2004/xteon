export type AppMode = 'PLANNER' | 'LIVE_MAP' | 'LIVE' | 'STAGE_DISPLAYS';
export type ThemeMode = 'DARK_FOH' | 'DAYLIGHT' | 'BROADCAST';

export type PortType = 
  | 'INTERNAL_DISPLAY'
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

export interface BranchedDownstreamDisplay {
  id: string;
  name: string;
  customAlias: string;
  stageZone: string;
  portType: PortType;
  cableLengthMeters: number;
  notes?: string;
}

export interface VirtualDistributionBranch {
  parentDisplayId: string;
  splitterType: 'SPLITTER_1X2' | 'SPLITTER_1X4' | 'SPLITTER_1X8' | 'HDBASET_EXTENDER';
  splitterModel: string;
  cableMedium: 'DIRECT_HDMI' | 'CAT6_HDBASET' | 'OPTICAL_FIBER';
  downstreamDisplays: BranchedDownstreamDisplay[];
  enabled: boolean;
}

export interface AppSettings {
  audioGuardEnabled: boolean;
  audioGuardMode: 'NOTIFY' | 'STRICT_LOCK';
  antiDimmingHeartbeatEnabled: boolean;
  windowGuardianEnabled: boolean;
  broadcastTelemetryWarnings: boolean;
  alertOnDisplayMirroring?: boolean;
  previewFps: number;
  protectInternalCameras: boolean;
  presentationKeepAwake: boolean;
  companionPort: number;
  companionPin: string;
  companionPinLockEnabled?: boolean;
  oscEnabled?: boolean;
  oscPort?: number;
  propresenterSyncEnabled?: boolean;
  propresenterHost?: string;
  propresenterPort?: number;
  obsWebSocketEnabled?: boolean;
}

export type EventLogLevel = 'INFO' | 'WARN' | 'CRITICAL';
export type EventLogCategory = 'DISPLAY' | 'AUDIO' | 'CAMERA' | 'SYSTEM' | 'SECURITY' | 'SAFETY' | 'BRANCH';

export interface ShowEventLogEntry {
  id: string;
  timestamp: string;
  category: EventLogCategory;
  level: EventLogLevel;
  severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  details?: string;
}

export interface EventLogInput {
  category: EventLogCategory;
  level?: EventLogLevel;
  severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  details?: string;
}


export interface NetworkAdapterInfo {
  name: string;
  ip: string;
  kind: 'WIFI' | 'HOTSPOT' | 'USB_TETHER' | 'ETHERNET' | 'VIRTUAL' | string;
  is_preferred: boolean;
}

export interface CompanionServerStatus {
  is_running: boolean;
  port: number;
  companion_port?: number;
  host: string;
  interfaces: NetworkAdapterInfo[];
  active_pin: string;
  session_token: string;
  pin_lock_enabled: boolean;
  client_count: number;
}

export interface CapturableWindow {
  hwnd_id: string;
  title: string;
  process_name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  is_minimized: boolean;
  is_maximized: boolean;
  is_borderless_snapped: boolean;
  is_pinned_stage: boolean;
  is_xteon_self: boolean;
  display_id?: string | null;
  display_os_index?: number | null;
  thumbnail_data_url?: string | null;
}

export interface StageWhisperPayload {
  id: string;
  message: string;
  tone: 'INFO' | 'WARN' | 'CRITICAL';
  created_at_ms: number;
  expires_at_ms?: number | null;
}

export type StageLinkSourceMode = 'WINDOW' | 'DISPLAY' | 'SPLIT';
export type StageSplitLayout = 'SIDE_70_30' | 'SIDE_50_50' | 'TOP_BOTTOM' | 'PIP_CORNER';

export interface StageLinkSlot {
  id: string;
  name: string;
  stage_zone: string;
  source_mode: StageLinkSourceMode;
  primary_source_id: string;
  primary_source_label: string;
  secondary_source_id?: string | null;
  secondary_source_label?: string | null;
  split_layout: StageSplitLayout;
  target_fps: number;
  max_width: number;
  jpeg_quality: number;
  is_frozen: boolean;
  is_blackout: boolean;
  is_flashing: boolean;
  active_whisper?: StageWhisperPayload | null;
  connected_clients: number;
  source_minimized: boolean;
  source_missing: boolean;
  live_fps: number;
  last_frame_kb: number;
  preview_data_url?: string | null;
}

export interface UpsertStageSlotInput {
  id?: string;
  name: string;
  stage_zone: string;
  source_mode: StageLinkSourceMode;
  primary_source_id: string;
  primary_source_label: string;
  secondary_source_id?: string | null;
  secondary_source_label?: string | null;
  split_layout?: StageSplitLayout;
  target_fps?: number;
  max_width?: number;
}

export interface ConnectedReceiver {
  clientId: string;
  deviceLabel: string;
  ip: string;
  connectionType: 'WIFI' | 'USB_TETHER' | 'ETHERNET' | 'DIRECT';
  fps: number;
  latencyMs: number;
  feedName: string;
  connectedAt: string;
  isFlashing?: boolean;
}

export interface VirtualDriverStatus {
  is_installed: boolean;
  is_active: boolean;
  display_count: number;
  message: string;
}

