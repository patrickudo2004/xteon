import React, { useEffect, useState } from 'react';
import { Sparkles, X, Tv, Layers, Maximize2, Shield } from 'lucide-react';

export const FullscreenOverlayView: React.FC<{
  type: 'flash' | 'pattern';
  patternType?: string;
  displayId?: string;
}> = ({ type, patternType: initialPattern = 'smpte', displayId }) => {
  const [currentPattern, setCurrentPattern] = useState(initialPattern);
  const [countdown, setCountdown] = useState(8);

  // Auto-countdown for flash screen
  useEffect(() => {
    if (type !== 'flash') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [type]);

  // Key listeners for dismissal
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type]);

  const handleClose = async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      if (type === 'flash') {
        invoke('close_flash').catch(() => {});
      } else {
        invoke('close_test_pattern').catch(() => {});
      }
    }
  };

  // --- FLASH SCREEN IDENTIFIER VIEW ---
  if (type === 'flash') {
    return (
      <div
        onClick={handleClose}
        className="w-screen h-screen relative flex flex-col items-center justify-center bg-slate-950 text-white select-none font-mono overflow-hidden cursor-pointer p-8"
      >
        {/* Pulsating High-Contrast Neon Border */}
        <div className="absolute inset-0 border-[16px] border-amber-400 animate-pulse pointer-events-none" />

        {/* Center Pro AV Identifier Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full p-10 rounded-3xl bg-slate-900/95 border-4 border-cyan-400 shadow-[0_0_80px_rgba(6,182,212,0.6)] backdrop-blur-xl text-center space-y-6"
        >
          {/* Beacon Icon */}
          <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 mx-auto flex items-center justify-center text-4xl shadow-inner text-cyan-300">
            ⚡
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
              Xteon Physical Screen Identifier
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-normal text-white mt-1 break-words max-w-full px-2">
              {displayId ? displayId.replace(/_/g, ' ') : 'EXTERNAL DISPLAY'}
            </h1>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-around text-xs">
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Physical Signal</div>
              <div className="text-emerald-400 font-bold mt-0.5">LOCKED (ACTIVE)</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Auto-Dismiss in</div>
              <div className="text-amber-400 font-bold mt-0.5">{countdown} Seconds</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-1000"
              style={{ width: `${(countdown / 8) * 100}%` }}
            />
          </div>

          <div className="pt-2 flex items-center justify-center gap-4">
            <button
              onClick={handleClose}
              className="px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Dismiss Identifier</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Click anywhere or press [ESC] / [SPACE] to close immediately
          </div>
        </div>
      </div>
    );
  }

  // --- CALIBRATION TEST PATTERNS VIEW ---
  return (
    <div
      onClick={handleClose}
      className="w-screen h-screen relative select-none cursor-pointer overflow-hidden bg-black font-mono"
    >
      {/* Pattern renderer */}
      {currentPattern === 'smpte' && (
        <div className="w-full h-full flex flex-col">
          {/* Top 67% standard 7 bars */}
          <div className="flex-[2] flex w-full">
            <div className="flex-1 bg-[#BFBFBF]" />
            <div className="flex-1 bg-[#BFBF00]" />
            <div className="flex-1 bg-[#00BFBF]" />
            <div className="flex-1 bg-[#00BF00]" />
            <div className="flex-1 bg-[#BF00BF]" />
            <div className="flex-1 bg-[#BF0000]" />
            <div className="flex-1 bg-[#0000BF]" />
          </div>
          {/* Middle 8% cast bars */}
          <div className="h-[8%] flex w-full">
            <div className="flex-1 bg-[#0000BF]" />
            <div className="flex-1 bg-[#131313]" />
            <div className="flex-1 bg-[#BF00BF]" />
            <div className="flex-1 bg-[#131313]" />
            <div className="flex-1 bg-[#00BFBF]" />
            <div className="flex-1 bg-[#131313]" />
            <div className="flex-1 bg-[#BFBFBF]" />
          </div>
          {/* Bottom 25% PLUGE & White block */}
          <div className="flex-1 flex w-full">
            <div className="w-[18%] bg-[#084453]" />
            <div className="w-[18%] bg-[#FFFFFF]" />
            <div className="w-[18%] bg-[#3A007D]" />
            <div className="w-[18%] bg-[#131313]" />
            <div className="w-[6%] bg-[#000000]" />
            <div className="w-[6%] bg-[#131313]" />
            <div className="w-[6%] bg-[#1D1D1D]" />
            <div className="flex-1 bg-[#131313]" />
          </div>
        </div>
      )}

      {currentPattern === 'grid' && (
        <div className="w-full h-full bg-black relative flex items-center justify-center">
          <div
            className="w-full h-full absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          <div className="w-64 h-64 rounded-full border-4 border-cyan-400 z-10 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-rose-500" />
          </div>
        </div>
      )}

      {currentPattern === 'checkerboard' && (
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #222 25%, transparent 25%), 
              linear-gradient(-45deg, #222 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #222 75%), 
              linear-gradient(-45deg, transparent 75%, #222 75%)
            `,
            backgroundSize: '60px 60px',
            backgroundColor: '#fff',
          }}
        />
      )}

      {currentPattern === 'grayscale' && (
        <div className="w-full h-full flex flex-row">
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              className="flex-1 h-full flex items-end justify-center pb-8"
              style={{ backgroundColor: `rgb(${Math.round(i * 25.5)}, ${Math.round(i * 25.5)}, ${Math.round(i * 25.5)})` }}
            >
              <span className={`text-xs font-mono font-bold ${i > 5 ? 'text-black' : 'text-white'}`}>
                {i * 10}%
              </span>
            </div>
          ))}
        </div>
      )}

      {currentPattern === 'white' && <div className="w-full h-full bg-white" />}
      {currentPattern === 'red' && <div className="w-full h-full bg-red-600" />}
      {currentPattern === 'green' && <div className="w-full h-full bg-green-600" />}
      {currentPattern === 'blue' && <div className="w-full h-full bg-blue-600" />}

      {/* Floating Pattern Switcher Toolbar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-6 right-6 bg-black/90 text-white p-2 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-1.5 z-50 text-xs backdrop-blur-md"
      >
        <button
          onClick={() => setCurrentPattern('smpte')}
          className={`px-3 py-1.5 rounded-lg transition ${currentPattern === 'smpte' ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:bg-white/10'}`}
        >
          SMPTE Bars
        </button>
        <button
          onClick={() => setCurrentPattern('grid')}
          className={`px-3 py-1.5 rounded-lg transition ${currentPattern === 'grid' ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:bg-white/10'}`}
        >
          Grid
        </button>
        <button
          onClick={() => setCurrentPattern('checkerboard')}
          className={`px-3 py-1.5 rounded-lg transition ${currentPattern === 'checkerboard' ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:bg-white/10'}`}
        >
          Checkerboard
        </button>
        <button
          onClick={() => setCurrentPattern('grayscale')}
          className={`px-3 py-1.5 rounded-lg transition ${currentPattern === 'grayscale' ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:bg-white/10'}`}
        >
          Grayscale
        </button>
        <button
          onClick={() => setCurrentPattern('white')}
          className={`px-3 py-1.5 rounded-lg transition ${currentPattern === 'white' ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:bg-white/10'}`}
        >
          100% White
        </button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-rose-500 hover:text-white transition text-slate-400"
          title="Exit Fullscreen Pattern"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Dismiss Tip */}
      <div className="absolute bottom-6 left-6 bg-black/80 text-slate-300 px-4 py-2 rounded-xl text-xs border border-white/10 shadow-2xl">
        Press [ESC] or click anywhere to exit calibration pattern
      </div>
    </div>
  );
};
