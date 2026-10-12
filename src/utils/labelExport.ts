import { RigProject } from '../types';

/**
 * Generates an RFC 4180-compliant CSV specifically formatted for industrial cable label printers:
 * - Brother P-Touch Editor (PT-E550W, PT-D600)
 * - Brady Workstation (BMP21-PLUS, M210, M611)
 * - DYMO Rhino (4200, 5200)
 */
export const generateCableLabelCSV = (project: RigProject): string => {
  const headers = [
    'Line_1_Header',
    'Line_2_Routing',
    'Cable_ID',
    'Source_Device',
    'Source_Port',
    'Target_Device',
    'Target_Port',
    'Signal_Standard',
    'Length_M',
    'Length_FT',
    'Stage_Zone',
    'Wire_Color_Flag',
    'Legal_Notice',
  ];

  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const getSignalStandard = (cableType: string) => {
    switch (cableType) {
      case 'INTERNAL_DISPLAY':
        return 'Internal Bus eDP (40Gbps)';
      case 'HDMI_2_0':
        return '4K60 UHD (18Gbps)';
      case 'HDMI_2_1':
        return '8K60 / 4K120 (48Gbps)';
      case 'DP_1_4':
        return 'DisplayPort 1.4 (32.4Gbps)';
      case 'SDI_3G':
        return '3G-SDI 1080p60';
      case 'SDI_12G':
        return '12G-SDI 4K60 (11.88Gbps)';
      case 'HDBASET_CAT6':
        return 'HDBaseT Cat6A (10.2Gbps)';
      case 'FIBER_HDMI':
        return 'Optical Fiber AOC (48Gbps)';
      case 'WIRELESS':
        return 'Wireless 5GHz / 60GHz';
      default:
        return 'Pro AV Signal';
    }
  };

  const getColorFlag = (cableType: string) => {
    switch (cableType) {
      case 'INTERNAL_DISPLAY':
        return 'CYAN'; // Internal host display
      case 'HDMI_2_0':
      case 'HDMI_2_1':
      case 'FIBER_HDMI':
        return 'ORANGE'; // Standard video signal
      case 'DP_1_4':
        return 'YELLOW'; // Workstation display
      case 'SDI_3G':
      case 'SDI_12G':
        return 'PURPLE'; // Broadcast coaxial SDI
      case 'HDBASET_CAT6':
        return 'BLUE'; // Twisted pair Cat6
      case 'WIRELESS':
        return 'CYAN'; // RF / wireless
      default:
        return 'WHITE';
    }
  };

  const rows = project.edges.map((edge, index) => {
    const srcNode = project.nodes.find((n) => n.id === edge.source);
    const tgtNode = project.nodes.find((n) => n.id === edge.target);

    const cableId = `CBL-${String(index + 1).padStart(3, '0')}`;
    const srcName = srcNode?.data.label || 'Source Workstation';
    const tgtName = tgtNode?.data.label || 'Destination Sink';
    const srcPort = edge.data.sourcePortId || 'Out';
    const tgtPort = edge.data.targetPortId || 'In';
    const cableType = edge.data.cableType || 'HDMI_2_0';
    const signalStd = getSignalStandard(cableType);
    const lengthM = edge.data.lengthMeters || 10;
    const lengthFt = Number((lengthM * 3.28084).toFixed(1));
    const stageZone = tgtNode?.data.stageZone || 'Main Stage';
    const colorFlag = getColorFlag(cableType);

    // Two compact text lines ideal for 18mm/24mm flag and wrap labels:
    const line1 = `${cableId} [${cableType.replace(/_/g, '.')}]`;
    const line2 = `${srcName} -> ${tgtName}`;

    return [
      escapeCSV(line1),
      escapeCSV(line2),
      escapeCSV(cableId),
      escapeCSV(srcName),
      escapeCSV(srcPort),
      escapeCSV(tgtName),
      escapeCSV(tgtPort),
      escapeCSV(signalStd),
      escapeCSV(lengthM),
      escapeCSV(lengthFt),
      escapeCSV(stageZone),
      escapeCSV(colorFlag),
      escapeCSV('Xteon Pro AV CAD (xteon.app)'),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
};

export const downloadCableLabelCSV = (project: RigProject) => {
  const csvContent = generateCableLabelCSV(project);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeTitle = (project.meta?.projectName || 'Xteon_Rig_Plan').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeTitle}_Cable_Labels_Brady_Brother.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
