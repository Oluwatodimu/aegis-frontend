import type { ReactNode } from 'react';
import { cx } from '../../lib';
import { Button } from './Button';
import { CheckIcon, InfoIcon, WarningIcon } from './Icons';

export function Alert({ tone = 'info', title, children }: { tone?: 'info' | 'ok' | 'warn' | 'bad'; title?: ReactNode; children: ReactNode }) {
  const icon = tone === 'warn' ? <WarningIcon /> : tone === 'bad' ? <WarningIcon color="#A3241A" /> : tone === 'ok' ? <CheckIcon color="#17603C" /> : <InfoIcon />;
  return (
    <div className={cx('alert', `alert-${tone}`)} role={tone === 'bad' ? 'alert' : 'status'}>
      {icon}
      <div className="stack" style={{ ['--gap' as string]: '4px' }}>
        {title && <span className="alert-title">{title}</span>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="muted small">{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="state" role="alert">
      <strong>Couldn’t load this</strong>
      <span className="muted small">{error.message}</span>
      {onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      {icon && (
        <span style={{ width: 44, height: 44, borderRadius: 12, background: '#F0F0ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      )}
      <strong style={{ fontSize: 14 }}>{title}</strong>
      {children && <span className="muted" style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>{children}</span>}
      {action}
    </div>
  );
}

/**
 * Renders loading / error / content for a `useApi` result.
 *   <Async state={members}>{(data) => <Table rows={data.items} />}</Async>
 */
export function Async<T>({ state, children }: { state: { data?: T; error?: Error; loading: boolean; reload: () => void }; children: (data: T) => ReactNode }) {
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data === undefined) return <Loading />;
  return <>{children(state.data)}</>;
}
