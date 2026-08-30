import React, { useState, useEffect } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { AppMode, ThemeMode } from '../../types';
import { exportCablePatchSheetPdf, exportEquipmentBomPdf, downloadProjectJson } from '../exports/PatchSheetExporter';
import { downloadCablePullListCSV } from '../../utils/csvExport';
import { exportCanvasToPNG } from '../../utils/imageExport';
import { INDUSTRY_TEMPLATES } from '../../utils/industryTemplates';
import { UpdateModal } from '../common/UpdateModal';
import {
  Layers,
  Monitor,
  Shield,
  Download,
  Upload,
  Sun,
  Moon,
  Tv,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
  Package,
  MousePointer,
  FilePlus2,
  FolderOpen,
  Save,
  Clock,
  FileSpreadsheet,
  Image as ImageIcon,
  Check,
  Edit2,
  ArrowUpCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    appMode,
    setAppMode,
    themeMode,
    setThemeMode,
    nodes,
    edges,
    exportProject,
    importProject,
    projectName,
    setProjectName,
    isDirty,
    recentProjects,
    createNewPlan,
    savePlanToFile,
    loadPlanFromFile,
    loadTemplate,
    setMobileModalOpen,
    showCursorInPreviews,
    setShowCursorInPreviews,
  } = useRigStore();

  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [recentSubmenuOpen, setRecentSubmenuOpen] = useState(false);
  const [templateSubmenuOpen, setTemplateSubmenuOpen] = useState(false);
  const [exportSubmenuOpen, setExportSubmenuOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName);

  useEffect(() => {
    setTitleInput(projectName);
  }, [projectName]);

  // Global Keyboard Shortcuts (Ctrl+S, Ctrl+O, Ctrl+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        savePlanToFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        loadPlanFromFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (!isDirty || window.confirm('Start a new blank plan? All unsaved canvas nodes will be cleared.')) {
          createNewPlan();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, savePlanToFile, loadPlanFromFile, createNewPlan]);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setProjectName(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 bg-[var(--bg-header)] border-b border-[var(--border-color)] px-4 flex items-center justify-between select-none z-30 shrink-0 text-[var(--text-primary)]">
      {/* Left Brand, Identity & File Menu */}
      <div className="flex items-center gap-3">
        {/* Logo Monogram */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center font-mono font-black text-slate-950 text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40">
            XT
          </div>
          <div className="font-mono text-sm font-black tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
            <span>XTEON</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-normal">PRO</span>
          </div>
        </div>

        {/* Top File Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            className="px-2.5 py-1.5 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <span className="font-bold">File</span>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </button>

          {fileMenuOpen && (
            <div
              className="absolute left-0 mt-2 w-64 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-1.5 space-y-1 font-mono text-xs z-50 text-[var(--text-primary)]"
              onMouseLeave={() => {
                setFileMenuOpen(false);
                setRecentSubmenuOpen(false);
                setTemplateSubmenuOpen(false);
                setExportSubmenuOpen(false);
              }}
            >
              {/* New Plan */}
              <button
                onClick={() => {
                  if (!isDirty || window.confirm('Start a new blank plan? All unsaved canvas nodes will be cleared.')) {
                    createNewPlan();
                  }
                  setFileMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FilePlus2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>New Blank Plan</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">Ctrl+N</span>
              </button>

              {/* Open Plan */}
              <button
                onClick={() => {
                  loadPlanFromFile();
                  setFileMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open Plan (.xteon)...</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">Ctrl+O</span>
              </button>

              {/* Save Plan */}
              <button
                onClick={() => {
                  savePlanToFile();
                  setFileMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Plan</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">Ctrl+S</span>
              </button>

              {/* Recent Projects Submenu Trigger */}
              <div
                className="relative"
                onMouseEnter={() => {
                  setRecentSubmenuOpen(true);
                  setTemplateSubmenuOpen(false);
                  setExportSubmenuOpen(false);
                }}
              >
                <button className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center justify-between transition cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recent Projects</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                </button>

                {recentSubmenuOpen && (
                  <div className="absolute left-full top-0 ml-1 w-64 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-1.5 space-y-1 z-50">
                    {recentProjects.length === 0 ? (
                      <div className="p-2 text-[11px] text-[var(--text-muted)] text-center">No recent projects</div>
                    ) : (
                      recentProjects.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(p.data);
                              importProject(parsed);
                              setProjectName(p.name);
                              setFileMenuOpen(false);
                            } catch {}
                          }}
                          className="w-full px-2 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left text-xs transition truncate"
                        >
                          <div className="font-bold text-[var(--text-primary)] truncate">{p.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{p.date} • {p.nodeCount} devices</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Starter Templates Submenu Trigger */}
              <div
                className="relative"
                onMouseEnter={() => {
                  setTemplateSubmenuOpen(true);
                  setRecentSubmenuOpen(false);
                  setExportSubmenuOpen(false);
                }}
              >
                <button className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center justify-between transition cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Industry Templates</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                </button>

                {templateSubmenuOpen && (
                  <div className="absolute left-full top-0 ml-1 w-72 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-1.5 space-y-1 z-50">
                    {INDUSTRY_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          loadTemplate(t.id);
                          setFileMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left text-xs transition cursor-pointer"
                      >
                        <div className="font-bold text-[var(--text-primary)]">{t.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] line-clamp-1">{t.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--border-color)] my-1" />

              {/* Export Submenu Trigger */}
              <div
                className="relative"
                onMouseEnter={() => {
                  setExportSubmenuOpen(true);
                  setRecentSubmenuOpen(false);
                  setTemplateSubmenuOpen(false);
                }}
              >
                <button className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center justify-between transition cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Outputs</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                </button>

                {exportSubmenuOpen && (
                  <div className="absolute left-full top-0 ml-1 w-64 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-1.5 space-y-1 z-50">
                    <button
                      onClick={() => {
                        exportCablePatchSheetPdf(nodes, edges);
                        setFileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center gap-2 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Stage Patch Sheet (PDF)</span>
                    </button>

                    <button
                      onClick={() => {
                        downloadCablePullListCSV(exportProject());
                        setFileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center gap-2 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cable Pull List (CSV)</span>
                    </button>

                    <button
                      onClick={() => {
                        exportCanvasToPNG(projectName);
                        setFileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center gap-2 transition cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                      <span>Schematic Diagram (PNG)</span>
                    </button>

                    <button
                      onClick={() => {
                        exportEquipmentBomPdf(nodes, edges);
                        setFileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded hover:bg-[var(--bg-subcard)] text-left flex items-center gap-2 transition cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>Equipment BOM (PDF)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Project Name & Dirty Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                autoFocus
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                className="bg-transparent border-b border-cyan-400 text-[var(--text-primary)] font-bold text-xs focus:outline-none w-48"
              />
              <button onClick={handleTitleSubmit} className="text-emerald-400 hover:text-emerald-300">
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1 cursor-pointer hover:text-cyan-400 transition"
              title="Click to rename project"
            >
              <span className="text-[var(--text-muted)] text-[10px]">Project:</span>
              <span className="font-bold max-w-44 truncate">{projectName}</span>
              {isDirty && <span className="text-amber-400 font-black animate-pulse" title="Unsaved changes">*</span>}
              <Edit2 className="w-2.5 h-2.5 text-[var(--text-muted)] ml-0.5 opacity-60" />
            </div>
          )}
        </div>

        {/* Tri-Mode Switcher */}
        <div className="p-1 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] flex items-center gap-1">
          <button
            onClick={() => setAppMode('PLANNER')}
            className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              appMode === 'PLANNER'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PLANNER STUDIO</span>
          </button>

          <button
            onClick={() => setAppMode('LIVE_MAP')}
            className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              appMode === 'LIVE_MAP'
                ? 'bg-blue-500 text-slate-950 shadow-md font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LIVE MAP</span>
          </button>

          <button
            onClick={() => setAppMode('LIVE')}
            className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              appMode === 'LIVE'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="hidden sm:inline">LIVE MONITOR</span>
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Cursor Exposure Toggle */}
        <button
          onClick={() => setShowCursorInPreviews(!showCursorInPreviews)}
          className={`px-2.5 py-1.5 rounded-md border text-xs font-mono transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
            showCursorInPreviews
              ? 'bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border-[var(--badge-cyan-border)] font-bold'
              : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-subcard)]'
          }`}
          title="Toggle cursor exposure in live preview feeds"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Cursor: {showCursorInPreviews ? 'ON' : 'OFF'}</span>
        </button>

        {/* Mobile Companion Trigger */}
        <button
          onClick={() => setMobileModalOpen(true)}
          className="p-2 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--accent-cyan)] transition shadow-sm cursor-pointer"
          title="Open Mobile Companion QR Pairing"
        >
          <Smartphone className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Theme Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="p-2 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] transition shadow-sm cursor-pointer"
            title="Switch Pro AV Theme"
          >
            {themeMode === 'DARK_FOH' ? (
              <Moon className="w-4 h-4 text-purple-400" />
            ) : themeMode === 'DAYLIGHT' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Tv className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {themeMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-1.5 space-y-1 font-mono text-xs z-50 text-[var(--text-primary)]"
              onMouseLeave={() => setThemeMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setThemeMode('DARK_FOH');
                  setThemeMenuOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded text-left flex items-center gap-2 transition cursor-pointer ${
                  themeMode === 'DARK_FOH' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--bg-subcard)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>FOH Stage Dark (OLED)</span>
              </button>

              <button
                onClick={() => {
                  setThemeMode('DAYLIGHT');
                  setThemeMenuOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded text-left flex items-center gap-2 transition cursor-pointer ${
                  themeMode === 'DAYLIGHT' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--bg-subcard)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Daylight Festival Mode</span>
              </button>

              <button
                onClick={() => {
                  setThemeMode('BROADCAST');
                  setThemeMenuOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded text-left flex items-center gap-2 transition cursor-pointer ${
                  themeMode === 'BROADCAST' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--bg-subcard)]'
                }`}
              >
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                <span>Broadcast Neutral 18%</span>
              </button>
            </div>
          )}
        </div>

        {/* Software Auto-Updater Button */}
        <button
          onClick={() => setUpdateModalOpen(true)}
          className="px-2.5 py-1.5 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5 transition shadow-sm cursor-pointer hover:border-cyan-500/50"
          title="Check for Software Updates from GitHub Releases"
        >
          <ArrowUpCircle className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Updates</span>
        </button>
      </div>

      {/* Auto-Updater Modal */}
      <UpdateModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
      />
    </header>
  );
};
