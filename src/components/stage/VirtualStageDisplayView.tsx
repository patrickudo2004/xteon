import React, { useEffect, useState } from 'react';
import { Clock, Timer, MessageSquare, Monitor, X, Play, Pause, RotateCcw } from 'lucide-react';

export const VirtualStageDisplayView: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(1200); // 20 mins default
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [whisperMessage, setWhisperMessage] = useState<string | null>(null);

  // Live wall clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer engine
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClose = async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      invoke('close_virtual_extended_display').catch(() => {});
    }
  };

  // Close instantly on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="w-screen h-screen bg-slate-950 text-white font-mono flex flex-col justify-between p-6 select-none overflow-hidden border-4 border-emerald-500/30">
      {/* Top Bar: Header & Digital Wall Clock */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <Monitor className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              XTEON VIRTUAL EXTENDED DISPLAY (DISPLAY 2)
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Stage Confidence Monitor • Streaming Live to Pulpit Receivers
            </div>
          </div>
        </div>

        {/* Big Wall Clock */}
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-black tracking-wider text-cyan-300 font-mono">
            {currentTime}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest">
            {currentDate}
          </div>
        </div>

        {/* Large Prominent Close Button */}
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs flex items-center gap-2 shadow-lg transition cursor-pointer shrink-0"
          title="Close Virtual Extended Display (Esc)"
        >
          <X className="w-4 h-4" />
          <span>Close Window (Esc)</span>
        </button>
      </div>

      {/* Main Center Area: Huge Countdown Timer + Stage Notes / Drag Zone */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 space-y-6">
        {whisperMessage && (
          <div className="w-full max-w-2xl p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 text-center animate-bounce shadow-lg">
            <div className="text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 mb-1">
              <MessageSquare className="w-4 h-4" /> FOH STAGE MESSAGE
            </div>
            <div className="text-xl font-bold font-sans">{whisperMessage}</div>
          </div>
        )}

        {/* Centerpiece Speaker Timer */}
        <div className="flex flex-col items-center">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2 flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-emerald-400" /> STAGE SERVICE TIMER
          </div>
          <div
            className={`text-6xl sm:text-8xl md:text-9xl font-black tracking-tight font-mono transition-colors ${
              timerSeconds < 180 ? 'text-red-400 animate-pulse' : timerSeconds < 300 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {formatTimer(timerSeconds)}
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer"
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{timerRunning ? 'PAUSE' : 'START'}</span>
            </button>
            <button
              onClick={() => {
                setTimerSeconds(1200);
                setTimerRunning(false);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-mono transition flex items-center gap-1.5 cursor-pointer text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET (20M)</span>
            </button>
          </div>
        </div>

        {/* Window Staging Hint Box */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 max-w-xl text-center space-y-1">
          <div className="text-xs font-bold text-slate-300 font-sans">
            Ready for Presentation & Chiron Window Snapping
          </div>
          <div className="text-[11px] text-slate-500 font-sans">
            Use Xteon FOH to route countdown timers, Chiron titles, or PowerPoint directly into this screen borderless.
          </div>
        </div>
      </div>

      {/* Bottom Bar: Telemetry Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-bold">STAGE BROADCAST ACTIVE</span>
          <span className="text-slate-600">•</span>
          <span>1920×1080 @ 60 FPS</span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          XTEON PRO AV ENGINE • STAGELINK V2
        </div>
      </div>
    </div>
  );
};
