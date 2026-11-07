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
  Radio,
  Usb,
  Cable,
  Zap,
  Monitor,
  CheckCircle2,
} from 'lucide-react';

export const MobileCompanionModal: React.FC = () => {
  const {
    mobileModalOpen,
    setMobileModalOpen,
    companionStatus,
    refreshCompanionStatus,
    liveDisplays,
    flashDisplay,
    refreshLiveDisplays,
  } = useRigStore();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [flashingId, setFlashingId] = useState<string | null>(null);

  useEffect(() => {
    if (mobileModalOpen) {
      refreshCompanionStatus();
      refreshLiveDisplays();
    }
  }, [mobileModalOpen]);

  useEffect(() => {
    if (companionStatus) {
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

  // Mobile Screen Tester runs on dedicated port 8766
  const testerPort = companionStatus?.companion_port || 8766;
  const activeHost = selectedIp || companionStatus?.host || '127.0.0.1';
  const testerUrl = `http://${activeHost}:${testerPort}`;

  useEffect(() => {
    if (!mobileModalOpen) return;
    let cancelled = false;
    QRCode.toDataURL(testerUrl, {
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
  }, [mobileModalOpen, testerUrl]);

  if (!mobileModalOpen) return null;

  const interfaces = companionStatus?.interfaces || [];

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(testerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {}
  };

  const handleTriggerFlash = (id: string) => {
    setFlashingId(id);
    flashDisplay(id);
    setTimeout(() => {
      setFlashingId(null);
    }, 1500);
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
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold font-mono text-[var(--text-primary)] truncate">
                  Mobile Companion
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  PORT {testerPort}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate">
                Walk-the-Room Display Identification & Screen Tester
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* QR Code & Connection Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Mobile Screen Tester QR"
                  className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left w-full">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Ready to Scan</span>
              </div>

              <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                Scan with any smartphone or tablet connected to your local Wi-Fi to test and flash screens while walking around your auditorium.
              </div>

              {/* URL with Copy */}
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono">
                <span className="truncate flex-1 text-[var(--text-primary)] font-semibold select-all">
                  {testerUrl}
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer shrink-0"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Adapter Picker */}
              {interfaces.length > 1 && (
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                    Network Interface (Wi-Fi / LAN):
                  </label>
                  <select
                    value={selectedIp}
                    onChange={(e) => setSelectedIp(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-amber-400"
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

          {/* Connected Displays Ready for Testing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-amber-400" />
                <span>Detected Outputs ({liveDisplays.length})</span>
              </span>
              <button
                onClick={() => refreshLiveDisplays()}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-2">
              {liveDisplays.map((disp) => {
                const isFlashing = flashingId === disp.id;
                return (
                  <div
                    key={disp.id}
                    className={`p-3 rounded-xl bg-[var(--bg-subcard)] border transition-all flex items-center justify-between gap-3 ${
                      isFlashing ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20' : 'border-[var(--border-color)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          SCREEN {disp.osIndex}
                        </span>
                        {disp.osIndex === 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            PRIMARY
                          </span>
                        )}
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {disp.customAlias || disp.name}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                        {disp.activeResolution.width}×{disp.activeResolution.height} @ {disp.refreshRateHz}Hz • {disp.portType || 'Active Video Out'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTriggerFlash(disp.id)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isFlashing
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isFlashing ? 'Flashing...' : 'Test Flash'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Keep-Awake & Walk-the-Room Features Note */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--text-muted)] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-[var(--text-primary)] block">Zero-Setup Walk-the-Room Testing</strong>
              <span>
                No app installation or PIN codes required. The mobile page includes a triple-redundant Stay-Awake engine so your phone screen will not sleep while walking around the venue.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-[var(--text-muted)]">
            Listening on <span className="text-[var(--text-primary)] font-bold">http://{activeHost}:{testerPort}</span>
          </div>
          <button
            onClick={() => setMobileModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
