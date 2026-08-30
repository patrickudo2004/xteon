import React from 'react';
import { useRigStore } from '../../store/useRigStore';
import { PortType, PortDefinition } from '../../types';
import { getPortIcon, StatusShapeIcon } from '../common/SvgIcons';
import {
  Sliders,
  Layers,
  Cable,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Ruler,
  Zap,
  Plus,
  Trash2,
  Tv,
  Split,
  Radio,
  Sparkles,
  PanelRightClose,
  ExternalLink,
} from 'lucide-react';

const cableTypeOptions: { value: PortType; label: string; maxLen: number; maxG: number }[] = [
  { value: 'HDMI_2_0', label: 'Copper HDMI 2.0 (18 Gbps)', maxLen: 10.0, maxG: 18.0 },
  { value: 'HDMI_2_1', label: 'Copper HDMI 2.1 Ultra (48 Gbps)', maxLen: 5.0, maxG: 48.0 },
  { value: 'FIBER_HDMI', label: 'Active Fiber Optic HDMI (48 Gbps)', maxLen: 300.0, maxG: 48.0 },
  { value: 'DP_1_4', label: 'DisplayPort 1.4 Copper (32.4 Gbps)', maxLen: 3.0, maxG: 32.4 },
  { value: 'SDI_3G', label: 'Belden 3G-SDI BNC (2.97 Gbps)', maxLen: 100.0, maxG: 2.97 },
  { value: 'SDI_12G', label: 'Belden 12G-SDI 4K BNC (11.88 Gbps)', maxLen: 70.0, maxG: 11.88 },
  { value: 'HDBASET_CAT6', label: 'Cat6A Shielded HDBaseT (18 Gbps)', maxLen: 100.0, maxG: 18.0 },
  { value: 'USB_C_DP', label: 'USB-C / Thunderbolt 4 (20 Gbps)', maxLen: 2.0, maxG: 20.0 },
  { value: 'WIRELESS', label: 'Zero-Delay Wireless 5G/6G (12 Gbps)', maxLen: 30.0, maxG: 12.0 },
  { value: 'NDI_GBE', label: 'NDI / Gigabit IP Stream (1 Gbps)', maxLen: 100.0, maxG: 1.0 },
];

export const InspectorPanel: React.FC = () => {
  const {
    selectedElement,
    nodes,
    edges,
    updateNodeData,
    updateEdgeData,
    addInputPort,
    removeInputPort,
    addOutputPort,
    removeOutputPort,
    setSplitterMultiplier,
    setMatrixDimensions,
    setTVInputCount,
    inspectorDockState,
    setInspectorDockState,
  } = useRigStore();

  const selectedNode = selectedElement?.type === 'node' ? nodes.find((n) => n.id === selectedElement.id) : null;
  const selectedEdge = selectedElement?.type === 'edge' ? edges.find((e) => e.id === selectedElement.id) : null;

  // Render Rig Overview if nothing selected
  if (!selectedNode && !selectedEdge) {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const totalSources = nodes.filter((n) => n.data.category === 'SOURCE').length;
    const totalSinks = nodes.filter((n) => n.data.category === 'SINK').length;
    const matchedSinks = nodes.filter((n) => n.data.category === 'SINK' && n.data.convergenceStatus === 'MATCHED').length;
    const errorEdges = edges.filter((e) => e.data?.status === 'ERROR_BANDWIDTH').length;
    const warnEdges = edges.filter((e) => e.data?.status === 'WARNING_DISTANCE').length;

    return (
      <div className="w-full bg-[var(--bg-header)] border-l border-[var(--border-color)] p-4 flex flex-col h-full select-none overflow-y-auto text-[var(--text-primary)]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Rig Telemetry Overview
            </span>
          </div>

          {inspectorDockState === 'DOCKED' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setInspectorDockState('DETACHED')}
                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                title="Pop out into floating window"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => setInspectorDockState('COLLAPSED')}
                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                title="Collapse right sidebar panel"
              >
                <PanelRightClose className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 font-mono">
          {/* Signal Health Status Card */}
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
            <div className="text-[10px] uppercase text-[var(--text-muted)] font-bold mb-1">Signal Integrity</div>
            {errorEdges > 0 ? (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                <StatusShapeIcon status="ERROR_BANDWIDTH" />
                <span>{errorEdges} Bandwidth Exceeded Errors</span>
              </div>
            ) : warnEdges > 0 ? (
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <StatusShapeIcon status="WARNING_DISTANCE" />
                <span>{warnEdges} Cable Distance Warnings</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <StatusShapeIcon status="VALID" />
                <span>All Signal Paths Within Safe Specs</span>
              </div>
            )}
          </div>

          {/* Staging Convergence Status */}
          {totalSinks > 0 && (
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[var(--text-muted)]">
                <span>Plan vs Reality Convergence</span>
                <span className="text-cyan-400">{Math.round((matchedSinks / totalSinks) * 100)}% Matched</span>
              </div>
              <div className="w-full bg-[var(--bg-subcard)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${(matchedSinks / totalSinks) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {matchedSinks} of {totalSinks} planned displays physically connected
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)]">Total Devices</div>
              <div className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{totalNodes}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)]">Cable Runs</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">{totalEdges}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)]">Video Sources</div>
              <div className="text-lg font-bold text-blue-400 mt-0.5">{totalSources}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)]">Display Sinks</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{totalSinks}</div>
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] p-3 rounded-xl bg-[var(--bg-subcard)] border border-dashed border-[var(--border-color)] text-center leading-relaxed mt-4">
            Click any device node or cable on the canvas to inspect, customize physical ports, and adjust length.
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER CABLE / PATHWAY INSPECTOR ---
  if (selectedEdge) {
    const cable = selectedEdge.data;
    if (!cable) return null;

    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
    const targetNode = nodes.find((n) => n.id === selectedEdge.target);
    const currentOpt = cableTypeOptions.find((c) => c.value === cable.cableType) || cableTypeOptions[0];
    const bandwidthPercent = Math.min(100, Math.round((cable.calculatedBandwidthGbps / currentOpt.maxG) * 100));

    return (
      <div className="w-full bg-[var(--bg-header)] border-l border-[var(--border-color)] p-4 flex flex-col h-full select-none overflow-y-auto text-[var(--text-primary)] font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Cable className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Pathway Inspector
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusShapeIcon status={cable.status} className="w-3.5 h-3.5 mr-1" />
            {inspectorDockState === 'DOCKED' && (
              <>
                <button
                  onClick={() => setInspectorDockState('DETACHED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                  title="Pop out into floating window"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setInspectorDockState('COLLAPSED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                  title="Collapse right sidebar panel"
                >
                  <PanelRightClose className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Signal Route Summary */}
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1.5">
            <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Signal Route</div>
            <div className="text-xs font-bold text-cyan-300 truncate">
              {sourceNode?.data.label || 'Source'} → {targetNode?.data.label || 'Target'}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {sourceNode?.data.resolution?.width}x{sourceNode?.data.resolution?.height} @ {sourceNode?.data.refreshRateHz}Hz
            </div>
          </div>

          {/* Cable Protocol Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
              Cable Transport Protocol
            </label>
            <select
              value={cable.cableType}
              onChange={(e) => updateEdgeData(selectedEdge.id, { cableType: e.target.value as PortType })}
              className="w-full bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 font-mono"
            >
              {cableTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cable Run Length (Meters) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Ruler className="w-3 h-3 text-cyan-400" />
                <span>Physical Run Length</span>
              </label>
              <span className="text-xs font-bold text-cyan-400 bg-[var(--bg-subcard)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                {cable.lengthMeters} m
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="150"
              value={cable.lengthMeters}
              onChange={(e) => updateEdgeData(selectedEdge.id, { lengthMeters: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
              <span>1 m (Patch)</span>
              <span>75 m (Stage Trunk)</span>
              <span>150 m (Long Reach)</span>
            </div>
          </div>

          {/* Bandwidth & Physics Load Gauge */}
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-[var(--text-muted)] uppercase font-bold">Signal Throughput</span>
              <span className="font-bold text-[var(--text-primary)]">
                {cable.calculatedBandwidthGbps} / {currentOpt.maxG} Gbps
              </span>
            </div>

            <div className="w-full bg-[var(--bg-subcard)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
              <div
                className={`h-full transition-all duration-200 ${
                  bandwidthPercent > 90 ? 'bg-rose-500' : bandwidthPercent > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${bandwidthPercent}%` }}
              />
            </div>

            {/* Validation Message Box */}
            <div
              className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                cable.status === 'ERROR_BANDWIDTH'
                  ? 'bg-rose-950/40 border-rose-600/50 text-rose-300'
                  : cable.status === 'WARNING_DISTANCE'
                  ? 'bg-amber-950/40 border-amber-600/50 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
              }`}
            >
              {cable.warningMessage || `Optimal signal lock (${cable.calculatedBandwidthGbps} Gbps, ${cable.lengthMeters}m).`}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER DEVICE NODE INSPECTOR ---
  const node = selectedNode;
  if (!node) return null;

  const data = node.data;
  const isSplitter = data.deviceType.startsWith('SPLITTER');
  const isMatrix = data.deviceType.startsWith('MATRIX');
  const isTV = data.deviceType === 'COMMERCIAL_TV' || data.deviceType === 'FOYER_DISPLAY';

  return (
    <div className="w-full bg-[var(--bg-header)] border-l border-[var(--border-color)] p-4 flex flex-col h-full select-none overflow-y-auto text-[var(--text-primary)] font-mono text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Device Inspector
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusShapeIcon status={data.convergenceStatus === 'MATCHED' ? 'VALID' : 'STANDBY'} className="w-3.5 h-3.5 mr-1" />
          {inspectorDockState === 'DOCKED' && (
            <>
              <button
                onClick={() => setInspectorDockState('DETACHED')}
                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                title="Pop out into floating window"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => setInspectorDockState('COLLAPSED')}
                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                title="Collapse right sidebar panel"
              >
                <PanelRightClose className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
          {data.category}
        </span>
      </div>

      {/* Basic Metadata Editor */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Device Label</label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Model / Hardware Spec</label>
          <input
            type="text"
            value={data.customModelName}
            onChange={(e) => updateNodeData(node.id, { customModelName: e.target.value })}
            className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Stage Zone</label>
            <input
              type="text"
              value={data.stageZone}
              onChange={(e) => updateNodeData(node.id, { stageZone: e.target.value })}
              className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Refresh Rate</label>
            <select
              value={data.refreshRateHz || 60}
              onChange={(e) => updateNodeData(node.id, { refreshRateHz: Number(e.target.value) })}
              className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value={30}>30 Hz</option>
              <option value={50}>50 Hz (PAL)</option>
              <option value={59.94}>59.94 Hz</option>
              <option value={60}>60 Hz</option>
              <option value={120}>120 Hz</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Presets / Multiplier Controls */}
      {isSplitter && (
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
          <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
            <Split className="w-3.5 h-3.5" />
            <span>Splitter Output Count</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[2, 4, 8, 16].map((count) => (
              <button
                key={count}
                onClick={() => setSplitterMultiplier(node.id, count)}
                className={`py-1 rounded-md text-xs font-bold border transition ${
                  data.outputPorts.length === count
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              >
                1x{count}
              </button>
            ))}
          </div>
        </div>
      )}

      {isTV && (
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
          <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5" />
            <span>TV HDMI Input Ports</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setTVInputCount(node.id, count)}
                className={`py-1 rounded-md text-xs font-bold border transition ${
                  data.inputPorts.length === count
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              >
                {count} In
              </button>
            ))}
          </div>
        </div>
      )}

      {isMatrix && (
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
          <div className="text-[10px] uppercase font-bold text-cyan-400">Matrix Cross-Point Size</div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { in: 4, out: 4, label: '4x4' },
              { in: 8, out: 8, label: '8x8' },
              { in: 16, out: 16, label: '16x16' },
            ].map((m) => (
              <button
                key={m.label}
                onClick={() => setMatrixDimensions(node.id, m.in, m.out)}
                className={`py-1 rounded-md text-xs font-bold border transition ${
                  data.inputPorts.length === m.in && data.outputPorts.length === m.out
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Input Ports Manager */}
      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-cyan-400">
            Input Ports ({data.inputPorts.length})
          </span>
          <button
            onClick={() => addInputPort(node.id, { name: `HDMI In ${data.inputPorts.length + 1}`, type: 'HDMI_2_0' })}
            className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold transition flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Input</span>
          </button>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {data.inputPorts.map((port) => (
            <div
              key={port.id}
              className="p-2 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center gap-1.5 justify-between"
            >
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={port.name}
                  onChange={(e) => {
                    const newInputs = data.inputPorts.map((p) =>
                      p.id === port.id ? { ...p, name: e.target.value } : p
                    );
                    updateNodeData(node.id, { inputPorts: newInputs });
                  }}
                  className="w-full bg-transparent text-[11px] font-semibold text-[var(--text-primary)] focus:outline-none"
                />
                <select
                  value={port.type}
                  onChange={(e) => {
                    const newInputs = data.inputPorts.map((p) =>
                      p.id === port.id ? { ...p, type: e.target.value as PortType } : p
                    );
                    updateNodeData(node.id, { inputPorts: newInputs });
                  }}
                  className="text-[9px] bg-transparent text-cyan-400 focus:outline-none cursor-pointer"
                >
                  <option value="HDMI_2_0">HDMI 2.0 (18G)</option>
                  <option value="HDMI_2_1">HDMI 2.1 (48G)</option>
                  <option value="DP_1_4">DP 1.4 (32G)</option>
                  <option value="SDI_12G">12G-SDI</option>
                  <option value="SDI_3G">3G-SDI</option>
                  <option value="HDBASET_CAT6">HDBaseT CAT6</option>
                  <option value="FIBER_HDMI">Fiber Optical</option>
                  <option value="WIRELESS">Wireless</option>
                </select>
              </div>

              <button
                onClick={() => removeInputPort(node.id, port.id)}
                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0"
                title="Delete input port"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Output Ports Manager */}
      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-cyan-400">
            Output Ports ({data.outputPorts.length})
          </span>
          <button
            onClick={() => addOutputPort(node.id, { name: `Out ${data.outputPorts.length + 1}`, type: 'HDMI_2_0' })}
            className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold transition flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Output</span>
          </button>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {data.outputPorts.map((port) => (
            <div
              key={port.id}
              className="p-2 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center gap-1.5 justify-between"
            >
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={port.name}
                  onChange={(e) => {
                    const newOutputs = data.outputPorts.map((p) =>
                      p.id === port.id ? { ...p, name: e.target.value } : p
                    );
                    updateNodeData(node.id, { outputPorts: newOutputs });
                  }}
                  className="w-full bg-transparent text-[11px] font-semibold text-[var(--text-primary)] focus:outline-none"
                />
                <select
                  value={port.type}
                  onChange={(e) => {
                    const newOutputs = data.outputPorts.map((p) =>
                      p.id === port.id ? { ...p, type: e.target.value as PortType } : p
                    );
                    updateNodeData(node.id, { outputPorts: newOutputs });
                  }}
                  className="text-[9px] bg-transparent text-cyan-400 focus:outline-none cursor-pointer"
                >
                  <option value="HDMI_2_0">HDMI 2.0 (18G)</option>
                  <option value="HDMI_2_1">HDMI 2.1 (48G)</option>
                  <option value="DP_1_4">DP 1.4 (32G)</option>
                  <option value="SDI_12G">12G-SDI</option>
                  <option value="SDI_3G">3G-SDI</option>
                  <option value="HDBASET_CAT6">HDBaseT CAT6</option>
                  <option value="FIBER_HDMI">Fiber Optical</option>
                  <option value="WIRELESS">Wireless</option>
                </select>
              </div>

              <button
                onClick={() => removeOutputPort(node.id, port.id)}
                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0"
                title="Delete output port"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
