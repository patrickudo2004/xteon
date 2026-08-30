import React from 'react';
import { useRigStore } from '../../store/useRigStore';
import { Volume2, ShieldCheck, X, Check, Lock, Radio } from 'lucide-react';

export const AudioConsentModal: React.FC = () => {
  const {
    audioConsentOpen,
    setAudioConsentOpen,
    audioMonitoringAllowed,
    setAudioMonitoringAllowed,
    liveDisplays,
  } = useRigStore();

  if (!audioConsentOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
                <span>AUDIO MONITORING & PRIVACY</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal">PRO AV</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Per-endpoint audio VU meter permissions & bus assignment
              </p>
            </div>
          </div>
          <button
            onClick={() => setAudioConsentOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Main Permission Toggle Card */}
          <div className={`p-4 rounded-xl border-2 transition ${
            audioMonitoringAllowed
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : 'bg-slate-900/40 border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className={`w-6 h-6 mt-0.5 ${audioMonitoringAllowed ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-sm text-slate-100">
                    Enable Display Audio Peak Level Monitoring
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Allows Xteon to read real-time decibel peak levels via Windows WASAPI for connected HDMI, DisplayPort, and wireless audio endpoints.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAudioMonitoringAllowed(!audioMonitoringAllowed)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  audioMonitoringAllowed ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    audioMonitoringAllowed ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Connected Display Endpoint Audio Mapping */}
          <div>
            <div className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Connected Output Endpoints ({liveDisplays.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">WASAPI Loopback Direct</span>
            </div>

            <div className="space-y-2.5">
              {liveDisplays.map((disp) => (
                <div
                  key={disp.id}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-200 truncate">{disp.customAlias}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {disp.portType === 'WIRELESS' ? 'ASUS GlideX Wireless Audio Bus' : 'Windows High Definition Audio'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {audioMonitoringAllowed ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        ● Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px] flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Muted
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-[var(--border-color)] flex items-center justify-end gap-3">
          <button
            onClick={() => setAudioConsentOpen(false)}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-2 shadow-lg"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Audio Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
