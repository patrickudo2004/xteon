import React, { useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { LiveDisplay, LiveCamera, StageLinkSlot } from '../../types';
import { getPortIcon, StatusShapeIcon } from '../common/SvgIcons';
import { CameraStreamPlayer } from './CameraStreamPlayer';
import { CameraIngestModal } from './CameraIngestModal';
import {
  Zap,
  Sliders,
  Volume2,
  Snowflake,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  MonitorCheck,
  MousePointer,
  Mic,
  Camera,
  Tv,
  Edit2,
  EyeOff,
  ShieldCheck,
  Radio,
  Plus,
  QrCode,
  Trash2,
  MessageSquare,
  Send,
  X,
  AppWindow,
  Pin,
  CornerUpLeft,
  Maximize2,
  AlertTriangle,
  Users,
  Eye,
} from 'lucide-react';

export const LiveMonitorView: React.FC = () => {
  const {
    liveDisplays,
    liveCameras,
    stageLinkSlots,
    osWindows,
    flashDisplay,
    openTestPatternModal,
    toggleDisplayFreeze,
    toggleLiveFeed,
    setAllLiveFeeds,
    updateDisplayAlias,
    updateCameraAlias,
    toggleCameraLiveFeed,
    toggleCameraFreeze,
    toggleHideCamera,
    showHiddenCameras,
    setCameraIngestModalOpen,
    setReconciliationModalOpen,
    setMobileModalOpen,
    refreshLiveDisplays,
    refreshLiveCameras,
    refreshOsWindows,
    refreshStageLinkSlots,
    openStageLinkModal,
    openQrForStageSlot,
    deleteStageLinkSlot,
    setStageLinkSlotFreeze,
    setStageLinkSlotBlackout,
    flashStageLinkSlot,
    sendStageLinkWhisper,
    clearStageLinkWhisper,
    routeOsWindow,
    unrouteOsWindow,
    setOsWindowPinned,
    restoreOsWindowBehind,
    recallStrayOsWindows,
    audioMonitoringAllowed,
    isLiveAudioActive,
    startSystemAudioCapture,
    stopSystemAudioCapture,
    showCursorInPreviews,
    setShowCursorInPreviews,
  } = useRigStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'STAGELINK' | 'DISPLAYS' | 'CAMERAS'>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingCamId, setEditingCamId] = useState<string | null>(null);
  const [editCamValue, setEditCamValue] = useState('');

  // Per-slot Stage Whisper draft state
  const [whisperDrafts, setWhisperDrafts] = useState<Record<string, string>>({});
  const [whisperTones, setWhisperTones] = useState<Record<string, 'INFO' | 'WARN' | 'CRITICAL'>>({});

  // Per-display OS Window Router drawer state
  const [openRouterDisplayId, setOpenRouterDisplayId] = useState<string | null>(null);
  const [selectedWindowByDisp, setSelectedWindowByDisp] = useState<Record<string, string>>({});
  const [borderlessByDisp, setBorderlessByDisp] = useState<Record<string, boolean>>({});
  const [pinByDisp, setPinByDisp] = useState<Record<string, boolean>>({});
  const [recallFeedback, setRecallFeedback] = useState<string | null>(null);

  const handleStartEdit = (disp: LiveDisplay) => {
    setEditingId(disp.id);
    setEditValue(disp.customAlias);
  };

  const handleSaveEdit = (dispId: string) => {
    if (editValue.trim()) {
      updateDisplayAlias(dispId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleStartCamEdit = (cam: LiveCamera) => {
    setEditingCamId(cam.id);
    setEditCamValue(cam.customAlias);
  };

  const handleSaveCamEdit = (camId: string) => {
    if (editCamValue.trim()) {
      updateCameraAlias(camId, editCamValue.trim());
    }
    setEditingCamId(null);
  };

  const handleRecallStray = async () => {
    const count = await recallStrayOsWindows();
    setRecallFeedback(count > 0 ? `Recalled ${count} window${count > 1 ? 's' : ''}` : 'Stage Clean');
    setTimeout(() => setRecallFeedback(null), 2600);
  };

  const extractHwndFromId = (sourceId?: string | null): string | null => {
    if (!sourceId) return null;
    if (sourceId.startsWith('W:')) return sourceId.slice(2);
    if (!sourceId.startsWith('D:')) return sourceId;
    return null;
  };

  const allFeedsPaused = liveDisplays.length > 0 && liveDisplays.every((d) => d.isLiveFeedEnabled === false);
  const visibleCameras = liveCameras.filter((c) => showHiddenCameras || !c.isHidden);
  const hiddenCamerasCount = liveCameras.filter((c) => c.isHidden).length;
  const routableWindows = osWindows.filter((w) => !w.is_xteon_self);

  const showStageLink = activeTab === 'ALL' || activeTab === 'STAGELINK';
  const showDisplays = activeTab === 'ALL' || activeTab === 'DISPLAYS';
  const showCameras = activeTab === 'ALL' || activeTab === 'CAMERAS';

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 overflow-y-auto select-none">
      {/* Top Banner with Comprehensive Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
            <h1 className="text-lg sm:text-xl font-bold font-mono text-[var(--text-primary)]">
              LIVE HARDWARE MULTIVIEW & STAGELINK
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
            {liveDisplays.length} Physical Screens • {stageLinkSlots.length} Wireless StageLink • {visibleCameras.length} Cameras
            {hiddenCamerasCount > 0 && ` (${hiddenCamerasCount} hidden)`}
          </p>
        </div>

        {/* Global Responsive Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Source / Sink Filter Tabs */}
          <div className="flex flex-wrap items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 text-xs font-mono gap-0.5">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg transition font-bold cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All ({liveDisplays.length + stageLinkSlots.length + visibleCameras.length})
            </button>
            <button
              onClick={() => setActiveTab('STAGELINK')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg transition font-bold cursor-pointer flex items-center gap-1 ${
                activeTab === 'STAGELINK'
                  ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>StageLink ({stageLinkSlots.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('DISPLAYS')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg transition font-bold cursor-pointer ${
                activeTab === 'DISPLAYS'
                  ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Displays ({liveDisplays.length})
            </button>
            <button
              onClick={() => setActiveTab('CAMERAS')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg transition font-bold cursor-pointer ${
                activeTab === 'CAMERAS'
                  ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Cameras ({visibleCameras.length})
            </button>
          </div>

          {/* + Wireless StageLink Button */}
          <button
            onClick={() => openStageLinkModal(null)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--badge-cyan-bg)] hover:opacity-90 border border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Stream Kairon Timer, ProPresenter, or Split Confidence view wirelessly to any tablet or phone"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Wireless Stage</span>
          </button>

          {/* Emergency Recall Stray Windows to FOH */}
          <button
            onClick={handleRecallStray}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--badge-amber-bg)] hover:opacity-90 border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Pull all unpinned desktop windows off external stage screens back to your FOH laptop display"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
            <span>{recallFeedback || 'Recall Stray Windows'}</span>
          </button>

          {/* Camera Ingest & Privacy Manager Drawer Button */}
          <button
            onClick={() => setCameraIngestModalOpen(true)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Configure camera hardware, mute laptop webcams & hide virtual drivers"
          >
            <Sliders className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            <span>Ingest</span>
            {hiddenCamerasCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] text-[10px]">
                {hiddenCamerasCount}
              </span>
            )}
          </button>

          {/* Mouse Cursor Exposure Toggle */}
          <button
            onClick={() => setShowCursorInPreviews(!showCursorInPreviews)}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
              showCursorInPreviews
                ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)]'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-subcard)]'
            }`}
            title="Toggle mouse cursor exposure in live preview feeds"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Cursor: {showCursorInPreviews ? 'ON' : 'OFF'}</span>
          </button>

          {/* Real Audio Loopback Native WASAPI Toggle */}
          <button
            onClick={() => {
              if (isLiveAudioActive) {
                stopSystemAudioCapture();
              } else {
                startSystemAudioCapture();
              }
            }}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
              isLiveAudioActive
                ? 'bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border-[var(--badge-emerald-border)] animate-pulse'
                : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-subcard)]'
            }`}
            title="Attach native Windows WASAPI master audio to VU level meters"
          >
            {isLiveAudioActive ? <Volume2 className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isLiveAudioActive ? 'Audio: LIVE' : 'Audio'}</span>
          </button>

          {/* Master Live Feeds Pause / Resume Toggle */}
          <button
            onClick={() => setAllLiveFeeds(allFeedsPaused)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Pause or resume live screen captures to optimize PC performance"
          >
            {allFeedsPaused ? (
              <>
                <Play className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Rescan Hardware Button */}
          <button
            onClick={() => {
              refreshLiveDisplays();
              refreshLiveCameras();
              refreshOsWindows();
              refreshStageLinkSlots(true);
            }}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Scan for newly connected monitors, open app windows, or USB cameras"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span>Rescan</span>
          </button>

          {/* Plan-to-Live Reconciliation */}
          <button
            onClick={() => setReconciliationModalOpen(true)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reconcile</span>
          </button>

          {/* Mobile QR Pairing */}
          <button
            onClick={() => setMobileModalOpen(true)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--accent-cyan)] font-bold text-xs font-mono transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Open Wireless QR Pairing for Remote & Stage Tablets"
          >
            <MonitorCheck className="w-3.5 h-3.5" />
            <span>Pair QR</span>
          </button>
        </div>
      </div>

      {/* --- WIRELESS STAGELINK CONFIDENCE MONITORS SECTION --- */}
      {showStageLink && (stageLinkSlots.length > 0 || activeTab === 'STAGELINK') && (
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              <Radio className="w-4 h-4" />
              <span>WIRELESS STAGELINK CONFIDENCE MONITORS ({stageLinkSlots.length})</span>
            </div>
            <button
              onClick={() => openStageLinkModal(null)}
              className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Wireless Stage</span>
            </button>
          </div>

          {stageLinkSlots.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] flex items-center justify-center text-[var(--accent-cyan)]">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  Turn Any Tablet or Phone Into a Wireless Pulpit / Stage Monitor
                </div>
                <div className="font-mono text-xs text-[var(--text-muted)] mt-1 max-w-lg">
                  Stream an individual app window (like <strong>Kairon Countdown Timer</strong> or <strong>ProPresenter</strong>), a 2-in-1 Split Confidence view, or any screen over local Wi-Fi, Hotspot, or USB Tether—zero mobile app installation required.
                </div>
              </div>
              <button
                onClick={() => openStageLinkModal(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Wireless Stage Monitor</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stageLinkSlots.map((slot) => {
                const rawHwnd = extractHwndFromId(slot.primary_source_id);
                    const rawSecHwnd = extractHwndFromId(slot.secondary_source_id);
                    const primWin = osWindows.find((w) => w.hwnd_id === rawHwnd);
                    const secWin = osWindows.find((w) => w.hwnd_id === rawSecHwnd);
                    const isMinimized = slot.source_minimized || primWin?.is_minimized || secWin?.is_minimized;
                    const restoreHwndTarget = (primWin?.is_minimized ? rawHwnd : (secWin?.is_minimized ? rawSecHwnd : (rawHwnd || rawSecHwnd)));
                const whisperText = whisperDrafts[slot.id] || '';
                const whisperTone = whisperTones[slot.id] || 'WARN';

                return (
                  <div
                    key={slot.id}
                    className={`rounded-2xl bg-[var(--bg-card)] border-2 shadow-xl overflow-hidden transition-all flex flex-col ${
                      slot.is_blackout
                        ? 'border-[var(--badge-rose-border)]'
                        : slot.is_frozen
                        ? 'border-[var(--badge-cyan-border)]'
                        : 'border-[var(--border-color)]'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] flex items-center justify-center text-[var(--accent-cyan)] shrink-0">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-sm font-bold text-[var(--text-primary)] truncate flex items-center gap-1.5">
                            <span>{slot.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] font-bold">
                              {slot.source_mode}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                            📍 {slot.stage_zone} • {slot.primary_source_label}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1 ${
                            slot.connected_clients > 0
                              ? 'bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border-[var(--badge-emerald-border)]'
                              : 'bg-[var(--bg-subcard)] text-[var(--text-muted)] border-[var(--border-color)]'
                          }`}
                          title="Live connected stage tablets/browsers"
                        >
                          <Users className="w-3 h-3" />
                          <span>
                            {slot.connected_clients > 0 ? `${slot.connected_clients} LIVE` : 'IDLE (0% CPU)'}
                          </span>
                        </span>

                        <button
                          onClick={() => openQrForStageSlot(slot.id)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                          title="Show QR Code for stage tablet"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR</span>
                        </button>

                        <button
                          onClick={() => openStageLinkModal(slot.id)}
                          className="min-h-[32px] min-w-[32px] p-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center cursor-pointer"
                          title="Edit StageLink source & layout"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete wireless stage monitor "${slot.name}"?`)) {
                              deleteStageLinkSlot(slot.id);
                            }
                          }}
                          className="min-h-[32px] min-w-[32px] p-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--badge-rose-bg)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--badge-rose-text)] flex items-center justify-center cursor-pointer"
                          title="Remove StageLink slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Minimized-Window Guard Alert Banner */}
                    {isMinimized && restoreHwndTarget && (
                      <div className="px-3.5 py-2 bg-[var(--badge-amber-bg)] border-b border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Source window minimized — holding last clean frame on pulpit</span>
                        </div>
                        <button
                          onClick={() => restoreOsWindowBehind(restoreHwndTarget)}
                          className="min-h-[30px] px-2.5 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] font-bold cursor-pointer"
                        >
                          Restore Behind
                        </button>
                      </div>
                    )}

                    {slot.source_missing && (
                      <div className="px-3.5 py-2 bg-[var(--badge-rose-bg)] border-b border-[var(--badge-rose-border)] text-[var(--badge-rose-text)] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Source window closed — holding last frame</span>
                        </div>
                        <button
                          onClick={() => openStageLinkModal(slot.id)}
                          className="min-h-[30px] px-2.5 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--badge-rose-border)] text-[var(--badge-rose-text)] font-bold cursor-pointer"
                        >
                          Rebind Source
                        </button>
                      </div>
                    )}

                    {/* Video Preview Well */}
                    <div className="relative aspect-video max-h-[320px] w-full bg-[#050608] flex items-center justify-center overflow-hidden border-b border-[var(--border-color)]">
                      {slot.is_blackout ? (
                        <div className="text-center space-y-2 p-4 font-mono">
                          <EyeOff className="w-7 h-7 text-rose-400 mx-auto" />
                          <div className="text-xs font-bold text-rose-300">STAGE BLACKOUT ACTIVE</div>
                          <div className="text-[10px] text-slate-400">Tablet screen is blanked to pure OLED black</div>
                        </div>
                      ) : slot.preview_data_url ? (
                        <img
                          src={slot.preview_data_url}
                          alt={slot.name}
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : (
                        <div className="text-center space-y-2 p-6 font-mono">
                          <QrCode className="w-8 h-8 text-cyan-400 mx-auto opacity-80" />
                          <div className="text-xs font-bold text-slate-200">{slot.name} Ready</div>
                          <div className="text-[11px] text-slate-400">
                            Scan QR on stage tablet to begin {slot.target_fps} FPS stream
                          </div>
                        </div>
                      )}

                      {/* Active Stage Whisper Preview Banner */}
                      {slot.active_whisper && (
                        <div className="absolute top-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-amber-500/95 text-slate-950 font-mono text-xs font-bold flex items-center justify-between gap-2 shadow-lg">
                          <span className="truncate">
                            💬 [{slot.active_whisper.tone}] {slot.active_whisper.message}
                          </span>
                          <button
                            onClick={() => clearStageLinkWhisper(slot.id)}
                            className="p-0.5 rounded bg-black/15 hover:bg-black/25 cursor-pointer shrink-0"
                            title="Dismiss Stage Whisper"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Telemetry Badge */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2">
                        <span>{slot.max_width}w</span>
                        <span className="opacity-40">•</span>
                        <span>{slot.connected_clients > 0 ? (slot.live_fps === 0 ? '0 FPS (Static)' : `${slot.live_fps} FPS`) : `${slot.target_fps} FPS cap`}</span>
                        {slot.source_mode === 'SPLIT' && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="text-cyan-400 font-bold">{slot.split_layout.replace('_', ' ')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Controls + FOH Stage Whisper */}
                    <div className="p-3.5 bg-[var(--bg-card)] space-y-3 font-mono text-xs">
                      {/* Hardware-style Transport Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => flashStageLinkSlot(slot.id)}
                          className="flex-1 min-h-[36px] py-1.5 px-2.5 rounded-lg bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Flash</span>
                        </button>

                        <button
                          onClick={() => setStageLinkSlotFreeze(slot.id, !slot.is_frozen)}
                          className={`min-h-[36px] py-1.5 px-3 rounded-lg border font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            slot.is_frozen
                              ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)]'
                              : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-primary)]'
                          }`}
                        >
                          <Snowflake className="w-3.5 h-3.5" />
                          <span>{slot.is_frozen ? 'Frozen' : 'Freeze'}</span>
                        </button>

                        <button
                          onClick={() => setStageLinkSlotBlackout(slot.id, !slot.is_blackout)}
                          className={`min-h-[36px] py-1.5 px-3 rounded-lg border font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            slot.is_blackout
                              ? 'bg-[var(--badge-rose-bg)] border-[var(--badge-rose-border)] text-[var(--badge-rose-text)]'
                              : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-primary)]'
                          }`}
                        >
                          {slot.is_blackout ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{slot.is_blackout ? 'Restore' : 'Blackout'}</span>
                        </button>
                      </div>

                      {/* FOH Stage Whisper Messenger */}
                      <div className="pt-2.5 border-t border-[var(--border-color)] space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-[var(--accent-cyan)]" />
                            <span>Stage Whisper Overlay</span>
                          </span>
                          <div className="flex flex-wrap items-center gap-1">
                            {['2m Left', 'Wrap Up', 'Mic Muted'].map((preset) => (
                              <button
                                key={preset}
                                onClick={() =>
                                  sendStageLinkWhisper(
                                    slot.id,
                                    preset,
                                    preset === 'Wrap Up' ? 'CRITICAL' : 'WARN',
                                    20
                                  )
                                }
                                className="px-2 py-0.5 rounded bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] font-bold cursor-pointer"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={whisperTone}
                            onChange={(e) =>
                              setWhisperTones({
                                ...whisperTones,
                                [slot.id]: e.target.value as 'INFO' | 'WARN' | 'CRITICAL',
                              })
                            }
                            className="min-h-[36px] px-2 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] text-[10px] font-bold"
                          >
                            <option value="INFO">INFO</option>
                            <option value="WARN">WARN</option>
                            <option value="CRITICAL">URGENT</option>
                          </select>

                          <input
                            type="text"
                            value={whisperText}
                            onChange={(e) =>
                              setWhisperDrafts({ ...whisperDrafts, [slot.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && whisperText.trim()) {
                                sendStageLinkWhisper(slot.id, whisperText, whisperTone, 25);
                                setWhisperDrafts({ ...whisperDrafts, [slot.id]: '' });
                              }
                            }}
                            placeholder="Silent message to pulpit..."
                            className="flex-1 min-w-0 min-h-[36px] px-2.5 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-cyan)]"
                          />

                          <button
                            onClick={() => {
                              if (whisperText.trim()) {
                                sendStageLinkWhisper(slot.id, whisperText, whisperTone, 25);
                                setWhisperDrafts({ ...whisperDrafts, [slot.id]: '' });
                              }
                            }}
                            className="min-h-[36px] px-3 rounded-lg bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                            title="Send silent Stage Whisper"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- LIVE CAMERAS SECTION --- */}
      {showCameras && (
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-amber)]">
              <Camera className="w-4 h-4" />
              <span>LIVE VIDEO CAMERA INGEST SOURCES ({visibleCameras.length})</span>
            </div>
            {visibleCameras.length > 0 && (
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                DirectShow / MediaFoundation Hardware Video Streams
              </span>
            )}
          </div>

          {visibleCameras.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] flex items-center justify-center text-[var(--accent-amber)]">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  {hiddenCamerasCount > 0
                    ? `${hiddenCamerasCount} Camera Source${hiddenCamerasCount > 1 ? 's' : ''} Hidden (Internal/Virtual)`
                    : 'No Live Camera Video Sources Detected'}
                </div>
                <div className="font-mono text-xs text-[var(--text-muted)] mt-1 max-w-md">
                  {hiddenCamerasCount > 0 ? (
                    <span>
                      Internal laptop webcams and virtual software drivers are currently hidden for privacy and booth cleanliness.
                    </span>
                  ) : (
                    <span>
                      Connect your phone via <span className="text-[var(--accent-cyan)] font-bold">Iriun 4K Webcam</span>, plug in a USB webcam, or connect an HDMI/SDI capture card.
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => refreshLiveCameras()}
                  className="min-h-[36px] px-4 py-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border border-[var(--border-color)] font-mono text-xs font-bold text-[var(--text-primary)] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span>Scan for Cameras</span>
                </button>
                {hiddenCamerasCount > 0 && (
                  <button
                    onClick={() => setCameraIngestModalOpen(true)}
                    className="min-h-[36px] px-4 py-1.5 rounded-lg bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] font-mono text-xs font-bold text-[var(--badge-amber-text)] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage Ingest ({hiddenCamerasCount} hidden)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
              {visibleCameras.map((cam, idx) => {
                const isFeedActive = cam.isLiveFeedEnabled === true;

                return (
                  <div
                    key={cam.id}
                    className={`rounded-2xl bg-[var(--bg-card)] border-2 shadow-2xl overflow-hidden transition-all duration-200 ${
                      cam.isFrozen
                        ? 'border-[var(--badge-cyan-border)]'
                        : isFeedActive
                        ? 'border-[var(--badge-emerald-border)]'
                        : 'border-[var(--border-color)]'
                    }`}
                  >
                    {/* Camera Card Header */}
                    <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[var(--badge-amber-bg)] flex items-center justify-center font-mono font-bold text-xs text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)] shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          {editingCamId === cam.id ? (
                            <input
                              type="text"
                              value={editCamValue}
                              autoFocus
                              onChange={(e) => setEditCamValue(e.target.value)}
                              onBlur={() => handleSaveCamEdit(cam.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveCamEdit(cam.id)}
                              className="bg-[var(--bg-subcard)] border border-[var(--accent-amber)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none"
                            />
                          ) : (
                            <div
                              onClick={() => handleStartCamEdit(cam)}
                              className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent-amber)] cursor-pointer flex items-center gap-1.5 truncate"
                              title="Click to rename camera alias"
                            >
                              <span>{cam.customAlias}</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-normal">✎</span>
                            </div>
                          )}
                          <div className="text-[11px] font-mono text-[var(--text-muted)] truncate flex items-center gap-1.5">
                            <span>{cam.vendor}</span>
                            <span>•</span>
                            <span>📍 {cam.stageZone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleCameraLiveFeed(cam.id)}
                          className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition flex items-center gap-1 border cursor-pointer ${
                            isFeedActive
                              ? 'bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border-[var(--badge-emerald-border)]'
                              : 'bg-[var(--bg-subcard)] text-[var(--text-muted)] border-[var(--border-color)]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isFeedActive ? 'bg-[var(--accent-emerald)] animate-pulse' : 'bg-slate-400'}`} />
                          <span>{isFeedActive ? 'STREAMING' : 'STANDBY'}</span>
                        </button>

                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-primary)]">
                          {getPortIcon(cam.portType, 'w-3.5 h-3.5')}
                          <span>{cam.portType.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Camera Video Viewfinder */}
                    <div className="relative aspect-video max-h-[360px] w-full bg-black flex items-center justify-center overflow-hidden border-b border-[var(--border-color)]">
                      <CameraStreamPlayer
                        cameraId={cam.id}
                        cameraName={cam.customAlias || cam.name}
                        isFrozen={cam.isFrozen}
                        isLiveFeedEnabled={isFeedActive}
                        onToggleFeed={() => toggleCameraLiveFeed(cam.id)}
                      />

                      {isFeedActive && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2">
                          <span>{cam.resolution.width}x{cam.resolution.height}</span>
                          <span className="opacity-40">•</span>
                          <span>{cam.refreshRateHz} FPS</span>
                          <span className="text-emerald-400 font-bold">SOURCE ACTIVE</span>
                        </div>
                      )}
                    </div>

                    {/* Camera Action Bar */}
                    <div className="p-3.5 bg-[var(--bg-card)] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] truncate">
                        <span className="truncate">{cam.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleHideCamera(cam.id)}
                          className="min-h-[34px] py-1.5 px-2.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--badge-rose-bg)] text-[var(--text-muted)] hover:text-[var(--badge-rose-text)] border border-[var(--border-color)] text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </button>

                        <button
                          onClick={() => toggleCameraFreeze(cam.id)}
                          disabled={!isFeedActive}
                          className={`min-h-[34px] py-1.5 px-3 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            !isFeedActive
                              ? 'opacity-40 cursor-not-allowed bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)]'
                              : cam.isFrozen
                              ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)] font-bold'
                              : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                          }`}
                        >
                          <Snowflake className="w-3.5 h-3.5" />
                          <span>{cam.isFrozen ? 'FROZEN' : 'FREEZE'}</span>
                        </button>

                        <button
                          onClick={() => toggleCameraLiveFeed(cam.id)}
                          className={`min-h-[34px] p-1.5 rounded-lg border transition cursor-pointer ${
                            !isFeedActive
                              ? 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border-[var(--badge-amber-border)]'
                              : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                          }`}
                        >
                          {!isFeedActive ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hiddenCamerasCount > 0 && visibleCameras.length > 0 && (
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-amber)]" />
                <span>
                  {hiddenCamerasCount} camera source{hiddenCamerasCount > 1 ? 's' : ''} hidden (Internal laptop sensor / Virtual OBS drivers muted).
                </span>
              </div>
              <button
                onClick={() => setCameraIngestModalOpen(true)}
                className="text-[var(--accent-cyan)] hover:underline font-bold cursor-pointer"
              >
                Manage Camera Ingest →
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- LIVE DISPLAYS SECTION --- */}
      {showDisplays && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              <Tv className="w-4 h-4" />
              <span>LIVE DISPLAY OUTPUT SINKS ({liveDisplays.length})</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Hardware Outputs + OS Window Director
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
            {liveDisplays.map((disp) => {
              const effectiveAudio = audioMonitoringAllowed ? Math.max(-60, Math.min(0, disp.audioLevelDb)) : -60;
              const audioPercent = audioMonitoringAllowed ? Math.round(((effectiveAudio + 60) / 60) * 100) : 0;
              const displayRatio =
                disp.activeResolution.width > 0 && disp.activeResolution.height > 0
                  ? `${disp.activeResolution.width} / ${disp.activeResolution.height}`
                  : '16 / 9';

              const isFeedActive = disp.isLiveFeedEnabled !== false;
              const isPrimary = disp.osIndex === 1;
              const windowsOnScreen = routableWindows.filter(
                (w) => !w.is_minimized && (w.display_id === disp.id || w.display_os_index === disp.osIndex)
              );
              const isRouterOpen = openRouterDisplayId === disp.id;
              const selectedWinId = selectedWindowByDisp[disp.id] || routableWindows[0]?.hwnd_id || '';
              const useBorderless = borderlessByDisp[disp.id] ?? !isPrimary;
              const usePinned = pinByDisp[disp.id] ?? !isPrimary;

              return (
                <div
                  key={disp.id}
                  className={`rounded-2xl bg-[var(--bg-card)] border-2 shadow-2xl overflow-hidden transition-all duration-200 ${
                    disp.isFrozen
                      ? 'border-[var(--badge-cyan-border)]'
                      : 'border-[var(--border-color)]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[var(--bg-subcard)] flex items-center justify-center font-mono font-bold text-xs text-[var(--accent-cyan)] border border-[var(--border-color)] shrink-0">
                        {disp.osIndex}
                      </div>
                      <div className="min-w-0">
                        {editingId === disp.id ? (
                          <input
                            type="text"
                            value={editValue}
                            autoFocus
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(disp.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(disp.id)}
                            className="bg-[var(--bg-subcard)] border border-[var(--accent-cyan)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none"
                          />
                        ) : (
                          <div
                            onClick={() => handleStartEdit(disp)}
                            className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent-cyan)] cursor-pointer flex items-center gap-1.5 truncate"
                            title="Click to rename display alias"
                          >
                            <span>{disp.customAlias}</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-normal">✎</span>
                          </div>
                        )}
                        <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                          {disp.vendor} {disp.model} • 📍 {disp.stageZone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleLiveFeed(disp.id)}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition flex items-center gap-1 border cursor-pointer ${
                          isFeedActive
                            ? 'bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border-[var(--badge-emerald-border)]'
                            : 'bg-[var(--bg-subcard)] text-[var(--text-muted)] border-[var(--border-color)]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isFeedActive ? 'bg-[var(--accent-emerald)] animate-pulse' : 'bg-slate-400'}`} />
                        <span>{isFeedActive ? 'LIVE VIEW' : 'STANDBY'}</span>
                      </button>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-primary)]">
                        {getPortIcon(disp.portType, 'w-3.5 h-3.5')}
                        <span>{disp.portType === 'INTERNAL_DISPLAY' ? 'INTERNAL (eDP)' : disp.portType.replace('_', ' ')}</span>
                      </div>
                      <StatusShapeIcon status={disp.status} className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Video Preview Canvas / Raster OR Standby Overlay */}
                  <div
                    style={{ aspectRatio: displayRatio }}
                    className="relative max-h-[360px] w-full bg-[#050608] flex items-center justify-center overflow-hidden border-b border-[var(--border-color)]"
                  >
                    {!isFeedActive ? (
                      <div className="w-full h-full bg-[var(--bg-subcard)] flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] flex items-center justify-center text-[var(--accent-cyan)]">
                          <Tv className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                            {disp.customAlias}
                          </div>
                          <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                            {disp.activeResolution.width} × {disp.activeResolution.height} @ {disp.refreshRateHz}Hz
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)]">
                          <span>⏸️ Live Stream Paused (Zero Lag Mode)</span>
                        </div>
                        <button
                          onClick={() => toggleLiveFeed(disp.id)}
                          className="min-h-[36px] px-4 py-1.5 rounded-lg bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] font-mono text-xs font-bold transition flex items-center gap-1.5 border border-[var(--badge-cyan-border)] cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume Live View</span>
                        </button>
                      </div>
                    ) : disp.liveThumbnailUrl ? (
                      <img
                        src={disp.liveThumbnailUrl}
                        alt={disp.customAlias}
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#0B0D13] flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
                          {getPortIcon(disp.portType, 'w-6 h-6')}
                        </div>
                        <div className="font-mono text-xs font-bold text-slate-200">
                          {disp.customAlias}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-1">
                          {disp.activeResolution.width} × {disp.activeResolution.height} @ {disp.refreshRateHz}Hz
                        </div>
                      </div>
                    )}

                    {disp.isFrozen && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-bold flex items-center gap-1 shadow-lg">
                        <Snowflake className="w-3 h-3" />
                        <span>FROZEN</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2">
                      <span>{disp.activeResolution.width}x{disp.activeResolution.height}</span>
                      <span className="opacity-40">•</span>
                      <span>{disp.refreshRateHz}Hz</span>
                      {disp.isHdr && <span className="text-amber-400 font-bold">HDR10</span>}
                    </div>
                  </div>

                  {/* Audio VU Level Meter, Window Director & Action Bar */}
                  <div className="p-3.5 bg-[var(--bg-card)] space-y-2.5 font-mono">
                    {/* Audio VU Meter */}
                    <div className="flex items-center gap-2">
                      <Volume2 className={`w-3.5 h-3.5 ${isLiveAudioActive ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-muted)]'} shrink-0`} />
                      <div className="flex-1 bg-[var(--bg-subcard)] rounded h-2 overflow-hidden border border-[var(--border-color)] flex">
                        <div
                          className={`h-full transition-all duration-75 ${
                            audioPercent > 85 ? 'bg-rose-500' : audioPercent > 65 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${audioPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-24 text-right">
                        {!isLiveAudioActive
                          ? 'No Audio Feed'
                          : effectiveAudio <= -59
                          ? '-inf dB'
                          : `${effectiveAudio.toFixed(1)} dB`}
                      </span>
                    </div>

                    {/* Active Windows Currently on This Display */}
                    {!isPrimary && windowsOnScreen.length > 0 && (
                      <div className="p-2 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center justify-between">
                          <span>Windows on This Screen ({windowsOnScreen.length})</span>
                        </div>
                        <div className="space-y-1">
                          {windowsOnScreen.slice(0, 3).map((w) => (
                            <div
                              key={w.hwnd_id}
                              className="flex items-center justify-between gap-2 text-[11px] bg-[var(--bg-card)] px-2 py-1 rounded-lg border border-[var(--border-color)]"
                            >
                              <div className="min-w-0 truncate flex items-center gap-1.5">
                                <AppWindow className="w-3 h-3 text-[var(--accent-cyan)] shrink-0" />
                                <span className="truncate font-bold text-[var(--text-primary)]">{w.title}</span>
                                {w.is_borderless_snapped && (
                                  <span className="text-[8px] px-1 rounded bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] font-bold shrink-0">
                                    STAGE FULL
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setOsWindowPinned(w.hwnd_id, !w.is_pinned_stage)}
                                  className={`p-1 rounded border cursor-pointer ${
                                    w.is_pinned_stage
                                      ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)]'
                                      : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)]'
                                  }`}
                                  title={w.is_pinned_stage ? 'Pinned to stage (Protected from Recall)' : 'Pin window to stage'}
                                >
                                  <Pin className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => unrouteOsWindow(w.hwnd_id)}
                                  className="px-1.5 py-0.5 rounded bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[10px] font-bold text-[var(--text-secondary)] flex items-center gap-0.5 cursor-pointer"
                                  title="Pull window back to FOH primary laptop display"
                                >
                                  <CornerUpLeft className="w-2.5 h-2.5" />
                                  <span>FOH</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expandable OS Window Director Drawer */}
                    {isRouterOpen && (
                      <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--badge-cyan-border)] space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-[var(--badge-cyan-text)] flex items-center gap-1.5">
                            <AppWindow className="w-3.5 h-3.5" />
                            <span>Route App Window → {disp.customAlias}</span>
                          </span>
                          <button
                            onClick={() => refreshOsWindows()}
                            className="text-[10px] text-[var(--accent-cyan)] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Refresh</span>
                          </button>
                        </div>

                        {routableWindows.length === 0 ? (
                          <div className="text-[11px] text-[var(--text-muted)]">
                            No open app windows found. Open Kairon or ProPresenter and click Refresh.
                          </div>
                        ) : (
                          <>
                            <select
                              value={selectedWinId}
                              onChange={(e) =>
                                setSelectedWindowByDisp({ ...selectedWindowByDisp, [disp.id]: e.target.value })
                              }
                              className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs"
                            >
                              {routableWindows.map((w) => (
                                <option key={w.hwnd_id} value={w.hwnd_id}>
                                  {w.title} ({w.process_name})
                                </option>
                              ))}
                            </select>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-secondary)]">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={useBorderless}
                                  onChange={(e) =>
                                    setBorderlessByDisp({ ...borderlessByDisp, [disp.id]: e.target.checked })
                                  }
                                />
                                <Maximize2 className="w-3 h-3 text-[var(--accent-cyan)]" />
                                <span>Borderless Fullscreen</span>
                              </label>

                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={usePinned}
                                  onChange={(e) =>
                                    setPinByDisp({ ...pinByDisp, [disp.id]: e.target.checked })
                                  }
                                />
                                <Pin className="w-3 h-3 text-[var(--accent-cyan)]" />
                                <span>Pin to Stage</span>
                              </label>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setOpenRouterDisplayId(null)}
                                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] text-[11px] font-bold cursor-pointer"
                              >
                                Close
                              </button>
                              <button
                                disabled={!selectedWinId}
                                onClick={async () => {
                                  if (selectedWinId) {
                                    await routeOsWindow(selectedWinId, disp.id, useBorderless, usePinned);
                                    setOpenRouterDisplayId(null);
                                  }
                                }}
                                className="min-h-[34px] px-3 py-1 rounded-lg bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] text-[11px] font-bold cursor-pointer"
                              >
                                Send Window Here
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]">
                      <button
                        onClick={() => flashDisplay(disp.id)}
                        className="flex-1 min-h-[36px] py-1.5 px-2 rounded-lg bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        title="Flash high-contrast identifier on physical screen"
                      >
                        <Zap className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                        <span>Flash</span>
                      </button>

                      <button
                        onClick={() => {
                          refreshOsWindows();
                          setOpenRouterDisplayId(isRouterOpen ? null : disp.id);
                        }}
                        className={`min-h-[36px] py-1.5 px-2.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isRouterOpen
                            ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)]'
                            : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                        }`}
                        title="Teleport any open app window (Kairon, ProPresenter, Browser) onto this display"
                      >
                        <AppWindow className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                        <span>Route App</span>
                      </button>

                      <button
                        onClick={() => openTestPatternModal(disp.id)}
                        className="min-h-[36px] py-1.5 px-2.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Send Test Patterns (SMPTE, Grid, Solid RGB)"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Test</span>
                      </button>

                      <button
                        onClick={() => toggleDisplayFreeze(disp.id)}
                        className={`min-h-[36px] p-1.5 rounded-lg border transition cursor-pointer ${
                          disp.isFrozen
                            ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)] font-bold'
                            : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                        }`}
                        title={disp.isFrozen ? 'Unfreeze Live Output' : 'Freeze Live Output'}
                      >
                        <Snowflake className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleLiveFeed(disp.id)}
                        className={`min-h-[36px] p-1.5 rounded-lg border transition cursor-pointer ${
                          disp.isLiveFeedEnabled === false
                            ? 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border-[var(--badge-amber-border)]'
                            : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                        }`}
                        title={disp.isLiveFeedEnabled === false ? 'Resume Live Stream' : 'Pause Live Stream (Zero Lag)'}
                      >
                        {disp.isLiveFeedEnabled === false ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Camera Ingest & Privacy Manager Modal */}
      <CameraIngestModal />
    </div>
  );
};
