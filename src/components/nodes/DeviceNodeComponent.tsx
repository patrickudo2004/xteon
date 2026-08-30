import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DeviceNodeData } from '../../types';
import { getPortIcon, StatusShapeIcon } from '../common/SvgIcons';
import { useRigStore } from '../../store/useRigStore';
import {
  Server,
  Split,
  RefreshCw,
  Cpu,
  Monitor,
  Sliders,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
} from 'lucide-react';

const categoryColorMap: Record<DeviceNodeData['category'], { headerBg: string; border: string; icon: React.ReactNode }> = {
  SOURCE: {
    headerBg: 'bg-gradient-to-r from-blue-900/80 via-[var(--bg-header)] to-indigo-900/60 text-blue-300',
    border: 'border-blue-500/50',
    icon: <Server className="w-3.5 h-3.5" />,
  },
  SWITCHER: {
    headerBg: 'bg-gradient-to-r from-amber-900/80 via-[var(--bg-header)] to-orange-900/60 text-amber-300',
    border: 'border-amber-500/50',
    icon: <Sliders className="w-3.5 h-3.5" />,
  },
  DISTRIBUTION: {
    headerBg: 'bg-gradient-to-r from-purple-900/80 via-[var(--bg-header)] to-violet-900/60 text-purple-300',
    border: 'border-purple-500/50',
    icon: <Split className="w-3.5 h-3.5" />,
  },
  CONVERTER: {
    headerBg: 'bg-gradient-to-r from-pink-900/80 via-[var(--bg-header)] to-rose-900/60 text-pink-300',
    border: 'border-pink-500/50',
    icon: <RefreshCw className="w-3.5 h-3.5" />,
  },
  PROCESSOR: {
    headerBg: 'bg-gradient-to-r from-cyan-900/80 via-[var(--bg-header)] to-teal-900/60 text-cyan-300',
    border: 'border-cyan-500/50',
    icon: <Cpu className="w-3.5 h-3.5" />,
  },
  SINK: {
    headerBg: 'bg-gradient-to-r from-emerald-900/80 via-[var(--bg-header)] to-green-900/60 text-emerald-300',
    border: 'border-emerald-500/50',
    icon: <Monitor className="w-3.5 h-3.5" />,
  },
};

export const DeviceNodeComponent: React.FC<NodeProps<any>> = memo(({ id, data, selected }) => {
  const nodeData = data as DeviceNodeData;
  const { selectElement, removeElement } = useRigStore();
  const catStyle = categoryColorMap[nodeData.category] || categoryColorMap.SOURCE;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectElement('node', id);
      }}
      className={`min-w-[260px] max-w-[340px] rounded-2xl bg-[var(--bg-card)] border-2 shadow-2xl transition-all duration-150 backdrop-blur-md overflow-hidden text-[var(--text-primary)] ${
        selected ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-[1.02]' : catStyle.border
      } hover:border-slate-400`}
    >
      {/* Node Header */}
      <div className={`px-3.5 py-2.5 flex items-center justify-between border-b border-[var(--border-color)] ${catStyle.headerBg}`}>
        <div className="flex items-center gap-2">
          {catStyle.icon}
          <span className="font-mono text-xs font-bold uppercase tracking-wider">{nodeData.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeElement('node', id);
            }}
            className="p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded-md text-[var(--text-muted)] transition"
            title="Delete Node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3.5 space-y-3 font-mono">
        <div>
          <div className="text-sm font-bold text-[var(--text-primary)] truncate">{nodeData.label}</div>
          <div className="text-[11px] text-[var(--text-muted)] truncate">{nodeData.customModelName}</div>
        </div>

        {/* Zone Badge & Resolution */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subcard)] text-[var(--text-primary)] border border-[var(--border-color)]">
            📍 {nodeData.stageZone}
          </span>
          {nodeData.resolution && (
            <span className="px-2 py-0.5 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-800">
              {nodeData.resolution.width}x{nodeData.resolution.height} @ {nodeData.refreshRateHz}Hz
            </span>
          )}
        </div>

        {/* Plan-to-Reality Live Convergence Badge for Sinks */}
        {nodeData.category === 'SINK' && (
          <div className="pt-1 border-t border-[var(--border-color)]">
            {nodeData.convergenceStatus === 'MATCHED' ? (
              <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Physical Link Locked</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            ) : nodeData.convergenceStatus === 'MISMATCH_RES' ? (
              <div className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Res Mismatch (Check Cable)</span>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 text-[10px] flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Awaiting Physical Link</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Input Ports Section */}
        {nodeData.inputPorts.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-[var(--border-color)]">
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
              Inputs ({nodeData.inputPorts.length})
            </div>
            {nodeData.inputPorts.map((port) => (
              <div
                key={port.id}
                className="relative flex items-center justify-between bg-[var(--bg-subcard)] px-2 py-1.5 rounded-lg border border-[var(--border-color)] text-xs"
              >
                <Handle
                  type="target"
                  position={Position.Left}
                  id={port.id}
                  className="!bg-emerald-500 !border-2 !border-[var(--bg-card)] !w-3.5 !h-3.5"
                  style={{ left: -7 }}
                />
                <div className="flex items-center gap-1.5 text-[var(--text-primary)] min-w-0 pr-2">
                  {getPortIcon(port.type, 'w-3.5 h-3.5')}
                  <span className="text-[11px] truncate font-medium">{port.name}</span>
                </div>
                <span className="text-[9px] text-cyan-400/80 shrink-0 font-bold">{port.maxBandwidthGbps}G</span>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Output Ports Section */}
        {nodeData.outputPorts.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-[var(--border-color)]">
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
              Outputs ({nodeData.outputPorts.length})
            </div>
            {nodeData.outputPorts.map((port) => (
              <div
                key={port.id}
                className="relative flex items-center justify-between bg-[var(--bg-subcard)] px-2 py-1.5 rounded-lg border border-[var(--border-color)] text-xs"
              >
                <div className="flex items-center gap-1.5 text-[var(--text-primary)] min-w-0 pr-2">
                  {getPortIcon(port.type, 'w-3.5 h-3.5')}
                  <span className="text-[11px] truncate font-medium">{port.name}</span>
                </div>
                <span className="text-[9px] text-cyan-400/80 shrink-0 font-bold">{port.maxBandwidthGbps}G</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={port.id}
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
});
