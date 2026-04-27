import React from 'react';
import Svg, { Circle, Path, Rect, Line, Polyline } from 'react-native-svg';

const common = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

type IconName = keyof typeof ICON_PATHS;

const ICON_PATHS = {
  basket: (<><Path d="M4 9h16l-1.5 9.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5L4 9Z"/><Path d="M9 9V6a3 3 0 0 1 6 0v3"/></>),
  fork: (<><Path d="M7 3v7a2 2 0 0 0 2 2v9"/><Path d="M11 3v7"/><Path d="M15 3c-1 2-1 5 0 6l1 1v11"/></>),
  bus: (<><Rect x="4" y="4" width="16" height="13" rx="2"/><Path d="M4 12h16"/><Circle cx="8" cy="18" r="1.5"/><Circle cx="16" cy="18" r="1.5"/><Path d="M8 8h8"/></>),
  bag: (<><Path d="M5 8h14l-1 12H6L5 8Z"/><Path d="M9 8V6a3 3 0 0 1 6 0v2"/></>),
  home: (<><Path d="M4 11 12 4l8 7"/><Path d="M6 10v10h12V10"/></>),
  bolt: <Path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>,
  disc: (<><Circle cx="12" cy="12" r="8"/><Circle cx="12" cy="12" r="2"/></>),
  dots: (<><Circle cx="6" cy="12" r="1" fill="currentColor"/><Circle cx="12" cy="12" r="1" fill="currentColor"/><Circle cx="18" cy="12" r="1" fill="currentColor"/></>),
  chip: (<><Rect x="6" y="6" width="12" height="12" rx="2"/><Rect x="9" y="9" width="6" height="6"/><Path d="M3 10h3M3 14h3M18 10h3M18 14h3M10 3v3M14 3v3M10 18v3M14 18v3"/></>),
  shield: (<><Path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"/><Path d="m9 12 2 2 4-4"/></>),
  search: (<><Circle cx="11" cy="11" r="6"/><Path d="m20 20-4-4"/></>),
  filter: <Path d="M4 5h16l-6 8v6l-4-2v-4L4 5Z"/>,
  cog: (<><Path d="M9.6 3.2a1 1 0 0 1 .9-.7h3a1 1 0 0 1 .9.7l.3 1.7c.55.2 1.07.5 1.5.85l1.6-.6a1 1 0 0 1 1.1.4l1.5 2.6a1 1 0 0 1-.2 1.2l-1.3 1.1c.05.32.1.65.1 1s-.05.68-.1 1l1.3 1.1a1 1 0 0 1 .2 1.2l-1.5 2.6a1 1 0 0 1-1.1.4l-1.6-.6c-.43.35-.95.65-1.5.85l-.3 1.7a1 1 0 0 1-.9.7h-3a1 1 0 0 1-.9-.7l-.3-1.7c-.55-.2-1.07-.5-1.5-.85l-1.6.6a1 1 0 0 1-1.1-.4l-1.5-2.6a1 1 0 0 1 .2-1.2l1.3-1.1c-.05-.32-.1-.65-.1-1s.05-.68.1-1l-1.3-1.1a1 1 0 0 1-.2-1.2l1.5-2.6a1 1 0 0 1 1.1-.4l1.6.6c.43-.35.95-.65 1.5-.85l.3-1.7Z"/><Circle cx="12" cy="12" r="3"/></>),
  plane: <Path d="M3 13 21 6l-7 13-2-6-6-3Z"/>,
  gas: (<><Path d="M5 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15"/><Path d="M4 20h12"/><Path d="M15 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-2-2"/></>),
  pill: (<><Rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)"/><Path d="M9.6 8.4l5.7 5.7" transform="rotate(-30 12 12)"/></>),
  car: (<><Path d="M5 13 6.5 8h11L19 13"/><Path d="M3 17v-4h18v4"/><Circle cx="7" cy="17" r="1.5"/><Circle cx="17" cy="17" r="1.5"/></>),
  check: <Path d="m5 12 5 5L20 7"/>,
  chevron: <Path d="m9 6 6 6-6 6"/>,
  plus: (<><Path d="M12 5v14M5 12h14"/></>),
  arrowRt: (<><Path d="M5 12h14"/><Path d="M13 6l6 6-6 6"/></>),
  sun: (<><Circle cx="12" cy="12" r="5"/><Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>),
  moon: <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>,
  wifiOff: (<><Path d="M3 3l18 18"/><Path d="M8.5 16.5a5 5 0 0 1 7 0"/><Path d="M5 12.5a10 10 0 0 1 3-2"/><Path d="M19 12.5a10 10 0 0 0-8-2.7"/><Circle cx="12" cy="20" r="1"/></>),
  refresh: (<><Path d="M1 4v6h6"/><Path d="M23 20v-6h-6"/><Path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/></>),
  star: <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z"/>,
  target: (<><Circle cx="12" cy="12" r="10"/><Circle cx="12" cy="12" r="6"/><Circle cx="12" cy="12" r="2"/></>),
  trash: (<><Path d="M4 7h16"/><Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><Path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><Path d="M10 11v7M14 11v7"/></>),
  download: (<><Path d="M12 3v13"/><Path d="m6 11 6 6 6-6"/><Path d="M4 21h16"/></>),
  upload: (<><Path d="M12 21V8"/><Path d="m6 13 6-6 6 6"/><Path d="M4 4h16"/></>),
  close: <Path d="M6 6l12 12M18 6 6 18"/>,
  book: (<><Path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"/><Path d="M5 17a3 3 0 0 1 3-3h11"/></>),
  play: <Path d="M7 5v14l12-7L7 5Z"/>,
  repeat: (<><Path d="M3 12a9 9 0 0 1 14.5-7L20 7"/><Path d="M20 3v4h-4"/><Path d="M21 12a9 9 0 0 1-14.5 7L4 17"/><Path d="M4 21v-4h4"/></>),
  document: (<><Path d="M7 3h7l5 5v13H7V3Z"/><Path d="M14 3v5h5"/><Path d="M9 13h6M9 16h6M9 10h3"/></>),
  arrowUpDown: (<><Path d="M7 4v16"/><Path d="m3 8 4-4 4 4"/><Path d="M17 20V4"/><Path d="m13 16 4 4 4-4"/></>),
  flag: (<><Path d="M5 21V4"/><Path d="M5 4h11l-2 4 2 4H5"/></>),
};

export type { IconName };

export const CAT_ICON: Record<string, IconName> = {
  FOOD_DINING: 'fork', TRANSPORT: 'bus', SHOPPING: 'bag', GROCERIES: 'basket',
  UTILITIES: 'bolt', ENTERTAINMENT: 'play', HEALTH_MEDICAL: 'pill', TRAVEL: 'plane',
  EDUCATION: 'book', FUEL: 'gas', ATM_CASH: 'dots', TRANSFER: 'arrowRt',
  SUBSCRIPTION: 'repeat', INSURANCE: 'shield', RENT: 'home', OTHER: 'dots',
};

export default function LiquidIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.7, style }: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
}) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;
  return (
    <Svg width={size} height={size} {...common} stroke={color} strokeWidth={strokeWidth} style={style}>
      {paths}
    </Svg>
  );
}
