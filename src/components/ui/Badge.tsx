import type { ReactNode } from 'react';
import { cx } from '../../lib';

export type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'accent';

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('badge', tone === 'ok' && 'badge-ok', tone === 'warn' && 'badge-warn', tone === 'bad' && 'badge-bad', tone === 'accent' && 'badge-accent', className)}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  active: 'ok',
  success: 'ok',
  accepted: 'ok',
  pending: 'neutral',
  suspended: 'bad',
  failure: 'bad',
  revoked: 'bad',
  denied: 'warn',
  expired: 'neutral',
  disabled: 'neutral',
};

/** Badge for a status string, e.g. <StatusBadge status="suspended" />. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{status[0]!.toUpperCase() + status.slice(1)}</Badge>;
}
