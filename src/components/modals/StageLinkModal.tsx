import React, { useEffect, useMemo, useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { StageLinkSourceMode } from '../../types';
import {
  X,
  Radio,
  AppWindow,
  Monitor,
  RefreshCw,
  QrCode,
  CheckCircle2,
  AlertTriangle,
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
  const [targetFps, setTargetFps] = useState<number>(20);
  const [maxWidth, setMaxWidth] = useState<number>(1280);
  const [isSaving, setIsSaving] = useState(false);

  const selectableWindows = useMemo(
    () => osWindows.filter((w) => !w.is_xteon_self),
    [osWindows]
  );

  // Build unified source options for WINDOW and DISPLAY modes
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
      setSourceMode(editingSlot.source_mode === 'DISPLAY' ? 'DISPLAY' : 'WINDOW');

      const normPrim =
        editingSlot.primary_source_id.startsWith('W:') || editingSlot.primary_source_id.startsWith('D:')
          ? editingSlot.primary_source_id
          : editingSlot.source_mode === 'DISPLAY'
          ? `D:${editingSlot.primary_source_id}`
          : `W:${editingSlot.primary_source_id}`;
      setPrimarySourceId(normPrim);

      setTargetFps(editingSlot.target_fps || 20);
      setMaxWidth(editingSlot.max_width || 1280);
    } else {
      const nextNum = stageLinkSlots.length + 1;
      setName(nextNum === 1 ? 'Pulpit Confidence Monitor' : `Stage Monitor ${nextNum}`);
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
      }
    }
  }, [sourceMode, sourceOptions]);

  if (!stageLinkModalOpen) return null;

  const currentOpts = sourceMode === 'WINDOW' ? sourceOptions.winOpts : sourceOptions.dispOpts;
  const selectedPrimaryObj = sourceOptions.allOpts.find((o) => o.value === primarySourceId);

  const canSubmit = Boolean(name.trim()) && Boolean(primarySourceId);

  const handleSave = async (openQrAfter: boolean) => {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    try {
      const savedSlot = await upsertStageLinkSlot({
        id: editingSlot?.id,
        name: name.trim(),
        stage_zone: stageZone.trim() || 'Stage Area',
        source_mode: sourceMode,
        primary_source_id: primarySourceId,
        primary_source_label: selectedPrimaryObj?.label || primarySourceId,
        secondary_source_id: null,
        secondary_source_label: null,
        split_layout: null,
        target_fps: targetFps,
        max_width: maxWidth,
      });

      closeStageLinkModal();
      if (openQrAfter && savedSlot) {
        openQrForStageSlot(savedSlot.id);
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
        className="w-full max-w-xl max-h-[90dvh] rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col text-[var(--text-primary)]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] flex items-center justify-center text-[var(--accent-cyan)] shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold font-mono text-[var(--text-primary)] truncate">
                {editingSlot ? `Configure Stage Slot: ${editingSlot.name}` : 'Create Stage Receiver Slot'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] truncate">
                Direct zero-cable streaming to wireless confidence monitors
              </p>
            </div>
          </div>
          <button
            onClick={closeStageLinkModal}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* Slot Name & Stage Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Slot / Device Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pulpit Confidence Monitor"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Stage Zone / Position
              </label>
              <input
                type="text"
                value={stageZone}
                onChange={(e) => setStageZone(e.target.value)}
                placeholder="e.g. Lower Pulpit Shelf"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Source Mode: 2 Clean Options */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Stream Source Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  mode: 'WINDOW' as StageLinkSourceMode,
                  icon: AppWindow,
                  title: 'Application Window',
                  desc: 'Stream a running presentation, lyrics, countdown, or notes window',
                },
                {
                  mode: 'DISPLAY' as StageLinkSourceMode,
                  icon: Monitor,
                  title: 'Entire Display / Screen',
                  desc: 'Stream a physical monitor, projector, or full desktop screen',
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = sourceMode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => setSourceMode(opt.mode)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--text-primary)] ring-1 ring-[var(--accent-cyan)]/40'
                        : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`} />
                      <span className="font-bold text-xs text-[var(--text-primary)]">{opt.title}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Selection Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {sourceMode === 'WINDOW' ? 'Select Application Window' : 'Select Display Screen'}
              </label>
              <button
                type="button"
                onClick={() => refreshOsWindows()}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh List</span>
              </button>
            </div>

            <select
              value={primarySourceId}
              onChange={(e) => setPrimarySourceId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-cyan-400"
            >
              <option value="">-- Choose Source --</option>
              {currentOpts.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} [{opt.detail}]
                </option>
              ))}
            </select>

            {selectedPrimaryObj?.isMinimized && selectedPrimaryObj.rawHwnd && (
              <div className="p-2.5 rounded-xl bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Window is currently minimized. Windows pauses rendering minimized apps.</span>
                </div>
                <button
                  type="button"
                  onClick={() => restoreOsWindowBehind(selectedPrimaryObj.rawHwnd!)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--badge-amber-border)] font-bold cursor-pointer"
                >
                  Restore Window Behind
                </button>
              </div>
            )}
          </div>

          {/* Stream Quality Settings */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-color)]">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Framerate</label>
              <select
                value={targetFps}
                onChange={(e) => setTargetFps(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)]"
              >
                <option value={15}>15 FPS (Lowest Bandwidth)</option>
                <option value={20}>20 FPS (Smooth Standard)</option>
                <option value={30}>30 FPS (Fluid Animation)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Max Resolution</label>
              <select
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)]"
              >
                <option value={960}>960px (Standard Tablet)</option>
                <option value={1280}>1280px (720p HD - Recommended)</option>
                <option value={1920}>1920px (1080p Full HD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={closeStageLinkModal}
            className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono font-bold transition cursor-pointer shrink-0"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!canSubmit || isSaving}
              onClick={() => handleSave(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Save & Pair (QR)</span>
            </button>
            <button
              type="button"
              disabled={!canSubmit || isSaving}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Slot'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
