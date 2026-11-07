import React, { useEffect, useState } from 'react';
import { useRigStore } from './store/useRigStore';
import { Navbar } from './components/layout/Navbar';
import { ComponentPalette } from './components/palette/ComponentPalette';
import { PlannerCanvas } from './components/canvas/PlannerCanvas';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { LiveMonitorView } from './components/live/LiveMonitorView';
import { LiveMapCanvas } from './components/livemap/LiveMapCanvas';
import { StageDisplaysView } from './components/stage/StageDisplaysView';
import { FullscreenOverlayView } from './components/overlays/FullscreenOverlayView';
import { TestPatternModal } from './components/modals/TestPatternModal';
import { ReconciliationModal } from './components/modals/ReconciliationModal';
import { MobileCompanionModal } from './components/modals/MobileCompanionModal';
import { StageReceiverPairModal } from './components/modals/StageReceiverPairModal';
import { StageLinkModal } from './components/modals/StageLinkModal';
import { AudioConsentModal } from './components/modals/AudioConsentModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { VirtualBranchModal } from './components/modals/VirtualBranchModal';
import { SmartTvGuideModal } from './components/modals/SmartTvGuideModal';
import { EventLogDrawer } from './components/modals/EventLogDrawer';
import { VirtualStageDisplayView } from './components/stage/VirtualStageDisplayView';
import { FloatingPanelWrapper } from './components/common/FloatingPanelWrapper';
import { PanelLeftOpen, PanelRightOpen, AlertTriangle, Volume2, X } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

export const App: React.FC = () => {
  const {
    appMode,
    themeMode,
    paletteDockState,
    setPaletteDockState,
    inspectorDockState,
    setInspectorDockState,
    isMirroringDetected,
    dismissMirroringAlert,
    appSettings,
    audioNotification,
    dismissAudioNotification,
    setSettingsModalOpen,
  } = useRigStore();

  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(340);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const [overlayRoute, setOverlayRoute] = useState<{
    type: 'flash' | 'pattern' | 'virtual_display';
    patternType?: string;
    displayId?: string;
  } | null>(null);

  // Check Tauri Native Window Label and Search/Hash Parameters
  useEffect(() => {
    // 1. Check Tauri Native Window Label
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      import('@tauri-apps/api/webviewWindow')
        .then(({ getCurrentWebviewWindow }) => {
          try {
            const label = getCurrentWebviewWindow().label;
            if (label === 'xteon_virtual_display' || label.startsWith('xteon_virtual_')) {
              setOverlayRoute({ type: 'virtual_display' });
            } else if (label.startsWith('xteon_pattern_')) {
              const parts = label.replace('xteon_pattern_', '').split('_');
              const pattern = parts[0] || 'smpte';
              const disp = parts.slice(1).join('_');
              setOverlayRoute({ type: 'pattern', patternType: pattern, displayId: disp });
            } else if (label.startsWith('xteon_flash_')) {
              const disp = label.replace('xteon_flash_', '');
              setOverlayRoute({ type: 'flash', displayId: disp });
            }
          } catch (e) {}
        })
        .catch(() => {});
    }

    // 2. URL Search & Hash fallback
    let rawQuery = window.location.search;
    if (!rawQuery && window.location.hash) {
      const hash = window.location.hash.replace(/^#\??/, '');
      rawQuery = hash.includes('?') ? hash.substring(hash.indexOf('?')) : `?${hash}`;
    }
    const params = new URLSearchParams(rawQuery);
    const overlay = params.get('overlay');
    if (overlay === 'virtual_display') {
      setOverlayRoute({ type: 'virtual_display' });
    } else if (overlay === 'flash' || overlay === 'pattern') {
      setOverlayRoute({
        type: overlay,
        patternType: params.get('type') || 'smpte',
        displayId: params.get('disp') || '',
      });
    }
  }, []);

  // Resizable Panels Mouse Drag Engine
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        setLeftWidth(Math.max(220, Math.min(500, e.clientX)));
      }
      if (isDraggingRight) {
        setRightWidth(Math.max(260, Math.min(600, window.innerWidth - e.clientX)));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  // Global Keyboard Shortcuts (Toggle Panels Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setPaletteDockState(paletteDockState === 'DOCKED' ? 'COLLAPSED' : 'DOCKED');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paletteDockState, setPaletteDockState]);

  if (overlayRoute) {
    if (overlayRoute.type === 'virtual_display') {
      return <VirtualStageDisplayView />;
    }
    return (
      <FullscreenOverlayView
        type={overlayRoute.type}
        patternType={overlayRoute.patternType}
        displayId={overlayRoute.displayId}
      />
    );
  }

  const getThemeClass = () => {
    switch (themeMode) {
      case 'DAYLIGHT':
        return 'theme-daylight';
      case 'BROADCAST':
        return 'theme-broadcast';
      case 'DARK_FOH':
      default:
        return 'theme-dark';
    }
  };

  return (
    <div className={`w-screen h-screen h-dvh flex flex-col overflow-hidden select-none font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] ${getThemeClass()}`}>
      {/* Top Navbar */}
      <Navbar />

      {/* Presentation Privacy Mirroring Alert Banner */}
      {isMirroringDetected && (appSettings.alertOnDisplayMirroring ?? true) && (
        <div className="bg-[var(--badge-amber-bg)] border-b border-[var(--badge-amber-border)] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[var(--badge-amber-text)] z-20 shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--badge-amber-text)] shrink-0 animate-pulse" />
            <span>
              <strong>PRIVACY WARNING: Display Mirroring (Clone) Active.</strong> Your internal screen is cloned to the external display. Audience can see desktop & private windows.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition"
            >
              Configure Guard
            </button>
            <button
              onClick={dismissMirroringAlert}
              className="p-1 rounded hover:bg-[var(--bg-subcard)] text-[var(--badge-amber-text)] cursor-pointer transition"
              title="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Audio Hijack Route Alert Banner */}
      {audioNotification?.show && (
        <div className="bg-[var(--badge-cyan-bg)] border-b border-[var(--badge-cyan-border)] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[var(--badge-cyan-text)] z-20 shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[var(--badge-cyan-text)] shrink-0" />
            <span>
              <strong>AUDIO ROUTING NOTICE: Audio redirected to "{audioNotification.deviceName}"</strong> via HDMI handshake.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="px-2.5 py-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--badge-cyan-border)] text-[11px] font-bold cursor-pointer transition text-[var(--badge-cyan-text)]"
            >
              Audio Settings
            </button>
            <button
              onClick={dismissAudioNotification}
              className="p-1 rounded hover:bg-[var(--bg-subcard)] text-[var(--badge-cyan-text)] cursor-pointer transition"
              title="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden relative bg-[var(--bg-primary)]">
        {appMode === 'PLANNER' ? (
          <>
            {/* Left Hardware Library (Floating Mode) */}
            {paletteDockState === 'DETACHED' && (
              <FloatingPanelWrapper
                title="Hardware Library"
                initialX={40}
                initialY={70}
                width={320}
                onReattach={() => setPaletteDockState('DOCKED')}
              >
                <ComponentPalette />
              </FloatingPanelWrapper>
            )}

            {/* Left Hardware Library (Collapsed Rail) */}
            {paletteDockState === 'COLLAPSED' && (
              <div className="h-full w-12 bg-[var(--bg-header)] border-r border-[var(--border-color)] flex flex-col items-center py-4 gap-3 shrink-0 z-20">
                <button
                  onClick={() => setPaletteDockState('DOCKED')}
                  className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-cyan-400 border border-[var(--border-color)] transition cursor-pointer shadow-sm"
                  title="Expand Hardware Library (Ctrl+B)"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                <div className="[writing-mode:vertical-lr] text-[10px] font-mono text-[var(--text-muted)] font-bold uppercase tracking-widest mt-2">
                  Library
                </div>
              </div>
            )}

            {/* Left Hardware Library (Docked & Resizable) */}
            {paletteDockState === 'DOCKED' && (
              <div style={{ width: leftWidth }} className="h-full shrink-0 relative flex">
                <ComponentPalette />
                {/* Draggable Splitter Handle Left */}
                <div
                  onMouseDown={() => setIsDraggingLeft(true)}
                  onDoubleClick={() => setLeftWidth(300)}
                  title="Drag to resize / Double-click to reset"
                  className={`w-1.5 hover:w-2 hover:bg-cyan-400/80 cursor-col-resize h-full absolute right-0 top-0 z-20 transition-all ${
                    isDraggingLeft ? 'bg-cyan-400 w-2' : 'bg-transparent'
                  }`}
                />
              </div>
            )}

            {/* Center 2D Infinite Canvas */}
            <div className="flex-1 h-full relative overflow-hidden">
              <PlannerCanvas />
            </div>

            {/* Right Telemetry Inspector (Floating Mode) */}
            {inspectorDockState === 'DETACHED' && (
              <FloatingPanelWrapper
                title="Properties Inspector"
                initialX={typeof window !== 'undefined' ? window.innerWidth - 380 : 800}
                initialY={70}
                width={350}
                onReattach={() => setInspectorDockState('DOCKED')}
              >
                <InspectorPanel />
              </FloatingPanelWrapper>
            )}

            {/* Right Telemetry Inspector (Collapsed Rail) */}
            {inspectorDockState === 'COLLAPSED' && (
              <div className="h-full w-12 bg-[var(--bg-header)] border-l border-[var(--border-color)] flex flex-col items-center py-4 gap-3 shrink-0 z-20">
                <button
                  onClick={() => setInspectorDockState('DOCKED')}
                  className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-cyan-400 border border-[var(--border-color)] transition cursor-pointer shadow-sm"
                  title="Expand Properties Inspector"
                >
                  <PanelRightOpen className="w-4 h-4" />
                </button>
                <div className="[writing-mode:vertical-lr] text-[10px] font-mono text-[var(--text-muted)] font-bold uppercase tracking-widest mt-2">
                  Inspector
                </div>
              </div>
            )}

            {/* Right Telemetry & Properties Inspector (Docked & Resizable) */}
            {inspectorDockState === 'DOCKED' && (
              <div style={{ width: rightWidth }} className="h-full shrink-0 relative flex">
                {/* Draggable Splitter Handle Right */}
                <div
                  onMouseDown={() => setIsDraggingRight(true)}
                  onDoubleClick={() => setRightWidth(340)}
                  title="Drag to resize / Double-click to reset"
                  className={`w-1.5 hover:w-2 hover:bg-cyan-400/80 cursor-col-resize h-full absolute left-0 top-0 z-20 transition-all ${
                    isDraggingRight ? 'bg-cyan-400 w-2' : 'bg-transparent'
                  }`}
                />
                <InspectorPanel />
              </div>
            )}
          </>
        ) : appMode === 'LIVE_MAP' ? (
          /* Live Hardware Topology Map */
          <LiveMapCanvas />
        ) : appMode === 'STAGE_DISPLAYS' ? (
          /* Dedicated Stage Displays & Extended Monitors View */
          <StageDisplaysView />
        ) : (
          /* Live Monitor View */
          <LiveMonitorView />
        )}
      </main>

      {/* Global Modals */}
      <TestPatternModal />
      <ReconciliationModal />
      <MobileCompanionModal />
      <StageReceiverPairModal />
      <StageLinkModal />
      <AudioConsentModal />
      <SettingsModal />
      <VirtualBranchModal />
      <SmartTvGuideModal />
      <EventLogDrawer />
      
      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
};

export default App;
