import React from 'react';
import { useRigStore } from '../../store/useRigStore';
import { CameraStreamPlayer } from '../live/CameraStreamPlayer';
import {
  Monitor,
  Camera,
  Cpu,
  RefreshCw,
  Zap,
  X,
  RotateCcw,
  Activity,
  CheckCircle2,
  PanelRightClose,
  ExternalLink,
  Wifi,
  Snowflake,
  Play,
  Pause,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LiveMapInspector: React.FC = () => {
  const {
    selectedLiveElement,
    selectLiveElement,
    liveDisplays,
    liveCameras,
    updateDisplayAlias,
    updateDisplayStageZone,
    resetDisplayToDefault,
    updateCameraAlias,
    updateCameraStageZone,
    resetCameraToDefault,
    toggleCameraLiveFeed,
    toggleCameraFreeze,
    toggleHideCamera,
    flashDisplay,
    liveMapInspectorDockState,
    setLiveMapInspectorDockState,
  } = useRigStore();

  if (!selectedLiveElement) return null;

  const selectedId = selectedLiveElement.id;

  // 1. Check if selected element is a camera
  const camera = liveCameras.find(
    (c) =>
      c.id === selectedId ||
      c.id === selectedId.replace('cam-node-', '') ||
      c.id === selectedId.replace('edge-cam-', '')
  );

  // 2. Check if selected element is a display
  const display =
    !camera
      ? liveDisplays.find(
          (d) =>
            d.id === selectedId ||
            d.id === selectedId.replace('disp-node-', '') ||
            d.id === selectedId.replace('edge-host-', '')
        ) ||
        (selectedId === 'host-pc'
          ? liveDisplays.find((d) => d.osIndex === 1) || liveDisplays[0]
          : null)
      : null;

  if (!camera && !display) return null;

  // --- CAMERA INSPECTOR VIEW ---
  if (camera) {
    const isWireless = camera.portType === 'WIRELESS';
    const isFeedActive = camera.isLiveFeedEnabled !== false;

    return (
      <div className="w-full bg-[var(--bg-header)] border-l border-[var(--border-color)] p-4 flex flex-col h-full select-none overflow-y-auto text-[var(--text-primary)] font-mono text-xs space-y-4 shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Camera Ingest Inspector
            </span>
          </div>
          <div className="flex items-center gap-1">
            {liveMapInspectorDockState === 'DOCKED' && (
              <>
                <button
                  onClick={() => setLiveMapInspectorDockState('DETACHED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-amber-400 border border-[var(--border-color)] transition cursor-pointer"
                  title="Pop out into floating window"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setLiveMapInspectorDockState('COLLAPSED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-amber-400 border border-[var(--border-color)] transition cursor-pointer"
                  title="Collapse inspector panel"
                >
                  <PanelRightClose className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              onClick={() => selectLiveElement(null, null)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition cursor-pointer"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-muted)] uppercase font-bold">Physical Ingest Link</span>
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>SIGNAL LOCKED</span>
            </span>
          </div>
          <div className="text-xs font-bold text-[var(--text-primary)]">
            {camera.name}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            {camera.resolution.width}x{camera.resolution.height} @ {camera.refreshRateHz} FPS • {camera.portType}
          </div>
        </div>

        {/* Live Camera Viewfinder Box */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-[var(--border-color)] shadow-inner">
          <CameraStreamPlayer
            cameraId={camera.id}
            cameraName={camera.customAlias || camera.name}
            isFrozen={camera.isFrozen}
            isLiveFeedEnabled={isFeedActive}
            onToggleFeed={() => toggleCameraLiveFeed(camera.id)}
          />
          {isFeedActive && (
            <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono text-emerald-400 font-bold">
              LIVE STREAM
            </div>
          )}
        </div>

        {/* Stage Alias & Zone Editor */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
              Custom Camera Alias
            </label>
            <input
              type="text"
              value={camera.customAlias}
              onChange={(e) => updateCameraAlias(camera.id, e.target.value)}
              placeholder="e.g. Pastor Center Cam"
              className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
              Stage Zone / Location
            </label>
            <input
              type="text"
              value={camera.stageZone}
              onChange={(e) => updateCameraStageZone(camera.id, e.target.value)}
              placeholder="e.g. Auditorium Center"
              className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          {/* Reset to Default Button */}
          <button
            onClick={() => resetCameraToDefault(camera.id)}
            className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Reset alias and zone back to original driver name"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Hardware Defaults</span>
          </button>
        </div>

        {/* Hardware Telemetry Specs */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
          <div className="text-[10px] uppercase font-bold text-amber-400">Driver & Device Specs</div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <div className="text-[var(--text-muted)]">Vendor</div>
              <div className="font-bold text-[var(--text-primary)] truncate">{camera.vendor}</div>
            </div>
            <div>
              <div className="text-[var(--text-muted)]">Port Protocol</div>
              <div className="font-bold text-[var(--text-primary)]">{camera.portType}</div>
            </div>
            <div>
              <div className="text-[var(--text-muted)]">Resolution</div>
              <div className="font-bold text-[var(--text-primary)]">{camera.resolution.width}x{camera.resolution.height}</div>
            </div>
            <div>
              <div className="text-[var(--text-muted)]">Frame Rate</div>
              <div className="font-bold text-[var(--text-primary)]">{camera.refreshRateHz} FPS</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => toggleCameraFreeze(camera.id)}
              disabled={!isFeedActive}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                !isFeedActive
                  ? 'opacity-40 cursor-not-allowed bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)]'
                  : camera.isFrozen
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border-[var(--border-color)]'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>{camera.isFrozen ? 'Unfreeze' : 'Freeze'}</span>
            </button>

            <button
              onClick={() => toggleCameraLiveFeed(camera.id)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                !isFeedActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border-[var(--border-color)]'
              }`}
            >
              {!isFeedActive ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{!isFeedActive ? 'Engage Stream' : 'Sensor Standby'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              toggleHideCamera(camera.id);
              selectLiveElement(null, null);
            }}
            className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-subcard)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-300 border border-[var(--border-color)] hover:border-rose-500/40 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Hide this camera from Live Map and Live Monitor"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Hide this Camera Feed</span>
          </button>
        </div>
      </div>
    );
  }

  // --- DISPLAY INSPECTOR VIEW ---
  return (
    <div className="w-full bg-[var(--bg-header)] border-l border-[var(--border-color)] p-4 flex flex-col h-full select-none overflow-y-auto text-[var(--text-primary)] font-mono text-xs space-y-4 shadow-2xl animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Live Display Inspector
          </span>
        </div>
        <div className="flex items-center gap-1">
          {liveMapInspectorDockState === 'DOCKED' && (
            <>
              <button
                onClick={() => setLiveMapInspectorDockState('DETACHED')}
                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                title="Pop out into floating window"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => setLiveMapInspectorDockState('COLLAPSED')}
                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                title="Collapse inspector panel"
              >
                <PanelRightClose className="w-3 h-3" />
              </button>
            </>
          )}
          <button
            onClick={() => selectLiveElement(null, null)}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition cursor-pointer"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Status Pill */}
      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--text-muted)] uppercase font-bold">Physical Connection</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SIGNAL LOCKED</span>
          </span>
        </div>
        <div className="text-xs font-bold text-[var(--text-primary)]">
          Screen {display!.osIndex}: {display!.name}
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          {display!.activeResolution.width}x{display!.activeResolution.height} @ {display!.refreshRateHz}Hz • {display!.portType}
        </div>
      </div>

      {/* Stage Alias & Zone Editor */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
            Custom Stage Alias Name
          </label>
          <input
            type="text"
            value={display!.customAlias}
            onChange={(e) => updateDisplayAlias(display!.id, e.target.value)}
            placeholder="e.g. Stage Left IMAG Projector"
            className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
            Stage Zone / Location
          </label>
          <input
            type="text"
            value={display!.stageZone}
            onChange={(e) => updateDisplayStageZone(display!.id, e.target.value)}
            placeholder="e.g. Downstage Left"
            className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Reset to Default Button */}
        <button
          onClick={() => resetDisplayToDefault(display!.id)}
          className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] text-[11px] font-bold transition flex items-center justify-center gap-1.5"
          title="Reset alias and zone back to original Windows driver name"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Hardware Defaults</span>
        </button>
      </div>

      {/* Hardware Telemetry Specs */}
      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
        <div className="text-[10px] uppercase font-bold text-cyan-400">Driver & Hardware Specs</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <div className="text-[var(--text-muted)]">Vendor</div>
            <div className="font-bold text-[var(--text-primary)] truncate">{display!.vendor}</div>
          </div>
          <div>
            <div className="text-[var(--text-muted)]">Port Protocol</div>
            <div className="font-bold text-[var(--text-primary)]">{display!.portType}</div>
          </div>
          <div>
            <div className="text-[var(--text-muted)]">Color Space</div>
            <div className="font-bold text-[var(--text-primary)]">{display!.colorSpace}</div>
          </div>
          <div>
            <div className="text-[var(--text-muted)]">Serial / ID</div>
            <div className="font-bold text-[var(--text-primary)] truncate">{display!.serial}</div>
          </div>
        </div>
      </div>

      {/* Direct Hardware Triggers */}
      <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
        <button
          onClick={() => flashDisplay(display!.id)}
          className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Flash Physical Screen</span>
        </button>
      </div>
    </div>
  );
};
