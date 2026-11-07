/** Inline SVG icons. Decorative icons are hidden from screen readers. */

export function Logo({ size = 22, accent = '#8FA0FF', stroke = '#FFFFFF' }: { size?: number; accent?: string; stroke?: string }) {
  return (
    <svg width={size} height={(size * 24) / 22} viewBox="0 0 22 24" fill="none" aria-hidden="true">
      <path d="M11 1.5 20 5v6.5c0 5.4-3.7 9.6-9 11-5.3-1.4-9-5.6-9-11V5l9-3.5Z" stroke={stroke} strokeWidth="1.6" />
      <path d="M11 6.5v11M6.5 9.5 11 12l4.5-2.5" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ color = 'currentColor', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3 8.5 3 3 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarningIcon({ color = '#7A4E00' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flex: 'none', marginTop: 1 }}>
      <path d="M10 2.5 18 17H2L10 2.5Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 8v4M10 14.5v.01" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flex: 'none', marginTop: 1 }}>
      <circle cx="10" cy="10" r="8" stroke="#2B45D4" strokeWidth="1.5" />
      <path d="M10 9v5M10 6.2v.01" stroke="#2B45D4" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="3.5" cy="8" r="1.3" fill="#5B5F66" />
      <circle cx="8" cy="8" r="1.3" fill="#5B5F66" />
      <circle cx="12.5" cy="8" r="1.3" fill="#5B5F66" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m5 6 3-3 3 3M5 10l3 3 3-3" stroke="#9DA1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="#2B45D4" strokeWidth="1.6" />
      <path d="m4 7 8 6 8-6" stroke="#2B45D4" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function AppsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="#5B5F66" strokeWidth="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="#5B5F66" strokeWidth="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="#5B5F66" strokeWidth="1.5" />
      <path d="M17 14v6M14 17h6" stroke="#5B5F66" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
