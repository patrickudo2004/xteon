import { RigProject } from '../types';

export function generateCablePullListCSV(project: RigProject): string {
  const headers = [
    'Cable ID',
    'Source Device',
    'Source Port',
    'Source Zone',
    'Destination Device',
    'Destination Port',
    'Destination Zone',
    'Cable Standard',
    'Length (m)',
    'Length (ft)',
    'Bandwidth (Gbps)',
    'Max Port (Gbps)',
    'Signal Format',
    'Signal Status',
    'Notes',
  ];

  const rows = project.edges.map((edge) => {
    const data = edge.data;
    const sourceNode = project.nodes.find((n) => n.id === edge.source);
    const targetNode = project.nodes.find((n) => n.id === edge.target);

    const sourcePort = sourceNode?.data?.outputPorts?.find((p) => p.id === edge.sourceHandle);
    const targetPort = targetNode?.data?.inputPorts?.find((p) => p.id === edge.targetHandle);

    const lengthM = data?.lengthMeters ?? 10;
    const lengthFt = Math.round(lengthM * 3.28084 * 10) / 10;
    const bandwidthGbps = data?.calculatedBandwidthGbps?.toFixed(2) ?? 'N/A';
    const signalStatus = data?.status ?? 'VALID';
    const notes = data?.warningMessage || 'Signal nominal';

    const cleanField = (val: string | number | undefined) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const resW = sourceNode?.data?.resolution?.width || 1920;
    const resH = sourceNode?.data?.resolution?.height || 1080;
    const fps = sourceNode?.data?.refreshRateHz || 60;

    return [
      cleanField(edge.id),
      cleanField(sourceNode?.data?.label || edge.source),
      cleanField(sourcePort?.name || edge.sourceHandle || 'Output'),
      cleanField(sourceNode?.data?.stageZone || 'FOH'),
      cleanField(targetNode?.data?.label || edge.target),
      cleanField(targetPort?.name || edge.targetHandle || 'Input'),
      cleanField(targetNode?.data?.stageZone || 'Stage'),
      cleanField(data?.cableType?.replace(/_/g, ' ') || 'HDMI 2.0'),
      cleanField(lengthM),
      cleanField(lengthFt),
      cleanField(bandwidthGbps),
      cleanField(sourcePort?.maxBandwidthGbps || 18.0),
      cleanField(`${resW}x${resH} @ ${fps}Hz`),
      cleanField(signalStatus),
      cleanField(notes),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function downloadCablePullListCSV(project: RigProject): void {
  const csvContent = generateCablePullListCSV(project);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeTitle = (project.meta?.projectName || 'Xteon_Rig').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeTitle}_Cable_Pull_List_${new Date().toISOString().split('T')[0]}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
