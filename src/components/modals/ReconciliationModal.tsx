import React from 'react';
import { useRigStore } from '../../store/useRigStore';
import { RefreshCw, Check, X, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

export const ReconciliationModal: React.FC = () => {
  const {
    reconciliationModalOpen,
    setReconciliationModalOpen,
    liveDisplays,
    nodes,
    flashDisplay,
  } = useRigStore();

  if (!reconciliationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md select-none animate-fadeIn p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl overflow-hidden text-[var(--text-primary)]">
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-[var(--text-primary)]">
                Plan-to-Reality Hardware Reconciliation
              </h3>
              <p className="font-mono text-[11px] text-[var(--text-muted)]">
                Map real physical Windows displays directly to planned diagram sinks.
              </p>
            </div>
          </div>

          <button
            onClick={() => setReconciliationModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bipartite Matching Matrix */}
        <div className="p-6 space-y-3 max-h-[480px] overflow-y-auto">
          {liveDisplays.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-[var(--text-muted)]">
              No live displays detected. Connect external displays or wireless screens to reconcile.
            </div>
          ) : (
            liveDisplays.map((disp, index) => {
              const plannedSinks = nodes.filter((n) => n.data.category === 'SINK');
              const matchedNode = nodes.find((n) => n.data.matchedLiveDisplayId === disp.id) || plannedSinks[index];
              const isExactRes = matchedNode?.data.resolution?.width === disp.activeResolution.width;
              const confidence = matchedNode ? (isExactRes ? 100 : 92) : 80;

              return (
                <div
                  key={disp.id}
                  className="p-3.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between gap-4 hover:border-cyan-500/40 transition"
                >
                  {/* Live Hardware Detected */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Live Hardware Detected</div>
                    <div className="font-mono text-xs font-bold text-[var(--text-primary)] truncate mt-0.5">
                      Screen {disp.osIndex}: {disp.vendor} {disp.model}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      {disp.activeResolution.width}x{disp.activeResolution.height} @ {disp.refreshRateHz}Hz • {disp.portType}
                    </div>
                  </div>

                  {/* Arrow & Confidence */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border mb-1 ${
                        confidence === 100
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-600/40'
                          : 'text-amber-300 bg-amber-950/60 border-amber-600/40'
                      }`}
                    >
                      {confidence}% Match
                    </span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </div>

                  {/* Planned Rig Node */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Target Planned Alias</div>
                    <div className="font-mono text-xs font-bold text-cyan-300 truncate mt-0.5">
                      {matchedNode?.data.label || disp.customAlias || 'Unassigned Sink'}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      📍 {matchedNode?.data.stageZone || disp.stageZone || 'Main Stage'}
                    </div>
                  </div>

                  {/* Quick Flash Identifier to verify */}
                  <button
                    onClick={() => flashDisplay(disp.id)}
                    className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-amber-500/20 hover:text-amber-300 text-[var(--text-muted)] border border-[var(--border-color)] transition shrink-0 cursor-pointer"
                    title="Flash Screen to verify physical match"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between">
          <div className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Preserves all custom routing, cable tags, and audio mappings</span>
          </div>
          <button
            onClick={() => setReconciliationModalOpen(false)}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept & Lock Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};
