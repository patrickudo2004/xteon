import React, { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  Node,
  Edge,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
// Note: @xyflow/react/dist/style.css is imported globally in src/index.css per GEMINI.md
import { useRigStore } from '../../store/useRigStore';
import { getPortIcon } from '../common/SvgIcons';
import { LiveMapInspector } from './LiveMapInspector';
import { FloatingPanelWrapper } from '../common/FloatingPanelWrapper';
import {
  Cpu,
  Monitor,
  Zap,
  Radio,
  Wifi,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Activity,
  Laptop,
  RotateCcw,
  Camera,
  PanelRightOpen,
  Split,
  Tv,
} from 'lucide-react';

// Custom Live Camera Source Node Component
const LiveCameraNode: React.FC<{ data: any }> = ({ data }) => {
  const { selectLiveElement, toggleCameraFreeze } = useRigStore();
  const camera = data.camera;
  if (!camera) return null;

  const isWireless = camera.portType === 'WIRELESS';

  return (
    <div
      onClick={() => selectLiveElement('node', `cam-node-${camera.id}`)}
      className="w-80 rounded-2xl bg-[var(--bg-card)] border-2 border-amber-500/70 shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none relative cursor-pointer hover:border-amber-400 transition"
    >
      {/* Node Header */}
      <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isWireless ? (
            <Wifi className="w-4 h-4 text-amber-400 animate-pulse" />
          ) : (
            <Camera className="w-4 h-4 text-amber-400" />
          )}
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            {camera.customAlias || camera.name}
          </span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase border bg-amber-500/20 text-amber-400 border-amber-500/40">
          {camera.portType.replace('_', ' ')}
        </span>
      </div>

      {/* Node Body */}
      <div className="p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs">
          <div className="text-[var(--text-muted)] truncate max-w-[170px]">{camera.vendor}</div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)]">
            📍 {camera.stageZone}
          </span>
        </div>

        {/* Live Signal Telemetry */}
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>SIGNAL LOCKED</span>
          </div>
          <span className="text-[10px] text-amber-300 font-bold">
            {camera.resolution.width}x{camera.resolution.height}
          </span>
        </div>

        <div className="text-[10px] text-[var(--text-muted)] truncate">
          {camera.name}
        </div>
      </div>

      {/* Source Output Handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        id={`cam-out-${camera.id}`}
        className="!bg-amber-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
        style={{ right: -7 }}
      />
    </div>
  );
};

// Custom Unified Host Workstation Node Component (PC + Primary Screen Built-In)
const LiveHostNode: React.FC<{ data: any }> = ({ data }) => {
  const { flashDisplay, setTestPattern, selectLiveElement } = useRigStore();
  const primaryDisplay = data.primaryDisplay;
  const externalDisplays = data.externalDisplays || [];
  const cameras = data.cameras || [];

  return (
    <div
      onClick={() => primaryDisplay && selectLiveElement('node', primaryDisplay.id)}
      className="w-96 rounded-2xl bg-[var(--bg-card)] border-2 border-cyan-500/70 shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none cursor-pointer hover:border-cyan-400 transition relative"
    >
      {/* Target Input Handles from Cameras on the left */}
      {cameras.map((cam: any) => (
        <Handle
          key={cam.id}
          type="target"
          position={Position.Left}
          id={`in-cam-${cam.id}`}
          className="!bg-amber-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
          style={{ left: -7 }}
        />
      ))}

      {/* Node Header */}
      <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
            <Laptop className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs tracking-wide text-cyan-300 uppercase font-mono">
              HOST WORKSTATION & PRIMARY SCREEN
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              Local Operating System & GPU Hub
            </div>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ACTIVE</span>
        </div>
      </div>

      {/* Built-in Primary Screen Details */}
      <div className="p-4 space-y-3 font-mono">
        {primaryDisplay ? (
          <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>Screen 1: {primaryDisplay.customAlias || primaryDisplay.name}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
                PRIMARY
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
              <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]">
                {primaryDisplay.activeResolution.width}x{primaryDisplay.activeResolution.height} @ {primaryDisplay.refreshRateHz}Hz
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]">
                📍 {primaryDisplay.stageZone}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  flashDisplay(primaryDisplay.id);
                }}
                className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Flash Screen</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTestPattern(primaryDisplay.id, 'smpte');
                }}
                className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Pattern</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[var(--text-muted)] italic">Primary screen detecting...</div>
        )}

        {/* Camera Ingest Ports */}
        {cameras.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
              <span>Camera Video Ingests ({cameras.length})</span>
              <span className="text-amber-400">Capture Input</span>
            </div>

            {cameras.map((cam: any) => (
              <div
                key={cam.id}
                className="relative flex items-center justify-between bg-[var(--bg-subcard)] px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs"
              >
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-[11px] truncate max-w-[190px]">
                    From {cam.customAlias || cam.name}
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold">{cam.portType}</span>
              </div>
            ))}
          </div>
        )}

        {/* Output Ports Connecting to External Displays */}
        {externalDisplays.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
              <span>Connected Video Ports ({externalDisplays.length})</span>
              <span className="text-cyan-400">GPU Output</span>
            </div>

            {externalDisplays.map((disp: any) => (
              <div
                key={disp.id}
                className="relative flex items-center justify-between bg-[var(--bg-subcard)] px-3 py-2 rounded-lg border border-[var(--border-color)] text-xs"
              >
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  {getPortIcon(disp.portType, 'w-3.5 h-3.5')}
                  <span className="font-medium text-[11px] truncate max-w-[190px]">
                    To {disp.customAlias || disp.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold">
                  <span>{disp.portType}</span>
                </div>

                {/* ReactFlow Source Handle on the right */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`out-${disp.id}`}
                  className="!bg-cyan-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
                  style={{ right: -7 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Custom External Display Node Component
const LiveDisplayNode: React.FC<{ data: any }> = ({ data }) => {
  const { flashDisplay, setTestPattern, selectLiveElement } = useRigStore();
  const display = data.display;
  if (!display) return null;

  const isWireless = display.portType === 'WIRELESS';

  return (
    <div
      onClick={() => selectLiveElement('node', `disp-node-${display.id}`)}
      className="w-80 rounded-2xl bg-[var(--bg-card)] border-2 border-blue-500/60 shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none relative cursor-pointer hover:border-cyan-400 transition"
    >
      {/* Target Input Handle from Host PC on the left */}
      <Handle
        type="target"
        position={Position.Left}
        id={`in-${display.id}`}
        className="!bg-cyan-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
        style={{ left: -7 }}
      />

      {/* Outgoing Handle to Splitter if branched */}
      {data.hasBranch && (
        <Handle
          type="source"
          position={Position.Right}
          id={`out-branch-${display.id}`}
          className="!bg-amber-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
          style={{ right: -7 }}
        />
      )}

      {/* Card Header */}
      <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isWireless ? (
            <Wifi className="w-4 h-4 text-amber-400 animate-pulse" />
          ) : (
            <Monitor className="w-4 h-4 text-blue-400" />
          )}
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Screen {display.osIndex}: {isWireless ? 'Wireless Screen' : 'External Display'}
          </span>
        </div>
        <span
          className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
            isWireless
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
          }`}
        >
          {display.portType}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs">
          <div className="text-[var(--text-primary)] font-bold truncate max-w-[170px]">
            {display.customAlias || display.name}
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)]">
            📍 {display.stageZone}
          </span>
        </div>

        <div className="text-[11px] text-[var(--text-muted)]">
          {display.vendor} {display.model}
        </div>

        {/* Live Signal Telemetry */}
        <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SIGNAL LOCKED</span>
          </div>
          <span className="text-[10px] text-emerald-300 font-bold">60.00 FPS</span>
        </div>

        {/* Virtual Splitter Badge */}
        {data.hasBranch && data.branch && (
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold truncate max-w-[190px]">
              <Split className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{data.branch.splitterModel}</span>
            </div>
            <span className="text-[10px] text-amber-300 font-bold shrink-0">
              {data.branch.downstreamDisplays.length} TVs
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              flashDisplay(display.id);
            }}
            className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Flash Screen</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setTestPattern(display.id, 'smpte');
            }}
            className="py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Test Pattern</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Virtual Splitter / Distribution Amplifier Node Component
const LiveSplitterNode: React.FC<{ data: any }> = ({ data }) => {
  const { openBranchModal } = useRigStore();
  const branch = data.branch;
  if (!branch) return null;

  return (
    <div
      onClick={() => openBranchModal(branch.parentDisplayId)}
      className="w-72 rounded-2xl bg-[var(--bg-card)] border-2 border-amber-500/80 shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none relative cursor-pointer hover:border-amber-400 transition"
    >
      <Handle
        type="target"
        position={Position.Left}
        id={`in-splitter-${branch.parentDisplayId}`}
        className="!bg-amber-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
        style={{ left: -7 }}
      />

      <div className="p-3 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Split className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            {branch.splitterType.replace('_', ' ')}
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border bg-amber-500/20 text-amber-400 border-amber-500/40">
          SPLITTER / DA
        </span>
      </div>

      <div className="p-3.5 space-y-2 font-mono">
        <div className="font-bold text-xs text-[var(--text-primary)] truncate">
          {branch.splitterModel}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
          <span>Medium: {branch.cableMedium.replace('_', ' ')}</span>
          <span className="text-amber-400 font-bold">{branch.downstreamDisplays.length} Outputs</span>
        </div>
        <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-[10px] text-amber-300">
          <span>1 IN ➔ {branch.downstreamDisplays.length} OUT ACTIVE</span>
        </div>
      </div>

      {branch.downstreamDisplays.map((tv: any, i: number) => (
        <Handle
          key={tv.id}
          type="source"
          position={Position.Right}
          id={`out-tv-${tv.id}`}
          className="!bg-amber-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
          style={{ right: -7, top: `${((i + 1) / (branch.downstreamDisplays.length + 1)) * 100}%` }}
        />
      ))}
    </div>
  );
};

// Custom Branched Downstream Display Node Component
const LiveDownstreamDisplayNode: React.FC<{ data: any }> = ({ data }) => {
  const { flashDisplay, openTestPatternModal } = useRigStore();
  const tv = data.tv;
  const parentDisplay = data.parentDisplay;
  if (!tv) return null;

  return (
    <div className="w-72 rounded-2xl bg-[var(--bg-card)] border-2 border-cyan-500/70 shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none relative">
      <Handle
        type="target"
        position={Position.Left}
        id={`in-downstream-${tv.id}`}
        className="!bg-cyan-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
        style={{ left: -7 }}
      />

      <div className="p-3 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] truncate max-w-[150px]">
            {tv.customAlias || tv.name}
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border bg-cyan-500/20 text-cyan-400 border-cyan-500/40">
          BRANCH TV
        </span>
      </div>

      <div className="p-3.5 space-y-2.5 font-mono">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-muted)]">Stage Zone:</span>
          <span className="font-bold text-[var(--text-primary)]">📍 {tv.stageZone}</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-muted)]">Cable Run:</span>
          <span className="font-bold text-amber-300">📏 {tv.cableLengthMeters}m ({tv.portType.replace('_', ' ')})</span>
        </div>

        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[10px] text-emerald-300">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>MIRRORED SIGNAL</span>
          </div>
          <span className="text-[9px] text-[var(--text-muted)]">60.00 FPS</span>
        </div>

        {/* Action triggers */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={() => parentDisplay && flashDisplay(parentDisplay.id)}
            className="py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Flash</span>
          </button>
          <button
            onClick={() => parentDisplay && openTestPatternModal(parentDisplay.id)}
            className="py-1 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Pattern</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  liveCameraNode: LiveCameraNode,
  liveHostNode: LiveHostNode,
  liveDisplayNode: LiveDisplayNode,
  liveSplitterNode: LiveSplitterNode,
  liveDownstreamNode: LiveDownstreamDisplayNode,
};

export const LiveMapCanvas: React.FC = () => {
  const {
    liveDisplays,
    liveCameras,
    refreshLiveDisplays,
    refreshLiveCameras,
    resetAllDisplaysToDefault,
    forkLiveRigToPlanner,
    selectLiveElement,
    selectedLiveElement,
    liveMapInspectorDockState,
    setLiveMapInspectorDockState,
    distributionBranches,
    openBranchModal,
  } = useRigStore();

  const [liveMapRightWidth, setLiveMapRightWidth] = React.useState(340);
  const [isDraggingRight, setIsDraggingRight] = React.useState(false);

  // Resizable Right Sidebar Mouse Drag Engine
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRight) {
        setLiveMapRightWidth(Math.max(260, Math.min(600, window.innerWidth - e.clientX)));
      }
    };
    const handleMouseUp = () => {
      setIsDraggingRight(false);
    };
    if (isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRight, setLiveMapRightWidth]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const primaryDisplay = liveDisplays.find((d) => d.osIndex === 1) || liveDisplays[0];
    const externalDisplays = liveDisplays.filter((d) => d.id !== primaryDisplay?.id);
    const visibleCameras = liveCameras.filter((c) => !c.isHidden);

    const positionMap: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => {
      positionMap[n.id] = n.position;
    });

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // 1. Camera Source Nodes (on the left)
    visibleCameras.forEach((cam, idx) => {
      const camNodeId = `cam-node-${cam.id}`;
      const defaultY = 80 + idx * 220;
      const pos = positionMap[camNodeId] || { x: 60, y: defaultY };

      newNodes.push({
        id: camNodeId,
        type: 'liveCameraNode',
        position: pos,
        data: { camera: cam },
      });

      // Edge from Camera to Host PC
      newEdges.push({
        id: `edge-cam-${cam.id}`,
        source: camNodeId,
        sourceHandle: `cam-out-${cam.id}`,
        target: 'host-pc',
        targetHandle: `in-cam-${cam.id}`,
        animated: true,
        style: {
          stroke: cam.portType === 'WIRELESS' ? '#F59E0B' : '#10B981',
          strokeWidth: 2.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: cam.portType === 'WIRELESS' ? '#F59E0B' : '#10B981',
        },
        label: `Video In • ${cam.portType.replace('_', ' ')}`,
        labelStyle: { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
        labelBgStyle: { fill: 'var(--bg-subcard)', fillOpacity: 0.95 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
      });
    });

    // 2. Host PC (in the middle)
    const hostX = visibleCameras.length > 0 ? 460 : 100;
    const hostY = Math.max(120, Math.max(externalDisplays.length, visibleCameras.length) * 80);
    const hostPosition = positionMap['host-pc'] || { x: hostX, y: hostY };

    newNodes.push({
      id: 'host-pc',
      type: 'liveHostNode',
      position: hostPosition,
      data: {
        primaryDisplay,
        externalDisplays,
        cameras: visibleCameras,
      },
    });

    // 3. External Displays (on the right)
    externalDisplays.forEach((disp, idx) => {
      const nodeId = `disp-node-${disp.id}`;
      const defaultY = 80 + idx * 260;
      const sinkX = visibleCameras.length > 0 ? 940 : 580;
      const pos = positionMap[nodeId] || { x: sinkX, y: defaultY };

      const branch = distributionBranches[disp.id];
      const hasBranch = Boolean(branch && branch.enabled && branch.downstreamDisplays && branch.downstreamDisplays.length > 0);

      newNodes.push({
        id: nodeId,
        type: 'liveDisplayNode',
        position: pos,
        data: {
          display: disp,
          hasBranch,
          branch,
        },
      });

      // Edge from Host PC to Display
      newEdges.push({
        id: `edge-host-${disp.id}`,
        source: 'host-pc',
        sourceHandle: `out-${disp.id}`,
        target: nodeId,
        targetHandle: `in-${disp.id}`,
        animated: true,
        style: {
          stroke: disp.portType === 'WIRELESS' ? '#F59E0B' : '#06B6D4',
          strokeWidth: 2.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: disp.portType === 'WIRELESS' ? '#F59E0B' : '#06B6D4',
        },
        label: `${disp.portType.replace('_', ' ')} • ${disp.activeResolution.width}x${disp.activeResolution.height}@${disp.refreshRateHz}Hz`,
        labelStyle: { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
        labelBgStyle: { fill: 'var(--bg-subcard)', fillOpacity: 0.95 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
      });

      // 4. If this display feed is branched (e.g. 1x4 Splitter over CAT6)
      if (hasBranch && branch) {
        const splitterNodeId = `splitter-node-${disp.id}`;
        const splitterPos = positionMap[splitterNodeId] || { x: pos.x + 360, y: pos.y };

        newNodes.push({
          id: splitterNodeId,
          type: 'liveSplitterNode',
          position: splitterPos,
          data: {
            branch,
            parentDisplay: disp,
          },
        });

        // Edge from Display to Splitter
        newEdges.push({
          id: `edge-branch-${disp.id}`,
          source: nodeId,
          sourceHandle: `out-branch-${disp.id}`,
          target: splitterNodeId,
          targetHandle: `in-splitter-${disp.id}`,
          animated: true,
          style: {
            stroke: '#F59E0B',
            strokeWidth: 2.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#F59E0B',
          },
          label: `Splitter Input (HDMI)`,
          labelStyle: { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
          labelBgStyle: { fill: 'var(--bg-subcard)', fillOpacity: 0.95 },
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 4,
        });

        // Downstream TVs connected to splitter outputs
        const tvCount = branch.downstreamDisplays.length;
        branch.downstreamDisplays.forEach((tv, tvIdx) => {
          const tvNodeId = `downstream-node-${tv.id}`;
          const vertOffset = (tvIdx - (tvCount - 1) / 2) * 230;
          const tvPos = positionMap[tvNodeId] || { x: pos.x + 720, y: pos.y + vertOffset };

          newNodes.push({
            id: tvNodeId,
            type: 'liveDownstreamNode',
            position: tvPos,
            data: {
              tv,
              parentDisplay: disp,
              branch,
            },
          });

          // Edge from Splitter to Downstream TV
          newEdges.push({
            id: `edge-splitter-to-${tv.id}`,
            source: splitterNodeId,
            sourceHandle: `out-tv-${tv.id}`,
            target: tvNodeId,
            targetHandle: `in-downstream-${tv.id}`,
            animated: true,
            style: {
              stroke: '#10B981',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#10B981',
            },
            label: `${tv.cableLengthMeters}m ${branch.cableMedium.replace('_', ' ')}`,
            labelStyle: { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
            labelBgStyle: { fill: 'var(--bg-subcard)', fillOpacity: 0.95 },
            labelBgPadding: [6, 3] as [number, number],
            labelBgBorderRadius: 4,
          });
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [liveDisplays, liveCameras, distributionBranches]);

  return (
    <div className="w-full h-full flex overflow-hidden relative bg-[var(--bg-primary)]">
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(e, node) => {
            e.stopPropagation();
            if (node.id === 'host-pc') {
              const primary = liveDisplays.find((d) => d.customAlias.includes('Primary') || d.osIndex === 1) || liveDisplays[0];
              if (primary) selectLiveElement('node', primary.id);
            } else if (node.id.startsWith('splitter-node-')) {
              const dispId = node.id.replace('splitter-node-', '');
              openBranchModal(dispId);
            } else if (node.id.startsWith('downstream-node-')) {
              const nodeData = node.data as { parentDisplay?: { id?: string } } | undefined;
              if (nodeData?.parentDisplay?.id) {
                selectLiveElement('node', `disp-node-${nodeData.parentDisplay.id}`);
              }
            } else {
              selectLiveElement('node', node.id);
            }
          }}
          onEdgeClick={(e, edge) => {
            e.stopPropagation();
            selectLiveElement('edge', edge.id);
          }}
          onPaneClick={() => {
            selectLiveElement(null, null);
          }}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Background color="var(--border-color)" gap={20} size={1} />
          <Controls className="react-flow__controls" />
          <MiniMap
            nodeColor={(n) => (n.id.startsWith('cam-') ? '#F59E0B' : n.id === 'host-pc' ? '#06B6D4' : '#3B82F6')}
            className="react-flow__minimap"
            maskColor="rgba(0,0,0,0.6)"
          />

          {/* Top Control Bar Panel */}
          <Panel position="top-left" className="m-4">
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs font-mono text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-[var(--text-primary)]">LIVE TOPOLOGY MAP</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                  {liveCameras.length} CAMS • {liveDisplays.length} SCREENS
                </span>
              </div>

              <div className="h-4 w-[1px] bg-[var(--border-color)]" />

              <button
                onClick={() => {
                  refreshLiveDisplays();
                  refreshLiveCameras();
                }}
                className="px-3 py-1.5 rounded-md bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-cyan-400 font-bold transition flex items-center gap-1.5 shadow-sm border border-[var(--border-color)] cursor-pointer"
                title="Rescan connected monitors, cameras & wireless adapters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rescan Hardware</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Reset all custom stage aliases back to factory driver names?')) {
                    resetAllDisplaysToDefault();
                  }
                }}
                className="px-3 py-1.5 rounded-md bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold transition flex items-center gap-1.5 shadow-sm border border-[var(--border-color)] cursor-pointer"
                title="Clear all custom names and reset to original hardware names"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Aliases</span>
              </button>

              {/* Fork Live Rig to Planner Studio */}
              <button
                onClick={() => {
                  if (window.confirm('Copy this live hardware setup (cameras & displays) into Planner Studio as an editable project?')) {
                    forkLiveRigToPlanner();
                  }
                }}
                className="px-3.5 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                title="Create an editable planning diagram from your current live hardware"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fork Rig to Planner</span>
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* DOCKED Mode Right Inspector */}
      {selectedLiveElement && liveMapInspectorDockState === 'DOCKED' && (
        <div
          style={{ width: `${liveMapRightWidth}px` }}
          className="relative h-full border-l border-[var(--border-color)] bg-[var(--bg-header)] shrink-0 z-20 flex"
        >
          {/* Draggable Resize Handle */}
          <div
            onMouseDown={() => setIsDraggingRight(true)}
            className={`absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-30 transition-colors ${
              isDraggingRight ? 'bg-cyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'hover:bg-cyan-500/40'
            }`}
            title="Drag to resize inspector panel"
          />
          <LiveMapInspector />
        </div>
      )}

      {/* DETACHED Floating Pop-out Window Mode */}
      {selectedLiveElement && liveMapInspectorDockState === 'DETACHED' && (
        <FloatingPanelWrapper
          title="Live Hardware Inspector"
          onReattach={() => setLiveMapInspectorDockState('DOCKED')}
          onClose={() => selectLiveElement(null, null)}
          width={380}
          initialX={typeof window !== 'undefined' ? window.innerWidth - 440 : 800}
          initialY={90}
        >
          <LiveMapInspector />
        </FloatingPanelWrapper>
      )}
    </div>
  );
};
