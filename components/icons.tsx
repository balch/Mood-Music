
import React from 'react';

type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const DroneIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 10Q6 4 9 10T15 10Q18 4 21 10" />
    <path d="M3 14Q6 8 9 14T15 14Q18 8 21 14" />
  </svg>
);

export const ParticlesIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <circle cx="6" cy="6" r="1.5" />
    <circle cx="10" cy="10" r="1.2" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="7" cy="16" r="1.3" />
    <circle cx="17" cy="12" r="1.5" />
    <circle cx="13" cy="18" r="1.1" />
  </svg>
);

export const InteractionIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L14.39 8.36L21 9.27L16 14.14L17.24 21.02L12 17.77L6.76 21.02L8 14.14L3 9.27L9.61 8.36L12 2Z" />
  </svg>
);

export const SwooshIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 7c2-4 8-4 10 0s6 10 10 10c4 0 4-6 0-8s-8 4-10 0S3 7 3 7z" />
  </svg>
);

export const BassIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="3" y1="8" x2="21" y2="8" strokeWidth="3" />
    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="4" />
    <line x1="3" y1="16" x2="21" y2="16" strokeWidth="2" />
  </svg>
);

export const LeadIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3L4 21H20L12 3Z" />
  </svg>
);

export const ResonanceIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 9C6 6.79086 7.79086 5 10 5H14C16.2091 5 18 6.79086 18 9V14C18 16.2091 16.2091 18 14 18H10C7.79086 18 6 16.2091 6 14V9Z" />
    <path d="M12 20V18" />
    <path d="M9 22H15" />
  </svg>
);