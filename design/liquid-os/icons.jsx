// Tiny line-icon set — same 24x24 viewBox, 1.6px strokes. Shared across all 3 directions.
// Only simple primitives; no complex SVG art.

const Icon = ({ name, size = 20, color = 'currentColor', sw = 1.7 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'basket':    return <svg {...common}><path d="M4 9h16l-1.5 9.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5L4 9Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>;
    case 'fork':      return <svg {...common}><path d="M7 3v7a2 2 0 0 0 2 2v9"/><path d="M11 3v7"/><path d="M15 3c-1 2-1 5 0 6l1 1v11"/></svg>;
    case 'bus':       return <svg {...common}><rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 12h16"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/><path d="M8 8h8"/></svg>;
    case 'bag':       return <svg {...common}><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
    case 'home':      return <svg {...common}><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/></svg>;
    case 'bolt':      return <svg {...common}><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/></svg>;
    case 'disc':      return <svg {...common}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/></svg>;
    case 'dots':      return <svg {...common}><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></svg>;
    case 'car':       return <svg {...common}><path d="M5 13 6.5 8h11L19 13"/><path d="M3 17v-4h18v4"/><circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/></svg>;
    case 'pill':      return <svg {...common}><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)"/><path d="M9.6 8.4l5.7 5.7" transform="rotate(-30 12 12)"/></svg>;
    case 'plane':     return <svg {...common}><path d="M3 13 21 6l-7 13-2-6-6-3Z"/></svg>;
    case 'gas':       return <svg {...common}><path d="M5 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15"/><path d="M4 20h12"/><path d="M15 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-2-2"/></svg>;
    case 'arrow-up':  return <svg {...common}><path d="M7 14l5-5 5 5"/></svg>;
    case 'arrow-dn':  return <svg {...common}><path d="M7 10l5 5 5-5"/></svg>;
    case 'arrow-rt':  return <svg {...common}><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>;
    case 'search':    return <svg {...common}><circle cx="11" cy="11" r="6"/><path d="m20 20-4-4"/></svg>;
    case 'filter':    return <svg {...common}><path d="M4 5h16l-6 8v6l-4-2v-4L4 5Z"/></svg>;
    case 'settings':  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2L5 5.9l-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.1 1.2L10 21h4l.5-2.6a7 7 0 0 0 2.1-1.2l2.3.9 2-3.4-2-1.5a7 7 0 0 0 .1-1.2Z"/></svg>;
    case 'shield':    return <svg {...common}><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'chip':      return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M3 10h3M3 14h3M18 10h3M18 14h3M10 3v3M14 3v3M10 18v3M14 18v3"/></svg>;
    case 'wifi-off':  return <svg {...common}><path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.5a10 10 0 0 1 3-2"/><path d="M19 12.5a10 10 0 0 0-8-2.7"/><circle cx="12" cy="20" r="1"/></svg>;
    case 'dot':       return <svg {...common}><circle cx="12" cy="12" r="4" fill={color}/></svg>;
    case 'check':     return <svg {...common}><path d="m5 12 5 5L20 7"/></svg>;
    case 'plus':      return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'chevron':   return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case 'cog':       return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M21 12h-2M5 12H3M18.36 5.64l-1.41 1.41M7.05 16.95l-1.41 1.41M18.36 18.36l-1.41-1.41M7.05 7.05 5.64 5.64"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="4"/></svg>;
  }
};

const CAT_ICON = {
  FOOD_DINING: 'fork', TRANSPORT: 'bus', SHOPPING: 'bag', GROCERIES: 'basket',
  UTILITIES: 'bolt', ENTERTAINMENT: 'disc', HEALTH_MEDICAL: 'pill', TRAVEL: 'plane',
  EDUCATION: 'disc', FUEL: 'gas', ATM_CASH: 'dots', TRANSFER: 'arrow-rt',
  SUBSCRIPTION: 'disc', INSURANCE: 'shield', RENT: 'home', OTHER: 'dots',
};

Object.assign(window, { Icon, CAT_ICON });
