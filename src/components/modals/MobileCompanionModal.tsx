import React, { useEffect, useMemo, useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  Wifi,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Unlock,
  Radio,
  Plus,
  Users,
  Usb,
  Cable,
} from 'lucide-react';

export const MobileCompanionModal: React.FC = () => {
  const {
    mobileModalOpen,
    setMobileModalOpen,
    qrStageSlotId,
    openQrForStageSlot,
    openStageLinkModal,
    companionStatus,
    refreshCompanionStatus,
    configureCompanionSecurity,
    stageLinkSlots,
    refreshStageLinkSlots,
  } = useRigStore();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [pinDraft, setPinDraft] = useState<string>('');
  const [editingPin, setEditingPin] = useState<boolean>(false);

  // Selected target: 'AUTO_STAGE', 'DIRECTOR', or stage slot id
  const [targetId, setTargetId] = useState<string>('AUTO_STAGE');

  useEffect(() => {
    if (mobileModalOpen) {
      refreshCompanionStatus();
      refreshStageLinkSlots(false);
      setTargetId(qrStageSlotId || 'AUTO_STAGE');
    }
  }, [mobileModalOpen, qrStageSlotId]);

  useEffect(() => {
    if (companionStatus) {
      setPinDraft(companionStatus.active_pin || '');
      const validIps = companionStatus.interfaces?.map((i) => i.ip) || [];
      if (!selectedIp || (validIps.length > 0 && !validIps.includes(selectedIp))) {
        const pref =
          companionStatus.interfaces?.find((i) => i.is_preferred)?.ip ||
          companionStatus.host ||
          validIps[0] ||
          '127.0.0.1';
        setSelectedIp(pref);
      }
    }
  }, [companionStatus]);

  const activePort = companionStatus?.port || 8765;
  const activeHost = selectedIp || companionStatus?.host || '127.0.0.1';
  const sessionToken = companionStatus?.session_token || '';
  const pinLockEnabled = companionStatus?.pin_lock_enabled ?? true;
  const activePin = companionStatus?.active_pin || '---';
  const clientCount = companionStatus?.client_count ?? 0;

  const selectedSlot = useMemo(
    () => stageLinkSlots.find((s) => s.id === targetId) || null,
    [stageLinkSlots, targetId]
  );

  // Full QR URL embeds session token for zero-tap pairing on stage tablets
  const pairingUrl = useMemo(() => {
    const basePath = targetId === 'AUTO_STAGE'
      ? '/stage'
      : selectedSlot
      ? `/stage/${encodeURIComponent(selectedSlot.id)}`
      : '';
    const tokenQuery = sessionToken ? `?key=${encodeURIComponent(sessionToken)}` : '';
    return `http://${activeHost}:${activePort}${basePath}${tokenQuery}`;
  }, [activeHost, activePort, targetId, selectedSlot, sessionToken]);

  // Clean manual URL for typing into browser (prompts PIN if PIN lock is enabled)
  const manualShortUrl = useMemo(() => {
    const basePath = targetId === 'AUTO_STAGE'
      ? '/stage'
      : selectedSlot
      ? `/stage/${encodeURIComponent(selectedSlot.id)}`
      : '';
    return `http://${activeHost}:${activePort}${basePath}`;
  }, [activeHost, activePort, targetId, selectedSlot]);

  useEffect(() => {
    if (!mobileModalOpen) return;
    let cancelled = false;
    QRCode.toDataURL(pairingUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mobileModalOpen, pairingUrl]);

  if (!mobileModalOpen) return null;

  const interfaces = companionStatus?.interfaces || [];

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(pairingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {}
  };

  const handleSavePin = async () => {
    if (pinDraft.trim()) {
      await configureCompanionSecurity(pinLockEnabled, pinDraft.trim());
    }
    setEditingPin(false);
  };

  const getAdapterIcon = (kind: string) => {
    if (kind === 'USB_TETHER') return <Usb className="w-3.5 h-3.5" />;
    if (kind === 'ETHERNET') return <Cable className="w-3.5 h-3.5" />;
    if (kind === 'HOTSPOT') return <Radio className="w-3.5 h-3.5" />;
    return <Wifi className="w-3.5 h-3.5" />;
  };

  return (
    <div
      onClick={() => setMobileModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92dvh] rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col text-[var(--text-primary)]"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] flex items-center justify-center text-[var(--accent-cyan)] shrink-0">
              {selectedSlot ? <Radio className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="font-mono text-sm font-bold text-[var(--text-primary)] flex flex-wrap items-center gap-2">
                <span className="truncate">
                  {targetId === 'AUTO_STAGE'
                    ? 'PAIR STAGE SCREEN (AUTO-ALLOCATE)'
                    : selectedSlot
                    ? `PAIR STAGE TABLET: ${selectedSlot.name}`
                    : 'WIRELESS COMPANION & STAGELINK QR'}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)] border border-[var(--badge-emerald-border)] font-bold">
                  LIVE :{activePort}
                </span>
              </h2>
              <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                100% Offline Local LAN • Zero Mobile App Install Required
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileModalOpen(false)}
            className="min-w-[40px] min-h-[40px] rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 font-mono text-xs">
          {/* Destination Mode Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                1. Choose Pairing Destination
              </label>
              <button
                type="button"
                onClick={() => {
                  setMobileModalOpen(false);
                  openStageLinkModal(null);
                }}
                className="text-[11px] font-bold text-[var(--accent-cyan)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New Stage Slot</span>
              </button>
            </div>

            <select
              value={targetId}
              onChange={(e) => {
                const v = e.target.value;
                setTargetId(v);
                openQrForStageSlot(v === 'DIRECTOR' || v === 'AUTO_STAGE' ? null : v);
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono font-bold focus:outline-none focus:border-[var(--accent-cyan)]"
            >
              <option value="AUTO_STAGE">⚡ Universal Stage Screen (Auto-assigns each connected device its own screen)</option>
              <option value="DIRECTOR">🎛️ Walk-the-Room FOH Remote Controller (All Displays & Stages)</option>
              {stageLinkSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  📺 Stage Monitor: {s.name} ({s.source_mode} • 📍 {s.stage_zone})
                </option>
              ))}
            </select>
          </div>

          {/* Multi-Adapter Network Interface Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                2. Network Link Adapter (Same Wi-Fi / Hotspot / USB)
              </label>
              <button
                type="button"
                onClick={() => refreshCompanionStatus()}
                className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--accent-cyan)] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Rescan IPs</span>
              </button>
            </div>

            {interfaces.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {interfaces.map((iface) => {
                  const active = activeHost === iface.ip;
                  return (
                    <button
                      key={`${iface.name}-${iface.ip}`}
                      type="button"
                      onClick={() => setSelectedIp(iface.ip)}
                      className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        active
                          ? 'bg-[var(--badge-cyan-bg)] border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)]'
                          : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]'
                      }`}
                      title={iface.name}
                    >
                      {getAdapterIcon(iface.kind)}
                      <span>{iface.kind.replace('_', ' ')}</span>
                      <span className="opacity-80">{iface.ip}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-muted)] text-[11px]">
                Active Host IP: <strong className="text-[var(--text-primary)]">{activeHost}</strong>
              </div>
            )}
          </div>

          {/* High-Contrast Camera-Ready QR Well */}
          <div className="p-4 rounded-2xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-2xl bg-white border-2 border-[var(--badge-cyan-border)] shadow-lg">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Xteon Pairing QR Code" className="w-48 h-48 sm:w-52 sm:h-52 rounded-lg" />
              ) : (
                <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
                </div>
              )}
            </div>

            <div className="space-y-1 w-full">
              <div className="text-xs font-bold text-[var(--text-primary)]">
                {selectedSlot
                  ? `Scan on your tablet or phone to open "${selectedSlot.name}"`
                  : 'Scan with your phone or tablet camera'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] break-all">
                Manual URL: <span className="text-[var(--accent-cyan)] font-bold select-all">{manualShortUrl}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />}
              <span>{copied ? 'Direct Pairing Link Copied!' : 'Copy Direct Pairing Link'}</span>
            </button>
          </div>

          {/* Security PIN & Connected Clients Bar */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {pinLockEnabled ? (
                  <Lock className="w-4 h-4 text-[var(--accent-emerald)]" />
                ) : (
                  <Unlock className="w-4 h-4 text-[var(--accent-amber)]" />
                )}
                <div>
                  <div className="font-bold text-[var(--text-primary)]">
                    Church Wi-Fi Security Gate {pinLockEnabled ? '(PIN Enabled)' : '(Unlocked)'}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    QR scans auto-authenticate; manual URL visitors enter PIN:{' '}
                    <strong className="text-[var(--accent-cyan)]">{activePin}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => configureCompanionSecurity(!pinLockEnabled)}
                  className={`min-h-[36px] px-2.5 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                    pinLockEnabled
                      ? 'bg-[var(--badge-emerald-bg)] border-[var(--badge-emerald-border)] text-[var(--badge-emerald-text)]'
                      : 'bg-[var(--badge-amber-bg)] border-[var(--badge-amber-border)] text-[var(--badge-amber-text)]'
                  }`}
                >
                  {pinLockEnabled ? 'PIN Lock: ON' : 'PIN Lock: OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPin(!editingPin)}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] font-bold cursor-pointer"
                >
                  {editingPin ? 'Cancel' : 'Edit PIN'}
                </button>
              </div>
            </div>

            {editingPin && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={pinDraft}
                  onChange={(e) => setPinDraft(e.target.value)}
                  placeholder="e.g. 412-890"
                  className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleSavePin}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[var(--badge-cyan-bg)] border border-[var(--badge-cyan-border)] text-[var(--badge-cyan-text)] font-bold cursor-pointer"
                >
                  Apply PIN
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                <span>
                  Connected Stage / Remote Devices:{' '}
                  <strong className="text-[var(--text-primary)]">{clientCount}</strong>
                </span>
              </div>
              <span className="text-[var(--accent-emerald)] font-bold">● Ready</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between gap-2 shrink-0 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="truncate">Tip: No internet needed—works on isolated church routers & phone hotspots</span>
          <button
            onClick={() => setMobileModalOpen(false)}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold transition cursor-pointer shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
