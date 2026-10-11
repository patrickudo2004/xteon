import React, { useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { ShowEventLogEntry } from '../../types';
import {
  X,
  FileText,
  AlertTriangle,
  Info,
  AlertCircle,
  Copy,
  Trash2,
  Check,
  Filter,
  Monitor,
  Volume2,
  Shield,
  Split,
  Download,
} from 'lucide-react';

export const EventLogDrawer: React.FC = () => {
  const {
    eventLogDrawerOpen,
    setEventLogDrawerOpen,
    eventLogs,
    clearEventLogs,
    projectName,
  } = useRigStore();

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  if (!eventLogDrawerOpen) return null;

  const filteredLogs = eventLogs.filter((log) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'WARNINGS') return log.level === 'WARN' || log.level === 'CRITICAL';
    return log.category === filterCategory;
  });

  const handleCopyLogs = () => {
    const header = `=== XTEON PRO AV SHOW INCIDENT REPORT ===\nProject: ${projectName}\nExported At: ${new Date().toLocaleString()}\nTotal Events: ${eventLogs.length}\n=========================================\n\n`;
    const body = eventLogs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level}] [${l.category}] ${l.message}${l.details ? ` - ${l.details}` : ''}`
      )
      .join('\n');
    
    navigator.clipboard.writeText(header + body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadge = (level: ShowEventLogEntry['level']) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold">
            CRITICAL
          </span>
        );
      case 'WARN':
        return (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
            WARNING
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-bold">
            INFO
          </span>
        );
    }
  };

  const getCategoryIcon = (cat: ShowEventLogEntry['category']) => {
    switch (cat) {
      case 'DISPLAY':
        return <Monitor className="w-3.5 h-3.5 text-cyan-400" />;
      case 'AUDIO':
        return <Volume2 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'SAFETY':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'BRANCH':
        return <Split className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div
      onClick={() => setEventLogDrawerOpen(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end select-none font-mono text-xs animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-full bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col text-[var(--text-primary)]"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-[var(--text-primary)]">
                Flight Recorder / Event Log
              </h2>
              <p className="text-[10px] text-[var(--text-muted)]">
                Blackbox audit trail of show-day hardware events & triggers
              </p>
            </div>
          </div>
          <button
            onClick={() => setEventLogDrawerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Action Toolbar */}
        <div className="p-3 bg-[var(--bg-subcard)] border-b border-[var(--border-color)] flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
              }`}
            >
              All ({eventLogs.length})
            </button>
            <button
              onClick={() => setFilterCategory('WARNINGS')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                filterCategory === 'WARNINGS'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
              }`}
            >
              Alerts
            </button>
            <button
              onClick={() => setFilterCategory('DISPLAY')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                filterCategory === 'DISPLAY'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
              }`}
            >
              Displays
            </button>
            <button
              onClick={() => setFilterCategory('AUDIO')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                filterCategory === 'AUDIO'
                  ? 'bg-indigo-500 text-slate-950'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
              }`}
            >
              Audio
            </button>
            <button
              onClick={() => setFilterCategory('SAFETY')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                filterCategory === 'SAFETY'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
              }`}
            >
              Safety
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyLogs}
              className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
              title="Copy incident log to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                if (window.confirm('Clear all flight recorder logs for this session?')) {
                  clearEventLogs();
                }
              }}
              className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-400 border border-[var(--border-color)] transition cursor-pointer"
              title="Clear log buffer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
              <Shield className="w-10 h-10 mb-2 opacity-30 text-cyan-400" />
              <div className="font-bold text-xs text-[var(--text-primary)]">Ready for Show Operations</div>
              <div className="text-[11px] mt-1 max-w-xs">
                No incident alerts recorded. Display hot-plugs, audio switches, and safety triggers will appear here in real-time.
              </div>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-xl border transition ${
                  log.level === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : log.level === 'WARN'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-[var(--bg-subcard)] border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(log.category)}
                    <span className="text-[var(--text-muted)] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>{getLevelBadge(log.level)}</div>
                </div>

                <div className="font-bold text-[11px] leading-snug">{log.message}</div>

                {log.details && (
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono break-words bg-[var(--bg-card)]/50 p-1.5 rounded border border-[var(--border-color)]/50">
                    {log.details}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-muted)] shrink-0">
          <span>{filteredLogs.length} events logged in this session</span>
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1 text-cyan-400 hover:underline cursor-pointer font-bold"
          >
            <Download className="w-3 h-3" />
            <span>Export Incident Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};
