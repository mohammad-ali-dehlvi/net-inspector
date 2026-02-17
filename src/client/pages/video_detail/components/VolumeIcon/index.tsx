
interface VolumeIconProps {
    volume: number
    muted: boolean
}

export default function VolumeIcon({ volume, muted }: VolumeIconProps) {
  const lvl = muted || volume === 0 ? 0 : volume < 0.4 ? 1 : volume < 0.8 ? 2 : 3;
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {lvl === 0 && (<><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>)}
      {lvl >= 1 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
      {lvl >= 3 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
    </svg>
  );
}