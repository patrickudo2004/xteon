import React, { useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import {
  X,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Sliders,
  ExternalLink,
  Split,
  Shield,
  HelpCircle,
} from 'lucide-react';

export const SmartTvGuideModal: React.FC = () => {
  const {
    smartTvGuideModalOpen,
    setSmartTvGuideModalOpen,
    setTestPatternModalOpen,
    openTestPatternModal,
    liveDisplays,
  } = useRigStore();

  const [activeBrand, setActiveBrand] = useState<'SAMSUNG' | 'LG' | 'SONY' | 'SPLITTER'>('SAMSUNG');

  if (!smartTvGuideModalOpen) return null;

  return (
    <div
      onClick={() => setSmartTvGuideModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-[var(--text-primary)]"
      >
        {/* Header */}
        <div className="p-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold tracking-wide uppercase text-[var(--text-primary)]">
                Smart TV & Splitter Field Guide
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Prevent auto-dimming, multi-view shrinking, overscan cropping & splitter pitfalls
              </p>
            </div>
          </div>
          <button
            onClick={() => setSmartTvGuideModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Selector Rail */}
        <div className="flex items-center border-b border-[var(--border-color)] bg-[var(--bg-subcard)] px-4 shrink-0 font-mono text-xs">
          <button
            onClick={() => setActiveBrand('SAMSUNG')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeBrand === 'SAMSUNG'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <span>Samsung TV</span>
          </button>

          <button
            onClick={() => setActiveBrand('LG')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeBrand === 'LG'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <span>LG webOS</span>
          </button>

          <button
            onClick={() => setActiveBrand('SONY')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeBrand === 'SONY'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <span>Sony Bravia</span>
          </button>

          <button
            onClick={() => setActiveBrand('SPLITTER')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeBrand === 'SPLITTER'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>1x4 / 1x8 Splitters</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 font-mono text-xs flex-1">
          {/* TAB 1: SAMSUNG */}
          {activeBrand === 'SAMSUNG' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-300 leading-relaxed">
                Samsung TVs are ubiquitous in venues, hospitality, and event halls. By default, consumer firmware enables Eco Sensors and Multi View, which cause screens to unexpectedly shrink or dim during live shows.
              </div>

              {/* Problem 1: MiniView / Multi View */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>1. Stop Screen Shrinking to MiniView / Multi View</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  When a laptop HDMI syncs, Samsung TVs can automatically pop open a split-screen Multi View window.
                </p>
                <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] space-y-1 text-[11px]">
                  <div className="text-cyan-400 font-bold">Quick Fix:</div>
                  <div>• Press <strong>Home / Source</strong> on remote → navigate to your HDMI input → press <strong>Up / Down</strong> → select <strong>Edit / Device Type</strong>.</div>
                  <div>• Change the icon to <strong>"PC"</strong>. This forces the TV to turn off Multi View triggers and disables laggy post-processing!</div>
                  <div className="mt-1 text-[var(--text-muted)]">• Or navigate to: <em>Settings → General & Privacy → Multi View → Disable Auto-Start</em>.</div>
                </div>
              </div>

              {/* Problem 2: Screen Auto-Dimming */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>2. Stop Auto-Dimming on Static Slides</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Samsung Eco Sensor detects static presentation slides and aggressively dims backlights to save energy.
                </p>
                <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] space-y-1 text-[11px]">
                  <div className="text-cyan-400 font-bold">TV Remote Settings:</div>
                  <div>• Navigate to: <em>Settings → General & Privacy → Power and Energy Saving</em>.</div>
                  <div>• Turn <strong>OFF</strong> <em>Brightness Optimization</em> and <em>Energy Saving Solution</em>.</div>
                  <div className="text-emerald-400 font-bold pt-1">
                    ✓ Xteon Built-In Shield: Enable "Anti-Dimming Heartbeat" in Settings to automatically keep backlights awake with sub-pixel micro-activity!
                  </div>
                </div>
              </div>

              {/* Problem 3: Overscan Cropping */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>3. Fix Cropped Edges (Overscan 16:9 Standard)</span>
                </div>
                <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] space-y-1 text-[11px]">
                  <div>• Navigate to: <em>Settings → Picture → Picture Size Settings</em>.</div>
                  <div>• Set Picture Size to <strong>16:9 Standard</strong> or <strong>Custom</strong>.</div>
                  <div>• Ensure <strong>Fit to Screen</strong> is set to <strong>ON</strong> (not Auto or Off).</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LG */}
          {activeBrand === 'LG' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-300 leading-relaxed">
                LG webOS Commercial and OLED panels are popular in live venues. Configure these 3 critical settings for flawless 1:1 presentation display:
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="text-cyan-400 font-bold text-xs">1. Enable Just Scan (Prevent 5% Edge Cropping)</div>
                <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] space-y-1 text-[11px]">
                  <div>• Open: <em>Settings (Gear icon) → Picture → Aspect Ratio</em>.</div>
                  <div>• Set Aspect Ratio to <strong>Original</strong> or <strong>16:9</strong>.</div>
                  <div>• Toggle <strong>Just Scan</strong> to <strong>ON</strong> (if set to Auto, edges may cut off on source switch).</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="text-cyan-400 font-bold text-xs">2. Disable Energy Saving & ASBL Dimming</div>
                <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] space-y-1 text-[11px]">
                  <div>• Open: <em>Settings → Support → Energy Saving</em>.</div>
                  <div>• Set <strong>Energy Saving Step</strong> to <strong>OFF</strong>.</div>
                  <div>• In Picture settings, turn off <em>Auto Dynamic Contrast</em> and <em>Motion Eye Care</em>.</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="text-cyan-400 font-bold text-xs">3. Activate LG PC Mode (Zero Input Lag)</div>
                <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] space-y-1 text-[11px]">
                  <div>• Long-press the <strong>Input</strong> button to open <strong>Home Dashboard</strong>.</div>
                  <div>• Click the 3 dots in upper right → select <strong>Edit Inputs</strong>.</div>
                  <div>• Change your HDMI icon to a <strong>PC</strong> icon. This locks 4:4:4 chroma and bypasses video processing!</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SONY */}
          {activeBrand === 'SONY' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-300 leading-relaxed">
                Sony Bravia displays feature high image quality but have subtle "Display Area" overscan defaults.
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="text-cyan-400 font-bold text-xs">1. Full Pixel Mapping (+1 Area)</div>
                <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] space-y-1 text-[11px]">
                  <div>• Navigate to: <em>Settings → Display & Sound → Screen</em>.</div>
                  <div>• Set <strong>Wide Mode</strong> to <strong>Full</strong>.</div>
                  <div>• Turn <strong>Auto Display Area</strong> to <strong>OFF</strong>.</div>
                  <div>• Set <strong>Display Area</strong> to <strong>Full Pixel</strong> (or <strong>+1</strong> on 1080p models).</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="text-cyan-400 font-bold text-xs">2. Disable Ambient Light Sensor</div>
                <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] space-y-1 text-[11px]">
                  <div>• Navigate to: <em>Settings → System → Power & Energy</em>.</div>
                  <div>• Turn <strong>Energy Saver</strong> to <strong>OFF</strong>.</div>
                  <div>• In Picture settings, toggle <strong>Light Sensor / Ambient Optimization</strong> to <strong>OFF</strong> so stage lights do not darken the screen.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SPLITTERS */}
          {activeBrand === 'SPLITTER' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed">
                <strong>Why doesn't the laptop detect 3 or 4 TVs on a 1x4 splitter?</strong><br />
                HDMI uses a point-to-point DDC (Display Data Channel) protocol. When your laptop is connected to an Antiference or Kramer 1x4 splitter, the laptop's GPU only talks to the splitter's internal receiver chip. Downstream CAT6 HDBaseT or HDMI lines are one-way broadcast feeds with zero telemetry returned to the laptop.
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="text-cyan-400 font-bold text-xs flex items-center gap-1.5">
                  <Split className="w-4 h-4 text-amber-400" />
                  <span>Splitter EDID Dip-Switch Rules for Show-Day:</span>
                </div>
                <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] space-y-2 text-[11px]">
                  <div>
                    <strong>Rule #1 (Lowest Common Denominator):</strong> If your splitter is set to "Copy Output 1", always plug the <em>lowest resolution</em> or most finicky TV into <strong>Output 1</strong>. This ensures the laptop sends a signal (e.g. 1080p 60Hz) that every TV can display.
                  </div>
                  <div>
                    <strong>Rule #2 (Fixed 1080p Lock):</strong> If you have mixed 4K and 1080p screens, flip the splitter's physical DIP switches to <strong>Standard 1080p EDID</strong>. This prevents 4K screens from negotiating 4K and causing 1080p screens to show "Signal Not Supported" / black screen.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="text-cyan-300 font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>How Xteon Solves This in Software:</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Use Xteon's <strong>"Branch Output (Splitter / DA)"</strong> feature on the Live Map! You can document your exact physical rig (1x2, 1x4, 1x8, CAT6 HDBaseT), name each TV ("Dining TV", "Dance Floor Screen", "Bar Area"), track cable distances, and see live mirrored previews for every physical screen.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[var(--text-muted)] font-mono">
            Pro Tip: Use the Overscan & Framing test pattern to visually verify 100% raster boundaries.
          </div>
          <button
            onClick={() => {
              setSmartTvGuideModalOpen(false);
              const target = liveDisplays.find((d) => d.osIndex !== 1) || liveDisplays[0];
              if (target) {
                openTestPatternModal(target.id);
              } else {
                setTestPatternModalOpen(true);
              }
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Launch Test Pattern</span>
          </button>
        </div>
      </div>
    </div>
  );
};
