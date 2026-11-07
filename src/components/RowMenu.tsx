import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { DotsIcon } from './ui';

export interface RowMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  hidden?: boolean;
}

/** "⋯" button that opens a small action menu for a table row. */
export function RowMenu({ label, items, footer }: { label: string; items: RowMenuItem[]; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const visible = items.filter((i) => !i.hidden);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!visible.length) return null;
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" className="btn btn-ghost btn-sm" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <DotsIcon />
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 20, width: 240, background: '#fff', border: '1px solid var(--line)', borderRadius: 10, boxShadow: '0 12px 32px rgba(17,18,20,.12)', padding: 6, textAlign: 'left', whiteSpace: 'normal' }}
        >
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="btn btn-ghost btn-block"
              style={{ justifyContent: 'flex-start', color: item.danger ? 'var(--bad)' : undefined, fontWeight: 400 }}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
          {footer && <div className="hint" style={{ padding: '6px 10px 4px' }}>{footer}</div>}
        </div>
      )}
    </div>
  );
}
