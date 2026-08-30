import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ArrowUpCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean | null>(null);
  const [updateInfo, setUpdateInfo] = useState<{
    version?: string;
    currentVersion?: string;
    body?: string;
    date?: string;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkForUpdates = async () => {
    setChecking(true);
    setErrorMsg(null);
    setUpdateAvailable(null);

    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();

        if (update) {
          setUpdateAvailable(true);
          setUpdateInfo({
            version: update.version,
            currentVersion: update.currentVersion,
            body: update.body || 'Performance enhancements, new pro AV feature modules, and bug fixes.',
            date: update.date,
          });
        } else {
          setUpdateAvailable(false);
        }
      } else {
        // Web preview fallback
        setUpdateAvailable(false);
      }
    } catch (err: any) {
      console.warn('Update check failed:', err);
      setErrorMsg(
        err?.message ||
          'Unable to reach GitHub Releases server. Please check your internet connection.'
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkForUpdates();
    }
  }, [isOpen]);

  const handleDownloadAndInstall = async () => {
    setDownloading(true);
    setErrorMsg(null);
    setDownloadProgress(0);

    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();

        if (update) {
          let downloaded = 0;
          let contentLength = 0;

          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength || 0;
                setTotalBytes(contentLength);
                break;
              case 'Progress':
                downloaded += event.data.chunkLength;
                setDownloadedBytes(downloaded);
                if (contentLength > 0) {
                  setDownloadProgress(Math.round((downloaded / contentLength) * 100));
                }
                break;
              case 'Finished':
                setDownloadProgress(100);
                setDownloadComplete(true);
                break;
            }
          });

          setDownloadComplete(true);
        }
      }
    } catch (err: any) {
      console.error('Download and install error:', err);
      setErrorMsg(err?.message || 'Failed to download or verify release binary signature.');
      setDownloading(false);
    }
  };

  const handleRelaunch = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      }
    } catch (err) {
      console.error('Relaunch error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold text-[var(--text-primary)]">
                XTEON AUTO-UPDATER
              </h2>
              <p className="font-mono text-[11px] text-[var(--text-muted)]">
                Official GitHub Release Channel • v1.2.0
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 font-mono text-xs">
          {checking && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="font-bold text-[var(--text-primary)]">
                Checking for Latest Releases...
              </div>
              <div className="text-[11px] text-[var(--text-muted)] max-w-xs">
                Querying <span className="text-cyan-400">patrickudo2004/xteon</span> on GitHub.
              </div>
            </div>
          )}

          {!checking && updateAvailable === false && !errorMsg && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)]">
                  You're Up to Date!
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  Xteon v1.2.0 is currently the newest available production version.
                </div>
              </div>
              <div className="pt-2 flex items-center gap-1 text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified against GitHub Releases</span>
              </div>
            </div>
          )}

          {!checking && updateAvailable === true && updateInfo && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-cyan-400 font-bold uppercase">New Release Found</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    v{updateInfo.version}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Current installed version: <span className="text-slate-300">v{updateInfo.currentVersion || '1.2.0'}</span>
                </div>
              </div>

              {/* Release Notes */}
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1.5">
                  Release Notes & Changelog
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[11px] text-slate-300 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {updateInfo.body}
                </div>
              </div>

              {/* Download Progress Bar */}
              {downloading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-bold">
                      {downloadComplete ? 'Download Complete • Verifying Signature' : 'Downloading Update Package...'}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {downloadProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-subcard)] overflow-hidden border border-[var(--border-color)]">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  {totalBytes > 0 && (
                    <div className="text-[10px] text-[var(--text-muted)] text-right">
                      {(downloadedBytes / (1024 * 1024)).toFixed(1)} MB / {(totalBytes / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-rose-300">
                  Update Check Error
                </div>
                <div className="text-[11px] text-rose-400/80 mt-1 leading-relaxed">
                  {errorMsg}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between gap-3 font-mono text-xs">
          <a
            href="https://github.com/patrickudo2004/xteon/releases"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-[var(--text-muted)] hover:text-cyan-400 transition flex items-center gap-1 cursor-pointer"
          >
            <span>GitHub Releases</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            {!downloadComplete && updateAvailable === true && (
              <button
                onClick={handleDownloadAndInstall}
                disabled={downloading}
                className="px-4 py-1.5 rounded-lg bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] font-bold hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? 'Downloading...' : 'Install Update'}</span>
              </button>
            )}

            {downloadComplete && (
              <button
                onClick={handleRelaunch}
                className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold hover:bg-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-lg animate-pulse"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Relaunch Now</span>
              </button>
            )}

            {(!updateAvailable || errorMsg) && !checking && (
              <button
                onClick={checkForUpdates}
                className="px-4 py-1.5 rounded-lg bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Check Again</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
