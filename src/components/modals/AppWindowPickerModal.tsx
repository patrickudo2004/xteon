import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRigStore } from '../../store/useRigStore';
import {
  X,
  Monitor,
  AppWindow,
  Columns2,
  Search,
  CheckCircle2,
  Sparkles,
  Maximize2,
  RotateCcw,
  Layers,
  ArrowRight,
  Square,
  Laptop,
} from 'lucide-react';
import { StageLinkSourceMode, StageSplitLayout } from '../../types';

interface AppWindowPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlotId?: string | null;
}

export const AppWindowPickerModal: React.FC<AppWindowPickerModalProps> = ({
  isOpen,
  onClose,
  targetSlotId,
}) => {
  const {
    osWindows,
    liveDisplays,
    refreshOsWindows,
    restoreOsWindowBehind,
    stageLinkSlots,
    refreshStageLinkSlots,
    upsertStageLinkSlot,
    getWindowThumbnails,
    stopStageLinkStream,
    triggerOsDisplayExtend,
  } = useRigStore();

  const [activeTab, setActiveTab] = useState<'WINDOW' | 'DISPLAY' | 'SPLIT'>('WINDOW');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrimId, setSelectedPrimId] = useState('');
  const [selectedPrimLabel, setSelectedPrimLabel] = useState('');
  const [selectedSecId, setSelectedSecId] = useState('');
  const [selectedSecLabel, setSelectedSecLabel] = useState('');
  const [splitLayout, setSplitLayout] = useState<StageSplitLayout>('SIDE_70_30');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const hasInitializedRef = useRef(false);

  // Filter out Xteon itself so operators don't mirror the controls inside itself
  const selectableWindows = useMemo(
    () => osWindows.filter((w) => !w.is_xteon_self),
    [osWindows]
  );

  const activeSlot = useMemo(
    () => stageLinkSlots.find((s) => s.id === targetSlotId) || stageLinkSlots[0] || null,
    [stageLinkSlots, targetSlotId]
  );

  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        refreshOsWindows();
        if (activeSlot) {
          setSelectedPrimId(activeSlot.primary_source_id);
          setSelectedPrimLabel(activeSlot.primary_source_label);
          setSelectedSecId(activeSlot.secondary_source_id || '');
          setSelectedSecLabel(activeSlot.secondary_source_label || '');
          setSplitLayout(activeSlot.split_layout || 'SIDE_70_30');
          setActiveTab(activeSlot.source_mode || 'WINDOW');
        } else if (selectableWindows.length > 0) {
          setSelectedPrimId(`W:${selectableWindows[0].hwnd_id}`);
          setSelectedPrimLabel(selectableWindows[0].title);
        } else if (liveDisplays.length > 0) {
          setSelectedPrimId(`D:${liveDisplays[0].id}`);
          setSelectedPrimLabel(`Screen ${liveDisplays[0].osIndex}: ${liveDisplays[0].customAlias || liveDisplays[0].name}`);
        }
      }

      // Grab live window thumbnails for Google Meet / Teams style visual cards
      const hwndIds = selectableWindows.map((w) => w.hwnd_id);
      if (hwndIds.length > 0) {
        getWindowThumbnails(hwndIds).then((res) => {
          if (res && Object.keys(res).length > 0) {
            setThumbnails((prev) => ({ ...prev, ...res }));
          }
        });
      }
    } else {
      hasInitializedRef.current = false;
    }
  }, [isOpen]);

  const filteredWindows = useMemo(() => {
    if (!searchQuery.trim()) return selectableWindows;
    const q = searchQuery.toLowerCase();
    return selectableWindows.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.process_name.toLowerCase().includes(q)
    );
  }, [selectableWindows, searchQuery]);

  if (!isOpen) return null;

  const getProcessIcon = (processName: string) => {
    const p = processName.toLowerCase();
    if (p.includes('powerpnt') || p.includes('keynote') || p.includes('presenter')) return '📊';
    if (p.includes('kairon') || p.includes('timer') || p.includes('clock')) return '⏱️';
    if (p.includes('chrome') || p.includes('msedge') || p.includes('firefox') || p.includes('browser')) return '🌐';
    if (p.includes('vlc') || p.includes('media') || p.includes('player') || p.includes('mpv')) return '🎬';
    if (p.includes('obs') || p.includes('vmix') || p.includes('stream')) return '📹';
    if (p.includes('word') || p.includes('notes') || p.includes('text') || p.includes('notepad')) return '📝';
    if (p.includes('spotify') || p.includes('audio') || p.includes('sound')) return '🎵';
    return '🪟';
  };

  const handleApply = async () => {
    const slotId = activeSlot?.id || 'stage-1';
    const slotName = activeSlot?.name || 'Stage Receiver (Pulpit Tablet)';
    const stageZone = activeSlot?.stage_zone || 'Pulpit Altar';

    await upsertStageLinkSlot({
      id: slotId,
      name: slotName,
      stage_zone: stageZone,
      source_mode: activeTab,
      primary_source_id: selectedPrimId,
      primary_source_label: selectedPrimLabel || 'Selected Source',
      secondary_source_id: activeTab === 'SPLIT' ? selectedSecId : null,
      secondary_source_label: activeTab === 'SPLIT' ? selectedSecLabel : null,
      split_layout: splitLayout,
      target_fps: 30,
      max_width: 1280,
    });

    await refreshStageLinkSlots(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[var(--text-primary)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-header)] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight">
                Choose Screen or Application to Share
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select what will be transmitted in real time to connected stage tablets, phones, and extended displays.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Google Meet Style) */}
        <div className="px-5 pt-3 border-b border-[var(--border-color)] flex items-center justify-between gap-2 bg-[var(--bg-card)] shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('WINDOW')}
              className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'WINDOW'
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <AppWindow className="w-4 h-4" />
              <span>Application Window</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-subcard)]">
                {selectableWindows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DISPLAY')}
              className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'DISPLAY'
                  ? 'border-blue-400 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Entire Screen</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-subcard)]">
                {liveDisplays.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SPLIT')}
              className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'SPLIT'
                  ? 'border-purple-400 text-purple-400 bg-purple-500/10'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Columns2 className="w-4 h-4" />
              <span>Stage Multiview (Split)</span>
            </button>
          </div>

          {activeTab === 'WINDOW' && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs mb-2">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Filter apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-28 text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
            </div>
          )}
        </div>

        {/* Modal Body / Selection Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: APPLICATION WINDOWS */}
          {activeTab === 'WINDOW' && (
            <div>
              {filteredWindows.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl">
                  <AppWindow className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <div className="font-bold">No capturable application windows detected</div>
                  <div className="text-xs mt-1">Open your countdown timer, presentation, or browser window to see it here.</div>
                  <button
                    onClick={() => refreshOsWindows()}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-xs font-semibold transition"
                  >
                    Refresh Windows List
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredWindows.map((win) => {
                    const isSelected = selectedPrimId === `W:${win.hwnd_id}`;
                    return (
                      <div
                        key={win.hwnd_id}
                        onClick={() => {
                          setSelectedPrimId(`W:${win.hwnd_id}`);
                          setSelectedPrimLabel(win.title);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 text-left ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                            : 'bg-[var(--bg-subcard)] border-[var(--border-color)] hover:border-cyan-500/40 hover:bg-[var(--bg-card)]'
                        }`}
                      >
                        {/* Live Thumbnail Preview (Google Meet / Teams Style) */}
                        <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-950/80 border border-[var(--border-color)] flex items-center justify-center">
                          {thumbnails[win.hwnd_id] ? (
                            <img
                              src={thumbnails[win.hwnd_id]}
                              alt={win.title}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-[var(--text-muted)]">
                              <span className="text-3xl">{getProcessIcon(win.process_name)}</span>
                              <span className="text-[10px] font-mono">{win.process_name}</span>
                            </div>
                          )}
                          {win.is_minimized && (
                            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
                              <span className="text-amber-400 text-xs font-bold font-mono">TASKBAR MINIMIZED</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreOsWindowBehind(win.hwnd_id);
                                }}
                                className="mt-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer"
                              >
                                Restore Window
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-base shrink-0">
                            {getProcessIcon(win.process_name)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs truncate" title={win.title}>
                              {win.title}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                              {win.process_name} • {win.width}×{win.height}
                            </div>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-color)]/60 text-[10px]">
                          {win.is_minimized ? (
                            <span className="text-amber-400 font-mono">⚠️ Minimized</span>
                          ) : (
                            <span className="text-emerald-400 font-mono">● Ready to Stream</span>
                          )}

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENTIRE SCREENS */}
          {activeTab === 'DISPLAY' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {liveDisplays.map((disp) => {
                const isSelected = selectedPrimId === `D:${disp.id}`;
                return (
                  <div
                    key={disp.id}
                    onClick={() => {
                      setSelectedPrimId(`D:${disp.id}`);
                      setSelectedPrimLabel(
                        `Screen ${disp.osIndex}: ${disp.customAlias || disp.name}`
                      );
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 text-left ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-400 shadow-md ring-1 ring-blue-400/50'
                        : 'bg-[var(--bg-subcard)] border-[var(--border-color)] hover:border-blue-500/40 hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    {/* Live Screen Preview */}
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-950/80 border border-[var(--border-color)] flex items-center justify-center">
                      {disp.liveThumbnailUrl ? (
                        <img
                          src={disp.liveThumbnailUrl}
                          alt={disp.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-[var(--text-muted)]">
                          <Monitor className="w-8 h-8 text-cyan-400" />
                          <span className="text-[10px] font-mono">{disp.activeResolution.width}×{disp.activeResolution.height}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">
                          Screen {disp.osIndex}: {disp.customAlias || disp.name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                          {disp.activeResolution.width}×{disp.activeResolution.height} @ {disp.refreshRateHz}Hz
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-1">
                          {disp.portType} • {disp.stageZone}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />}
                    </div>
                  </div>
                );
              })}

              {!liveDisplays.some((d) => d.osIndex > 1) && (
                <div
                  onClick={async () => {
                    await triggerOsDisplayExtend();
                    await new Promise((r) => setTimeout(r, 600));
                    await useRigStore.getState().refreshLiveDisplays();
                    const sec = useRigStore.getState().liveDisplays.find((d) => d.osIndex > 1);
                    if (sec) {
                      setSelectedPrimId(`D:${sec.id}`);
                      setSelectedPrimLabel(`Screen ${sec.osIndex}: ${sec.customAlias || sec.name} (Projector)`);
                    }
                  }}
                  className="p-4 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left"
                >
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-950/80 border border-cyan-500/30 flex flex-col items-center justify-center p-3 text-center gap-1.5">
                    <Laptop className="w-8 h-8 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300">Activate Windows Extend (Projector)</span>
                    <span className="text-[10px] text-slate-400">Switches Windows to Extend mode for connected projector or HDMI display</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-cyan-300">
                        + Extend to Projector / Screen 2
                      </div>
                      <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                        Native OS Extend • Win+P
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STAGE MULTIVIEW (SPLIT VIEW) */}
          {activeTab === 'SPLIT' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300">
                <strong>Stage Multiview:</strong> Composites two independent applications side-by-side onto the speaker's tablet (e.g. countdown clock on the left, presentation notes on the right).
              </div>

              {/* Dynamic Live Composite Mockup Preview */}
              <div className="p-3 rounded-xl bg-slate-950 border border-[var(--border-color)] space-y-1.5">
                <div className="text-[11px] font-mono text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Live Multiview Layout Preview</span>
                  <span className="text-purple-400">{splitLayout}</span>
                </div>
                <div className="w-full h-36 rounded-lg bg-black/60 border border-purple-500/40 flex overflow-hidden p-1 gap-1">
                  <div
                    className="h-full rounded bg-slate-900 border border-cyan-500/50 flex flex-col items-center justify-center overflow-hidden transition-all relative"
                    style={{
                      width:
                        splitLayout === 'SIDE_70_30' ? '70%' : splitLayout === 'SIDE_50_50' ? '50%' : '100%',
                    }}
                  >
                    {thumbnails[selectedPrimId.replace('W:', '')] ? (
                      <img
                        src={thumbnails[selectedPrimId.replace('W:', '')]}
                        alt="Primary"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-xs font-mono text-cyan-300 p-2 text-center truncate">
                        Primary: {selectedPrimLabel || 'Select primary app'}
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 px-1 rounded bg-black/70 text-[9px] font-mono text-cyan-400">
                      Primary
                    </span>
                  </div>
                  <div
                    className="h-full rounded bg-slate-900 border border-purple-500/50 flex flex-col items-center justify-center overflow-hidden transition-all relative"
                    style={{
                      width:
                        splitLayout === 'SIDE_70_30' ? '30%' : splitLayout === 'SIDE_50_50' ? '50%' : '100%',
                    }}
                  >
                    {thumbnails[selectedSecId.replace('W:', '')] ? (
                      <img
                        src={thumbnails[selectedSecId.replace('W:', '')]}
                        alt="Secondary"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-xs font-mono text-purple-300 p-2 text-center truncate">
                        {selectedSecLabel || 'Secondary app'}
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono text-purple-400">
                      Secondary
                    </span>
                  </div>
                </div>
              </div>

              {/* Layout Picker */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] font-mono block mb-2">
                  1. CHOOSE MULTIVIEW LAYOUT
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'SIDE_70_30', label: '70% / 30% Side Split', desc: 'Main app large, side clock' },
                    { id: 'SIDE_50_50', label: '50% / 50% Equal Split', desc: 'Equal split screen' },
                    { id: 'TOP_BOTTOM', label: 'Top / Bottom Stack', desc: 'Stacked horizontal split' },
                    { id: 'PIP_CORNER', label: 'Picture-in-Picture', desc: 'Small corner confidence' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSplitLayout(l.id as StageSplitLayout)}
                      className={`p-2.5 rounded-lg border text-left transition cursor-pointer text-xs ${
                        splitLayout === l.id
                          ? 'border-purple-400 bg-purple-500/20 text-purple-200 font-bold'
                          : 'border-[var(--border-color)] bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="font-bold">{l.label}</div>
                      <div className="text-[10px] opacity-70 truncate">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary Source */}
                <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)]">
                  <div className="text-xs font-bold font-mono text-cyan-400 mb-2">
                    Primary App (Main View)
                  </div>
                  <select
                    value={selectedPrimId}
                    onChange={(e) => {
                      setSelectedPrimId(e.target.value);
                      const opt = filteredWindows.find((w) => `W:${w.hwnd_id}` === e.target.value);
                      if (opt) setSelectedPrimLabel(opt.title);
                    }}
                    className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400"
                  >
                    {filteredWindows.map((w) => (
                      <option key={w.hwnd_id} value={`W:${w.hwnd_id}`}>
                        {w.title} ({w.process_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Secondary Source */}
                <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)]">
                  <div className="text-xs font-bold font-mono text-purple-400 mb-2">
                    Secondary App (Side Clock / Notes)
                  </div>
                  <select
                    value={selectedSecId}
                    onChange={(e) => {
                      setSelectedSecId(e.target.value);
                      const opt = filteredWindows.find((w) => `W:${w.hwnd_id}` === e.target.value);
                      if (opt) setSelectedSecLabel(opt.title);
                    }}
                    className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-400"
                  >
                    <option value="">-- None / Blank --</option>
                    {filteredWindows.map((w) => (
                      <option key={w.hwnd_id} value={`W:${w.hwnd_id}`}>
                        {w.title} ({w.process_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-header)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {activeSlot && (
              <button
                type="button"
                onClick={async () => {
                  await stopStageLinkStream(activeSlot.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer"
                title="Stop current broadcast feed"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Sharing</span>
              </button>
            )}
            <div className="text-xs text-[var(--text-muted)] truncate hidden sm:block">
              Selected: <span className="font-bold text-[var(--text-primary)]">{selectedPrimLabel || 'None'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-subcard)] text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedPrimId}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Apply to Stage Screen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
