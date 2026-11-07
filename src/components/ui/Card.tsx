import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib';

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  /** Shown on the right of the header (a link, badge or button). */
  actions?: ReactNode;
  padded?: boolean;
  dashed?: boolean;
}

export function Card({ title, description, actions, padded, dashed, className, children, ...rest }: CardProps) {
  return (
    <section className={cx('card', dashed && 'dashed', className)} {...rest}>
      {(title || actions) && (
        <div className="card-head">
          {title && <h2 className="section-title">{title}</h2>}
          {actions}
          {description && <p className="hint">{description}</p>}
        </div>
      )}
      {padded ? <div className="card-pad stack">{children}</div> : children}
    </section>
  );
}

/** Label/value row inside a settings card. */
export function CardRow({ label, htmlFor, children }: { label: ReactNode; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="card-row">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}
      <div>{children}</div>
    </div>
  );
}

export function Stat({ label, value, note, noteTone }: { label: string; value: ReactNode; note?: ReactNode; noteTone?: 'warn' }) {
  return (
    <div className="card stat">
      <span className="muted" style={{ fontSize: 13 }}>{label}</span>
      <span className="stat-value">{value}</span>
      {note && <span className="small" style={{ color: noteTone === 'warn' ? 'var(--warn)' : 'var(--muted)' }}>{note}</span>}
    </div>
  );
}
