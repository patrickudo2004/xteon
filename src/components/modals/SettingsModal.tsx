import React, { useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import {
  X,
  Volume2,
  Tv,
  Zap,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Coffee,
  Radio,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    appSettings,
    updateSettings,
    companionStatus,
    configureCompanionSecurity,
    showCursorInPreviews,
    setShowCursorInPreviews,
  } = useRigStore();

  const [activeTab, setActiveTab] = useState<
    'AUDIO' | 'DISPLAYS' | 'PERFORMANCE' | 'PRIVACY' | 'INTEGRATIONS' | 'LEGAL'
  >('AUDIO');

  if (!settingsModalOpen) return null;

  const activePinValue = appSettings.companionPin || companionStatus?.active_pin || '';
  const pinLockEnabled = appSettings.companionPinLockEnabled ?? companionStatus?.pin_lock_enabled ?? true;

  return (
    <div
      onClick={() => setSettingsModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] text-[var(--text-primary)]"
      >
        {/* Modal Header */}
        <div className="p-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] flex items-center justify-center text-[var(--accent-cyan)] font-bold shrink-0">
              ⚙️
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-mono font-bold tracking-wide uppercase text-[var(--text-primary)] truncate">
                Preferences & Show-Day Settings
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                System guards, hardware telemetry thresholds & StageLink security
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="min-w-[36px] min-h-[36px] p-1.5 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer shrink-0 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Tab Navigation Rail */}
        <div className="flex items-center overflow-x-auto whitespace-nowrap border-b border-[var(--border-color)] bg-[var(--bg-subcard)] px-3 sm:px-4 shrink-0 font-mono text-xs">
          {[
            { id: 'AUDIO' as const, icon: Volume2, label: 'Audio' },
            { id: 'DISPLAYS' as const, icon: Tv, label: 'Displays' },
            { id: 'PERFORMANCE' as const, icon: Zap, label: 'Performance' },
            { id: 'PRIVACY' as const, icon: ShieldCheck, label: 'Privacy & StageLink' },
            { id: 'INTEGRATIONS' as const, icon: Radio, label: 'Integrations' },
            { id: 'LEGAL' as const, icon: FileCheck, label: 'Legal' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                  active
                    ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 font-mono text-xs flex-1">
          {/* TAB 1: AUDIO */}
          {activeTab === 'AUDIO' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <span>Guard Audio Routing</span>
                      {appSettings.audioGuardEnabled && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)]">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Prevents newly plugged HDMI cables and TVs from unexpectedly stealing your audio output.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={appSettings.audioGuardEnabled}
                      onChange={(e) => updateSettings({ audioGuardEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {appSettings.audioGuardEnabled && (
                  <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
                    <div className="text-[11px] text-[var(--text-muted)] font-bold">
                      When an HDMI display requests audio:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => updateSettings({ audioGuardMode: 'NOTIFY' })}
                        className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                          appSettings.audioGuardMode === 'NOTIFY'
                            ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)]'
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
                            ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)]'
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

              <div className="p-3.5 rounded-xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] text-[11px] text-[var(--badge-cyan-text)] leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Pro AV Advice:</strong> If you are plugging into a TV and <em>want</em> music to play from the TV speakers, keep this setting <strong>OFF</strong>. If you are connected to a soundboard/PA at a live show, turn it <strong>ON</strong>.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISPLAYS */}
          {activeTab === 'DISPLAYS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Keep Smart TVs Awake (Anti-Dimming Heartbeat)
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Generates an imperceptible 1-pixel luminance flutter every 20s to prevent Samsung & LG TVs from dimming on static slides.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={appSettings.antiDimmingHeartbeatEnabled}
                    onChange={(e) => updateSettings({ antiDimmingHeartbeatEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-[var(--accent-amber)]" />
                    <span>Presentation Keep-Awake (Caffeine Shield)</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Prevents laptop OS display sleep, screensavers, or lock screens while Xteon is active.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={appSettings.presentationKeepAwake}
                    onChange={(e) => updateSettings({ presentationKeepAwake: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Window Position Guardian (Anti-Reshuffle)
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Remembers exact presentation window coordinates if a cable is bumped and restores them on re-handshake.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={appSettings.windowGuardianEnabled}
                    onChange={(e) => updateSettings({ windowGuardianEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Broadcast Telemetry Warnings
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Flags HDCP active encryptions and 60.00Hz vs 59.94Hz frame rate mismatches.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={appSettings.broadcastTelemetryWarnings}
                    onChange={(e) => updateSettings({ broadcastTelemetryWarnings: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
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
                          ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)]'
                          : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                      }`}
                    >
                      <div className="font-bold text-sm">{p.label}</div>
                      <div className="text-[10px] opacity-75">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Show Mouse Cursor in Previews
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Renders real-time cursor positions onto screen preview thumbnails.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={showCursorInPreviews}
                    onChange={(e) => setShowCursorInPreviews(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY & STAGELINK SECURITY */}
          {activeTab === 'PRIVACY' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Sensor Standby (Protect Internal Webcams)
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                    Keeps laptop integrated webcams disconnected so hardware privacy LEDs never trigger unexpectedly on stage.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={appSettings.protectInternalCameras}
                    onChange={(e) => updateSettings({ protectInternalCameras: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      StageLink & Mobile Companion Security Gate
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      QR scans auto-pair securely; manual IP visitors on shared church Wi-Fi must enter your live PIN.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={pinLockEnabled}
                      onChange={(e) => configureCompanionSecurity(e.target.checked, activePinValue)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                      LAN HTTP / WebSocket Port
                    </label>
                    <input
                      type="number"
                      value={appSettings.companionPort}
                      onChange={(e) => updateSettings({ companionPort: Number(e.target.value) || 8765 })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                      Live Session Security PIN
                    </label>
                    <input
                      type="text"
                      value={activePinValue}
                      placeholder="Runtime Generated PIN"
                      onChange={(e) => configureCompanionSecurity(pinLockEnabled, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTEGRATIONS */}
          {activeTab === 'INTEGRATIONS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      Bitfocus Companion & Elgato Stream Deck
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Local WebSocket & REST hub on port {appSettings.companionPort || 8765}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border border-[var(--badge-emerald-border)] text-[10px] font-bold">
                    ACTIVE (:{appSettings.companionPort || 8765})
                  </span>
                </div>

                <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)]">
                  <div className="font-bold text-[var(--accent-cyan)] mb-1">
                    Supported Stream Deck & StageLink Actions:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-[var(--text-muted)]">
                    <li><strong className="text-[var(--text-primary)]">Emergency Master Blackout:</strong> Instant blanking of stage displays & StageLink tablets</li>
                    <li><strong className="text-[var(--text-primary)]">Flash Screen / StageLink:</strong> Momentary high-visibility identification flash</li>
                    <li><strong className="text-[var(--text-primary)]">Stage Whisper API:</strong> Push silent countdown/wrap-up alerts to pulpit tablets</li>
                    <li><strong className="text-[var(--text-primary)]">Window Recall:</strong> Pull stray desktop windows back to FOH primary display</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <span>Open Sound Control (OSC) UDP Receiver</span>
                      {appSettings.oscEnabled && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] font-bold">
                          UDP :{appSettings.oscPort || 8000}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Show-control cue automation for QLab 5, Resolume Arena, TouchDesigner, and digital audio desks.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={appSettings.oscEnabled ?? true}
                      onChange={(e) => updateSettings({ oscEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                      OSC Inbound UDP Port
                    </label>
                    <input
                      type="number"
                      value={appSettings.oscPort || 8000}
                      onChange={(e) => updateSettings({ oscPort: Number(e.target.value) || 8000 })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono"
                    />
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex flex-col justify-center">
                    <div>Path: <code className="text-[var(--accent-cyan)]">/xteon/blackout [1/0]</code></div>
                    <div>Path: <code className="text-[var(--accent-cyan)]">/xteon/pattern [string]</code></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      ProPresenter 7 REST API Synchronizer
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Detects active worship lyric, audience, and stage confidence screens.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={appSettings.propresenterSyncEnabled ?? false}
                      onChange={(e) => updateSettings({ propresenterSyncEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {appSettings.propresenterSyncEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                        Host Address
                      </label>
                      <input
                        type="text"
                        value={appSettings.propresenterHost || '127.0.0.1'}
                        onChange={(e) => updateSettings({ propresenterHost: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono"
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
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono"
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
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--accent-amber)] font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>1. Structural Rigging & Electrical Safety Disclaimer</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Xteon is exclusively a logical pre-production workflow planner and hardware monitor. It does <strong>NOT</strong> perform structural engineering calculations, truss weight load ratings, rigging point certifications, or electrical ampacity sizing.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--accent-rose)] font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>2. Live Event Interruption & Signal Outage Indemnity</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Xteon is provided strictly <strong>"AS-IS"</strong> without warranty of any kind, express or implied.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--accent-cyan)] font-bold text-xs uppercase tracking-wider">
                  <FileCheck className="w-4 h-4 shrink-0" />
                  <span>3. Presentation Privacy & Screen Cloning Waiver</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Audio Route Guard, Keep-Awake Caffeine Shield, and Mirroring Alerts are auxiliary software notifications and do not substitute for physical hardware isolation switches or operating system display verification.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="text-[var(--text-primary)]">Xteon Pro AV Rig Planner & Hardware Intelligence Workspace</strong>
                  <div>Copyright © 2026 Patrick Udoh (patrickudo2004@gmail.com). All Rights Reserved.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] font-bold">
                  Commercial License
                </span>
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
                  companionPin: companionStatus?.active_pin || '',
                  companionPinLockEnabled: true,
                });
                configureCompanionSecurity(true);
              }
            }}
            className="text-[var(--text-muted)] hover:text-[var(--accent-rose)] flex items-center gap-1.5 transition cursor-pointer"
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
