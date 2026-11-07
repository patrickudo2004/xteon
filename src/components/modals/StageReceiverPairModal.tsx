import React, { useEffect, useMemo, useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import QRCode from 'qrcode';
import {
  X,
  Radio,
  Wifi,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Unlock,
  Plus,
  Users,
  Usb,
  Cable,
  Tv,
} from 'lucide-react';

export const StageReceiverPairModal: React.FC = () => {
  const {
    stagePairModalOpen,
    stagePairSlotId,
    closeStagePairModal,
    companionStatus,
    refreshCompanionStatus,
    configureCompanionSecurity,
    stageLinkSlots,
    refreshStageLinkSlots,
    openStageLinkModal,
  } = useRigStore();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [pinDraft, setPinDraft] = useState<string>('');
  const [editingPin, setEditingPin] = useState<boolean>(false);

  // Target slot id or 'AUTO_STAGE'
  const [targetId, setTargetId] = useState<string>('AUTO_STAGE');

  useEffect(() => {
    if (stagePairModalOpen) {
      refreshCompanionStatus();
      refreshStageLinkSlots(false);
      setTargetId(stagePairSlotId || 'AUTO_STAGE');
    }
  }, [stagePairModalOpen, stagePairSlotId]);

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

  // Full QR URL embeds session token for zero-tap pairing
  const pairingUrl = useMemo(() => {
    const basePath = targetId === 'AUTO_STAGE'
      ? '/stage'
      : selectedSlot
      ? `/stage/${encodeURIComponent(selectedSlot.id)}`
      : '/stage';
    const tokenQuery = sessionToken ? `?key=${encodeURIComponent(sessionToken)}` : '';
    return `http://${activeHost}:${activePort}${basePath}${tokenQuery}`;
  }, [activeHost, activePort, targetId, selectedSlot, sessionToken]);

  // Clean manual URL for typing into browser
  const manualShortUrl = useMemo(() => {
    const basePath = targetId === 'AUTO_STAGE'
      ? '/stage'
      : selectedSlot
      ? `/stage/${encodeURIComponent(selectedSlot.id)}`
      : '/stage';
    return `http://${activeHost}:${activePort}${basePath}`;
  }, [activeHost, activePort, targetId, selectedSlot]);

  useEffect(() => {
    if (!stagePairModalOpen) return;
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
  }, [stagePairModalOpen, pairingUrl]);

  if (!stagePairModalOpen) return null;

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
      onClick={() => closeStagePairModal()}
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
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold font-mono text-[var(--text-primary)] truncate">
                Pair Stage Receiver (StageLink)
              </h3>
              <p className="text-xs text-[var(--text-muted)] truncate">
                Stream Confidence Monitor Video to Tablets, Phones & Smart TVs
              </p>
            </div>
          </div>
          <button
            onClick={() => closeStagePairModal()}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* Target Slot Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Assign Stage Slot / Destination:
            </label>
            <div className="flex gap-2">
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-cyan-400"
              >
                <option value="AUTO_STAGE">⚡ Universal Stage Receiver (Auto-assign available slot)</option>
                {stageLinkSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    Slot: {slot.name} ({slot.stage_zone}) [{slot.source_mode}]
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  closeStagePairModal();
                  openStageLinkModal(null);
                }}
                className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-400 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition shrink-0"
                title="Create a new Stage Slot"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Slot</span>
              </button>
            </div>
          </div>

          {/* QR Code & Direct Pairing */}
          <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="StageLink QR"
                  className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left w-full">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Stage Video Hub (Port {activePort})</span>
              </div>

              <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                Scan with any iPad, tablet, or phone camera to mount as a live wireless confidence monitor.
              </div>

              {/* URL with Copy */}
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono">
                <span className="truncate flex-1 text-[var(--text-primary)] font-semibold select-all">
                  {manualShortUrl}
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer shrink-0"
                  title="Copy Direct URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Interface Picker */}
              {interfaces.length > 1 && (
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                    Network Interface (Wi-Fi / LAN):
                  </label>
                  <select
                    value={selectedIp}
                    onChange={(e) => setSelectedIp(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-cyan-400"
                  >
                    {interfaces.map((iface) => (
                      <option key={iface.ip} value={iface.ip}>
                        {iface.name} ({iface.ip}) {iface.is_preferred ? '★ Preferred' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Security & PIN Lock */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                {pinLockEnabled ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                <span>Security PIN Lock</span>
              </span>
              <button
                onClick={() => configureCompanionSecurity(!pinLockEnabled, activePin)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                  pinLockEnabled
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                }`}
              >
                {pinLockEnabled ? 'PIN Enforced' : 'Open Access'}
              </button>
            </div>

            {pinLockEnabled && (
              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]">
                <span className="text-xs text-[var(--text-muted)]">Manual Connection PIN:</span>
                {editingPin ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={pinDraft}
                      onChange={(e) => setPinDraft(e.target.value)}
                      className="w-24 px-2 py-1 rounded bg-[var(--bg-card)] border border-cyan-400 text-xs font-mono text-center font-bold"
                    />
                    <button
                      onClick={handleSavePin}
                      className="px-2 py-1 rounded bg-cyan-500 text-slate-950 text-xs font-mono font-bold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-mono text-sm font-bold text-amber-400 tracking-widest">
                      {activePin}
                    </span>
                    <button
                      onClick={() => setEditingPin(true)}
                      className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Receivers: <strong className="text-[var(--text-primary)]">{clientCount}</strong></span>
          </div>
          <button
            onClick={() => closeStagePairModal()}
            className="px-4 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
