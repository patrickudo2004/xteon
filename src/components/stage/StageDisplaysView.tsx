import React, { useState, useEffect, useMemo } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { AppWindowPickerModal } from '../modals/AppWindowPickerModal';
import { NetworkAdapterInfo } from '../../types';
import {
  Tv,
  Monitor,
  AppWindow,
  Columns2,
  Radio,
  QrCode,
  Shield,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Snowflake,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Laptop,
  Maximize2,
  RotateCcw,
  Trash2,
  Smartphone,
  Wifi,
  Cable,
  Sparkles,
} from 'lucide-react';

export const StageDisplaysView: React.FC = () => {
  const {
    stageLinkSlots,
    osWindows,
    liveDisplays,
    refreshStageLinkSlots,
    refreshOsWindows,
    refreshCompanionStatus,
    openQrForStageSlot,
    setStageLinkSlotFreeze,
    setStageLinkSlotBlackout,
    flashStageLinkSlot,
    sendStageLinkWhisper,
    clearStageLinkWhisper,
    companionStatus,
    routeOsWindow,
    recallStrayOsWindows,
  } = useRigStore();

  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [whisperInput, setWhisperInput] = useState('');
  const [whisperTone, setWhisperTone] = useState<'INFO' | 'WARN' | 'CRITICAL'>('WARN');
  const [whisperDuration, setWhisperDuration] = useState<number>(15);
  const [isExtending, setIsExtending] = useState(false);
  const [recallSuccessMsg, setRecallSuccessMsg] = useState('');

  // Primary active stage slot
  const primarySlot = useMemo(
    () => stageLinkSlots[0] || null,
    [stageLinkSlots]
  );

  useEffect(() => {
    refreshStageLinkSlots(true);
    refreshOsWindows();
    refreshCompanionStatus();
    const interval = setInterval(() => {
      refreshStageLinkSlots(false);
      refreshCompanionStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Check if a second physical or virtual display is detected by Windows
  const secondaryDisplay = useMemo(
    () => liveDisplays.find((d) => d.osIndex > 1) || null,
    [liveDisplays]
  );

  // Preferred network interface
  const preferredInterface = useMemo(() => {
    const ifaces = companionStatus?.interfaces || [];
    return ifaces.find((i: NetworkAdapterInfo) => i.is_preferred) || ifaces[0] || null;
  }, [companionStatus]);

  // Handle trigger Windows Extend shortcut
  const handleTriggerWindowsExtend = async () => {
    setIsExtending(true);
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { Command } = await import('@tauri-apps/plugin-shell');
        // Trigger Windows native DisplaySwitch /extend
        const cmd = Command.create('cmd', ['/c', 'DisplaySwitch.exe /extend']);
        await cmd.execute();
      }
    } catch (e) {
      console.warn('DisplaySwitch trigger:', e);
    }
    setTimeout(() => {
      setIsExtending(false);
      useRigStore.getState().refreshLiveDisplays();
    }, 1500);
  };

  // Open Windows Display Settings
  const handleOpenDisplaySettings = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { open } = await import('@tauri-apps/plugin-shell');
        await open('ms-settings:display');
      } else {
        window.open('ms-settings:display', '_blank');
      }
    } catch (e) {}
  };

  // Teleport the first detected timer/presentation window to Display 2 borderless
  const handleTeleportToDisplay2 = async () => {
    if (!secondaryDisplay) return;
    const targetWin = osWindows.find((w) => !w.is_xteon_self);
    if (!targetWin) return;

    await routeOsWindow(targetWin.hwnd_id, secondaryDisplay.id, true, true);
    setRecallSuccessMsg(`Routed "${targetWin.title}" to Display 2`);
    setTimeout(() => setRecallSuccessMsg(''), 3000);
  };

  // Emergency Recall Stray Windows to Laptop
  const handleRecallWindows = async () => {
    const rescued = await recallStrayOsWindows();
    setRecallSuccessMsg(`Rescued ${rescued} window(s) to primary laptop display`);
    setTimeout(() => setRecallSuccessMsg(''), 3000);
  };

  // Send Stage Whisper message to active slot
  const handleSendWhisper = async () => {
    if (!whisperInput.trim() || !primarySlot) return;
    await sendStageLinkWhisper(primarySlot.id, whisperInput, whisperTone, whisperDuration);
    setWhisperInput('');
  };

  const handleClearWhisper = async () => {
    if (!primarySlot) return;
    await clearStageLinkWhisper(primarySlot.id);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[var(--bg-primary)] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[var(--text-primary)]">
                STAGE DISPLAYS & EXTENDED MONITORS
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Turn tablets, phones, or wired screens into pulpit confidence monitors and extended desktops.
              </p>
            </div>
          </div>
        </div>

        {/* Status Badges & Quick Connect */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {preferredInterface && (
            <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono flex items-center gap-2">
              {preferredInterface.kind === 'USB_TETHER' ? (
                <Cable className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="text-[var(--text-muted)]">{preferredInterface.name}:</span>
              <span className="font-bold text-[var(--text-primary)]">{preferredInterface.ip}</span>
            </div>
          )}

          <button
            onClick={() => openQrForStageSlot(primarySlot?.id || 'stage-primary')}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition flex items-center gap-2 shadow-md cursor-pointer ml-auto md:ml-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Pair Device (QR Code)</span>
          </button>
        </div>
      </div>

      {recallSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{recallSuccessMsg}</span>
        </div>
      )}

      {/* Two Core Operation Modes Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MODE 1: TRUE VIRTUAL EXTENDED MONITOR (WIN + P) */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold font-mono text-sm sm:text-base text-[var(--text-primary)]">
                    Virtual Extended Monitor (Win + P)
                  </h2>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Secondary Windows desktop workspace for dual-monitor staging
                  </div>
                </div>
              </div>

              {secondaryDisplay ? (
                <span className="px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  ● Display 2 Active
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                  Single Screen
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Enables Windows <strong>"Extend"</strong> mode. Windows treats your tablet as a physical second display. Your mouse glides across seamlessly, and you can drag any window onto it.
            </p>

            {secondaryDisplay && (
              <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono space-y-1">
                <div className="text-[var(--text-primary)] font-bold">
                  Screen {secondaryDisplay.osIndex}: {secondaryDisplay.customAlias || secondaryDisplay.name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {secondaryDisplay.activeResolution.width}×{secondaryDisplay.activeResolution.height} @ {secondaryDisplay.refreshRateHz}Hz • {secondaryDisplay.portType}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-color)]">
            <button
              onClick={handleTriggerWindowsExtend}
              disabled={isExtending}
              className="px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Trigger native Windows + P 'Extend' display mode"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isExtending ? 'Switching...' : 'Switch to Extend (Win + P)'}</span>
            </button>

            <button
              onClick={handleOpenDisplaySettings}
              className="px-3 py-2 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Windows Display Settings</span>
            </button>

            {secondaryDisplay && (
              <button
                onClick={handleTeleportToDisplay2}
                className="px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="Send active window borderless fullscreen to Display 2"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Snap Window to Display 2</span>
              </button>
            )}

            <button
              onClick={handleRecallWindows}
              className="px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer ml-auto"
              title="Recall any off-screen or lost windows back onto laptop screen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Emergency Recall to Laptop</span>
            </button>
          </div>
        </div>

        {/* MODE 2: APPLICATION & WINDOW CASTER (GOOGLE MEET STYLE) */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <AppWindow className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold font-mono text-sm sm:text-base text-[var(--text-primary)]">
                    Application & Window Caster
                  </h2>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Google Meet style zero-move window streaming
                  </div>
                </div>
              </div>

              {primarySlot?.is_frozen ? (
                <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">
                  ❄️ FROZEN
                </span>
              ) : primarySlot?.is_blackout ? (
                <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold">
                  ⬛ BLACKOUT
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  ● LIVE BROADCASTING
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Streams a specific window or presentation directly to the tablet. The window does not need to be moved to an external screen.
            </p>

            {/* Currently Streaming Preview Tile */}
            <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-cyan-400 text-lg">
                  {primarySlot?.source_mode === 'DISPLAY' ? '🖥️' : primarySlot?.source_mode === 'SPLIT' ? '⚡' : '🪟'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {primarySlot?.primary_source_label || 'Default Window Stream'}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                    Mode: {primarySlot?.source_mode || 'WINDOW'} • {primarySlot?.target_fps || 30} FPS
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPickerModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition shrink-0 cursor-pointer"
              >
                Change App...
              </button>
            </div>
          </div>

          {/* Quick Stage Protection Controls */}
          {primarySlot && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => flashStageLinkSlot(primarySlot.id)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Pulse amber/white light border on speaker tablet screen"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Flash Attention</span>
              </button>

              <button
                onClick={() => setStageLinkSlotFreeze(primarySlot.id, !primarySlot.is_frozen)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  primarySlot.is_frozen
                    ? 'bg-blue-500 text-slate-950 border-blue-400'
                    : 'bg-[var(--bg-subcard)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)]'
                }`}
                title="Freeze tablet frame while switching confidential content"
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>{primarySlot.is_frozen ? 'Unfreeze' : 'Freeze Feed'}</span>
              </button>

              <button
                onClick={() => setStageLinkSlotBlackout(primarySlot.id, !primarySlot.is_blackout)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  primarySlot.is_blackout
                    ? 'bg-red-500 text-white border-red-400'
                    : 'bg-[var(--bg-subcard)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)]'
                }`}
                title="Blackout tablet feed immediately"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>{primarySlot.is_blackout ? 'Restore Feed' : 'Blackout'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONNECTED RECEIVERS & DEVICES HUD (REQUESTED BY USER) */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold font-mono text-sm sm:text-base text-[var(--text-primary)]">
                Connected Stage Receivers & Monitors
              </h2>
              <div className="text-[11px] text-[var(--text-muted)]">
                Live phones, tablets, and smart screens receiving video feeds on this network
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            {primarySlot?.connected_clients || 0} Connected
          </span>
        </div>

        {/* Devices List */}
        {primarySlot && primarySlot.connected_clients > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-emerald-500/30 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-lg">
                  📱
                </div>
                <div>
                  <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
                    <span>Pulpit Tablet Receiver</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      LIVE
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                    Stream: {primarySlot.name} • 30 FPS • ~20ms latency
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => flashStageLinkSlot(primarySlot.id)}
                  className="p-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs transition cursor-pointer"
                  title="Flash screen attention on this receiver"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-[var(--border-color)] rounded-xl space-y-2">
            <Smartphone className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-40" />
            <div className="text-xs font-bold text-[var(--text-primary)]">
              No stage receivers currently connected
            </div>
            <p className="text-[11px] text-[var(--text-muted)] max-w-md mx-auto">
              Scan the QR code with any tablet or phone camera, or connect a tablet via USB-C cable with USB Tethering enabled.
            </p>
            <button
              onClick={() => openQrForStageSlot(primarySlot?.id || 'stage-primary')}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-semibold font-mono transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Show Connection QR Code</span>
            </button>
          </div>
        )}
      </div>

      {/* STAGE WHISPER (SILENT HEADS-UP MESSENGER) */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <div>
              <h2 className="font-bold font-mono text-sm sm:text-base text-[var(--text-primary)]">
                Stage Whisper (Silent Speaker Heads-Up)
              </h2>
              <div className="text-[11px] text-[var(--text-muted)]">
                Broadcast private notifications directly to the pulpit tablet without audio interruption
              </div>
            </div>
          </div>

          {primarySlot?.active_whisper && (
            <button
              onClick={handleClearWhisper}
              className="px-2.5 py-1 rounded-md bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-mono flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Active Whisper</span>
            </button>
          )}
        </div>

        {primarySlot?.active_whisper && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center justify-between">
            <div>
              <span className="font-bold">Active On Stage:</span> "{primarySlot.active_whisper.message}"
            </div>
            <span className="text-[10px] opacity-70">Showing on tablet</span>
          </div>
        )}

        {/* Input Form */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            placeholder="Type discreet message (e.g., 'Pastor: 2 mins left', 'Wrap up for offering')..."
            value={whisperInput}
            onChange={(e) => setWhisperInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendWhisper()}
            className="flex-1 p-2.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-400 placeholder-[var(--text-muted)]"
          />

          <select
            value={whisperTone}
            onChange={(e) => setWhisperTone(e.target.value as any)}
            className="p-2.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none"
          >
            <option value="INFO">Info (Cyan)</option>
            <option value="WARN">Warning (Amber)</option>
            <option value="CRITICAL">Critical Alert (Red)</option>
          </select>

          <select
            value={whisperDuration}
            onChange={(e) => setWhisperDuration(Number(e.target.value))}
            className="p-2.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none"
          >
            <option value={10}>10 Seconds</option>
            <option value={20}>20 Seconds</option>
            <option value={30}>30 Seconds</option>
            <option value={0}>Permanent</option>
          </select>

          <button
            onClick={handleSendWhisper}
            disabled={!whisperInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Whisper</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Quick Presets:</span>
          {[
            'Pastor: 2 minutes left',
            'Wrap up for prayer',
            'Guest speaker has arrived',
            'Mic volume is low - speak closer',
          ].map((preset) => (
            <button
              key={preset}
              onClick={() => setWhisperInput(preset)}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Google Meet Style Picker Modal */}
      <AppWindowPickerModal
        isOpen={pickerModalOpen}
        onClose={() => setPickerModalOpen(false)}
        targetSlotId={primarySlot?.id}
      />
    </div>
  );
};
