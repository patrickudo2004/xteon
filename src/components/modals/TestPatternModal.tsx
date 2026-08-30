import React, { useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { X, Sliders, Grid, Monitor, Eye, Check } from 'lucide-react';

const testPatterns = [
  { id: 'SMPTE', name: 'SMPTE Color Bars (RP 219)', desc: 'Standard 75% color saturation calibration bars' },
  { id: 'GRID', name: 'Pixel Alignment Grid & Crosshairs', desc: '100px square grid for projector alignment and LED mapping' },
  { id: 'WHITE', name: '100% Solid White', desc: 'Panel brightness and backlight uniformity inspection' },
  { id: 'RED', name: '100% Pure Red', desc: 'Red subpixel and dead pixel verification' },
  { id: 'GREEN', name: '100% Pure Green', desc: 'Green subpixel inspection' },
  { id: 'BLUE', name: '100% Pure Blue', desc: 'Blue subpixel inspection' },
  { id: 'BLACK', name: '100% Solid Black', desc: 'Contrast ratio and light bleed inspection' },
];

export const TestPatternModal: React.FC = () => {
  const {
    activeTestDisplayId,
    activeTestPattern,
    liveDisplays,
    setTestPattern,
    testPatternModalOpen,
    setTestPatternModalOpen,
  } = useRigStore();
  const [selectedPattern, setSelectedPattern] = useState(activeTestPattern || 'SMPTE');

  if (!testPatternModalOpen) return null;

  const targetDisplay = liveDisplays.find((d) => d.id === activeTestDisplayId);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm select-none animate-fade-in text-[var(--text-primary)]">
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-mono text-sm font-bold text-[var(--text-primary)]">CALIBRATION TEST PATTERN GENERATOR</h2>
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                Target: {targetDisplay ? `${targetDisplay.customAlias} (Screen ${targetDisplay.osIndex})` : 'External Display'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setTestPatternModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testPatterns.map((pat) => (
              <div
                key={pat.id}
                onClick={() => setSelectedPattern(pat.id)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  selectedPattern === pat.id
                    ? 'bg-cyan-500/10 border-cyan-400 ring-1 ring-cyan-400/30'
                    : 'bg-[var(--bg-subcard)] border-[var(--border-color)] hover:border-slate-500'
                }`}
              >
                <div className="w-4 h-4 rounded-full border border-[var(--border-color)] flex items-center justify-center shrink-0 mt-0.5">
                  {selectedPattern === pat.id && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{pat.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{pat.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Test Pattern Preview Window */}
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-2">Live Raster Preview</div>
            <div className="h-36 rounded-lg overflow-hidden border border-[var(--border-color)] flex items-center justify-center relative shadow-inner">
              {selectedPattern === 'SMPTE' && (
                <div className="w-full h-full flex">
                  <div className="flex-1 bg-gray-300" />
                  <div className="flex-1 bg-yellow-400" />
                  <div className="flex-1 bg-cyan-400" />
                  <div className="flex-1 bg-green-500" />
                  <div className="flex-1 bg-magenta-500" />
                  <div className="flex-1 bg-red-600" />
                  <div className="flex-1 bg-blue-600" />
                </div>
              )}
              {selectedPattern === 'GRID' && (
                <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:16px_16px]" />
                  <div className="w-12 h-12 border-2 border-cyan-400 rounded-full z-10" />
                </div>
              )}
              {selectedPattern === 'WHITE' && <div className="w-full h-full bg-white" />}
              {selectedPattern === 'RED' && <div className="w-full h-full bg-red-600" />}
              {selectedPattern === 'GREEN' && <div className="w-full h-full bg-green-600" />}
              {selectedPattern === 'BLUE' && <div className="w-full h-full bg-blue-600" />}
              {selectedPattern === 'BLACK' && <div className="w-full h-full bg-black" />}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between">
          <div className="text-xs font-mono text-[var(--text-muted)]">
            Overlays full-screen test pattern on target display output
          </div>
          <div className="flex items-center gap-3">
            {activeTestPattern && (
              <button
                onClick={() => {
                  setTestPattern(null, null);
                  setTestPatternModalOpen(false);
                }}
                className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Stop Pattern</span>
              </button>
            )}
            <button
              onClick={() => {
                if (activeTestDisplayId) {
                  setTestPattern(activeTestDisplayId, selectedPattern);
                }
                setTestPatternModalOpen(false);
              }}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Project Pattern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
