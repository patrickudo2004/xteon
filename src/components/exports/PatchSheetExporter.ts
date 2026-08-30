import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DeviceNodeData, CableEdgeData, RigProject } from '../../types';
import { Node, Edge } from '@xyflow/react';

export const exportCablePatchSheetPdf = (
  nodes: Node<DeviceNodeData>[],
  edges: Edge<CableEdgeData>[],
  projectName: string = 'Xteon Staging Rig Plan'
) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('XTEON PRO AV — CABLE RUN & PATCH SHEET', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Project: ${projectName}`, 14, 25);

  // Build Table Rows
  const tableRows = edges.map((edge, index) => {
    const cable = edge.data as CableEdgeData;
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    return [
      `#${String(index + 1).padStart(2, '0')}`,
      `RUN-${edge.id.slice(-4).toUpperCase()}`,
      `${sourceNode?.data.label || 'Unknown'} (${sourceNode?.data.stageZone || 'FOH'})`,
      `${cable?.cableType || 'HDMI'} (${cable?.lengthMeters || 10}m / ${(cable ? cable.lengthMeters * 3.28 : 32.8).toFixed(1)}ft)`,
      `${cable?.calculatedBandwidthGbps || 3.2} Gbps`,
      `${targetNode?.data.label || 'Unknown'} (${targetNode?.data.stageZone || 'Stage'})`,
      cable?.status === 'VALID' ? 'OPTIMAL' : cable?.status === 'WARNING_DISTANCE' ? 'DIST. RISK' : 'ERROR',
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [['Patch #', 'Cable Tag', 'Source Device & Zone', 'Cable Specification & Length', 'Signal Data Rate', 'Destination Sink', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`Xteon_Patch_Sheet_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportEquipmentBomPdf = (nodes: Node<DeviceNodeData>[], edges: Edge<CableEdgeData>[]) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('XTEON PRO AV — EQUIPMENT BILL OF MATERIALS (BOM)', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

  // Group Devices
  const deviceCounts: Record<string, { count: number; category: string; model: string }> = {};
  nodes.forEach((n) => {
    const key = n.data.customModelName || n.data.label;
    if (!deviceCounts[key]) {
      deviceCounts[key] = { count: 1, category: n.data.category, model: n.data.customModelName };
    } else {
      deviceCounts[key].count++;
    }
  });

  const deviceRows = Object.entries(deviceCounts).map(([name, data], idx) => [
    `#${idx + 1}`,
    data.category,
    name,
    data.model,
    `${data.count} units`,
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['Item #', 'Category', 'Device Specification', 'Vendor / Model Reference', 'Quantity Required']],
    body: deviceRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`Xteon_Equipment_BOM_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const downloadProjectJson = (projectData: RigProject) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projectData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `Rig_Project_${new Date().toISOString().slice(0, 10)}.xteon`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
