import React, { useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import {
  X,
  Volume2,
  Tv,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Coffee,
  Eye,
  Sliders,
  Smartphone,
  Lock,
  Radio,
  ShieldAlert,
  FileCheck,
  ExternalLink,
  Layers,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    appSettings,
    updateSettings,
    showCursorInPreviews,
    setShowCursorInPreviews,
  } = useRigStore();

  const [activeTab, setActiveTab] = useState<'AUDIO' | 'DISPLAYS' | 'PERFORMANCE' | 'PRIVACY' | 'INTEGRATIONS' | 'LEGAL'>('AUDIO');

  if (!settingsModalOpen) return null;

  return (
    <div
      onClick={() => setSettingsModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[var(--text-primary)]"
      >
        {/* Modal Header */}
        <div className="p-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold tracking-wide uppercase text-[var(--text-primary)]">
                Preferences & Show-Day Settings
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                System guards, hardware telemetry thresholds & performance controls
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Rail */}
        <div className="flex items-center border-b border-[var(--border-color)] bg-[var(--bg-subcard)] px-4 shrink-0 font-mono text-xs">
          <button
            onClick={() => setActiveTab('AUDIO')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'AUDIO'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio Protection</span>
          </button>

          <button
            onClick={() => setActiveTab('DISPLAYS')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'DISPLAYS'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Displays & Smart TVs</span>
          </button>

          <button
            onClick={() => setActiveTab('PERFORMANCE')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'PERFORMANCE'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Performance</span>
          </button>

          <button
            onClick={() => setActiveTab('PRIVACY')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'PRIVACY'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('INTEGRATIONS')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'INTEGRATIONS'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Integrations (OSC / Deck)</span>
          </button>

          <button
            onClick={() => setActiveTab('LEGAL')}
            className={`py-3 px-3 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'LEGAL'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-300'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Legal & EULA</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs flex-1">
          {/* TAB 1: AUDIO */}
          {activeTab === 'AUDIO' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <span>Guard Audio Routing</span>
                      {appSettings.audioGuardEnabled && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Prevents newly plugged HDMI cables and TVs from unexpectedly stealing your audio output.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appSettings.audioGuardEnabled}
                      onChange={(e) => updateSettings({ audioGuardEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {appSettings.audioGuardEnabled && (
                  <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
                    <div className="text-[11px] text-[var(--text-muted)] font-bold">
                      When an HDMI display requests audio:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateSettings({ audioGuardMode: 'NOTIFY' })}
                        className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                          appSettings.audioGuardMode === 'NOTIFY'
                            ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                            : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                        }`}
                      >
                        <div className="font-bold">Polite Notification</div>
                        <div className="text-[10px] mt-0.5 opacity-80">
                          Show a toast with a 1-click [Switch Back] button
                        </div>
                      </button>

                      <button
                        onClick={() => updateSettings({ audioGuardMode: 'STRICT_LOCK' })}
                        className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                          appSettings.audioGuardMode === 'STRICT_LOCK'
                            ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                            : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                        }`}
                      >
                        <div className="font-bold">Strict Lock</div>
                        <div className="text-[10px] mt-0.5 opacity-80">
                          Immediately re-assert primary soundcard
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-300/90 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Pro AV Advice:</strong> If you are plugging into a TV and <em>want</em> music to play from the TV speakers, keep this setting <strong>OFF</strong>. If you are connected to a soundboard/PA at a live show, turn it <strong>ON</strong>.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISPLAYS */}
          {activeTab === 'DISPLAYS' && (
            <div className="space-y-4">
              {/* Anti-Dimming Heartbeat */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <span>Keep Smart TVs Awake (Anti-Dimming Heartbeat)</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Generates an imperceptible 1-pixel luminance flutter every 20s to prevent Samsung & LG TVs from aggressively dimming on static slides.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appSettings.antiDimmingHeartbeatEnabled}
                    onChange={(e) => updateSettings({ antiDimmingHeartbeatEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Keep-Awake / Presentation Sleep Shield */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span>Presentation Keep-Awake (Caffeine Shield)</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Prevents laptop OS display sleep, screensavers, or lock screens while Xteon is active.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appSettings.presentationKeepAwake}
                    onChange={(e) => updateSettings({ presentationKeepAwake: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Window Position Guardian */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Window Position Guardian (Anti-Reshuffle)
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Remembers exact presentation window coordinates if a cable is bumped and restores them on re-handshake.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appSettings.windowGuardianEnabled}
                    onChange={(e) => updateSettings({ windowGuardianEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Broadcast Telemetry Warnings */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Broadcast Telemetry Warnings
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Flags HDCP active encryptions and 60.00Hz vs 59.94Hz frame rate mismatches.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appSettings.broadcastTelemetryWarnings}
                    onChange={(e) => updateSettings({ broadcastTelemetryWarnings: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PERFORMANCE */}
          {activeTab === 'PERFORMANCE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Live Screen Preview Refresh Rate
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Controls thumbnail capture frequency. Lower rates save battery on portable laptops.
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { fps: 5, label: '5 FPS', desc: 'Battery Saver' },
                    { fps: 10, label: '10 FPS', desc: 'Balanced' },
                    { fps: 20, label: '20 FPS', desc: 'Silky Smooth (FOH)' },
                  ].map((p) => (
                    <button
                      key={p.fps}
                      onClick={() => updateSettings({ previewFps: p.fps })}
                      className={`p-3 rounded-lg border text-center transition cursor-pointer ${
                        appSettings.previewFps === p.fps
                          ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                          : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                      }`}
                    >
                      <div className="font-bold text-sm">{p.label}</div>
                      <div className="text-[10px] opacity-75">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Show Mouse Cursor in Previews
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Renders real-time cursor positions onto screen preview thumbnails.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCursorInPreviews}
                    onChange={(e) => setShowCursorInPreviews(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY */}
          {activeTab === 'PRIVACY' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Sensor Standby (Protect Internal Webcams)
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Keeps laptop integrated webcams disconnected so hardware privacy LEDs never trigger unexpectedly on stage.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appSettings.protectInternalCameras}
                    onChange={(e) => updateSettings({ protectInternalCameras: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Mobile Companion Untethered Server
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Local Wi-Fi director port and PIN authorization settings.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                      LAN HTTP Port
                    </label>
                    <input
                      type="number"
                      value={appSettings.companionPort}
                      onChange={(e) => updateSettings({ companionPort: Number(e.target.value) || 8765 })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                      6-Digit Security PIN
                    </label>
                    <input
                      type="text"
                      value={appSettings.companionPin}
                      onChange={(e) => updateSettings({ companionPin: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTEGRATIONS */}
          {activeTab === 'INTEGRATIONS' && (
            <div className="space-y-4">
              {/* Bitfocus Companion & Stream Deck */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                      🎛️
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)]">
                        Bitfocus Companion & Elgato Stream Deck
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Local WebSocket hub on port {appSettings.companionPort || 8765}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    ACTIVE (LAN :8765)
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)]">
                  <div className="font-bold text-cyan-400 mb-1">Supported Stream Deck Actions & Tally Feedback:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-[var(--text-muted)]">
                    <li><strong className="text-white">Emergency Master Blackout:</strong> Instant panic blanking of all stage displays</li>
                    <li><strong className="text-white">Flash Screen [1-8]:</strong> Momentary high-visibility identification flash card</li>
                    <li><strong className="text-white">Pattern Switcher:</strong> Cycle SMPTE Color Bars, Overscan, and PLUGE Super-Black</li>
                    <li><strong className="text-white">Caffeine Lock:</strong> Toggle Keep-Awake presentation shield with glowing LED feedback</li>
                    <li><strong className="text-white">Two-Way LCD Feedback:</strong> Key glows Green (All screens healthy), Yellow (Warning), Red (Cable drop)</li>
                  </ul>
                </div>
              </div>

              {/* Open Sound Control (OSC) UDP Engine */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <span>Open Sound Control (OSC) UDP Receiver</span>
                      {appSettings.oscEnabled && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
                          UDP :8000
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Show-control cue automation for QLab 5, Resolume Arena, TouchDesigner, and digital audio desks.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appSettings.oscEnabled ?? true}
                      onChange={(e) => updateSettings({ oscEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                      OSC Inbound UDP Port
                    </label>
                    <input
                      type="number"
                      value={appSettings.oscPort || 8000}
                      onChange={(e) => updateSettings({ oscPort: Number(e.target.value) || 8000 })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-xs font-mono"
                    />
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex flex-col justify-center">
                    <div>Path: <code className="text-cyan-300">/xteon/blackout [1/0]</code></div>
                    <div>Path: <code className="text-cyan-300">/xteon/pattern [string]</code></div>
                  </div>
                </div>
              </div>

              {/* ProPresenter 7 Live Synchronizer */}
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      ProPresenter 7 REST API Synchronizer
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Detects active worship lyric, audience, and stage confidence screens.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appSettings.propresenterSyncEnabled ?? false}
                      onChange={(e) => updateSettings({ propresenterSyncEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {appSettings.propresenterSyncEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                        Host Address
                      </label>
                      <input
                        type="text"
                        value={appSettings.propresenterHost || '127.0.0.1'}
                        onChange={(e) => updateSettings({ propresenterHost: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                        HTTP API Port
                      </label>
                      <input
                        type="number"
                        value={appSettings.propresenterPort || 1025}
                        onChange={(e) => updateSettings({ propresenterPort: Number(e.target.value) || 1025 })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: LEGAL & EULA */}
          {activeTab === 'LEGAL' && (
            <div className="space-y-4">
              {/* Rigging & Structural Disclaimer */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>1. Structural Rigging & Electrical Safety Disclaimer</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Xteon is exclusively a logical pre-production workflow planner and hardware monitor. It does <strong>NOT</strong> perform structural engineering calculations, truss weight load ratings, rigging point certifications, or electrical ampacity sizing.
                </p>
                <p className="text-[10px] text-slate-400">
                  All physical hardware installation, cable truss suspension, and power distribution must be verified and approved on-site by certified ETCP rigging engineers and licensed master electricians. The user assumes all risk and liability for physical equipment rigging.
                </p>
              </div>

              {/* Show Outage & Downtime Indemnity */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>2. Live Event Interruption & Signal Outage Indemnity</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Under no circumstances shall the developer, copyright holder, or affiliated entities be liable for direct, indirect, incidental, punitive, or consequential damages resulting from signal loss, broadcast interruptions, display blackouts, hardware damage, or show downtime during live events, broadcasts, concerts, or keynotes.
                </p>
                <p className="text-[10px] text-slate-400">
                  Xteon is provided strictly <strong>"AS-IS"</strong> without warranty of any kind, express or implied.
                </p>
              </div>

              {/* Presentation Privacy Disclaimer */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <FileCheck className="w-4 h-4 shrink-0" />
                  <span>3. Presentation Privacy & Screen Cloning Waiver</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Audio Route Guard, Keep-Awake Caffeine Shield, and Mirroring Alerts are auxiliary software notifications and do not substitute for physical hardware isolation switches or operating system display verification. The presenter retains sole responsibility for verifying screen cloning before presenting sensitive material.
                </p>
              </div>

              {/* Copyright & Commercial License */}
              <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                <div>
                  <strong>Xteon Pro AV Rig Planner & Hardware Intelligence Workspace</strong>
                  <div>Copyright © 2026 Patrick Udoh (patrickudo2004@gmail.com). All Rights Reserved.</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                    Commercial License
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between shrink-0 font-mono text-xs">
          <button
            onClick={() => {
              if (window.confirm('Reset all preferences to default values?')) {
                updateSettings({
                  audioGuardEnabled: false,
                  audioGuardMode: 'NOTIFY',
                  antiDimmingHeartbeatEnabled: false,
                  windowGuardianEnabled: true,
                  broadcastTelemetryWarnings: true,
                  previewFps: 20,
                  protectInternalCameras: true,
                  presentationKeepAwake: false,
                  companionPort: 8765,
                  companionPin: '842-190',
                });
              }
            }}
            className="text-[var(--text-muted)] hover:text-rose-400 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => setSettingsModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Close & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
