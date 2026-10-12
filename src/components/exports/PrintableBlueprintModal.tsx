import React from 'react';
import { useRigStore } from '../../store/useRigStore';
import { X, Printer, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PrintableBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableBlueprintModal: React.FC<PrintableBlueprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { nodes, edges, projectName, projectVenue, projectAuthor } = useRigStore();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
      >
        {/* Modal Toolbar (Hidden during print) */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold font-mono">
              📐
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wide text-white">
                FOH Production Blueprint & Stage Wiring Schematic
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                High-contrast vector sheet formatted for 11x17 Tabloid / A3 field printing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Schematic (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Blueprint Canvas (This prints cleanly onto 1-2 pages) */}
        <div
          id="xteon-printable-blueprint"
          className="p-8 bg-white text-slate-950 overflow-y-auto font-mono text-xs print:p-0 print:m-0 print:text-black"
        >
          {/* Header Block */}
          <div className="border-4 border-slate-950 p-4 mb-6">
            <div className="flex justify-between items-start border-b-2 border-slate-950 pb-3 mb-3">
              <div>
                <h1 className="text-2xl font-black tracking-wider uppercase">
                  {projectName || 'XTEON STAGING RIG PLAN'}
                </h1>
                <div className="text-xs font-bold text-slate-700 uppercase mt-0.5">
                  Venue: {projectVenue || 'Main Auditorium'} • Prepared By: {projectAuthor || 'Technical Director'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black tracking-widest text-slate-900">
                  XTEON PRO AV
                </div>
                <div className="text-[10px] text-slate-600">
                  Date: {currentDate} • Rev 1.3
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px] uppercase font-bold text-slate-800">
              <div>Total Nodes: {nodes.length}</div>
              <div>Total Cables: {edges.length}</div>
              <div>Rig Mode: Pre-Production CAD</div>
              <div>Standard: SMPTE / CEA-861-G</div>
            </div>
          </div>

          {/* Equipment Inventory Summary Table */}
          <div className="mb-6">
            <h3 className="font-bold uppercase tracking-wider text-sm border-b-2 border-slate-950 pb-1 mb-2">
              1. Equipment Bill of Materials (BOM)
            </h3>
            <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400">
                  <th className="p-2 border-r border-slate-400">Device Label</th>
                  <th className="p-2 border-r border-slate-400">Category</th>
                  <th className="p-2 border-r border-slate-400">Hardware Model</th>
                  <th className="p-2 border-r border-slate-400">Stage Zone</th>
                  <th className="p-2">Ports Configured</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr key={node.id} className="border-b border-slate-300">
                    <td className="p-2 font-bold border-r border-slate-300">{node.data.label}</td>
                    <td className="p-2 border-r border-slate-300">{node.data.category}</td>
                    <td className="p-2 border-r border-slate-300">{node.data.customModelName || 'Standard Pro AV'}</td>
                    <td className="p-2 border-r border-slate-300">{node.data.stageZone || 'Stage Area'}</td>
                    <td className="p-2">
                      In: {node.data.inputPorts?.length || 0} | Out: {node.data.outputPorts?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cable Pull Schedule Table */}
          <div className="mb-6">
            <h3 className="font-bold uppercase tracking-wider text-sm border-b-2 border-slate-950 pb-1 mb-2">
              2. Cable Pull & Signal Interconnect Schedule
            </h3>
            <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400">
                  <th className="p-2 border-r border-slate-400">Tag</th>
                  <th className="p-2 border-r border-slate-400">Source (Origin)</th>
                  <th className="p-2 border-r border-slate-400">Target (Destination)</th>
                  <th className="p-2 border-r border-slate-400">Medium</th>
                  <th className="p-2 border-r border-slate-400">Length</th>
                  <th className="p-2">Signal Physics</th>
                </tr>
              </thead>
              <tbody>
                {edges.map((edge, idx) => {
                  const src = nodes.find((n) => n.id === edge.source);
                  const tgt = nodes.find((n) => n.id === edge.target);
                  const lengthM = edge.data?.lengthMeters || 10;
                  const lengthFt = (lengthM * 3.28084).toFixed(1);

                  return (
                    <tr key={edge.id} className="border-b border-slate-300">
                      <td className="p-2 font-bold border-r border-slate-300">
                        CBL-{String(idx + 1).padStart(3, '0')}
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        {src?.data.label} ({edge.data?.sourcePortId || 'Out'})
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        {tgt?.data.label} ({edge.data?.targetPortId || 'In'})
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        {edge.data?.cableType?.replace(/_/g, ' ') || 'HDMI 2.0'}
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        {lengthM}m ({lengthFt}ft)
                      </td>
                      <td className="p-2 font-bold">
                        {edge.data?.calculatedBandwidthGbps ? `${edge.data.calculatedBandwidthGbps} Gbps` : 'VALID'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Iron-Clad Legal Disclaimer & Field Safety Notice */}
          <div className="border-2 border-slate-950 p-4 bg-slate-50 text-[10px] leading-relaxed">
            <div className="font-bold uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <span>⚠️ CRITICAL FIELD SAFETY & RIGGING NOTICE</span>
            </div>
            <p className="mb-1 text-slate-700">
              <strong>1. STRUCTURAL & ELECTRICAL DISCLAIMER:</strong> This schematic is a logical signal routing plan generated via Xteon Pro AV CAD (xteon.app). It does NOT constitute structural engineering, truss weight load certification, rigging approval, or electrical distribution sizing. All physical hardware hanging, motor rigging, and power distribution must be verified and certified on-site by ETCP-certified riggers and licensed electricians.
            </p>
            <p className="text-slate-700">
              <strong>2. SIGNAL OUTAGE INDEMNITY:</strong> The software developer and copyright holder assume no liability for physical cable damage, connector wear, broadcast dropouts, display handshakes, or live event interruptions resulting from reliance upon this plan. All signal paths should be verified with physical test patterns prior to public show execution.
            </p>
          </div>
        </div>

        {/* Modal Footer (Hidden during print) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 font-mono text-xs print:hidden">
          <div className="text-[11px] text-slate-400">
            Formatted with print CSS for landscape A3 / 11x17 tabloid paper
          </div>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save to PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
