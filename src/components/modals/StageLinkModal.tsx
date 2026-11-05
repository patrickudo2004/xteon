import React, { useEffect, useMemo, useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { StageLinkSourceMode, StageSplitLayout } from '../../types';
import {
  X,
  Radio,
  AppWindow,
  Columns2,
  Monitor,
  RefreshCw,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const StageLinkModal: React.FC = () => {
  const {
    stageLinkModalOpen,
    editingStageSlotId,
    closeStageLinkModal,
    stageLinkSlots,
    osWindows,
    liveDisplays,
    refreshOsWindows,
    restoreOsWindowBehind,
    upsertStageLinkSlot,
    openQrForStageSlot,
  } = useRigStore();

  const editingSlot = useMemo(
    () => stageLinkSlots.find((s) => s.id === editingStageSlotId) || null,
    [stageLinkSlots, editingStageSlotId]
  );

  const [name, setName] = useState('Pulpit Confidence Monitor');
  const [stageZone, setStageZone] = useState('Lower Pulpit Shelf');
  const [sourceMode, setSourceMode] = useState<StageLinkSourceMode>('WINDOW');
  const [primarySourceId, setPrimarySourceId] = useState('');
  const [secondarySourceId, setSecondarySourceId] = useState('');
  const [splitLayout, setSplitLayout] = useState<StageSplitLayout>('SIDE_70_30');
  const [targetFps, setTargetFps] = useState<number>(20);
  const [maxWidth, setMaxWidth] = useState<number>(1280);
  const [isSaving, setIsSaving] = useState(false);

  const selectableWindows = useMemo(
    () => osWindows.filter((w) => !w.is_xteon_self),
    [osWindows]
  );

  // Build unified source options for WINDOW, DISPLAY, and SPLIT modes
  const sourceOptions = useMemo(() => {
    const winOpts = selectableWindows.map((w) => ({
      value: `W:${w.hwnd_id}`,
      rawHwnd: w.hwnd_id,
      kind: 'WINDOW' as const,
      isMinimized: w.is_minimized,
      label: `${w.title} (${w.process_name})`,
      detail: `${w.width}×${w.height}${w.is_minimized ? ' • MINIMIZED' : ''}`,
    }));

    const dispOpts = liveDisplays.map((d) => ({
      value: `D:${d.id}`,
      rawHwnd: null,
      kind: 'DISPLAY' as const,
      isMinimized: false,
      label: `Screen ${d.osIndex}: ${d.customAlias || d.name}`,
      detail: `${d.activeResolution.width}×${d.activeResolution.height} @ ${d.refreshRateHz}Hz`,
    }));

    return { winOpts, dispOpts, allOpts: [...winOpts, ...dispOpts] };
  }, [selectableWindows, liveDisplays]);

  useEffect(() => {
    if (!stageLinkModalOpen) return;
    refreshOsWindows();

    if (editingSlot) {
      setName(editingSlot.name);
      setStageZone(editingSlot.stage_zone);
      setSourceMode(editingSlot.source_mode);

      const normPrim =
        editingSlot.primary_source_id.startsWith('W:') || editingSlot.primary_source_id.startsWith('D:')
          ? editingSlot.primary_source_id
          : editingSlot.source_mode === 'DISPLAY'
          ? `D:${editingSlot.primary_source_id}`
          : `W:${editingSlot.primary_source_id}`;
      setPrimarySourceId(normPrim);

      const secRaw = editingSlot.secondary_source_id || '';
      const normSec =
        !secRaw
          ? ''
          : secRaw.startsWith('W:') || secRaw.startsWith('D:')
          ? secRaw
          : `W:${secRaw}`;
      setSecondarySourceId(normSec);

      setSplitLayout(editingSlot.split_layout || 'SIDE_70_30');
      setTargetFps(editingSlot.target_fps || 20);
      setMaxWidth(editingSlot.max_width || 1280);
    } else {
      const nextNum = stageLinkSlots.length + 1;
      setName(nextNum === 1 ? 'Pulpit Confidence Monitor' : `Wireless Stage ${nextNum}`);
      setStageZone(nextNum === 1 ? 'Lower Pulpit Shelf' : 'Stage Confidence');
      const defaultMode: StageLinkSourceMode = selectableWindows.length > 0 ? 'WINDOW' : 'DISPLAY';
      setSourceMode(defaultMode);
      if (defaultMode === 'WINDOW' && selectableWindows[0]) {
        setPrimarySourceId(`W:${selectableWindows[0].hwnd_id}`);
      } else if (liveDisplays[0]) {
        const ext = liveDisplays.find((d) => d.osIndex > 1) || liveDisplays[0];
        setPrimarySourceId(`D:${ext.id}`);
      } else {
        setPrimarySourceId('');
      }
      if (selectableWindows[1]) {
        setSecondarySourceId(`W:${selectableWindows[1].hwnd_id}`);
      } else if (liveDisplays[0]) {
        setSecondarySourceId(`D:${liveDisplays[0].id}`);
      } else {
        setSecondarySourceId('');
      }
      setSplitLayout('SIDE_70_30');
      setTargetFps(20);
      setMaxWidth(1280);
    }
  }, [stageLinkModalOpen, editingSlot]);

  // Keep primary source valid when user switches between WINDOW and DISPLAY modes
  useEffect(() => {
    if (!stageLinkModalOpen) return;
    if (sourceMode === 'WINDOW' && primarySourceId.startsWith('D:')) {
      if (sourceOptions.winOpts[0]) {
        setPrimarySourceId(sourceOptions.winOpts[0].value);
      }
    } else if (sourceMode === 'DISPLAY' && primarySourceId.startsWith('W:')) {
      const ext = sourceOptions.dispOpts[1] || sourceOptions.dispOpts[0];
      if (ext) {
        setPrimarySourceId(ext.value);
      }
    } else if (!primarySourceId) {
      if (sourceMode === 'DISPLAY' && sourceOptions.dispOpts[0]) {
        setPrimarySourceId(sourceOptions.dispOpts[0].value);
      } else if (sourceOptions.winOpts[0]) {
        setPrimarySourceId(sourceOptions.winOpts[0].value);
      } else if (sourceOptions.dispOpts[0]) {
        setPrimarySourceId(sourceOptions.dispOpts[0].value);
      }
    }
  }, [sourceMode, sourceOptions, stageLinkModalOpen]);

  if (!stageLinkModalOpen) return null;

  const primaryList =
    sourceMode === 'DISPLAY'
      ? sourceOptions.dispOpts
      : sourceMode === 'WINDOW'
      ? sourceOptions.winOpts
      : sourceOptions.allOpts;

  const selectedPrimaryObj = sourceOptions.allOpts.find((o) => o.value === primarySourceId);
  const selectedSecondaryObj = sourceOptions.allOpts.find((o) => o.value === secondarySourceId);

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(primarySourceId) &&
    (sourceMode !== 'SPLIT' || Boolean(secondarySourceId));

  const handleSave = async (openQrAfter: boolean) => {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    try {
      const slot = await upsertStageLinkSlot({
        id: editingSlot?.id,
        name: name.trim(),
        stage_zone: stageZone.trim() || 'Stage Area',
        source_mode: sourceMode,
        primary_source_id: primarySourceId,
        primary_source_label: selectedPrimaryObj?.label || primarySourceId,
        secondary_source_id: sourceMode === 'SPLIT' ? secondarySourceId || null : null,
        secondary_source_label:
          sourceMode === 'SPLIT' ? selectedSecondaryObj?.label || secondarySourceId || null : null,
        split_layout: splitLayout,
        target_fps: targetFps,
        max_width: maxWidth,
      });
      closeStageLinkModal();
      if (openQrAfter && slot) {
        openQrForStageSlot(slot.id);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={closeStageLinkModal}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92dvh] rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col text-[var(--text-primary)]"
      >
        {/* Sticky Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] flex items-center justify-center text-[var(--accent-cyan)] shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-mono text-sm font-bold text-[var(--text-primary)] truncate">
                {editingSlot ? 'CONFIGURE WIRELESS STAGELINK' : 'NEW WIRELESS STAGELINK MONITOR'}
              </h2>
              <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                Zero-app wireless stage/pulpit monitor over Wi-Fi, Hotspot, or USB Tether
              </p>
            </div>
          </div>

          <button
            onClick={closeStageLinkModal}
            className="min-w-[40px] min-h-[40px] rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 font-mono text-xs">
          {/* Name & Stage Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1.5">
                Stage Monitor Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pulpit Confidence Tablet"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--accent-cyan)]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1.5">
                Physical Stage Zone
              </label>
              <input
                type="text"
                value={stageZone}
                onChange={(e) => setStageZone(e.target.value)}
                placeholder="e.g. Lower Pulpit Shelf"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--accent-cyan)]"
              />
            </div>
          </div>

          {/* Capture Mode Cards */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1.5">
              Wireless Feed Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  mode: 'WINDOW' as StageLinkSourceMode,
                  icon: AppWindow,
                  title: 'App Window Cast',
                  desc: 'Stream Kairon Timer or ProPresenter window even behind other apps',
                },
                {
                  mode: 'SPLIT' as StageLinkSourceMode,
                  icon: Columns2,
                  title: 'Dual Split / PiP',
                  desc: 'Combine Slides + Countdown Timer together on one tablet',
                },
                {
                  mode: 'DISPLAY' as StageLinkSourceMode,
                  icon: Monitor,
                  title: 'Screen Mirror',
                  desc: 'Stream any physical display output wirelessly to stage',
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = sourceMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setSourceMode(item.mode)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1.5 min-h-[84px] ${
                      active
                        ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] shadow-sm'
                        : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-cyan)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="w-4 h-4 shrink-0" />
                      {active && <span className="text-[9px] font-bold uppercase">Selected</span>}
                    </div>
                    <div className="font-bold text-xs">{item.title}</div>
                    <div className="text-[10px] text-[var(--text-muted)] leading-snug">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Source Selector */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[10px] uppercase font-bold text-[var(--text-primary)]">
                {sourceMode === 'SPLIT'
                  ? 'Primary Feed (Left / Main Region)'
                  : sourceMode === 'WINDOW'
                  ? 'Target Application Window'
                  : 'Target Display Output'}
              </label>

              {sourceMode !== 'DISPLAY' && (
                <button
                  type="button"
                  onClick={() => refreshOsWindows()}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[11px] font-bold text-[var(--accent-cyan)] flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rescan Open Apps ({selectableWindows.length})</span>
                </button>
              )}
            </div>

            {primaryList.length === 0 ? (
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] text-[11px]">
                {sourceMode === 'WINDOW'
                  ? 'No open application windows detected yet. Open Kairon Timer, ProPresenter, or a browser window and click Rescan Open Apps.'
                  : 'No active display outputs detected.'}
              </div>
            ) : (
              <select
                value={primarySourceId}
                onChange={(e) => setPrimarySourceId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--accent-cyan)]"
              >
                {primaryList.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    [{opt.kind}] {opt.label} — {opt.detail}
                  </option>
                ))}
              </select>
            )}

            {/* Minimized Window Guard Notice */}
            {selectedPrimaryObj?.isMinimized && selectedPrimaryObj.rawHwnd && (
              <div className="p-2.5 rounded-xl bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Selected window is currently minimized. Windows pauses rendering minimized apps until restored.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => restoreOsWindowBehind(selectedPrimaryObj.rawHwnd!)}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] font-bold cursor-pointer"
                >
                  Restore Behind Now
                </button>
              </div>
            )}
          </div>

          {/* Secondary Source + Split Layout (SPLIT Mode) */}
          {sourceMode === 'SPLIT' && (
            <div className="p-3.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--text-primary)] block mb-1.5">
                  Secondary Feed (Right / Bottom / PiP Corner)
                </label>
                <select
                  value={secondarySourceId}
                  onChange={(e) => setSecondarySourceId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--accent-cyan)]"
                >
                  <option value="">-- Choose 2nd Window or Display --</option>
                  {sourceOptions.allOpts.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      [{opt.kind}] {opt.label} — {opt.detail}
                    </option>
                  ))}

                </select>
              </div>

              {/* Minimized Window Guard for Secondary Feed */}
              {selectedSecondaryObj?.isMinimized && selectedSecondaryObj.rawHwnd && (
                <div className="p-2.5 rounded-xl bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Secondary window is currently minimized. Windows pauses rendering minimized apps until restored.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreOsWindowBehind(selectedSecondaryObj.rawHwnd!)}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] font-bold cursor-pointer"
                  >
                    Restore Behind Now
                  </button>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1.5">
                  Confidence Split Layout
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'SIDE_70_30' as StageSplitLayout, label: '70 / 30 Stage' },
                    { id: 'SIDE_50_50' as StageSplitLayout, label: '50 / 50 Dual' },
                    { id: 'TOP_BOTTOM' as StageSplitLayout, label: 'Top / Bottom' },
                    { id: 'PIP_CORNER' as StageSplitLayout, label: 'Corner PiP' },
                  ].map((lay) => (
                    <button
                      key={lay.id}
                      type="button"
                      onClick={() => setSplitLayout(lay.id)}
                      className={`min-h-[40px] px-2.5 py-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                        splitLayout === lay.id
                          ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)]'
                          : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]'
                      }`}
                    >
                      {lay.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stream Performance Tuning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                Stream Frame Rate
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { fps: 10, label: '10 FPS', sub: 'Timer / Saver' },
                  { fps: 20, label: '20 FPS', sub: 'Balanced' },
                  { fps: 30, label: '30 FPS', sub: 'Smooth Motion' },
                ].map((opt) => (
                  <button
                    key={opt.fps}
                    type="button"
                    onClick={() => setTargetFps(opt.fps)}
                    className={`min-h-[48px] p-2 rounded-xl border text-center transition cursor-pointer ${
                      targetFps === opt.fps
                        ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] font-bold'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                Raster Resolution Cap
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { w: 960, label: '960w', sub: 'Ultra-Low Wi-Fi' },
                  { w: 1280, label: '720p HD', sub: 'Recommended' },
                  { w: 1920, label: '1080p', sub: 'Sharp Lyrics' },
                ].map((opt) => (
                  <button
                    key={opt.w}
                    type="button"
                    onClick={() => setMaxWidth(opt.w)}
                    className={`min-h-[48px] p-2 rounded-xl border text-center transition cursor-pointer ${
                      maxWidth === opt.w
                        ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] font-bold'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Field Tip */}
          <div className="p-3 rounded-xl bg-[var(--badge-emerald-bg)] border border-[var(--badge-emerald-border)] text-[var(--badge-emerald-text)] flex items-start gap-2.5 text-[11px] leading-relaxed">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Zero-CPU Idle Engine:</strong> StageLink automatically idles at 0% CPU until a tablet or phone scans the QR code, and skips unchanged countdown/lyric frames automatically over Wi-Fi.
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-4 sm:px-5 py-3.5 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2.5 shrink-0 font-mono text-xs">
          <button
            type="button"
            onClick={closeStageLinkModal}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-secondary)] font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!canSubmit || isSaving}
              onClick={() => handleSave(false)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] disabled:opacity-40 border border-[var(--border-color)] text-[var(--text-primary)] font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
              <span>{editingSlot ? 'Save Changes' : 'Create Slot'}</span>
            </button>

            <button
              type="button"
              disabled={!canSubmit || isSaving}
              onClick={() => handleSave(true)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{editingSlot ? 'Save & Show QR' : 'Create & Pair Tablet QR'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
