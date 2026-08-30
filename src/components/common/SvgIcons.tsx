import React from 'react';
import { PortType } from '../../types';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// 1. HDMI Connector SVG (Chamfered Trapezoid with internal contacts)
export const HdmiIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path 
      d="M4 6H20V12L17 18H7L4 12V6Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinejoin="round"
      className="fill-current/10"
    />
    <path d="M7 10H17M8 14H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 2. DisplayPort Connector SVG (Asymmetric single-notched housing)
export const DisplayPortIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path 
      d="M4 6H20V14L16 18H4V6Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinejoin="round"
      className="fill-current/10"
    />
    <path d="M7 10H17M7 14H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 3. BNC / SDI Connector SVG (Coaxial Bayonet Lug Barrel)
export const SdiBncIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" className="fill-current/10" />
    <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.5" fill={color} />
    <path d="M3 12H5M19 12H21M12 3V5M12 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 4. EtherCON / RJ45 Connector SVG (Industrial Latch Housing)
export const EtherConIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" className="fill-current/10" />
    <path d="M8 4V8H16V4" stroke={color} strokeWidth="1.5" />
    <path d="M7 14H9M11 14H13M15 14H17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M9 18H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 5. opticalCON / Fiber Duplex SVG (LC Duplex Ferrule)
export const FiberOpticIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="2" className="fill-current/10" />
    <circle cx="8.5" cy="12" r="2.5" stroke={color} strokeWidth="1.5" />
    <circle cx="8.5" cy="12" r="1" fill={color} />
    <circle cx="15.5" cy="12" r="2.5" stroke={color} strokeWidth="1.5" />
    <circle cx="15.5" cy="12" r="1" fill={color} />
    <path d="M12 5V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 6. USB-C / Thunderbolt Stadium Pill SVG
export const UsbCIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="7" width="18" height="10" rx="5" stroke={color} strokeWidth="2" className="fill-current/10" />
    <rect x="7" y="11" width="10" height="2" rx="1" fill={color} />
  </svg>
);

// 7. Legacy VGA / DVI Connector SVG
export const LegacyVgaIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 6H20L18 18H6L4 6Z" stroke={color} strokeWidth="2" strokeLinejoin="round" className="fill-current/10" />
    <circle cx="8" cy="10" r="1" fill={color} />
    <circle cx="12" cy="10" r="1" fill={color} />
    <circle cx="16" cy="10" r="1" fill={color} />
    <circle cx="9" cy="13" r="1" fill={color} />
    <circle cx="13" cy="13" r="1" fill={color} />
    <circle cx="17" cy="13" r="1" fill={color} />
  </svg>
);

export const WirelessPortIcon: React.FC<IconProps> = ({ className, size = 16, color = '#38BDF8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 20H12.01" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M8.5 16.5C10.4 14.6 13.6 14.6 15.5 16.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M5 13C8.9 9.1 15.1 9.1 19 13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M1.5 9.5C7.3 3.7 16.7 3.7 22.5 9.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Helper function to return the correct SVG icon for any PortType
export const getPortIcon = (type: PortType, className = "w-4 h-4", size = 16) => {
  switch (type) {
    case 'HDMI_2_0':
    case 'HDMI_2_1':
      return <HdmiIcon className={className} size={size} color="#A78BFA" />;
    case 'DP_1_4':
    case 'DP_2_0':
      return <DisplayPortIcon className={className} size={size} color="#60A5FA" />;
    case 'SDI_3G':
    case 'SDI_12G':
      return <SdiBncIcon className={className} size={size} color="#F472B6" />;
    case 'HDBASET_CAT6':
    case 'NDI_GBE':
      return <EtherConIcon className={className} size={size} color="#34D399" />;
    case 'FIBER_HDMI':
      return <FiberOpticIcon className={className} size={size} color="#FB923C" />;
    case 'USB_C_DP':
      return <UsbCIcon className={className} size={size} color="#22D3EE" />;
    case 'WIRELESS':
    case 'VIRTUAL':
      return <WirelessPortIcon className={className} size={size} color="#38BDF8" />;
    case 'VGA_LEGACY':
    default:
      return <LegacyVgaIcon className={className} size={size} color="#94A3B8" />;
  }
};

// Color-blind accessible geometric status icons
export const StatusShapeIcon: React.FC<{ status: 'VALID' | 'WARNING_DISTANCE' | 'ERROR_BANDWIDTH' | 'ONLINE' | 'STANDBY' | 'DISCONNECTED'; className?: string }> = ({ status, className = "w-3.5 h-3.5" }) => {
  if (status === 'VALID' || status === 'ONLINE') {
    return (
      <svg viewBox="0 0 16 16" fill="currentColor" className={`text-emerald-400 ${className}`}>
        <circle cx="8" cy="8" r="6" />
      </svg>
    );
  }
  if (status === 'WARNING_DISTANCE' || status === 'STANDBY') {
    return (
      <svg viewBox="0 0 16 16" fill="currentColor" className={`text-amber-400 ${className}`}>
        <path d="M8 2L15 14H1L8 2Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={`text-rose-500 ${className}`}>
      <polygon points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5" />
    </svg>
  );
};
