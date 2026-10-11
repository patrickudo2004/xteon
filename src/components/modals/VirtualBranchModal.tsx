import React, { useState, useEffect } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { VirtualDistributionBranch, BranchedDownstreamDisplay } from '../../types';
import {
  X,
  Split,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  Sparkles,
  Cable,
  Tv,
} from 'lucide-react';

export const VirtualBranchModal: React.FC = () => {
  const {
    branchModalOpen,
    setBranchModalOpen,
    activeBranchDisplayId,
    liveDisplays,
    distributionBranches,
    setDistributionBranch,
    removeDistributionBranch,
  } = useRigStore();

  const targetDisplay = liveDisplays.find((d) => d.id === activeBranchDisplayId);
  const existingBranch = activeBranchDisplayId ? distributionBranches[activeBranchDisplayId] : null;

  const [splitterType, setSplitterType] = useState<'SPLITTER_1X2' | 'SPLITTER_1X4' | 'SPLITTER_1X8' | 'HDBASET_EXTENDER'>('SPLITTER_1X4');
  const [splitterModel, setSplitterModel] = useState('Antiference 1x4 4K HDMI Splitter over CAT6 (PoC)');
  const [cableMedium, setCableMedium] = useState<'DIRECT_HDMI' | 'CAT6_HDBASET' | 'OPTICAL_FIBER'>('CAT6_HDBASET');
  const [downstreamDisplays, setDownstreamDisplays] = useState<BranchedDownstreamDisplay[]>([]);

  const defaultCount = splitterType === 'SPLITTER_1X2' ? 2 : splitterType === 'SPLITTER_1X4' ? 4 : 8;

  useEffect(() => {
    if (existingBranch) {
      setSplitterType(existingBranch.splitterType);
      setSplitterModel(existingBranch.splitterModel);
      setCableMedium(existingBranch.cableMedium);
      setDownstreamDisplays(existingBranch.downstreamDisplays);
    } else {
      // Default to 1x4 (like Antiference setup)
      const count = splitterType === 'SPLITTER_1X2' ? 2 : splitterType === 'SPLITTER_1X4' ? 4 : 8;
      const initial: BranchedDownstreamDisplay[] = Array.from({ length: count }, (_, i) => ({
        id: `branch-disp-${Date.now()}-${i + 1}`,
        name: `Stage TV ${i + 1}`,
        customAlias: i === 0 ? 'Main Dining TV' : i === 1 ? 'Dance Floor Screen' : i === 2 ? 'Bar Area Monitor' : 'Foyer Display',
        stageZone: i === 0 ? 'Dining Hall' : i === 1 ? 'Main Stage' : i === 2 ? 'Bar Area' : 'Entrance',
        portType: cableMedium === 'CAT6_HDBASET' ? 'HDBASET_CAT6' : 'HDMI_2_0',
        cableLengthMeters: (i + 1) * 15,
      }));
      setDownstreamDisplays(initial);
    }
  }, [existingBranch, activeBranchDisplayId, splitterType, cableMedium]);

  if (!branchModalOpen || !activeBranchDisplayId || !targetDisplay) return null;

  const handleSplitterTypeChange = (type: 'SPLITTER_1X2' | 'SPLITTER_1X4' | 'SPLITTER_1X8' | 'HDBASET_EXTENDER') => {
    setSplitterType(type);
    const count = type === 'SPLITTER_1X2' ? 2 : type === 'SPLITTER_1X4' ? 4 : 8;
    const model =
      type === 'SPLITTER_1X4'
        ? 'Antiference 1x4 4K HDMI Splitter over CAT6 (PoC)'
        : type === 'SPLITTER_1X2'
        ? 'Kramer 1x2 4K60 Distribution Amp'
        : 'Extron 1x8 HDMI 4K Distribution Amp';
    setSplitterModel(model);

    // Adjust downstream displays count
    setDownstreamDisplays((prev) => {
      const next = [...prev];
      while (next.length < count) {
        const i = next.length;
        next.push({
          id: `branch-disp-${Date.now()}-${i + 1}`,
          name: `Downstream TV ${i + 1}`,
          customAlias: `Stage Screen ${i + 1}`,
          stageZone: 'Stage Area',
          portType: cableMedium === 'CAT6_HDBASET' ? 'HDBASET_CAT6' : 'HDMI_2_0',
          cableLengthMeters: (i + 1) * 15,
        });
      }
      return next.slice(0, count);
    });
  };

  const handleUpdateDownstream = (index: number, partial: Partial<BranchedDownstreamDisplay>) => {
    setDownstreamDisplays((prev) =>
      prev.map((disp, i) => (i === index ? { ...disp, ...partial } : disp))
    );
  };

  const handleSave = () => {
    const branch: VirtualDistributionBranch = {
      parentDisplayId: activeBranchDisplayId,
      splitterType,
      splitterModel,
      cableMedium,
      downstreamDisplays,
      enabled: true,
    };
    setDistributionBranch(branch);
    setBranchModalOpen(false);
  };

  const handleRemove = () => {
    if (window.confirm('Remove virtual splitter branching on this feed?')) {
      removeDistributionBranch(activeBranchDisplayId);
      setBranchModalOpen(false);
    }
  };

  return (
    <div
      onClick={() => setBranchModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[var(--text-primary)]"
      >
        {/* Header */}
        <div className="p-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold tracking-wide uppercase text-[var(--text-primary)]">
                Branch Output / Add Virtual Splitter
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Branch feed for: <span className="text-cyan-400 font-bold">{targetDisplay.customAlias || targetDisplay.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setBranchModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 font-mono text-xs flex-1">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Hardware Notice:</strong> Physical HDMI splitters (like Antiference or Kramer) isolate downstream screens from the laptop GPU. This tool branches the live feed on your topology map, allowing you to name each TV, set stage zones, and mirror live previews.
            </div>
          </div>

          {/* Splitter Presets */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase font-bold text-[var(--text-muted)] block">
              1. Distribution Hardware Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'SPLITTER_1X2', label: '1x2 Splitter', desc: 'Dual Output' },
                { type: 'SPLITTER_1X4', label: '1x4 Splitter', desc: 'e.g. Antiference (4K)' },
                { type: 'SPLITTER_1X8', label: '1x8 DA', desc: 'Arena Distribution' },
              ].map((s) => (
                <button
                  key={s.type}
                  onClick={() => handleSplitterTypeChange(s.type as any)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    splitterType === s.type
                      ? 'bg-amber-500/10 border-amber-400 text-amber-300'
                      : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className="font-bold text-xs">{s.label}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Model & Medium */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                Hardware Model Label
              </label>
              <input
                type="text"
                value={splitterModel}
                onChange={(e) => setSplitterModel(e.target.value)}
                placeholder="e.g. Antiference 1x4 4K PoC"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                Transmission Cable Medium
              </label>
              <select
                value={cableMedium}
                onChange={(e) => setCableMedium(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-white text-xs font-mono"
              >
                <option value="CAT6_HDBASET">CAT6 / HDBaseT Balun (PoC)</option>
                <option value="DIRECT_HDMI">Direct HDMI Passive Copper</option>
                <option value="OPTICAL_FIBER">Optical Fiber HDMI (Single-Mode)</option>
              </select>
            </div>
          </div>

          {/* Downstream Screen Configuration */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase font-bold text-[var(--text-muted)]">
                2. Downstream Displays Connected ({downstreamDisplays.length} Outputs)
              </label>
              <span className="text-[10px] text-cyan-400">Previews will mirror automatically</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {downstreamDisplays.map((disp, idx) => (
                <div
                  key={disp.id}
                  className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <input
                        type="text"
                        value={disp.customAlias}
                        onChange={(e) => handleUpdateDownstream(idx, { customAlias: e.target.value })}
                        placeholder="Screen Alias (e.g. Bar TV)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={disp.stageZone}
                        onChange={(e) => handleUpdateDownstream(idx, { stageZone: e.target.value })}
                        placeholder="Stage Zone (e.g. Patio)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={disp.cableLengthMeters}
                        onChange={(e) => handleUpdateDownstream(idx, { cableLengthMeters: Number(e.target.value) || 10 })}
                        placeholder="Meters"
                        className="w-20 px-2 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-xs font-mono text-center"
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">meters</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between shrink-0 font-mono text-xs">
          {existingBranch ? (
            <button
              onClick={handleRemove}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Branching</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBranchModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[var(--bg-subcard)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Branch Topology</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
