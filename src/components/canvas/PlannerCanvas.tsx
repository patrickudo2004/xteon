import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useRigStore } from '../../store/useRigStore';
import { DeviceNodeComponent } from '../nodes/DeviceNodeComponent';
import { CustomCableEdge } from '../edges/CustomCableEdge';
import { Layers, Sparkles, Plus, CheckCircle2, Clock, Zap } from 'lucide-react';

export const PlannerCanvas: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectElement, loadSampleRig, liveDisplays } = useRigStore();

  const nodeTypes = useMemo(() => ({ deviceNode: DeviceNodeComponent as any }), []);
  const edgeTypes = useMemo(() => ({ customCable: CustomCableEdge as any }), []);

  const totalSinks = nodes.filter((n) => n.data.category === 'SINK').length;
  const matchedSinks = nodes.filter((n) => n.data.category === 'SINK' && n.data.convergenceStatus === 'MATCHED').length;
  const convergencePercent = totalSinks > 0 ? Math.round((matchedSinks / totalSinks) * 100) : 0;

  return (
    <div
      className="flex-1 h-full relative bg-[var(--bg-primary)] select-none text-[var(--text-primary)]"
      onClick={() => selectElement(null, null)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.2}
        maxZoom={2.5}
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="var(--border-color)"
          className="bg-transparent"
        />
        <Controls className="react-flow__controls" />
        <MiniMap
          nodeStrokeColor="#06B6D4"
          nodeColor="#1E2330"
          maskColor="rgba(10, 11, 14, 0.75)"
          className="react-flow__minimap"
          style={{ width: 140, height: 90 }}
        />

        {/* Live Staging Progress Floating Header Panel */}
        {totalSinks > 0 && (
          <Panel position="top-center" className="mt-4">
            <div className="p-3 rounded-2xl bg-[var(--bg-card)]/90 border border-[var(--border-color)] backdrop-blur-md shadow-2xl flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-[var(--text-primary)]">STAGING CONVERGENCE:</span>
                <span className="font-bold text-cyan-400">
                  {matchedSinks} of {totalSinks} Displays Locked ({convergencePercent}%)
                </span>
              </div>

              <div className="w-28 bg-[var(--bg-subcard)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${convergencePercent}%` }}
                />
              </div>

              {convergencePercent === 100 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% REALITY MATCHED</span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>STAGING IN PROGRESS</span>
                </span>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Clean Blank Canvas Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="p-8 rounded-3xl bg-[var(--bg-card)]/80 border-2 border-dashed border-[var(--border-color)] backdrop-blur-md max-w-lg shadow-2xl pointer-events-auto space-y-4 font-mono">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-inner">
              <Layers className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">BLANK RIG CANVAS</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Click any device from the left <strong>Hardware Library</strong> to place sources, switchers, splitters, and displays, then draw cables between port handles.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => loadSampleRig()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Sample Rig Template</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
