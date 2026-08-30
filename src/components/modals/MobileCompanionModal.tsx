import React, { useEffect, useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import QRCode from 'qrcode';
import { X, Smartphone, Wifi, RefreshCw } from 'lucide-react';

export const MobileCompanionModal: React.FC = () => {
  const { mobileModalOpen, setMobileModalOpen } = useRigStore();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [localIp, setLocalIp] = useState<string>('127.0.0.1');
  const [port, setPort] = useState<number>(8765);

  useEffect(() => {
    if (mobileModalOpen) {
      const fetchStatus = async () => {
        let currentIp = '127.0.0.1';
        let currentPort = 8765;

        if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            const status: any = await invoke('get_mobile_companion_status');
            if (status && status.host) {
              currentIp = status.host;
              currentPort = status.port;
              setLocalIp(status.host);
              setPort(status.port);
            }
          } catch (e) {
            console.warn('Companion status query fallback:', e);
          }
        }

        const url = `http://${currentIp}:${currentPort}`;
        QRCode.toDataURL(url, {
          width: 220,
          margin: 1,
          color: { dark: '#06B6D4', light: '#0A0B0E' },
        }).then(setQrDataUrl);
      };

      fetchStatus();
    }
  }, [mobileModalOpen]);

  if (!mobileModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md select-none animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col text-[var(--text-primary)]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-850 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>WALK-THE-ROOM MOBILE COMPANION</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-normal">HTTP LIVE</span>
              </h2>
              <div className="text-[11px] font-mono text-slate-400">Real-Time Local Wi-Fi Companion Controller</div>
            </div>
          </div>
          <button
            onClick={() => setMobileModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-2xl bg-[#0A0B0E] border-2 border-cyan-500/40 shadow-2xl">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Pairing QR Code" className="w-52 h-52 rounded-xl" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center font-mono text-xs text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono text-slate-300 font-bold">
              Scan with your phone's camera on the same Wi-Fi
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              or open in mobile browser: <span className="text-cyan-400 font-bold select-all">http://{localIp}:{port}</span>
            </div>
          </div>

          {/* Wi-Fi Link Details */}
          <div className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>Local LAN IP: <strong className="text-slate-100">{localIp}</strong></span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              ● Server Active (:8765)
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Walk venue to flash displays & toggle blackout</span>
          <button
            onClick={() => setMobileModalOpen(false)}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
