import React, { useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { CameraStreamPlayer } from '../live/CameraStreamPlayer';
import {
  Monitor,
  Camera,
  Zap,
  X,
  RotateCcw,
  PanelRightClose,
  ExternalLink,
  Snowflake,
  Play,
  Pause,
  Eye,
  EyeOff,
  Split,
  Tv,
  Sparkles,
  Radio,
  QrCode,
  Edit2,
  Send,
  AppWindow,
} from 'lucide-react';

export const LiveMapInspector: React.FC = () => {
  const {
    selectedLiveElement,
    selectLiveElement,
    liveDisplays,
    liveCameras,
    stageLinkSlots,
    osWindows,
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
    distributionBranches,
    openBranchModal,
    removeDistributionBranch,
    setSmartTvGuideModalOpen,
    openStageLinkModal,
    openQrForStageSlot,
    flashStageLinkSlot,
    setStageLinkSlotFreeze,
    setStageLinkSlotBlackout,
    sendStageLinkWhisper,
    clearStageLinkWhisper,
    routeOsWindow,
  } = useRigStore();

  const [whisperText, setWhisperText] = useState('');
  const [selectedWinId, setSelectedWinId] = useState('');

  if (!selectedLiveElement) return null;

  const selectedId = selectedLiveElement.id;

  // 1. Check if selected element is a Wireless StageLink slot
  const stageSlot = stageLinkSlots.find(
    (s) =>
      s.id === selectedId ||
      s.id === selectedId.replace('stage-node-', '') ||
      s.id === selectedId.replace('edge-stage-', '')
  );

  // 2. Check if selected element is a camera
  const camera = !stageSlot
    ? liveCameras.find(
        (c) =>
          c.id === selectedId ||
          c.id === selectedId.replace('cam-node-', '') ||
          c.id === selectedId.replace('edge-cam-', '')
      )
    : null;

  // 3. Check if selected element is a display
  const display =
    !stageSlot && !camera
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

  if (!stageSlot && !camera && !display) {
    return (
      <div className="w-full bg-[var(--bg-header)] p-4 flex flex-col h-full select-none text-[var(--text-primary)] font-mono text-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <span className="font-bold text-[var(--text-muted)]">Live Inspector</span>
          <button
            onClick={() => selectLiveElement(null, null)}
            className="p-1 rounded hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] cursor-pointer"
          >
            ✕
          </button>
        </div>
        <p className="text-[var(--text-muted)] text-[11px]">Select a display, camera, or StageLink slot to inspect live hardware telemetry.</p>
      </div>
    );
  }

  // --- WIRELESS STAGELINK INSPECTOR VIEW ---
  if (stageSlot) {
    return (
      <div className="w-full bg-[var(--bg-header)] border-l border-[var(--border-color)] p-4 flex flex-col h-full select-none overflow-y-auto text-[var(--text-primary)] font-mono text-xs space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[var(--accent-emerald)]" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              StageLink Inspector
            </span>
          </div>
          <div className="flex items-center gap-1">
            {liveMapInspectorDockState === 'DOCKED' && (
              <>
                <button
                  onClick={() => setLiveMapInspectorDockState('DETACHED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-pointer"
                  title="Pop out into floating window"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setLiveMapInspectorDockState('COLLAPSED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-pointer"
                  title="Collapse inspector panel"
                >
                  <PanelRightClose className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              onClick={() => selectLiveElement(null, null)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-muted)] uppercase font-bold">Wireless Confidence Link</span>
            <span className="text-[var(--badge-emerald-text)] font-bold">
              {stageSlot.connected_clients} LIVE
            </span>
          </div>
          <div className="text-xs font-bold text-[var(--text-primary)]">{stageSlot.name}</div>
          <div className="text-[10px] text-[var(--text-muted)]">
            📍 {stageSlot.stage_zone} • {stageSlot.source_mode} ({stageSlot.max_width}w @ {stageSlot.target_fps} FPS)
          </div>
        </div>

        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-[var(--border-color)] flex items-center justify-center">
          {stageSlot.preview_data_url ? (
            <img src={stageSlot.preview_data_url} alt={stageSlot.name} className="w-full h-full object-contain" />
          ) : (
            <div className="text-[11px] text-slate-400 p-4 text-center">
              Scan QR code on stage tablet to begin streaming
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openQrForStageSlot(stageSlot.id)}
            className="min-h-[38px] py-2 px-3 rounded-xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Pair QR</span>
          </button>
          <button
            onClick={() => openStageLinkModal(stageSlot.id)}
            className="min-h-[38px] py-2 px-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Source</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => flashStageLinkSlot(stageSlot.id)}
            className="min-h-[36px] rounded-lg bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Zap className="w-3 h-3" />
            <span>Flash</span>
          </button>
          <button
            onClick={() => setStageLinkSlotFreeze(stageSlot.id, !stageSlot.is_frozen)}
            className="min-h-[36px] rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Snowflake className="w-3 h-3" />
            <span>{stageSlot.is_frozen ? 'Unfrz' : 'Freeze'}</span>
          </button>
          <button
            onClick={() => setStageLinkSlotBlackout(stageSlot.id, !stageSlot.is_blackout)}
            className="min-h-[36px] rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            {stageSlot.is_blackout ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{stageSlot.is_blackout ? 'Show' : 'Black'}</span>
          </button>
        </div>

        {/* Stage Whisper Quick Sender */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--accent-cyan)]">Stage Whisper</span>
            {stageSlot.active_whisper && (
              <button
                onClick={() => clearStageLinkWhisper(stageSlot.id)}
                className="text-[10px] text-[var(--badge-rose-text)] font-bold cursor-pointer"
              >
                Clear Active
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={whisperText}
              onChange={(e) => setWhisperText(e.target.value)}
              placeholder="Message to pulpit..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && whisperText.trim()) {
                  sendStageLinkWhisper(stageSlot.id, whisperText, 'WARN', 25);
                  setWhisperText('');
                }
              }}
              className="flex-1 min-w-0 min-h-[34px] px-2.5 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs"
            />
            <button
              onClick={() => {
                if (whisperText.trim()) {
                  sendStageLinkWhisper(stageSlot.id, whisperText, 'WARN', 25);
                  setWhisperText('');
                }
              }}
              className="min-h-[34px] px-2.5 rounded-lg bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] font-bold cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- CAMERA INSPECTOR VIEW ---
  if (camera) {
    const isFeedActive = camera.isLiveFeedEnabled !== false;

    return (
      <div className="w-full bg-[var(--bg-header)] border-l border-[var(--border-color)] p-4 flex flex-col h-full select-none overflow-y-auto text-[var(--text-primary)] font-mono text-xs space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[var(--accent-amber)]" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Camera Ingest Inspector
            </span>
          </div>
          <div className="flex items-center gap-1">
            {liveMapInspectorDockState === 'DOCKED' && (
              <>
                <button
                  onClick={() => setLiveMapInspectorDockState('DETACHED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] border border-[var(--border-color)] transition cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setLiveMapInspectorDockState('COLLAPSED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] border border-[var(--border-color)] transition cursor-pointer"
                >
                  <PanelRightClose className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              onClick={() => selectLiveElement(null, null)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-muted)] uppercase font-bold">Physical Ingest Link</span>
            <span className="text-[var(--accent-amber)] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-amber)] animate-pulse" />
              <span>SIGNAL LOCKED</span>
            </span>
          </div>
          <div className="text-xs font-bold text-[var(--text-primary)]">{camera.name}</div>
          <div className="text-[10px] text-[var(--text-muted)]">
            {camera.resolution.width}x{camera.resolution.height} @ {camera.refreshRateHz} FPS • {camera.portType}
          </div>
        </div>

        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-[var(--border-color)] shadow-inner">
          <CameraStreamPlayer
            cameraId={camera.id}
            cameraName={camera.customAlias || camera.name}
            isFrozen={camera.isFrozen}
            isLiveFeedEnabled={isFeedActive}
            onToggleFeed={() => toggleCameraLiveFeed(camera.id)}
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
              Custom Camera Alias
            </label>
            <input
              type="text"
              value={camera.customAlias}
              onChange={(e) => updateCameraAlias(camera.id, e.target.value)}
              className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono"
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
              className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono"
            />
          </div>

          <button
            onClick={() => resetCameraToDefault(camera.id)}
            className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Hardware Defaults</span>
          </button>
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => toggleCameraFreeze(camera.id)}
              disabled={!isFeedActive}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                !isFeedActive
                  ? 'opacity-40 cursor-not-allowed bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)]'
                  : camera.isFrozen
                  ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)]'
                  : 'bg-[var(--bg-subcard)] text-[var(--text-primary)] border-[var(--border-color)]'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>{camera.isFrozen ? 'Unfreeze' : 'Freeze'}</span>
            </button>

            <button
              onClick={() => toggleCameraLiveFeed(camera.id)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                !isFeedActive
                  ? 'bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border-[var(--badge-emerald-border)]'
                  : 'bg-[var(--bg-subcard)] text-[var(--text-primary)] border-[var(--border-color)]'
              }`}
            >
              {!isFeedActive ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{!isFeedActive ? 'Engage' : 'Standby'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              toggleHideCamera(camera.id);
              selectLiveElement(null, null);
            }}
            className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--badge-rose-bg)] text-[var(--text-muted)] hover:text-[var(--badge-rose-text)] border border-[var(--border-color)] text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Hide this Camera Feed</span>
          </button>
        </div>
      </div>
    );
  }

  // --- DISPLAY INSPECTOR VIEW ---
  const routableWins = osWindows.filter((w) => !w.is_xteon_self);
  const activeWinChoice = selectedWinId || routableWins[0]?.hwnd_id || '';

  return (
    <div className="w-full bg-[var(--bg-header)] border-l border-[var(--border-color)] p-4 flex flex-col h-full select-none overflow-y-auto text-[var(--text-primary)] font-mono text-xs space-y-4 shadow-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Live Display Inspector
          </span>
        </div>
        <div className="flex items-center gap-1">
          {liveMapInspectorDockState === 'DOCKED' && (
            <>
              <button
                onClick={() => setLiveMapInspectorDockState('DETACHED')}
                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] border border-[var(--border-color)] transition cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => setLiveMapInspectorDockState('COLLAPSED')}
                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] border border-[var(--border-color)] transition cursor-pointer"
              >
                <PanelRightClose className="w-3 h-3" />
              </button>
            </>
          )}
          <button
            onClick={() => selectLiveElement(null, null)}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--text-muted)] uppercase font-bold">Physical Connection</span>
          <span className="text-[var(--accent-emerald)] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
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

      <div className="space-y-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
            Custom Stage Alias Name
          </label>
          <input
            type="text"
            value={display!.customAlias}
            onChange={(e) => updateDisplayAlias(display!.id, e.target.value)}
            className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono"
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
            className="w-full mt-1 bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono"
          />
        </div>

        <button
          onClick={() => resetDisplayToDefault(display!.id)}
          className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Hardware Defaults</span>
        </button>
      </div>

      {/* Quick OS Window Director */}
      {routableWins.length > 0 && (
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-[var(--accent-cyan)] flex items-center gap-1.5">
            <AppWindow className="w-3.5 h-3.5" />
            <span>OS Window Director</span>
          </div>
          <select
            value={activeWinChoice}
            onChange={(e) => setSelectedWinId(e.target.value)}
            className="w-full min-h-[36px] px-2 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px]"
          >
            {routableWins.map((w) => (
              <option key={w.hwnd_id} value={w.hwnd_id}>
                {w.title} ({w.process_name})
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (activeWinChoice) {
                routeOsWindow(activeWinChoice, display!.id, display!.osIndex > 1, display!.osIndex > 1);
              }
            }}
            className="w-full min-h-[36px] py-1.5 px-3 rounded-xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] text-[11px] font-bold cursor-pointer"
          >
            Teleport Window to This Screen
          </button>
        </div>
      )}

      {/* Hardware Distribution (Splitter / DA) */}
      {(() => {
        const branch = distributionBranches[display!.id];
        return (
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase font-bold text-[var(--accent-amber)] flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5" />
                <span>Hardware Distribution (Splitter / DA)</span>
              </div>
              {branch && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)] font-bold">
                  {branch.splitterType.replace('_', ' ')}
                </span>
              )}
            </div>

            {branch ? (
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-[var(--text-primary)]">
                  {branch.splitterModel}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openBranchModal(display!.id)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[var(--bg-subcard)] text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-bold cursor-pointer"
                  >
                    Edit Splitter
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Remove virtual splitter branching on this feed?')) {
                        removeDistributionBranch(display!.id);
                      }
                    }}
                    className="py-1.5 px-2 rounded-lg bg-[var(--badge-rose-bg)] text-[var(--badge-rose-text)] border border-[var(--badge-rose-border)] text-[10px] font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openBranchModal(display!.id)}
                className="w-full py-2 px-3 rounded-xl bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)] text-[11px] font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Branch Output (Add Splitter / DA)</span>
              </button>
            )}
          </div>
        );
      })()}

      {/* Smart TV Pre-Flight Setup Card */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
        <div className="text-[10px] uppercase font-bold text-[var(--accent-cyan)] flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5" />
          <span>Smart TV Field Calibration</span>
        </div>
        <button
          onClick={() => setSmartTvGuideModalOpen(true)}
          className="w-full py-2 px-2 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-[var(--accent-cyan)]" />
          <span>Open Smart TV Setup Guide</span>
        </button>
      </div>

      <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
        <button
          onClick={() => flashDisplay(display!.id)}
          className="w-full py-2 px-3 rounded-xl bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>Flash Physical Screen</span>
        </button>
      </div>
    </div>
  );
};
