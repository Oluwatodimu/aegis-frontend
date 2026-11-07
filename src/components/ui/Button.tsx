import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cx } from '../../lib';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface StyleProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

function classes({ variant = 'secondary', size = 'md', block }: StyleProps, extra?: string) {
  return cx(
    'btn',
    variant === 'primary' && 'btn-primary',
    variant === 'danger' && 'btn-danger',
    variant === 'ghost' && 'btn-ghost',
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg',
    block && 'btn-block',
    extra,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleProps {
  /** Shows "Working…" and disables the button while a request is running. */
  busy?: boolean;
  children: ReactNode;
}

export function Button({ variant, size, block, busy, disabled, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={classes({ variant, size, block }, className)} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy ? 'Working…' : children}
    </button>
  );
}

/** A link that looks like a button (for navigation, not actions). */
export function ButtonLink({ variant, size, block, className, ...rest }: LinkProps & StyleProps) {
  return <Link className={classes({ variant, size, block }, className)} {...rest} />;
}
