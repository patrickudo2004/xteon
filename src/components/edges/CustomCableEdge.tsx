import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { CableEdgeData } from '../../types';
import { useRigStore } from '../../store/useRigStore';
import { StatusShapeIcon, getPortIcon } from '../common/SvgIcons';
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const CustomCableEdge: React.FC<EdgeProps<any>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { selectElement } = useRigStore();
  const cableData = data as CableEdgeData;

  // Status styling
  let strokeColor = '#10B981'; // Green
  let badgeBg = 'bg-emerald-950/90 border-emerald-600 text-emerald-300';

  if (cableData.status === 'WARNING_DISTANCE') {
    strokeColor = '#F59E0B'; // Amber
    badgeBg = 'bg-amber-950/90 border-amber-600 text-amber-300';
  } else if (cableData.status === 'ERROR_BANDWIDTH') {
    strokeColor = '#EF4444'; // Red
    badgeBg = 'bg-rose-950/90 border-rose-600 text-rose-300';
  }

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path cursor-pointer"
        d={edgePath}
        strokeWidth={selected ? 4 : 2.5}
        stroke={selected ? '#06B6D4' : strokeColor}
        strokeDasharray={cableData.status === 'WARNING_DISTANCE' ? '6 4' : undefined}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          onClick={(e) => {
            e.stopPropagation();
            selectElement('edge', id);
          }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono border shadow-xl cursor-pointer transition-transform hover:scale-110 backdrop-blur-md ${badgeBg} ${
            selected ? 'ring-2 ring-cyan-400' : ''
          }`}
          title={cableData.warningMessage || 'Signal Optimal'}
        >
          {getPortIcon(cableData.cableType, "w-3 h-3")}
          <span>{cableData.lengthMeters}m</span>
          <span className="opacity-40">•</span>
          <span className="font-semibold">{cableData.calculatedBandwidthGbps} Gbps</span>
          <StatusShapeIcon status={cableData.status} className="w-2.5 h-2.5 ml-0.5" />
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
