import React from 'react';
import { useRigStore } from '../../store/useRigStore';
import { LiveCamera } from '../../types';
import { getPortIcon } from '../common/SvgIcons';
import {
  Camera,
  Eye,
  EyeOff,
  Power,
  X,
  ShieldCheck,
  Radio,
  Monitor,
  CheckCircle2,
} from 'lucide-react';

export const CameraIngestModal: React.FC = () => {
  const {
    liveCameras,
    cameraIngestModalOpen,
    setCameraIngestModalOpen,
    toggleHideCamera,
    toggleCameraLiveFeed,
    unhideAllCameras,
    engageAllProCameras,
    disengageAllCameras,
    updateCameraAlias,
    updateCameraStageZone,
  } = useRigStore();

  if (!cameraIngestModalOpen) return null;

  const proCameras = liveCameras.filter((c) => c.category === 'EXTERNAL_PRO');
  const internalCameras = liveCameras.filter((c) => c.category === 'INTERNAL_WEBCAM');
  const virtualCameras = liveCameras.filter((c) => c.category === 'VIRTUAL_BRIDGE');

  const hiddenCount = liveCameras.filter((c) => c.isHidden).length;
  const activeCount = liveCameras.filter((c) => !c.isHidden && c.isLiveFeedEnabled).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base font-bold text-[var(--text-primary)]">
                  CAMERA INGEST & PRIVACY MANAGER
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                  {liveCameras.length} Devices
                </span>
              </div>
              <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
                Configure live capture feeds, mute laptop webcams, and hide virtual software drivers.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCameraIngestModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Action Toolbar */}
        <div className="px-5 py-3 bg-[var(--bg-subcard)] border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> {activeCount} Streaming
            </span>
            <span>•</span>
            <span className="text-amber-400 font-bold">
              {hiddenCount} Hidden / Muted
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={engageAllProCameras}
              className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Engage streams for all unhidden production cameras"
            >
              <Power className="w-3 h-3 text-emerald-400" />
              <span>Engage Pro Feeds</span>
            </button>

            <button
              onClick={disengageAllCameras}
              className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Put all camera sensors into Standby (turns off camera LEDs)"
            >
              <Power className="w-3 h-3 text-slate-400" />
              <span>Standby All</span>
            </button>

            {hiddenCount > 0 && (
              <button
                onClick={unhideAllCameras}
                className="px-2.5 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>Unhide All</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Device Lists by Category */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Pro / External Ingest */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                Production Stage Ingest Sources ({proCameras.length})
              </h3>
            </div>

            {proCameras.length === 0 ? (
              <div className="p-4 rounded-xl bg-[var(--bg-subcard)] border border-dashed border-[var(--border-color)] text-center font-mono text-xs text-[var(--text-muted)]">
                No external capture cards or wireless phone cameras detected.
              </div>
            ) : (
              <div className="space-y-2.5">
                {proCameras.map((cam) => (
                  <CameraDeviceRow
                    key={cam.id}
                    camera={cam}
                    onToggleHide={() => toggleHideCamera(cam.id)}
                    onToggleFeed={() => toggleCameraLiveFeed(cam.id)}
                    onUpdateAlias={(alias) => updateCameraAlias(cam.id, alias)}
                    onUpdateZone={(zone) => updateCameraStageZone(cam.id, zone)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Internal Laptop Sensors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                  Internal Laptop Sensors ({internalCameras.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                Privacy Protection Active
              </span>
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)] mb-3 leading-relaxed">
              Internal webcam sensors embedded in the laptop screen. Muted and hidden by default to keep the technician booth private.
            </p>

            {internalCameras.length === 0 ? (
              <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-center font-mono text-xs text-[var(--text-muted)]">
                No internal webcam sensors detected.
              </div>
            ) : (
              <div className="space-y-2.5">
                {internalCameras.map((cam) => (
                  <CameraDeviceRow
                    key={cam.id}
                    camera={cam}
                    onToggleHide={() => toggleHideCamera(cam.id)}
                    onToggleFeed={() => toggleCameraLiveFeed(cam.id)}
                    onUpdateAlias={(alias) => updateCameraAlias(cam.id, alias)}
                    onUpdateZone={(zone) => updateCameraStageZone(cam.id, zone)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Virtual Software Bridges */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Virtual Software Bridges ({virtualCameras.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                OBS / Screen Drivers
              </span>
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)] mb-3 leading-relaxed">
              Virtual DirectShow drivers registered by OBS, screen recorders, or streaming utilities. Hidden by default.
            </p>

            {virtualCameras.length === 0 ? (
              <div className="p-3 rounded-xl bg-[var(--bg-subcard)] border border-[var(--border-color)] text-center font-mono text-xs text-[var(--text-muted)]">
                No virtual software capture bridges detected.
              </div>
            ) : (
              <div className="space-y-2.5">
                {virtualCameras.map((cam) => (
                  <CameraDeviceRow
                    key={cam.id}
                    camera={cam}
                    onToggleHide={() => toggleHideCamera(cam.id)}
                    onToggleFeed={() => toggleCameraLiveFeed(cam.id)}
                    onUpdateAlias={(alias) => updateCameraAlias(cam.id, alias)}
                    onUpdateZone={(zone) => updateCameraStageZone(cam.id, zone)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-color)] flex items-center justify-between">
          <div className="text-xs font-mono text-[var(--text-muted)]">
            Preferences auto-saved for next app launch.
          </div>
          <button
            onClick={() => setCameraIngestModalOpen(false)}
            className="px-5 py-1.5 rounded-lg bg-[var(--badge-cyan-bg)] text-[var(--badge-cyan-text)] border border-[var(--badge-cyan-border)] font-mono text-xs font-bold hover:opacity-90 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface CameraDeviceRowProps {
  camera: LiveCamera;
  onToggleHide: () => void;
  onToggleFeed: () => void;
  onUpdateAlias: (alias: string) => void;
  onUpdateZone: (zone: string) => void;
}

const CameraDeviceRow: React.FC<CameraDeviceRowProps> = ({
  camera,
  onToggleHide,
  onToggleFeed,
  onUpdateAlias,
  onUpdateZone,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [aliasVal, setAliasVal] = React.useState(camera.customAlias);

  const isStreaming = !camera.isHidden && camera.isLiveFeedEnabled;

  return (
    <div
      className={`p-3 rounded-xl border transition-all duration-150 flex flex-wrap items-center justify-between gap-3 ${
        camera.isHidden
          ? 'bg-[var(--bg-subcard)] opacity-60 border-[var(--border-color)]'
          : 'bg-[var(--bg-card)] border-slate-700 hover:border-slate-500 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0">
          {getPortIcon(camera.portType, 'w-4 h-4')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                type="text"
                value={aliasVal}
                autoFocus
                onChange={(e) => setAliasVal(e.target.value)}
                onBlur={() => {
                  if (aliasVal.trim()) onUpdateAlias(aliasVal.trim());
                  setIsEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (aliasVal.trim()) onUpdateAlias(aliasVal.trim());
                    setIsEditing(false);
                  }
                }}
                className="bg-[var(--bg-subcard)] border border-cyan-400 rounded px-2 py-0.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none"
              />
            ) : (
              <span
                onClick={() => setIsEditing(true)}
                className="font-mono text-xs font-bold text-[var(--text-primary)] hover:text-cyan-400 cursor-pointer truncate"
                title="Click to rename"
              >
                {camera.customAlias} ✎
              </span>
            )}

            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-subcard)] border border-[var(--border-color)] text-[var(--text-muted)] shrink-0">
              {camera.portType.replace('_', ' ')}
            </span>
          </div>

          <div className="text-[10px] font-mono text-[var(--text-muted)] truncate mt-0.5">
            Hardware: {camera.name} • Vendor: {camera.vendor}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Stream Engage / Standby Toggle */}
        <button
          onClick={onToggleFeed}
          disabled={camera.isHidden}
          className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            camera.isHidden
              ? 'opacity-30 cursor-not-allowed border-[var(--border-color)] bg-[var(--bg-subcard)] text-[var(--text-muted)]'
              : isStreaming
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] border-[var(--border-color)]'
          }`}
          title={isStreaming ? 'Pause video feed (sensor standby)' : 'Engage live video stream'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span>{isStreaming ? 'STREAMING' : 'STANDBY'}</span>
        </button>

        {/* Hide / Unhide Toggle */}
        <button
          onClick={onToggleHide}
          className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            camera.isHidden
              ? 'bg-[var(--bg-subcard)] hover:bg-[var(--border-color)] text-[var(--text-muted)] border-[var(--border-color)]'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
          }`}
          title={camera.isHidden ? 'Unhide this camera device' : 'Hide this camera device'}
        >
          {camera.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{camera.isHidden ? 'HIDDEN' : 'SHOWN'}</span>
        </button>
      </div>
    </div>
  );
};