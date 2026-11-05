import React, { useEffect, useState } from 'react';
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
  Monitor,
  Zap,
  Radio,
  Wifi,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Laptop,
  RotateCcw,
  Camera,
  Split,
  Tv,
  Plus,
  QrCode,
  Snowflake,
  CornerUpLeft,
  Users,
  PanelRightOpen,
} from 'lucide-react';

// Custom Live Camera Source Node Component
const LiveCameraNode: React.FC<{ data: any }> = ({ data }) => {
  const { selectLiveElement } = useRigStore();
  const camera = data.camera;
  if (!camera) return null;

  const isWireless = camera.portType === 'WIRELESS';

  return (
    <div
      onClick={() => selectLiveElement('node', `cam-node-${camera.id}`)}
      className="w-80 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--badge-amber-border)] shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none relative cursor-pointer hover:border-[var(--accent-amber)] transition"
    >
      <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {isWireless ? (
            <Wifi className="w-4 h-4 text-[var(--accent-amber)] animate-pulse shrink-0" />
          ) : (
            <Camera className="w-4 h-4 text-[var(--accent-amber)] shrink-0" />
          )}
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] truncate">
            {camera.customAlias || camera.name}
          </span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase border bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border-[var(--badge-amber-border)] shrink-0">
          {camera.portType.replace('_', ' ')}
        </span>
      </div>

      <div className="p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="text-[var(--text-muted)] truncate">{camera.vendor}</div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0">
            📍 {camera.stageZone}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[var(--badge-amber-text)] font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>SIGNAL LOCKED</span>
          </div>
          <span className="text-[10px] text-[var(--badge-amber-text)] font-bold">
            {camera.resolution.width}x{camera.resolution.height}
          </span>
        </div>

        <div className="text-[10px] text-[var(--text-muted)] truncate">{camera.name}</div>
      </div>

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

// Custom Unified Host Workstation Node Component (PC + Primary Screen + StageLink Hub)
const LiveHostNode: React.FC<{ data: any }> = ({ data }) => {
  const { flashDisplay, setTestPattern, selectLiveElement } = useRigStore();
  const primaryDisplay = data.primaryDisplay;
  const externalDisplays = data.externalDisplays || [];
  const stageSlots = data.stageSlots || [];
  const cameras = data.cameras || [];

  return (
    <div
      onClick={() => primaryDisplay && selectLiveElement('node', primaryDisplay.id)}
      className="w-96 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--badge-cyan-border)] shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none cursor-pointer hover:border-[var(--accent-cyan)] transition relative"
    >
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

      <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] flex items-center justify-center text-[var(--accent-cyan)]">
            <Laptop className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs tracking-wide text-[var(--badge-cyan-text)] uppercase font-mono">
              HOST WORKSTATION & PRIMARY SCREEN
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              Local OS, GPU & StageLink Wireless Hub
            </div>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-[var(--badge-emerald-bg)] border border-[var(--badge-emerald-border)] text-[var(--badge-emerald-text)] text-[10px] font-mono font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
          <span>ACTIVE</span>
        </div>
      </div>

      <div className="p-4 space-y-3 font-mono">
        {primaryDisplay ? (
          <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)] truncate">
                <Monitor className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0" />
                <span className="truncate">Screen 1: {primaryDisplay.customAlias || primaryDisplay.name}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] font-bold shrink-0">
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
                className="flex-1 py-1.5 px-2 rounded-lg bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Flash Screen</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTestPattern(primaryDisplay.id, 'smpte');
                }}
                className="flex-1 py-1.5 px-2 rounded-lg bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Pattern</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[var(--text-muted)] italic">Primary screen detecting...</div>
        )}

        {cameras.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
              <span>Camera Video Ingests ({cameras.length})</span>
              <span className="text-[var(--accent-amber)]">Capture Input</span>
            </div>

            {cameras.map((cam: any) => (
              <div
                key={cam.id}
                className="relative flex items-center justify-between bg-[var(--bg-subcard)] px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs"
              >
                <div className="flex items-center gap-2 text-[var(--text-primary)] truncate">
                  <Camera className="w-3.5 h-3.5 text-[var(--accent-amber)] shrink-0" />
                  <span className="font-medium text-[11px] truncate max-w-[190px]">
                    From {cam.customAlias || cam.name}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--accent-amber)] font-bold">{cam.portType}</span>
              </div>
            ))}
          </div>
        )}

        {externalDisplays.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
              <span>Connected Video Ports ({externalDisplays.length})</span>
              <span className="text-[var(--accent-cyan)]">GPU Output</span>
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

                <div className="flex items-center gap-1 text-[10px] text-[var(--accent-cyan)] font-bold">
                  <span>{disp.portType}</span>
                </div>

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

        {stageSlots.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
              <span>Wireless StageLink Feeds ({stageSlots.length})</span>
              <span className="text-[var(--accent-emerald)]">LAN :8765</span>
            </div>

            {stageSlots.map((slot: any) => (
              <div
                key={slot.id}
                className="relative flex items-center justify-between bg-[var(--bg-subcard)] px-3 py-2 rounded-lg border border-[var(--border-color)] text-xs"
              >
                <div className="flex items-center gap-2 text-[var(--text-primary)] min-w-0">
                  <Radio className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0" />
                  <span className="font-medium text-[11px] truncate max-w-[190px]">
                    To {slot.name}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--accent-emerald)] font-bold shrink-0">
                  {slot.source_mode}
                </span>

                <Handle
                  type="source"
                  position={Position.Right}
                  id={`out-stage-${slot.id}`}
                  className="!bg-emerald-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
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

// Custom Wireless StageLink Sink Node Component
const LiveStageLinkNode: React.FC<{ data: any }> = ({ data }) => {
  const { selectLiveElement, flashStageLinkSlot, openQrForStageSlot, setStageLinkSlotFreeze } = useRigStore();
  const slot = data.slot;
  if (!slot) return null;

  return (
    <div
      onClick={() => selectLiveElement('node', `stage-node-${slot.id}`)}
      className="w-80 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--badge-emerald-border)] shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none relative cursor-pointer hover:border-[var(--accent-cyan)] transition"
    >
      <Handle
        type="target"
        position={Position.Left}
        id={`in-stage-${slot.id}`}
        className="!bg-emerald-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
        style={{ left: -7 }}
      />

      <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Radio className="w-4 h-4 text-[var(--accent-emerald)] animate-pulse shrink-0" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] truncate">
            {slot.name}
          </span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase border bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)] shrink-0">
          {slot.source_mode}
        </span>
      </div>

      <div className="p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="text-[var(--text-muted)] truncate">{slot.primary_source_label}</div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0">
            📍 {slot.stage_zone}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[var(--badge-emerald-bg)] border border-[var(--badge-emerald-border)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[var(--badge-emerald-text)] font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>
              {slot.connected_clients > 0
                ? `${slot.connected_clients} TABLET${slot.connected_clients > 1 ? 'S' : ''} LIVE`
                : 'READY FOR QR SCAN'}
            </span>
          </div>
          <span className="text-[10px] text-[var(--badge-emerald-text)] font-bold">
            {slot.target_fps} FPS
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openQrForStageSlot(slot.id);
            }}
            className="py-1.5 px-2 rounded-lg bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <QrCode className="w-3 h-3" />
            <span>QR</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              flashStageLinkSlot(slot.id);
            }}
            className="py-1.5 px-2 rounded-lg bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Zap className="w-3 h-3" />
            <span>Flash</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setStageLinkSlotFreeze(slot.id, !slot.is_frozen);
            }}
            className="py-1.5 px-2 rounded-lg bg-[var(--bg-subcard)] text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Snowflake className="w-3 h-3" />
            <span>{slot.is_frozen ? 'Unfrz' : 'Freeze'}</span>
          </button>
        </div>
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
      className="w-80 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--badge-cyan-border)] shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none relative cursor-pointer hover:border-[var(--accent-cyan)] transition"
    >
      <Handle
        type="target"
        position={Position.Left}
        id={`in-${display.id}`}
        className="!bg-cyan-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
        style={{ left: -7 }}
      />

      {data.hasBranch && (
        <Handle
          type="source"
          position={Position.Right}
          id={`out-branch-${display.id}`}
          className="!bg-amber-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
          style={{ right: -7 }}
        />
      )}

      <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isWireless ? (
            <Wifi className="w-4 h-4 text-[var(--accent-amber)] animate-pulse" />
          ) : (
            <Monitor className="w-4 h-4 text-[var(--accent-cyan)]" />
          )}
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Screen {display.osIndex}: {isWireless ? 'Wireless Screen' : 'External Display'}
          </span>
        </div>
        <span
          className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
            isWireless
              ? 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border-[var(--badge-amber-border)]'
              : 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)]'
          }`}
        >
          {display.portType}
        </span>
      </div>

      <div className="p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="text-[var(--text-primary)] font-bold truncate">
            {display.customAlias || display.name}
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0">
            📍 {display.stageZone}
          </span>
        </div>

        <div className="text-[11px] text-[var(--text-muted)]">
          {display.vendor} {display.model}
        </div>

        <div className="p-2.5 rounded-xl bg-[var(--badge-emerald-bg)] border border-[var(--badge-emerald-border)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[var(--badge-emerald-text)] font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>SIGNAL LOCKED</span>
          </div>
          <span className="text-[10px] text-[var(--badge-emerald-text)] font-bold">
            {display.refreshRateHz ? `${display.refreshRateHz} Hz` : '60 Hz'}
          </span>
        </div>

        {data.hasBranch && data.branch && (
          <div className="p-2.5 rounded-xl bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[var(--badge-amber-text)] font-bold truncate max-w-[190px]">
              <Split className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{data.branch.splitterModel}</span>
            </div>
            <span className="text-[10px] text-[var(--badge-amber-text)] font-bold shrink-0">
              {data.branch.downstreamDisplays.length} TVs
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              flashDisplay(display.id);
            }}
            className="py-1.5 px-2 rounded-lg bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Zap className="w-3 h-3" />
            <span>Flash Screen</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setTestPattern(display.id, 'smpte');
            }}
            className="py-1.5 px-2 rounded-lg bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
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
      className="w-72 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--badge-amber-border)] shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none relative cursor-pointer hover:border-[var(--accent-amber)] transition"
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
          <Split className="w-4 h-4 text-[var(--accent-amber)]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            {branch.splitterType.replace('_', ' ')}
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border-[var(--badge-amber-border)]">
          SPLITTER / DA
        </span>
      </div>

      <div className="p-3.5 space-y-2 font-mono">
        <div className="font-bold text-xs text-[var(--text-primary)] truncate">
          {branch.splitterModel}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
          <span>Medium: {branch.cableMedium.replace('_', ' ')}</span>
          <span className="text-[var(--accent-amber)] font-bold">{branch.downstreamDisplays.length} Outputs</span>
        </div>
        <div className="p-2 rounded-lg bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] flex items-center justify-between text-[10px] text-[var(--badge-amber-text)] font-bold">
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
    <div className="w-72 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--badge-cyan-border)] shadow-2xl overflow-hidden font-sans text-[var(--text-primary)] select-none relative">
      <Handle
        type="target"
        position={Position.Left}
        id={`in-downstream-${tv.id}`}
        className="!bg-cyan-400 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
        style={{ left: -7 }}
      />

      <div className="p-3 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] truncate max-w-[150px]">
            {tv.customAlias || tv.name}
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)]">
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
          <span className="font-bold text-[var(--accent-amber)]">📏 {tv.cableLengthMeters}m ({tv.portType.replace('_', ' ')})</span>
        </div>

        <div className="p-2 rounded-lg bg-[var(--badge-emerald-bg)] border border-[var(--badge-emerald-border)] flex items-center justify-between text-[10px] text-[var(--badge-emerald-text)]">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>MIRRORED SIGNAL</span>
          </div>
          <span className="text-[9px] text-[var(--text-muted)] font-mono">
            {parentDisplay?.refreshRateHz ? `${parentDisplay.refreshRateHz} Hz` : '60 Hz'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={() => parentDisplay && flashDisplay(parentDisplay.id)}
            className="py-1 px-2 rounded-lg bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Zap className="w-3 h-3" />
            <span>Flash</span>
          </button>
          <button
            onClick={() => parentDisplay && openTestPatternModal(parentDisplay.id)}
            className="py-1 px-2 rounded-lg bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
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
  liveStageLinkNode: LiveStageLinkNode,
  liveSplitterNode: LiveSplitterNode,
  liveDownstreamNode: LiveDownstreamDisplayNode,
};

export const LiveMapCanvas: React.FC = () => {
  const {
    liveDisplays,
    liveCameras,
    stageLinkSlots,
    refreshLiveDisplays,
    refreshLiveCameras,
    refreshStageLinkSlots,
    refreshOsWindows,
    openStageLinkModal,
    recallStrayOsWindows,
    resetAllDisplaysToDefault,
    forkLiveRigToPlanner,
    selectLiveElement,
    selectedLiveElement,
    liveMapInspectorDockState,
    setLiveMapInspectorDockState,
    distributionBranches,
    openBranchModal,
  } = useRigStore();

  const [liveMapRightWidth, setLiveMapRightWidth] = useState(340);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [recallMsg, setRecallMsg] = useState<string | null>(null);

  useEffect(() => {
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
  }, [isDraggingRight]);

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
    const hostY = Math.max(
      120,
      Math.max(externalDisplays.length + stageLinkSlots.length, visibleCameras.length) * 80
    );
    const hostPosition = positionMap['host-pc'] || { x: hostX, y: hostY };

    newNodes.push({
      id: 'host-pc',
      type: 'liveHostNode',
      position: hostPosition,
      data: {
        primaryDisplay,
        externalDisplays,
        stageSlots: stageLinkSlots,
        cameras: visibleCameras,
      },
    });

    const sinkX = visibleCameras.length > 0 ? 940 : 580;

    // 3. External Displays (on the right)
    externalDisplays.forEach((disp, idx) => {
      const nodeId = `disp-node-${disp.id}`;
      const defaultY = 80 + idx * 260;
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

        newEdges.push({
          id: `edge-branch-${disp.id}`,
          source: nodeId,
          sourceHandle: `out-branch-${disp.id}`,
          target: splitterNodeId,
          targetHandle: `in-splitter-${disp.id}`,
          animated: true,
          style: { stroke: '#F59E0B', strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
          label: 'Splitter Input (HDMI)',
          labelStyle: { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
          labelBgStyle: { fill: 'var(--bg-subcard)', fillOpacity: 0.95 },
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 4,
        });

        const tvCount = branch.downstreamDisplays.length;
        branch.downstreamDisplays.forEach((tv, tvIdx) => {
          const tvNodeId = `downstream-node-${tv.id}`;
          const vertOffset = (tvIdx - (tvCount - 1) / 2) * 230;
          const tvPos = positionMap[tvNodeId] || { x: pos.x + 720, y: pos.y + vertOffset };

          newNodes.push({
            id: tvNodeId,
            type: 'liveDownstreamNode',
            position: tvPos,
            data: { tv, parentDisplay: disp, branch },
          });

          newEdges.push({
            id: `edge-splitter-to-${tv.id}`,
            source: splitterNodeId,
            sourceHandle: `out-tv-${tv.id}`,
            target: tvNodeId,
            targetHandle: `in-downstream-${tv.id}`,
            animated: true,
            style: { stroke: '#10B981', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' },
            label: `${tv.cableLengthMeters}m ${branch.cableMedium.replace('_', ' ')}`,
            labelStyle: { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
            labelBgStyle: { fill: 'var(--bg-subcard)', fillOpacity: 0.95 },
            labelBgPadding: [6, 3] as [number, number],
            labelBgBorderRadius: 4,
          });
        });
      }
    });

    // 4. Wireless StageLink Sink Nodes (below External Displays)
    stageLinkSlots.forEach((slot, sIdx) => {
      const stageNodeId = `stage-node-${slot.id}`;
      const defaultY = 80 + (externalDisplays.length + sIdx) * 260;
      const pos = positionMap[stageNodeId] || { x: sinkX, y: defaultY };

      newNodes.push({
        id: stageNodeId,
        type: 'liveStageLinkNode',
        position: pos,
        data: { slot },
      });

      newEdges.push({
        id: `edge-stage-${slot.id}`,
        source: 'host-pc',
        sourceHandle: `out-stage-${slot.id}`,
        target: stageNodeId,
        targetHandle: `in-stage-${slot.id}`,
        animated: true,
        style: {
          stroke: '#10B981',
          strokeWidth: 2.5,
          strokeDasharray: '6 4',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#10B981',
        },
        label: `StageLink Wi-Fi • ${slot.source_mode} @ ${slot.target_fps}FPS`,
        labelStyle: { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
        labelBgStyle: { fill: 'var(--bg-subcard)', fillOpacity: 0.95 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [liveDisplays, liveCameras, stageLinkSlots, distributionBranches]);

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
              const primary =
                liveDisplays.find((d) => d.customAlias.includes('Primary') || d.osIndex === 1) ||
                liveDisplays[0];
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
            nodeColor={(n) =>
              n.id.startsWith('cam-')
                ? '#F59E0B'
                : n.id.startsWith('stage-')
                ? '#10B981'
                : n.id === 'host-pc'
                ? '#06B6D4'
                : '#3B82F6'
            }
            className="react-flow__minimap"
            maskColor="rgba(0,0,0,0.6)"
          />

          {/* Top Responsive Control Bar Panel */}
          <Panel position="top-left" className="m-3 max-w-[calc(100vw-2rem)]">
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] backdrop-blur-md shadow-2xl flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
                <span className="font-bold text-[var(--text-primary)]">LIVE TOPOLOGY</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] font-bold">
                  {liveCameras.length} CAMS • {liveDisplays.length} SCREENS • {stageLinkSlots.length} STAGELINK
                </span>
              </div>

              <button
                onClick={() => openStageLinkModal(null)}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Add Wireless StageLink Confidence Monitor"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Wireless Stage</span>
              </button>

              <button
                onClick={async () => {
                  const n = await recallStrayOsWindows();
                  setRecallMsg(n > 0 ? `Recalled ${n}` : 'Stage Clean');
                  setTimeout(() => setRecallMsg(null), 2200);
                }}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)] font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Pull unpinned windows back to FOH primary screen"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
                <span>{recallMsg || 'Recall Windows'}</span>
              </button>

              <button
                onClick={() => {
                  refreshLiveDisplays();
                  refreshLiveCameras();
                  refreshOsWindows();
                  refreshStageLinkSlots(true);
                }}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--accent-cyan)] font-bold transition flex items-center gap-1.5 border border-[var(--border-color)] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rescan</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Reset all custom stage aliases back to factory driver names?')) {
                    resetAllDisplaysToDefault();
                  }
                }}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold transition flex items-center gap-1.5 border border-[var(--border-color)] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Aliases</span>
              </button>

              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Copy this live hardware setup (cameras, displays & StageLink monitors) into Planner Studio as an editable project?'
                    )
                  ) {
                    forkLiveRigToPlanner();
                  }
                }}
                className="min-h-[34px] px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fork to Planner</span>
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Collapsed Rail so user can re-expand LiveMapInspector */}
      {selectedLiveElement && liveMapInspectorDockState === 'COLLAPSED' && (
        <div className="h-full w-12 bg-[var(--bg-header)] border-l border-[var(--border-color)] flex flex-col items-center py-4 gap-3 shrink-0 z-20">
          <button
            onClick={() => setLiveMapInspectorDockState('DOCKED')}
            className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--accent-cyan)] border border-[var(--border-color)] transition cursor-pointer shadow-sm"
            title="Expand Live Inspector"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DOCKED Mode Right Inspector */}
      {selectedLiveElement && liveMapInspectorDockState === 'DOCKED' && (
        <div
          style={{ width: `${liveMapRightWidth}px` }}
          className="relative h-full border-l border-[var(--border-color)] bg-[var(--bg-header)] shrink-0 z-20 flex"
        >
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
