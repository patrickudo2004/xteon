import React, { useState, useRef, useEffect } from 'react';
import { Move, X, CornerDownLeft } from 'lucide-react';

interface FloatingPanelWrapperProps {
  title: string;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  onReattach: () => void;
  onClose?: () => void;
  children: React.ReactNode;
}

export const FloatingPanelWrapper: React.FC<FloatingPanelWrapperProps> = ({
  title,
  initialX = 100,
  initialY = 70,
  width = 340,
  onReattach,
  onClose,
  children,
}) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: initialX,
    posY: initialY,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 100, dragRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.posY + dy)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
    setIsDragging(true);
  };

  return (
    <div
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${width}px`,
        maxHeight: `calc(100vh - ${Math.min(window.innerHeight - 120, pos.y + 20)}px)`,
      }}
      className="fixed z-40 rounded-2xl bg-[var(--bg-card)] border-2 border-cyan-500/50 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden backdrop-blur-xl animate-fade-in text-[var(--text-primary)]"
    >
      {/* Floating Draggable Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-[var(--border-color)] flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-cyan-400 opacity-80" />
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">{title}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            FLOATING
          </span>
        </div>

        <div className="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={onReattach}
            className="px-2 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
            title="Snap panel back into sidebar dock"
          >
            <CornerDownLeft className="w-3 h-3" />
            <span>Reattach</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Body */}
      <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[70vh]">
        {children}
      </div>
    </div>
  );
};
