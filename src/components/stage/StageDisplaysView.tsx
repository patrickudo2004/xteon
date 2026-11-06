import React, { useState, useEffect, useMemo } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { AppWindowPickerModal } from '../modals/AppWindowPickerModal';
import { NetworkAdapterInfo, StageLinkSlot, StageSplitLayout } from '../../types';
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
  Tablet,
  Wifi,
  Cable,
  Sparkles,
  Settings,
  Sliders,
  Edit3,
  Copy,
  Check,
  X,
  Plus,
  Play,
  Square,
  ChevronRight,
  Layers,
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
    triggerOsDisplayExtend,
    openOsDisplaySettings,
    stopStageLinkStream,
    deleteStageLinkSlot,
    upsertStageLinkSlot,
    spawnVirtualExtendedDisplay,
    closeVirtualExtendedDisplay,
    virtualDriverStatus,
    refreshVirtualDriverStatus,
    installVirtualDisplayDriver,
    toggleVirtualDisplayActive,
  } = useRigStore();

  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerTargetSlotId, setPickerTargetSlotId] = useState<string | undefined>(undefined);
  const [whisperInput, setWhisperInput] = useState('');
  const [whisperTone, setWhisperTone] = useState<'INFO' | 'WARN' | 'CRITICAL'>('WARN');
  const [whisperDuration, setWhisperDuration] = useState<number>(15);
  const [isExtending, setIsExtending] = useState(false);
  const [isInstallingDriver, setIsInstallingDriver] = useState(false);
  const [recallSuccessMsg, setRecallSuccessMsg] = useState('');
  const [copiedLinkSlotId, setCopiedLinkSlotId] = useState<string | null>(null);

  // Multi-Variety Device Configuration Drawer State
  const [editingSlotForDrawer, setEditingSlotForDrawer] = useState<StageLinkSlot | null>(null);
  const [drawerName, setDrawerName] = useState('');
  const [drawerZone, setDrawerZone] = useState('');
  const [drawerMode, setDrawerMode] = useState<'WINDOW' | 'DISPLAY' | 'SPLIT'>('WINDOW');
  const [drawerFps, setDrawerFps] = useState<number>(30);
  const [drawerMaxWidth, setDrawerMaxWidth] = useState<number>(1280);
  const [drawerSplitLayout, setDrawerSplitLayout] = useState<StageSplitLayout>('SIDE_70_30');
  const [drawerPrimarySourceId, setDrawerPrimarySourceId] = useState('');
  const [drawerPrimarySourceLabel, setDrawerPrimarySourceLabel] = useState('');
  const [drawerSecondarySourceId, setDrawerSecondarySourceId] = useState('');
  const [drawerSecondarySourceLabel, setDrawerSecondarySourceLabel] = useState('');

  // Primary active stage slot
  const primarySlot = useMemo(
    () => stageLinkSlots[0] || null,
    [stageLinkSlots]
  );

  useEffect(() => {
    // Automatically close any legacy virtual display window so it never interferes or freezes the app
    closeVirtualExtendedDisplay().catch(() => {});
    refreshStageLinkSlots(true);
    refreshOsWindows();
    refreshCompanionStatus();
    refreshVirtualDriverStatus();
    const interval = setInterval(() => {
      refreshStageLinkSlots(false);
      refreshCompanionStatus();
      refreshVirtualDriverStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if a second physical or virtual display is detected by Windows / OS
  const secondaryDisplay = useMemo(
    () => liveDisplays.find((d) => d.osIndex > 1 && d.id !== 'display-virtual-stage') || null,
    [liveDisplays]
  );

  // Wired secondary physical displays (HDMI, DP, USB-C)
  const wiredDisplays = useMemo(
    () => liveDisplays.filter((d) => d.osIndex > 1 && d.id !== 'display-virtual-stage'),
    [liveDisplays]
  );

  // Check if Xteon Virtual Extended Stage Display is currently running
  const virtualDisplay = useMemo(
    () => liveDisplays.find((d) => d.id === 'display-virtual-stage') || null,
    [liveDisplays]
  );

  const effectiveSecondaryDisplay = secondaryDisplay || virtualDisplay;

  // Preferred network interface
  const preferredInterface = useMemo(() => {
    const ifaces = companionStatus?.interfaces || [];
    return ifaces.find((i: NetworkAdapterInfo) => i.is_preferred) || ifaces[0] || null;
  }, [companionStatus]);

  // Total active connected clients on live stage slots
  const totalConnectedClients = useMemo(() => {
    return stageLinkSlots.reduce((acc, s) => acc + (s.connected_clients || 0), 0);
  }, [stageLinkSlots]);

  // Handle trigger native OS Extend shortcut (Windows DisplaySwitch, macOS, Linux)
  const handleTriggerWindowsExtend = async () => {
    setIsExtending(true);
    try {
      // 1. Ensure any legacy virtual window is dismissed
      await closeVirtualExtendedDisplay();

      // 2. Trigger native OS Extend shortcut (Windows: DisplaySwitch.exe /extend)
      const res = await triggerOsDisplayExtend();

      // 3. Wait briefly for Windows to activate the projector / second screen
      await new Promise((r) => setTimeout(r, 800));
      await useRigStore.getState().refreshLiveDisplays();

      const updated = useRigStore.getState().liveDisplays;
      const secDisp = updated.find((d) => d.osIndex > 1 && d.id !== 'display-virtual-stage');

      if (secDisp && primarySlot) {
        await upsertStageLinkSlot({
          id: primarySlot.id,
          name: primarySlot.name,
          stage_zone: primarySlot.stage_zone,
          source_mode: 'DISPLAY',
          primary_source_id: `D:${secDisp.id}`,
          primary_source_label: `Display ${secDisp.osIndex}: ${secDisp.customAlias || secDisp.name} (Projector)`,
          target_fps: 60,
          max_width: 1920,
        });
        await refreshStageLinkSlots(true);
        setRecallSuccessMsg(res || `Extended Windows desktop! Projector (Display ${secDisp.osIndex}) connected.`);
      } else {
        setRecallSuccessMsg('Switched Windows to Extended Desktop mode. Connect projector or HDMI cable to use Screen 2.');
      }
      setTimeout(() => setRecallSuccessMsg(''), 4500);
    } catch (e: any) {
      console.warn('Display extend trigger:', e);
      setRecallSuccessMsg(`Display extend: ${e?.message || e}`);
      setTimeout(() => setRecallSuccessMsg(''), 4500);
    } finally {
      setIsExtending(false);
      await useRigStore.getState().refreshLiveDisplays();
    }
  };

  // Install Windows Virtual Display Driver (Elevated Setup)
  const handleInstallVirtualDriver = async () => {
    setIsInstallingDriver(true);
    setRecallSuccessMsg('Launching Virtual Display Driver installer with Administrator prompt. Please approve the UAC dialog on your screen.');
    try {
      const res = await installVirtualDisplayDriver();
      setRecallSuccessMsg(res || 'Virtual Display Driver installer initiated! Check UAC prompt on your screen.');
      await new Promise((r) => setTimeout(r, 2000));
      await refreshVirtualDriverStatus();
      await useRigStore.getState().refreshLiveDisplays();
    } catch (e: any) {
      setRecallSuccessMsg(`Installer note: ${e?.message || e}`);
    } finally {
      setIsInstallingDriver(false);
      setTimeout(() => setRecallSuccessMsg(''), 6000);
    }
  };

  // Toggle Virtual Display 2 (Enable/Disable via devcon & DisplaySwitch)
  const handleToggleVirtualDisplay = async (enable: boolean) => {
    setIsExtending(true);
    try {
      const res = await toggleVirtualDisplayActive(enable);
      await useRigStore.getState().refreshLiveDisplays();
      await refreshVirtualDriverStatus();

      if (enable) {
        // Allow Windows brief moment to attach virtual monitor to DWM
        await new Promise((r) => setTimeout(r, 800));
        await useRigStore.getState().refreshLiveDisplays();
        const updated = useRigStore.getState().liveDisplays;
        const secDisp = updated.find((d) => d.osIndex > 1);

        if (secDisp && primarySlot) {
          await upsertStageLinkSlot({
            id: primarySlot.id,
            name: primarySlot.name,
            stage_zone: primarySlot.stage_zone,
            source_mode: 'DISPLAY',
            primary_source_id: `D:${secDisp.id}`,
            primary_source_label: `Display ${secDisp.osIndex}: ${secDisp.customAlias || secDisp.name} (Virtual Extended)`,
            target_fps: 60,
            max_width: 1920,
          });
          await refreshStageLinkSlots(true);
          setRecallSuccessMsg(`Display 2 is ACTIVE! Streaming 60 FPS presentation output to ${primarySlot.name || 'connected receiver'}.`);
        } else {
          setRecallSuccessMsg(res || 'Virtual Extended Display activated.');
        }
      } else {
        setRecallSuccessMsg('Deactivated Virtual Extended Display.');
      }
    } catch (e: any) {
      setRecallSuccessMsg(`Virtual display error: ${e?.message || e}`);
    } finally {
      setIsExtending(false);
      setTimeout(() => setRecallSuccessMsg(''), 5000);
    }
  };

  // Close Xteon Virtual Extended Display
  const handleCloseVirtualDisplay = async () => {
    await closeVirtualExtendedDisplay();
    await useRigStore.getState().refreshLiveDisplays();
    setRecallSuccessMsg('Closed Virtual Extended Stage Display');
    setTimeout(() => setRecallSuccessMsg(''), 3000);
  };

  // Instantly stream host desktop screen (Display 1) at 60 FPS zero-install
  const handleStreamDesktop = async (slotId?: string) => {
    const targetSlotId = slotId || primarySlot?.id || 'stage-1';
    const currentSlot = stageLinkSlots.find((s) => s.id === targetSlotId) || primarySlot;
    await upsertStageLinkSlot({
      id: targetSlotId,
      name: currentSlot?.name || 'External Monitor',
      stage_zone: currentSlot?.stage_zone || 'Pulpit Altar',
      source_mode: 'DISPLAY',
      primary_source_id: 'D:display-1',
      primary_source_label: 'Desktop Screen (Host Laptop)',
      target_fps: 60,
      max_width: 1920,
    });
    await refreshStageLinkSlots(true);
    setRecallSuccessMsg('Broadcasting host laptop screen (Display 1) at 60 FPS zero-install!');
    setTimeout(() => setRecallSuccessMsg(''), 4000);
  };

  // Stream projector screen (Display 2) directly to connected receivers
  const handleStreamProjectorScreen = async (slotId?: string) => {
    const targetDisp = secondaryDisplay || liveDisplays.find((d) => d.osIndex > 1 && d.id !== 'display-virtual-stage');
    if (!targetDisp) {
      setRecallSuccessMsg('No projector or secondary display detected yet. Click "Activate Windows Extend" first.');
      setTimeout(() => setRecallSuccessMsg(''), 3500);
      return;
    }
    const targetSlotId = slotId || primarySlot?.id || 'stage-1';
    const currentSlot = stageLinkSlots.find((s) => s.id === targetSlotId) || primarySlot;
    await upsertStageLinkSlot({
      id: targetSlotId,
      name: currentSlot?.name || 'Projector Confidence Screen',
      stage_zone: currentSlot?.stage_zone || 'Pulpit Altar',
      source_mode: 'DISPLAY',
      primary_source_id: `D:${targetDisp.id}`,
      primary_source_label: `Display ${targetDisp.osIndex}: ${targetDisp.customAlias || targetDisp.name} (Projector)`,
      target_fps: 60,
      max_width: 1920,
    });
    await refreshStageLinkSlots(true);
    setRecallSuccessMsg(`Broadcasting Projector Screen (Display ${targetDisp.osIndex}) to receiver!`);
    setTimeout(() => setRecallSuccessMsg(''), 4000);
  };

  // Open native OS Display Settings
  const handleOpenDisplaySettings = async () => {
    try {
      await openOsDisplaySettings();
    } catch (e) {
      console.warn('Open display settings error:', e);
    }
  };

  // Teleport the first detected timer/presentation window to Display 2 borderless
  const handleTeleportToDisplay2 = async () => {
    const targetDisp = effectiveSecondaryDisplay;
    if (!targetDisp) return;
    const targetWin = osWindows.find((w) => !w.is_xteon_self);
    if (!targetWin) return;

    await routeOsWindow(targetWin.hwnd_id, targetDisp.id, true, true);
    setRecallSuccessMsg(`Routed "${targetWin.title}" to Extended Stage Display`);
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

  // Open Drawer for a specific slot
  const handleOpenDrawer = (slot: StageLinkSlot) => {
    setEditingSlotForDrawer(slot);
    setDrawerName(slot.name || 'Stage Receiver');
    setDrawerZone(slot.stage_zone || 'Pulpit Altar');
    setDrawerMode(slot.source_mode || 'WINDOW');
    setDrawerFps(slot.target_fps || 30);
    setDrawerMaxWidth(slot.max_width || 1280);
    setDrawerSplitLayout(slot.split_layout || 'SIDE_70_30');
    setDrawerPrimarySourceId(slot.primary_source_id || '');
    setDrawerPrimarySourceLabel(slot.primary_source_label || '');
    setDrawerSecondarySourceId(slot.secondary_source_id || '');
    setDrawerSecondarySourceLabel(slot.secondary_source_label || '');
  };

  // Save changes from Drawer
  const handleSaveDrawer = async () => {
    if (!editingSlotForDrawer) return;

    await upsertStageLinkSlot({
      id: editingSlotForDrawer.id,
      name: drawerName.trim() || 'Stage Receiver',
      stage_zone: drawerZone.trim() || 'Pulpit Altar',
      source_mode: drawerMode,
      primary_source_id: drawerPrimarySourceId,
      primary_source_label: drawerPrimarySourceLabel,
      secondary_source_id: drawerSecondarySourceId || null,
      secondary_source_label: drawerSecondarySourceLabel || null,
      split_layout: drawerSplitLayout,
      target_fps: drawerFps,
      max_width: drawerMaxWidth,
    });
    setEditingSlotForDrawer(null);
    setRecallSuccessMsg(`Updated stage receiver "${drawerName || editingSlotForDrawer.name}"`);
    setTimeout(() => setRecallSuccessMsg(''), 3000);
    await refreshStageLinkSlots(true);
  };

  // Delete slot from Drawer
  const handleDeleteFromDrawer = async () => {
    if (!editingSlotForDrawer) return;
    await deleteStageLinkSlot(editingSlotForDrawer.id);
    setEditingSlotForDrawer(null);
    setRecallSuccessMsg('Stage receiver disconnected and removed');
    setTimeout(() => setRecallSuccessMsg(''), 3000);
    await refreshStageLinkSlots(true);
  };

  // Add a new stage receiver slot (with recycled slug allocation)
  const handleAddStageReceiver = async () => {
    const slotCount = stageLinkSlots.length;
    const newSlot = await upsertStageLinkSlot({
      name: `Stage Receiver ${slotCount + 1}`,
      stage_zone: slotCount === 0 ? 'Pulpit Altar' : slotCount === 1 ? 'Downstage Wedge' : 'Choir Loft',
      source_mode: 'WINDOW',
      primary_source_id: '',
      primary_source_label: '',
      target_fps: 30,
      max_width: 1280,
    });
    if (newSlot) {
      handleOpenDrawer(newSlot);
    }
  };

  // Copy direct device URL
  const handleCopySlotLink = (slotId: string) => {
    const ip = preferredInterface?.ip || 'localhost';
    const url = `http://${ip}:8765/${slotId}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    }
    setCopiedLinkSlotId(slotId);
    setTimeout(() => setCopiedLinkSlotId(null), 2500);
  };

  // Stop sharing active feed
  const handleStopSharing = async (slotId?: string) => {
    await stopStageLinkStream(slotId);
    setRecallSuccessMsg('Screen sharing ended. Stage receiver returned to standby.');
    setTimeout(() => setRecallSuccessMsg(''), 3000);
  };

  // Preset location chips
  const LOCATION_PRESETS = [
    'Pulpit Altar',
    'Downstage Wedge',
    'Choir Loft',
    'FOH Control Booth',
    'Pastor Study / Green Room',
  ];

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
            onClick={() => openQrForStageSlot(primarySlot?.id || 'stage-1')}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition flex items-center gap-2 shadow-md cursor-pointer ml-auto md:ml-0"
            title="Scan QR code with tablet or phone to connect"
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
        {/* MODE 1: ZERO-INSTALL EXTERNAL MONITOR & PROJECTOR (GLIDEX STYLE) */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold font-mono text-sm sm:text-base text-[var(--text-primary)]">
                    External Monitor & Virtual Stage Screen
                  </h2>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    GlideX-style extended desktop for PowerPoint Presenter View & wireless receivers
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {secondaryDisplay ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                    ● Display 2 (Extended Monitor) Active
                  </span>
                ) : virtualDriverStatus?.installed ? (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold flex items-center gap-1">
                    ● Virtual Display Engine Ready
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1">
                    Single Screen (Driver Setup Available)
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Use your phone, tablet, or receiver as a genuine <strong>Display 2</strong> in Windows without physical HDMI cables. 
              PowerPoint will show <strong>Presenter View</strong> on your laptop and stream <strong>presentation slides</strong> at 60 FPS to your connected device.
            </p>

            {secondaryDisplay && (
              <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-blue-500/30 text-xs font-mono space-y-1">
                <div className="text-[var(--text-primary)] font-bold flex items-center justify-between">
                  <span>Screen {secondaryDisplay.osIndex}: {secondaryDisplay.customAlias || secondaryDisplay.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                    EXTENDED MONITOR (60 FPS)
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {secondaryDisplay.activeResolution.width}×{secondaryDisplay.activeResolution.height} @ {secondaryDisplay.refreshRateHz}Hz • {secondaryDisplay.portType}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Grouped & Compacted */}
          <div className="space-y-2 pt-3 border-t border-[var(--border-color)]">
            <div className="flex flex-wrap items-center gap-2">
              {/* 1-Click Virtual Display Driver Toggle (If installed) */}
              {virtualDriverStatus?.installed ? (
                <button
                  onClick={() => handleToggleVirtualDisplay(!secondaryDisplay)}
                  disabled={isExtending}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm min-h-[36px] ${
                    secondaryDisplay
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                  }`}
                  title="Toggle Virtual Display 2 in Windows"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {isExtending
                      ? 'Toggling Display 2...'
                      : secondaryDisplay
                      ? 'Deactivate Virtual Display 2'
                      : 'Activate Virtual Extended Display (Display 2)'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleInstallVirtualDriver}
                  disabled={isInstallingDriver}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm min-h-[36px]"
                  title="Install the Windows Virtual Display Driver to enable secondary monitor without HDMI cable"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {isInstallingDriver
                      ? 'Launching Installer (Check UAC Prompt)...'
                      : 'Setup Virtual Display Engine (One-Time Setup)'}
                  </span>
                </button>
              )}

              <button
                onClick={() => handleStreamDesktop()}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm min-h-[36px]"
                title="Immediately stream host laptop desktop screen to connected receivers"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Stream Laptop Screen (Display 1)</span>
              </button>

              {secondaryDisplay && (
                <button
                  onClick={() => handleStreamProjectorScreen(primarySlot?.id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm min-h-[36px]"
                  title="Stream projector / second screen directly to connected devices"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Stream Projector (Display {secondaryDisplay.osIndex})</span>
                </button>
              )}

              <button
                onClick={handleTriggerWindowsExtend}
                disabled={isExtending}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-card)] border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm min-h-[36px]"
                title="Activate Windows Extended Desktop mode (DisplaySwitch /extend)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>
                  {isExtending
                    ? 'Activating...'
                    : 'DisplaySwitch /extend'}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {virtualDisplay && (
                <button
                  onClick={handleCloseVirtualDisplay}
                  className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-mono font-semibold transition flex items-center gap-1 cursor-pointer min-h-[34px]"
                  title="Close Virtual Window"
                >
                  <X className="w-3 h-3" />
                  <span>Close Virtual Window</span>
                </button>
              )}

              {secondaryDisplay && (
                <button
                  onClick={handleTeleportToDisplay2}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold transition flex items-center gap-1 cursor-pointer min-h-[34px]"
                  title="Send active window borderless fullscreen to Projector"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Snap Window to Display 2</span>
                </button>
              )}

              <button
                onClick={handleOpenDisplaySettings}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono font-semibold transition flex items-center gap-1 cursor-pointer min-h-[34px]"
                title="Open OS Display Settings panel"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Windows Display Settings</span>
              </button>

              <button
                onClick={handleRecallWindows}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold transition flex items-center gap-1 cursor-pointer ml-auto min-h-[34px]"
                title="Recall any off-screen or lost windows back onto laptop screen"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Emergency Recall</span>
              </button>

              {!virtualDriverStatus?.installed && (
                <div className="w-full text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1 pt-1">
                  Manual script: <code className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[10px] text-cyan-300">C:\VirtualDisplayDriver\install_driver.bat</code>
                </div>
              )}
            </div>
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
                    Google Meet & Teams style zero-move window streaming
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
              ) : primarySlot?.primary_source_label ? (
                <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  ● LIVE BROADCASTING
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[10px] font-mono font-bold">
                  STANDBY
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Streams any application window (Chyron, ProPresenter, PowerPoint, countdown timers) directly to the tablet with 60 FPS forced keyframe heartbeat so timers never freeze.
            </p>

            {/* Currently Streaming Preview Tile */}
            <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-cyan-400 text-lg shrink-0">
                  {primarySlot?.source_mode === 'DISPLAY' ? '🖥️' : primarySlot?.source_mode === 'SPLIT' ? '⚡' : '🪟'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {primarySlot?.primary_source_label || 'Standby — Ready for app share'}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                    Mode: {primarySlot?.source_mode || 'WINDOW'} • {primarySlot?.target_fps || 30} FPS • {primarySlot?.live_fps || 0} FPS Live
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setPickerTargetSlotId(primarySlot?.id);
                    setPickerModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition cursor-pointer min-h-[36px]"
                >
                  {primarySlot?.primary_source_label ? 'Change App...' : 'Select App...'}
                </button>

                {primarySlot?.primary_source_label && (
                  <button
                    onClick={() => handleStopSharing(primarySlot.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[36px]"
                    title="Stop sharing feed to stage receivers"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop Sharing</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stage Protection Controls */}
          {primarySlot && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => flashStageLinkSlot(primarySlot.id)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                title="Pulse amber/white light border on speaker tablet screen"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Flash Attention</span>
              </button>

              <button
                onClick={() => setStageLinkSlotFreeze(primarySlot.id, !primarySlot.is_frozen)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
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
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
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

      {/* CONNECTED RECEIVERS & MONITORS HUD (ENHANCED MULTI-DEVICE MANAGEMENT) */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold font-mono text-sm sm:text-base text-[var(--text-primary)]">
                Connected Stage Receivers & Monitors
              </h2>
              <div className="text-[11px] text-[var(--text-muted)]">
                Live phones, tablets, smart screens, and wired external confidence displays
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              {totalConnectedClients + wiredDisplays.length} Active ({stageLinkSlots.length} Wireless, {wiredDisplays.length} Wired)
            </span>
            <button
              onClick={handleAddStageReceiver}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer text-[var(--text-primary)] min-h-[36px]"
              title="Add another stage receiver or display endpoint"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Receiver</span>
            </button>
          </div>
        </div>

        {/* Devices Cards Grid (Both Wireless and Wired Displays) */}
        {stageLinkSlots.length > 0 || wiredDisplays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* WIRELESS RECEIVERS (PHONES, TABLETS, LAPTOPS) */}
            {stageLinkSlots.map((slot, index) => {
              const isLive = slot.connected_clients > 0;

              return (
                <div
                  key={slot.id}
                  className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] hover:border-cyan-500/40 transition flex flex-col justify-between gap-3 text-left group"
                >
                  <div className="space-y-2">
                    {/* Header Row: Title + Status Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-base shrink-0">
                          {slot.name.toLowerCase().includes('phone') ? (
                            <Smartphone className="w-4 h-4" />
                          ) : slot.name.toLowerCase().includes('screen') || slot.name.toLowerCase().includes('monitor') ? (
                            <Monitor className="w-4 h-4" />
                          ) : (
                            <Tablet className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[var(--text-primary)] truncate flex items-center gap-1.5">
                            <span>{slot.name || `Stage Device ${index + 1}`}</span>
                          </div>
                          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                            Zone: {slot.stage_zone || 'Pulpit Altar'}
                          </div>
                        </div>
                      </div>

                      {/* Pill Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                          WIRELESS (Wi-Fi)
                        </span>
                        {isLive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE ({slot.connected_clients})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[9px] font-mono">
                            READY (0 Connected)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feed Info */}
                    <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs space-y-1">
                      <div className="text-[11px] font-medium text-[var(--text-primary)] truncate flex items-center gap-1.5">
                        <span className="text-[var(--text-muted)] text-[10px]">Source:</span>
                        <span className="truncate">{slot.primary_source_label || 'Desktop Screen (Host Laptop)'}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono flex items-center justify-between">
                        <span>Mode: {slot.source_mode}</span>
                        <span>{slot.target_fps} FPS • {slot.max_width}p</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border-color)]">
                    <button
                      onClick={() => handleOpenDrawer(slot)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold transition flex items-center gap-1 cursor-pointer min-h-[34px]"
                      title="Edit device name, location, operating mode, and parameters"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        setPickerTargetSlotId(slot.id);
                        setPickerModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] font-mono font-medium transition flex items-center gap-1 cursor-pointer min-h-[34px]"
                      title="Choose application or window to cast to this device"
                    >
                      <AppWindow className="w-3 h-3 text-cyan-400" />
                      <span>Cast App</span>
                    </button>

                    <button
                      onClick={() => handleStreamDesktop(slot.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold transition flex items-center gap-1 cursor-pointer min-h-[34px]"
                      title="Set this device to display your laptop desktop screen (External Monitor)"
                    >
                      <Laptop className="w-3 h-3 text-emerald-400" />
                      <span>Desktop Screen</span>
                    </button>

                    <button
                      onClick={() => flashStageLinkSlot(slot.id)}
                      className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs transition cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                      title="Flash screen attention on this receiver"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => openQrForStageSlot(slot.id)}
                      className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                      title="Show pairing QR code for this specific device"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCopySlotLink(slot.id)}
                      className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                      title="Copy browser stage link"
                    >
                      {copiedLinkSlotId === slot.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => deleteStageLinkSlot(slot.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs transition cursor-pointer ml-auto min-h-[34px] min-w-[34px] flex items-center justify-center"
                      title="Remove device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* WIRED EXTERNAL DISPLAYS (HDMI, DP, USB-C) */}
            {wiredDisplays.map((disp) => (
              <div
                key={disp.id}
                className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-blue-500/30 hover:border-blue-500/60 transition flex flex-col justify-between gap-3 text-left group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 text-base shrink-0">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[var(--text-primary)] truncate flex items-center gap-1.5">
                          <span>Display {disp.osIndex}: {disp.customAlias || disp.name}</span>
                        </div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                          Port: {disp.portType || 'HDMI / DP'} • Physical Monitor
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[9px] font-mono font-bold shrink-0">
                      WIRED ({disp.portType || 'HDMI'})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs space-y-1">
                    <div className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                      Resolution: {disp.activeResolution.width}×{disp.activeResolution.height} @ {disp.refreshRateHz}Hz
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      Physical external display connected directly to graphics hardware
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border-color)]">
                  <button
                    onClick={handleTeleportToDisplay2}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[11px] font-mono font-bold transition flex items-center gap-1 cursor-pointer min-h-[34px]"
                    title="Snap active window borderless fullscreen to this wired screen"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Snap Window</span>
                  </button>

                  <button
                    onClick={handleOpenDisplaySettings}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[11px] font-mono transition flex items-center gap-1 cursor-pointer ml-auto min-h-[34px]"
                    title="Open OS Display Settings"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>OS Settings</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-[var(--border-color)] rounded-xl space-y-2">
            <Smartphone className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-40" />
            <div className="text-xs font-bold text-[var(--text-primary)]">
              No stage receivers or external monitors currently connected
            </div>
            <p className="text-[11px] text-[var(--text-muted)] max-w-md mx-auto">
              Scan the QR code with any tablet or phone camera, or plug in a wired HDMI/DP monitor to configure a new stage endpoint.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleAddStageReceiver}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold font-mono transition inline-flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Primary Receiver</span>
              </button>
              <button
                onClick={() => openQrForStageSlot('stage-1')}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold font-mono transition inline-flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Show QR Code</span>
              </button>
            </div>
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
              className="px-2.5 py-1 rounded-md bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-mono flex items-center gap-1 cursor-pointer min-h-[32px]"
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
            className="flex-1 p-2.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-400 placeholder-[var(--text-muted)] min-h-[42px]"
          />

          <select
            value={whisperTone}
            onChange={(e) => setWhisperTone(e.target.value as any)}
            className="p-2.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none min-h-[42px]"
          >
            <option value="INFO">Info (Cyan)</option>
            <option value="WARN">Warning (Amber)</option>
            <option value="CRITICAL">Critical Alert (Red)</option>
          </select>

          <select
            value={whisperDuration}
            onChange={(e) => setWhisperDuration(Number(e.target.value))}
            className="p-2.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none min-h-[42px]"
          >
            <option value={10}>10 Seconds</option>
            <option value={20}>20 Seconds</option>
            <option value={30}>30 Seconds</option>
            <option value={0}>Permanent</option>
          </select>

          <button
            onClick={handleSendWhisper}
            disabled={!whisperInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0 min-h-[42px]"
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
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer min-h-[32px]"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* MULTI-VARIETY DEVICE CONFIGURATION DRAWER / MODAL */}
      {editingSlotForDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-mono text-[var(--text-primary)]">
                    Configure Stage Device: {editingSlotForDrawer.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Slot ID: <span className="font-mono text-cyan-400">{editingSlotForDrawer.id}</span> • Adjust identity, mode, resolution, and stage zones
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingSlotForDrawer(null)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subcard)] transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-left flex-1">
              {/* Section 1: Device Identification */}
              <div className="space-y-3">
                <label className="block text-xs font-mono font-bold text-[var(--text-primary)]">
                  Device Name & Label
                </label>
                <input
                  type="text"
                  value={drawerName}
                  onChange={(e) => setDrawerName(e.target.value)}
                  placeholder="e.g., Pulpit Altar Tablet, Choir Monitor"
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 min-h-[42px]"
                />
              </div>

              {/* Stage Zone / Location */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-[var(--text-primary)]">
                  Stage Zone / Location
                </label>
                <input
                  type="text"
                  value={drawerZone}
                  onChange={(e) => setDrawerZone(e.target.value)}
                  placeholder="e.g., Pulpit Altar, Downstage Wedge, Choir Loft"
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 min-h-[42px]"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Presets:</span>
                  {LOCATION_PRESETS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setDrawerZone(loc)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                        drawerZone === loc
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Operating Mode Switcher (The 4 Varieties) */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border-color)]">
                <label className="block text-xs font-mono font-bold text-[var(--text-primary)]">
                  Stage Receiver Operating Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode 1: Window */}
                  <div
                    onClick={() => setDrawerMode('WINDOW')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                      drawerMode === 'WINDOW'
                        ? 'bg-cyan-500/10 border-cyan-400 text-[var(--text-primary)]'
                        : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AppWindow className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-bold text-xs text-[var(--text-primary)]">Application Window</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Zero-move streaming of a specific app (ProPresenter, Chyron, Timer) directly to the screen.
                    </p>
                  </div>

                  {/* Mode 2: Entire Screen Mirror */}
                  <div
                    onClick={() => setDrawerMode('DISPLAY')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                      drawerMode === 'DISPLAY'
                        ? 'bg-blue-500/10 border-blue-400 text-[var(--text-primary)]'
                        : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-bold text-xs text-[var(--text-primary)]">Entire Screen Mirror</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Mirrors primary display or secondary monitor full-screen directly to this receiver.
                    </p>
                  </div>

                  {/* Mode 3: Stage Multi-View Split */}
                  <div
                    onClick={() => setDrawerMode('SPLIT')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                      drawerMode === 'SPLIT'
                        ? 'bg-purple-500/10 border-purple-400 text-[var(--text-primary)]'
                        : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Columns2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="font-bold text-xs text-[var(--text-primary)]">Stage Multi-View Split</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Dual-split composite: e.g. Countdown Timer (35%) on left, Sermon Presentation (65%) on right.
                    </p>
                  </div>

                  {/* Mode 4: Projector / Extended Display Screen */}
                  <div
                    onClick={async () => {
                      setDrawerMode('DISPLAY');
                      let targetDisp = secondaryDisplay || liveDisplays.find((d) => d.osIndex > 1 && d.id !== 'display-virtual-stage');
                      if (!targetDisp) {
                        if (virtualDriverStatus?.installed) {
                          await handleToggleVirtualDisplay(true);
                        } else {
                          await triggerOsDisplayExtend();
                        }
                        await new Promise((r) => setTimeout(r, 800));
                        await useRigStore.getState().refreshLiveDisplays();
                        targetDisp = useRigStore.getState().liveDisplays.find((d) => d.osIndex > 1 && d.id !== 'display-virtual-stage');
                      }
                      if (targetDisp) {
                        setDrawerPrimarySourceId(`D:${targetDisp.id}`);
                        setDrawerPrimarySourceLabel(`Screen ${targetDisp.osIndex}: ${targetDisp.customAlias || targetDisp.name} (Projector)`);
                      } else {
                        setDrawerPrimarySourceId('D:display-1');
                        setDrawerPrimarySourceLabel('Desktop Screen (Host Laptop)');
                      }
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                      drawerMode === 'DISPLAY' && drawerPrimarySourceId !== 'D:display-1'
                        ? 'bg-emerald-500/15 border-emerald-400 text-[var(--text-primary)] ring-1 ring-emerald-400/50'
                        : 'border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-xs text-emerald-300">Projector / Extended Screen</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Streams the projector or secondary extended display directly to this receiver.
                    </p>
                  </div>
                </div>
              </div>

              {/* If SPLIT mode selected: Choose Split Ratio */}
              {drawerMode === 'SPLIT' && (
                <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-subcard)] border border-purple-500/30">
                  <label className="block text-xs font-mono font-bold text-purple-300">
                    Split Layout Arrangement
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'SIDE_70_30', label: '70% / 30% Side' },
                      { id: 'SIDE_50_50', label: '50% / 50% Equal' },
                      { id: 'TOP_BOTTOM', label: 'Top / Bottom' },
                      { id: 'PIP_CORNER', label: 'PIP Corner' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDrawerSplitLayout(opt.id as any)}
                        className={`p-2 rounded-lg text-xs font-mono transition cursor-pointer min-h-[38px] ${
                          drawerSplitLayout === opt.id
                            ? 'bg-purple-500 text-white font-bold'
                            : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Performance & Framerate Tuning */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-color)]">
                <label className="block text-xs font-mono font-bold text-[var(--text-primary)]">
                  Performance & Quality Tuning
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] text-[var(--text-muted)] font-mono mb-1">Target Framerate</span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { fps: 20, label: '20 FPS (Eco)' },
                        { fps: 30, label: '30 FPS (Church Standard)' },
                        { fps: 60, label: '60 FPS (Ultra Fluid)' },
                      ].map((f) => (
                        <button
                          key={f.fps}
                          type="button"
                          onClick={() => setDrawerFps(f.fps)}
                          className={`flex-1 p-2 rounded-lg text-xs font-mono transition cursor-pointer min-h-[38px] ${
                            drawerFps === f.fps
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-muted)]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] text-[var(--text-muted)] font-mono mb-1">Stream Resolution</span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { width: 1280, label: '720p HD' },
                        { width: 1920, label: '1080p FHD' },
                        { width: 2560, label: '1440p 2K' },
                      ].map((r) => (
                        <button
                          key={r.width}
                          type="button"
                          onClick={() => setDrawerMaxWidth(r.width)}
                          className={`flex-1 p-2 rounded-lg text-xs font-mono transition cursor-pointer min-h-[38px] ${
                            drawerMaxWidth === r.width
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-muted)]'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Live Controls & Direct Link */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2.5">
                <span className="block text-xs font-mono font-bold text-[var(--text-primary)]">
                  Direct Receiver URL & Connection
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono text-cyan-300 truncate">
                    http://{preferredInterface?.ip || 'localhost'}:8765/{editingSlotForDrawer.id}
                  </div>
                  <button
                    onClick={() => handleCopySlotLink(editingSlotForDrawer.id)}
                    className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                  >
                    {copiedLinkSlotId === editingSlotForDrawer.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLinkSlotId === editingSlotForDrawer.id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => openQrForStageSlot(editingSlotForDrawer.id)}
                    className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Show device pairing QR code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[var(--bg-subcard)] flex flex-wrap items-center justify-between gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={handleDeleteFromDrawer}
                className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[42px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete & Disconnect Device</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setEditingSlotForDrawer(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-mono transition cursor-pointer min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDrawer}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md cursor-pointer min-h-[42px]"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Apply Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Meet Style Picker Modal */}
      <AppWindowPickerModal
        isOpen={pickerModalOpen}
        onClose={() => setPickerModalOpen(false)}
        targetSlotId={pickerTargetSlotId || primarySlot?.id}
      />
    </div>
  );
};
