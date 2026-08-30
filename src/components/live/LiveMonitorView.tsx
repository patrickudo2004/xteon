import React, { useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { LiveDisplay, LiveCamera } from '../../types';
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
  Wifi,
  Layers,
  Edit2,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Power,
} from 'lucide-react';

export const LiveMonitorView: React.FC = () => {
  const {
    liveDisplays,
    liveCameras,
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
    unhideAllCameras,
    showHiddenCameras,
    setShowHiddenCameras,
    setCameraIngestModalOpen,
    setReconciliationModalOpen,
    setMobileModalOpen,
    refreshLiveDisplays,
    refreshLiveCameras,
    audioMonitoringAllowed,
    isLiveAudioActive,
    startSystemAudioCapture,
    stopSystemAudioCapture,
    showCursorInPreviews,
    setShowCursorInPreviews,
  } = useRigStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'DISPLAYS' | 'CAMERAS'>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingCamId, setEditingCamId] = useState<string | null>(null);
  const [editCamValue, setEditCamValue] = useState('');

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

  const allFeedsPaused = liveDisplays.length > 0 && liveDisplays.every((d) => d.isLiveFeedEnabled === false);

  const visibleCameras = liveCameras.filter((c) => showHiddenCameras || !c.isHidden);
  const hiddenCamerasCount = liveCameras.filter((c) => c.isHidden).length;

  const showDisplays = activeTab === 'ALL' || activeTab === 'DISPLAYS';
  const showCameras = activeTab === 'ALL' || activeTab === 'CAMERAS';

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 overflow-y-auto select-none">
      {/* Top Banner with Comprehensive Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
            <h1 className="text-xl font-bold font-mono text-[var(--text-primary)]">LIVE HARDWARE MULTIVIEW & INGEST</h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
            {liveDisplays.length} Display Sinks • {visibleCameras.length} Live Cameras Active {hiddenCamerasCount > 0 && `(${hiddenCamerasCount} hidden/muted)`}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Source / Sink Filter Tabs */}
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-md transition font-bold cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Feeds ({liveDisplays.length + visibleCameras.length})
            </button>
            <button
              onClick={() => setActiveTab('DISPLAYS')}
              className={`px-3 py-1 rounded-md transition font-bold cursor-pointer ${
                activeTab === 'DISPLAYS'
                  ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Displays ({liveDisplays.length})
            </button>
            <button
              onClick={() => setActiveTab('CAMERAS')}
              className={`px-3 py-1 rounded-md transition font-bold cursor-pointer ${
                activeTab === 'CAMERAS'
                  ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Cameras ({visibleCameras.length})
            </button>
          </div>

          {/* Camera Ingest & Privacy Manager Drawer Button */}
          <button
            onClick={() => setCameraIngestModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Configure camera hardware, mute laptop webcams & hide virtual drivers"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Ingest Manager</span>
            {hiddenCamerasCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">
                {hiddenCamerasCount} hidden
              </span>
            )}
          </button>

          {/* Mouse Cursor Exposure Toggle */}
          <button
            onClick={() => setShowCursorInPreviews(!showCursorInPreviews)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
              showCursorInPreviews
                ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)]'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-subcard)]'
            }`}
            title="Toggle mouse cursor exposure in live preview feeds"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Cursor: {showCursorInPreviews ? 'SHOWN' : 'HIDDEN'}</span>
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
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
              isLiveAudioActive
                ? 'bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border-[var(--badge-emerald-border)] animate-pulse'
                : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-subcard)]'
            }`}
            title="Attach native Windows WASAPI master audio to VU level meters"
          >
            {isLiveAudioActive ? <Volume2 className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isLiveAudioActive ? 'Live Audio: ACTIVE' : 'Connect Audio'}</span>
          </button>

          {/* Master Live Feeds Pause / Resume Toggle */}
          <button
            onClick={() => setAllLiveFeeds(allFeedsPaused)}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Pause or resume live screen captures to optimize PC performance"
          >
            {allFeedsPaused ? (
              <>
                <Play className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                <span>Resume Displays</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span>Pause Displays</span>
              </>
            )}
          </button>

          {/* Rescan Hardware Button */}
          <button
            onClick={() => {
              refreshLiveDisplays();
              refreshLiveCameras();
            }}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Scan for newly connected monitors, Iriun wireless phones, or USB cameras"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span>Rescan All</span>
          </button>

          {/* Plan-to-Live Reconciliation */}
          <button
            onClick={() => setReconciliationModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reconcile</span>
          </button>

          {/* Mobile QR Pairing */}
          <button
            onClick={() => setMobileModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--accent-cyan)] font-bold text-xs font-mono transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Open Mobile Companion QR code for phone control"
          >
            <MonitorCheck className="w-3.5 h-3.5" />
            <span>Mobile QR</span>
          </button>
        </div>
      </div>

      {/* --- LIVE CAMERAS SECTION --- */}
      {showCameras && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
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
                      Connect your phone via <span className="text-cyan-400 font-bold">Iriun 4K Webcam</span>, plug in a USB webcam, or connect an HDMI/SDI capture card. Xteon will automatically discover it.
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshLiveCameras()}
                  className="px-4 py-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border border-[var(--border-color)] font-mono text-xs font-bold text-[var(--text-primary)] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Scan for Cameras</span>
                </button>
                {hiddenCamerasCount > 0 && (
                  <button
                    onClick={() => setCameraIngestModalOpen(true)}
                    className="px-4 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 font-mono text-xs font-bold text-amber-300 transition flex items-center gap-1.5 cursor-pointer"
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
                        ? 'border-cyan-500/70 ring-1 ring-cyan-500/30'
                        : isFeedActive
                        ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : 'border-[var(--border-color)] hover:border-amber-500/50'
                    }`}
                  >
                    {/* Camera Card Header */}
                    <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center font-mono font-bold text-xs text-amber-400 border border-amber-500/30">
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
                              className="bg-[var(--bg-subcard)] border border-amber-400 rounded px-2 py-0.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none"
                            />
                          ) : (
                            <div
                              onClick={() => handleStartCamEdit(cam)}
                              className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-amber-400 cursor-pointer flex items-center gap-1.5 truncate"
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
                            {cam.category === 'INTERNAL_WEBCAM' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                                INTERNAL
                              </span>
                            )}
                            {cam.category === 'VIRTUAL_BRIDGE' && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 text-[9px] font-bold">
                                VIRTUAL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Live Feed Toggle */}
                        <button
                          onClick={() => toggleCameraLiveFeed(cam.id)}
                          className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition flex items-center gap-1 border cursor-pointer ${
                            isFeedActive
                              ? 'bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border-[var(--badge-emerald-border)]'
                              : 'bg-[var(--bg-subcard)] text-[var(--text-muted)] border-[var(--border-color)]'
                          }`}
                          title={isFeedActive ? 'Pause live camera feed (Sensor Standby)' : 'Engage live camera stream'}
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
                    <div className="relative aspect-video max-h-[360px] w-full bg-black flex items-center justify-center overflow-hidden border-b border-[var(--border-color)] group">
                      <CameraStreamPlayer
                        cameraId={cam.id}
                        cameraName={cam.customAlias || cam.name}
                        isFrozen={cam.isFrozen}
                        isLiveFeedEnabled={isFeedActive}
                        onToggleFeed={() => toggleCameraLiveFeed(cam.id)}
                      />

                      {/* Overlay telemetry badges */}
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
                        {/* Quick Hide Button */}
                        <button
                          onClick={() => toggleHideCamera(cam.id)}
                          className="py-1.5 px-2.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-300 border border-[var(--border-color)] hover:border-rose-500/40 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Hide this camera feed and turn off sensor"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </button>

                        {/* Freeze Viewfinder Button */}
                        <button
                          onClick={() => toggleCameraFreeze(cam.id)}
                          disabled={!isFeedActive}
                          className={`py-1.5 px-3 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            !isFeedActive
                              ? 'opacity-40 cursor-not-allowed bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)]'
                              : cam.isFrozen
                              ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)] font-bold'
                              : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                          }`}
                          title={cam.isFrozen ? 'Unfreeze camera viewfinder' : 'Freeze camera viewfinder frame'}
                        >
                          <Snowflake className="w-3.5 h-3.5" />
                          <span>{cam.isFrozen ? 'FROZEN' : 'FREEZE'}</span>
                        </button>

                        {/* Stream toggle */}
                        <button
                          onClick={() => toggleCameraLiveFeed(cam.id)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            !isFeedActive
                              ? 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border-[var(--badge-amber-border)]'
                              : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                          }`}
                          title={!isFeedActive ? 'Engage live camera stream' : 'Pause camera stream (Sensor Standby)'}
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

          {/* Hidden cameras notice banner */}
          {hiddenCamerasCount > 0 && visibleCameras.length > 0 && (
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>
                  {hiddenCamerasCount} camera source{hiddenCamerasCount > 1 ? 's' : ''} hidden (Internal laptop sensor / Virtual OBS drivers muted).
                </span>
              </div>
              <button
                onClick={() => setCameraIngestModalOpen(true)}
                className="text-cyan-400 hover:underline font-bold cursor-pointer"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              <Tv className="w-4 h-4" />
              <span>LIVE DISPLAY OUTPUT SINKS ({liveDisplays.length})</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Windows OS Display Driver Raster Feeds
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

              return (
                <div
                  key={disp.id}
                  className={`rounded-2xl bg-[var(--bg-card)] border-2 shadow-2xl overflow-hidden transition-all duration-200 ${
                    disp.isFrozen
                      ? 'border-cyan-500/70 ring-1 ring-cyan-500/30'
                      : 'border-[var(--border-color)] hover:border-slate-500'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[var(--bg-subcard)] flex items-center justify-center font-mono font-bold text-xs text-[var(--accent-cyan)] border border-[var(--border-color)]">
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
                            className="bg-[var(--bg-subcard)] border border-cyan-400 rounded px-2 py-0.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none"
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
                      {/* Per-Display Live Feed Toggle Button */}
                      <button
                        onClick={() => toggleLiveFeed(disp.id)}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition flex items-center gap-1 border cursor-pointer ${
                          isFeedActive
                            ? 'bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border-[var(--badge-emerald-border)]'
                            : 'bg-[var(--bg-subcard)] text-[var(--text-muted)] border-[var(--border-color)]'
                        }`}
                        title={isFeedActive ? 'Click to turn off live video feed & save performance' : 'Click to turn on live video feed'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isFeedActive ? 'bg-[var(--accent-emerald)] animate-pulse' : 'bg-slate-400'}`} />
                        <span>{isFeedActive ? 'LIVE VIEW' : 'STANDBY'}</span>
                      </button>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-primary)]">
                        {getPortIcon(disp.portType, 'w-3.5 h-3.5')}
                        <span>{disp.portType.replace('_', ' ')}</span>
                      </div>
                      <StatusShapeIcon status={disp.status} className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Video Preview Canvas / Raster OR Standby Overlay */}
                  <div
                    style={{ aspectRatio: displayRatio }}
                    className="relative max-h-[360px] w-full bg-[#050608] flex items-center justify-center overflow-hidden border-b border-[var(--border-color)] group"
                  >
                    {!isFeedActive ? (
                      /* Standby Overlay Chassis (0% GPU / GDI load) */
                      <div className="w-full h-full bg-gradient-to-br from-[#0B0D13] via-[var(--bg-card)] to-[#07090E] flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] flex items-center justify-center text-[var(--accent-cyan)]">
                          <Tv className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                            {disp.customAlias}
                          </div>
                          <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                            {disp.activeResolution.width} × {disp.activeResolution.height} @ {disp.refreshRateHz}Hz • {disp.portType.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)]">
                          <span>⏸️ Live Stream Paused (Zero Lag Mode)</span>
                        </div>
                        <button
                          onClick={() => toggleLiveFeed(disp.id)}
                          className="px-4 py-1.5 rounded-lg bg-[var(--badge-cyan-bg)] hover:bg-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-[var(--badge-cyan-border)] cursor-pointer"
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
                      <div className="w-full h-full bg-gradient-to-br from-slate-950 via-[#0B0D13] to-slate-900 flex flex-col items-center justify-center p-4 text-center">
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

                    {/* Overlay telemetry badges */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2">
                      <span>{disp.activeResolution.width}x{disp.activeResolution.height}</span>
                      <span className="opacity-40">•</span>
                      <span>{disp.refreshRateHz}Hz</span>
                      {disp.isHdr && <span className="text-[var(--accent-amber)] font-bold">HDR10</span>}
                    </div>
                  </div>

                  {/* Audio VU Level Meter & Action Bar */}
                  <div className="p-3.5 bg-[var(--bg-card)] space-y-2.5">
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
                      <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 w-24 text-right">
                        {!isLiveAudioActive
                          ? 'No Audio Feed'
                          : effectiveAudio <= -59
                          ? '-inf dB'
                          : `${effectiveAudio.toFixed(1)} dB`}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]">
                      <button
                        onClick={() => flashDisplay(disp.id)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-[var(--badge-amber-bg)] hover:bg-[var(--badge-amber-border)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        title="Flash high-contrast identifier on physical screen"
                      >
                        <Zap className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                        <span>Flash Screen</span>
                      </button>

                      <button
                        onClick={() => openTestPatternModal(disp.id)}
                        className="py-1.5 px-2.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Send Test Patterns (SMPTE, Grid, Solid RGB)"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Test</span>
                      </button>

                      <button
                        onClick={() => toggleDisplayFreeze(disp.id)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          disp.isFrozen
                            ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)] font-bold'
                            : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                        }`}
                        title={disp.isFrozen ? "Unfreeze Live Output" : "Freeze Live Output"}
                      >
                        <Snowflake className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleLiveFeed(disp.id)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          disp.isLiveFeedEnabled === false
                            ? 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border-[var(--badge-amber-border)]'
                            : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]'
                        }`}
                        title={disp.isLiveFeedEnabled === false ? "Resume Live Stream" : "Pause Live Stream (Zero Lag)"}
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
