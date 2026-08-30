import React, { useState } from 'react';
import { useRigStore } from '../../store/useRigStore';
import { DeviceCategory, DeviceType } from '../../types';
import {
  Server,
  Split,
  RefreshCw,
  Cpu,
  Monitor,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  Sliders,
  Radio,
  FilePlus2,
  Sparkles,
  Cast,
  Tv,
  PanelLeftClose,
  ExternalLink,
} from 'lucide-react';

interface PaletteItem {
  category: DeviceCategory;
  deviceType: DeviceType;
  label: string;
  desc: string;
  defaultPorts: string;
}

const hardwareCatalog: { category: DeviceCategory; label: string; icon: React.ReactNode; items: PaletteItem[] }[] = [
  {
    category: 'SOURCE',
    label: '1. Video Sources & Media',
    icon: <Server className="w-4 h-4 text-blue-400" />,
    items: [
      { category: 'SOURCE', deviceType: 'LAPTOP', label: 'Presentation Laptop', desc: 'Host / Guest speaker laptop', defaultPorts: '1x HDMI 2.0, 1x USB-C DP' },
      { category: 'SOURCE', deviceType: 'MEDIA_SERVER', label: 'FOH Media Server', desc: 'Workstation driving ProPresenter / Resolume / OBS', defaultPorts: '4x DP 1.4 / HDMI 2.0 Outputs' },
      { category: 'SOURCE', deviceType: 'CAMERA_PTZ', label: 'PTZ Robotic Camera', desc: 'NDI / 12G-SDI remote robotic camera', defaultPorts: '1x 12G-SDI, 1x HDMI, 1x NDI' },
      { category: 'SOURCE', deviceType: 'CAMERA_SDI', label: 'Studio Broadcast Camera', desc: 'Broadcast camera feed over BNC', defaultPorts: '1x 12G-SDI Out' },
      { category: 'SOURCE', deviceType: 'PLAYBACK_RECORDER', label: 'HyperDeck Recorder/Player', desc: 'Blackmagic video deck playback', defaultPorts: '12G-SDI & HDMI Playback + Loop' },
      { category: 'SOURCE', deviceType: 'WIRELESS_GATEWAY', label: 'Wireless Screen Gateway', desc: 'ASUS GlideX / Barco ClickShare / Miracast', defaultPorts: 'Wireless In -> HDMI Out' },
    ],
  },
  {
    category: 'SWITCHER',
    label: '2. Switchers & Matrices',
    icon: <Sliders className="w-4 h-4 text-amber-400" />,
    items: [
      { category: 'SWITCHER', deviceType: 'SEAMLESS_SWITCHER', label: 'Seamless Presentation Switcher', desc: 'Roland V-160HD / Barco S3-4K Switcher', defaultPorts: '4 In -> PGM, AUX, Multiview Out' },
      { category: 'SWITCHER', deviceType: 'PRODUCTION_SWITCHER', label: 'Production Vision Switcher', desc: 'Blackmagic ATEM Constellation 4K', defaultPorts: '4 In -> PGM 1/2, AUX, Multiview' },
      { category: 'SWITCHER', deviceType: 'MATRIX_4X4', label: '4x4 Matrix Router', desc: 'Extron / Kramer 4K Matrix Switcher', defaultPorts: '4 Inputs <-> 4 Outputs (HDMI 2.0)' },
      { category: 'SWITCHER', deviceType: 'MATRIX_8X8', label: '8x8 Matrix Router', desc: 'Blackmagic Smart Videohub 8x8', defaultPorts: '8 Inputs <-> 8 Outputs (HDMI/SDI)' },
      { category: 'SWITCHER', deviceType: 'MATRIX_16X16', label: '16x16 Matrix Router', desc: 'Enterprise Broadcast Router', defaultPorts: '16 Inputs <-> 16 Outputs' },
    ],
  },
  {
    category: 'DISTRIBUTION',
    label: '3. Splitters & Distribution',
    icon: <Split className="w-4 h-4 text-purple-400" />,
    items: [
      { category: 'DISTRIBUTION', deviceType: 'SPLITTER_1X2', label: '1x2 HDMI Splitter', desc: 'Compact dual display clone splitter', defaultPorts: '1 In -> 2 Out (HDMI 2.0)' },
      { category: 'DISTRIBUTION', deviceType: 'SPLITTER_1X4', label: '1x4 HDMI Distribution Amp', desc: 'Kramer VM-4H2 4K60 Splitter', defaultPorts: '1 In -> 4 Out (HDMI 2.0)' },
      { category: 'DISTRIBUTION', deviceType: 'SPLITTER_1X8', label: '1x8 HDMI Distribution Amp', desc: 'High-density stage splitter', defaultPorts: '1 In -> 8 Out (HDMI 2.0)' },
      { category: 'DISTRIBUTION', deviceType: 'SPLITTER_1X16', label: '1x16 HDMI Splitter', desc: 'Multi-room overflow distribution', defaultPorts: '1 In -> 16 Out (HDMI 2.0)' },
    ],
  },
  {
    category: 'CONVERTER',
    label: '4. Extenders & Converters',
    icon: <RefreshCw className="w-4 h-4 text-pink-400" />,
    items: [
      { category: 'CONVERTER', deviceType: 'DECIMATOR_MD_HX', label: 'Decimator MD-HX Cross-Converter', desc: 'HDMI <-> 3G-SDI Cross-Converter & Scaler', defaultPorts: 'HDMI/SDI In -> 2x SDI Out + Scaled HDMI' },
      { category: 'CONVERTER', deviceType: 'DECIMATOR_12G_CROSS', label: 'Decimator 12G-CROSS 4K', desc: '12G-SDI & HDMI 2.0 4K Cross Converter', defaultPorts: '4K HDMI/SDI In -> 4x 12G-SDI Out' },
      { category: 'CONVERTER', deviceType: 'HDBASET_TX', label: 'HDBaseT 4K Transmitter (TX)', desc: '100m Cat6A Long-Reach Video Sender', defaultPorts: 'HDMI In -> HDBaseT Cat6 Out' },
      { category: 'CONVERTER', deviceType: 'HDBASET_RX', label: 'HDBaseT 4K Receiver (RX)', desc: '100m Cat6A Long-Reach Video Receiver', defaultPorts: 'HDBaseT In -> HDMI Out' },
      { category: 'CONVERTER', deviceType: 'FIBER_TRANSCEIVER', label: 'Optical Fiber HDMI Transceiver', desc: '300m Single-Mode Optical Extender', defaultPorts: 'HDMI In -> Fiber Optic Out' },
      { category: 'CONVERTER', deviceType: 'WIRELESS_VIDEO_TX', label: 'Zero-Delay Wireless TX/RX', desc: 'Teradek Bolt 4K LT / Hollyland Mars', defaultPorts: 'SDI/HDMI In -> Wireless Beam' },
    ],
  },
  {
    category: 'PROCESSOR',
    label: '5. LED & Wall Processors',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    items: [
      { category: 'PROCESSOR', deviceType: 'NOVASTAR_MCTRL4K', label: 'NovaStar MCTRL4K Processor', desc: 'Flagship 4K UHD LED Controller', defaultPorts: 'DP 1.4 / HDMI 2.0 -> 16x RJ45 Out' },
      { category: 'PROCESSOR', deviceType: 'NOVASTAR_MX40_PRO', label: 'NovaStar MX40 Pro COEX', desc: 'Next-Gen 8K/4K COEX Processor', defaultPorts: 'DP 1.4 / 12G-SDI -> 20x 5G Ports' },
      { category: 'PROCESSOR', deviceType: 'NOVASTAR_VX4S', label: 'NovaStar VX4S / VX600', desc: 'All-in-One Controller & Scaler', defaultPorts: 'HDMI/DVI/SDI In -> 4x RJ45 Out' },
      { category: 'PROCESSOR', deviceType: 'BROMPTON_SX40', label: 'Brompton Tessera SX40 4K', desc: 'High-end Broadcast LED Processor', defaultPorts: '12G-SDI / HDMI -> 4x 10G Optical' },
      { category: 'PROCESSOR', deviceType: 'DATAPATH_FX4', label: 'Datapath Fx4 Video Wall Scaler', desc: '4K Display Controller for 4 Displays', defaultPorts: '4K DP In -> 4x HDMI Outputs' },
    ],
  },
  {
    category: 'SINK',
    label: '6. Displays, Projectors & Sinks',
    icon: <Monitor className="w-4 h-4 text-emerald-400" />,
    items: [
      { category: 'SINK', deviceType: 'COMMERCIAL_TV', label: 'Commercial Flat Panel TV', desc: 'Multi-input 4K UHD Stage Display (1..4 HDMIs)', defaultPorts: '3x HDMI Inputs (Configurable)' },
      { category: 'SINK', deviceType: 'PROJECTOR', label: 'Venue Laser Projector', desc: '20K-lumen long-throw stage projector', defaultPorts: 'HDMI 2.0, 12G-SDI, HDBaseT In' },
      { category: 'SINK', deviceType: 'LED_WALL', label: 'Direct-View LED Video Wall', desc: 'Custom cabinet grid & pixel pitch wall', defaultPorts: '4x Trunk Ports (Configurable)' },
      { category: 'SINK', deviceType: 'CONFIDENCE_MONITOR', label: 'Downstage Confidence DSM', desc: 'Presenter / Pastor downstage monitor', defaultPorts: 'HDMI 2.0 In, 3G-SDI In' },
      { category: 'SINK', deviceType: 'STUDIO_MULTIVIEW', label: 'Studio Multiview Monitor', desc: 'Multi-screen quad-split monitoring display', defaultPorts: '2x HDMI 2.0, 1x DP 1.4' },
      { category: 'SINK', deviceType: 'STREAMING_ENCODER', label: 'Live Broadcast Streamer', desc: 'RTMP / SRT Cloud Streaming Output', defaultPorts: '12G-SDI & HDMI In -> Cloud Stream' },
    ],
  },
];

export const ComponentPalette: React.FC = () => {
  const { addDeviceNode, createNewPlan, loadSampleRig, nodes, paletteDockState, setPaletteDockState } = useRigStore();
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    SOURCE: true,
    SWITCHER: true,
    DISTRIBUTION: true,
    CONVERTER: true,
    PROCESSOR: true,
    SINK: true,
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredCatalog = hardwareCatalog
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.desc.toLowerCase().includes(search.toLowerCase()) ||
          item.defaultPorts.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="w-full bg-[var(--bg-header)] border-r border-[var(--border-color)] flex flex-col h-full select-none text-[var(--text-primary)]">
      {/* Top Header & New Plan / Sample Actions */}
      <div className="p-3.5 border-b border-[var(--border-color)] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Hardware Library
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] mr-1">
              {nodes.length} Placed
            </span>
            {paletteDockState === 'DOCKED' && (
              <>
                <button
                  onClick={() => setPaletteDockState('DETACHED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                  title="Pop out into floating window"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setPaletteDockState('COLLAPSED')}
                  className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] text-[var(--text-muted)] hover:text-cyan-400 border border-[var(--border-color)] transition cursor-pointer"
                  title="Collapse sidebar panel (Ctrl+B)"
                >
                  <PanelLeftClose className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Plan Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (nodes.length > 0 && !window.confirm('Start a new blank plan? All unsaved canvas nodes will be cleared.')) {
                return;
              }
              createNewPlan();
            }}
            className="py-1.5 px-2.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 shadow-sm text-[var(--accent-cyan)] cursor-pointer"
            title="Clear canvas and create a brand new blank plan"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>New Plan</span>
          </button>

          <button
            onClick={() => {
              if (nodes.length > 0 && !window.confirm('Load sample rig? Current canvas will be replaced.')) {
                return;
              }
              loadSampleRig();
            }}
            className="py-1.5 px-2.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subcard)] border border-[var(--border-color)] text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 shadow-sm text-[var(--accent-amber)] cursor-pointer"
            title="Load a standard reference rig (1 Media Server -> 1x4 Splitter -> 3 TVs)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Rig</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search splitters, TVs, cameras, SDI..."
            className="w-full bg-[var(--bg-subcard)] border border-[var(--border-color)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>
      </div>

      {/* Catalog List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {filteredCatalog.map((cat) => {
          const isOpen = openCategories[cat.category] !== false;
          return (
            <div key={cat.category} className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)]">
              <button
                onClick={() => toggleCategory(cat.category)}
                className="w-full px-3 py-2 bg-[var(--bg-subcard)] hover:opacity-90 flex items-center justify-between text-left transition border-b border-[var(--border-color)]"
              >
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    {cat.label}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
              </button>

              {isOpen && (
                <div className="p-1.5 space-y-1">
                  {cat.items.map((item) => (
                    <div
                      key={item.deviceType}
                      onClick={() => addDeviceNode(item.deviceType)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-subcard)] border border-transparent hover:border-[var(--border-color)] cursor-pointer transition group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-xs font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition">
                          {item.label}
                        </div>
                        <Plus className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 line-clamp-1">
                        {item.desc}
                      </div>
                      <div className="text-[9px] text-cyan-400/80 font-mono mt-1 flex items-center gap-1">
                        <span>Ports:</span>
                        <span className="text-[var(--text-primary)] opacity-80">{item.defaultPorts}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
