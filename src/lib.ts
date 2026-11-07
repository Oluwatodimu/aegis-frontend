/** Small helpers used across screens. */

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const stampFmt = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatStamp = (iso: string) => stampFmt.format(new Date(iso)).replace(',', '');

/** "09:42" today, "Yesterday", or "29 Oct". */
export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return timeFmt.format(d);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(d);
}

/** "in 6 h", "in 3 days", or "expired". */
export function formatExpiry(iso: string): { text: string; soon: boolean } {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { text: 'Expired', soon: true };
  const hours = Math.round(ms / 3_600_000);
  if (hours < 48) return { text: `in ${hours} h`, soon: true };
  return { text: `in ${Math.round(hours / 24)} days`, soon: false };
}

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
