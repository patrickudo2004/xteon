import React from 'react';
import { useRigStore } from '../../store/useRigStore';
import { X, Zap } from 'lucide-react';

export const FlashOverlayModal: React.FC = () => {
  const { activeFlashingDisplayId, liveDisplays, flashDisplay } = useRigStore();

  if (!activeFlashingDisplayId) return null;

  const targetDisplay = liveDisplays.find((d) => d.id === activeFlashingDisplayId);
  if (!targetDisplay) return null;

  return (
    <div
      onClick={() => flashDisplay('')}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 cursor-pointer animate-pulse-subtle backdrop-blur-md"
    >
      {/* High-Contrast Flashing Border Simulation */}
      <div className="w-full max-w-4xl p-8 rounded-2xl bg-[#0A0B0E] border-8 border-amber-400 shadow-[0_0_80px_rgba(251,191,36,0.6)] text-center space-y-6 animate-bounce-short">
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-lg tracking-widest uppercase">
          <Zap className="w-6 h-6 fill-current" />
          <span>DISPLAY IDENTIFIER ACTIVE</span>
        </div>

        <div className="space-y-2">
          <div className="text-7xl font-mono font-black text-white tracking-tight">
            SCREEN {targetDisplay.osIndex}
          </div>
          <div className="text-3xl font-bold text-cyan-300 font-mono">
            {targetDisplay.customAlias}
          </div>
        </div>

        <div className="inline-block p-4 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-slate-300 space-y-1">
          <div>Hardware: {targetDisplay.vendor} {targetDisplay.model} ({targetDisplay.serial})</div>
          <div>Connection: {targetDisplay.portType} • Location: 📍 {targetDisplay.stageZone}</div>
          <div className="text-emerald-400 font-bold">
            Resolution: {targetDisplay.activeResolution.width}x{targetDisplay.activeResolution.height} @ {targetDisplay.refreshRateHz}Hz
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500">
          (This identifier overlay is actively flashing on physical Screen {targetDisplay.osIndex}. Auto-dismissing in 3.5s or click anywhere to close.)
        </div>
      </div>
    </div>
  );
};
