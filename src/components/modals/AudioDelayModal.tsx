import React, { useState } from 'react';
import { X, Clock, Thermometer, Ruler, Zap, Info, Volume2, Video } from 'lucide-react';

interface AudioDelayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioDelayModal: React.FC<AudioDelayModalProps> = ({ isOpen, onClose }) => {
  const [distanceMeters, setDistanceMeters] = useState<number>(30);
  const [unitMode, setUnitMode] = useState<'METERS' | 'FEET'>('METERS');
  const [tempCelsius, setTempCelsius] = useState<number>(20);
  const [tempMode, setTempMode] = useState<'CELSIUS' | 'FAHRENHEIT'>('CELSIUS');
  const [frameRate, setFrameRate] = useState<number>(60);

  if (!isOpen) return null;

  // Speed of sound in dry air: v = 331.3 + (0.606 * Temp_C) m/s
  const speedOfSoundMps = 331.3 + 0.606 * tempCelsius;
  const speedOfSoundFps = speedOfSoundMps * 3.28084;

  // Actual distance in meters for calculation
  const effectiveDistanceM = unitMode === 'METERS' ? distanceMeters : distanceMeters / 3.28084;

  // Total acoustic delay in milliseconds
  const delayMs = (effectiveDistanceM / speedOfSoundMps) * 1000;

  // Video frames of latency
  const delayFrames = (delayMs / 1000) * frameRate;

  const handleDistanceChange = (val: number) => {
    setDistanceMeters(Math.max(0, val));
  };

  const handleTempChange = (val: number) => {
    if (tempMode === 'CELSIUS') {
      setTempCelsius(val);
    } else {
      // Convert F to C: (F - 32) * 5/9
      setTempCelsius(Number((((val - 32) * 5) / 9).toFixed(1)));
    }
  };

  const currentTempDisplay =
    tempMode === 'CELSIUS'
      ? tempCelsius
      : Number(((tempCelsius * 9) / 5 + 32).toFixed(1));

  const applyPreset = (m: number) => {
    if (unitMode === 'METERS') {
      setDistanceMeters(m);
    } else {
      setDistanceMeters(Number((m * 3.28084).toFixed(1)));
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[var(--text-primary)]"
      >
        {/* Header */}
        <div className="p-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wide">
                Acoustic Audio-to-Video Delay Calculator
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Speed-of-sound latency compensation for arena IMAG & delay towers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 font-mono text-xs">
          {/* Main Calculation Hero Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-cyan-950/30 to-slate-900 border border-indigo-500/30 grid grid-cols-2 gap-4 text-center">
            <div className="border-r border-indigo-500/20 pr-4">
              <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Delay Setting</span>
              </div>
              <div className="text-3xl font-black text-white font-mono tracking-tight">
                {delayMs.toFixed(1)} <span className="text-sm text-indigo-400 font-normal">ms</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                Configure on audio matrix / console
              </div>
            </div>

            <div className="pl-2">
              <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-center gap-1">
                <Video className="w-3.5 h-3.5" />
                <span>Video Frame Offset</span>
              </div>
              <div className="text-3xl font-black text-cyan-300 font-mono tracking-tight">
                {delayFrames.toFixed(2)} <span className="text-sm text-cyan-500 font-normal">frames</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                At {frameRate} fps projection
              </div>
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Distance Input */}
            <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-cyan-400" />
                  <span>Distance</span>
                </label>
                <div className="flex bg-[var(--bg-card)] rounded p-0.5 border border-[var(--border-color)] text-[9px]">
                  <button
                    onClick={() => setUnitMode('METERS')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${unitMode === 'METERS' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400'}`}
                  >
                    m
                  </button>
                  <button
                    onClick={() => setUnitMode('FEET')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${unitMode === 'FEET' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400'}`}
                  >
                    ft
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={distanceMeters}
                onChange={(e) => handleDistanceChange(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-base font-bold font-mono"
              />
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                Stage speakers to listener
              </div>
            </div>

            {/* Ambient Temperature */}
            <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  <span>Temp</span>
                </label>
                <div className="flex bg-[var(--bg-card)] rounded p-0.5 border border-[var(--border-color)] text-[9px]">
                  <button
                    onClick={() => setTempMode('CELSIUS')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${tempMode === 'CELSIUS' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-slate-400'}`}
                  >
                    °C
                  </button>
                  <button
                    onClick={() => setTempMode('FAHRENHEIT')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${tempMode === 'FAHRENHEIT' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-slate-400'}`}
                  >
                    °F
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="1"
                value={currentTempDisplay}
                onChange={(e) => handleTempChange(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-base font-bold font-mono"
              />
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                Air: {speedOfSoundMps.toFixed(1)} m/s ({speedOfSoundFps.toFixed(0)} ft/s)
              </div>
            </div>

            {/* Frame Rate Selector */}
            <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)]">
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Video FPS</span>
              </label>
              <select
                value={frameRate}
                onChange={(e) => setFrameRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-xs font-bold font-mono cursor-pointer"
              >
                <option value={24}>24.00 fps (Cinema)</option>
                <option value={25}>25.00 fps (PAL Broadcast)</option>
                <option value={29.97}>29.97 fps (NTSC)</option>
                <option value={30}>30.00 fps</option>
                <option value={50}>50.00 fps (PAL Pro)</option>
                <option value={59.94}>59.94 fps (NTSC Pro)</option>
                <option value={60}>60.00 fps (Pro AV UHD)</option>
              </select>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                1 frame = {(1000 / frameRate).toFixed(1)} ms
              </div>
            </div>
          </div>

          {/* Quick Distance Presets */}
          <div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-2">
              Common Venue Delay Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => applyPreset(15)}
                className="p-2 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-header)] border border-[var(--border-color)] text-left transition cursor-pointer"
              >
                <div className="font-bold text-[11px] text-[var(--text-primary)]">Club / Theater</div>
                <div className="text-[10px] text-[var(--text-muted)]">15m (49ft) • ~44ms</div>
              </button>

              <button
                onClick={() => applyPreset(30)}
                className="p-2 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-header)] border border-[var(--border-color)] text-left transition cursor-pointer"
              >
                <div className="font-bold text-[11px] text-[var(--text-primary)]">Sanctuary FOH</div>
                <div className="text-[10px] text-[var(--text-muted)]">30m (98ft) • ~87ms</div>
              </button>

              <button
                onClick={() => applyPreset(60)}
                className="p-2 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-header)] border border-[var(--border-color)] text-left transition cursor-pointer"
              >
                <div className="font-bold text-[11px] text-[var(--text-primary)]">Arena Delay Ring</div>
                <div className="text-[10px] text-[var(--text-muted)]">60m (197ft) • ~175ms</div>
              </button>

              <button
                onClick={() => applyPreset(100)}
                className="p-2 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-header)] border border-[var(--border-color)] text-left transition cursor-pointer"
              >
                <div className="font-bold text-[11px] text-[var(--text-primary)]">Festival Lawn</div>
                <div className="text-[10px] text-[var(--text-muted)]">100m (328ft) • ~291ms</div>
              </button>
            </div>
          </div>

          {/* Engineering Rule Notice */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/50 flex items-start gap-2 text-[11px] text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Rule of Thumb:</strong> Sound takes approximately <strong>~3 milliseconds to travel 1 meter</strong> (~1 ms per foot). If the audience is watching an IMAG screen 30m away, delay the video or audio matrix by <strong>~87ms (5.2 frames @ 60fps)</strong> to restore perfect lip synchronization.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between shrink-0 font-mono text-xs">
          <span className="text-[11px] text-[var(--text-muted)]">
            Acoustic equation: v = 331.3 + (0.606 × T°C) m/s
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
