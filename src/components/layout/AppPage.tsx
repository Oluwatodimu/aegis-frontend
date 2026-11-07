import { Fragment, useEffect, type ReactNode } from 'react';
import { Link, useOutletContext } from 'react-router';
import { cx } from '../../lib';
import { MenuIcon } from '../ui';
import type { ShellContext } from './AppLayout';

export interface Crumb {
  label: string;
  to?: string;
}

/** Top bar with breadcrumbs + the page body. Every signed-in screen uses this. */
export function AppPage({ crumbs, narrow, children, title }: { crumbs: Crumb[]; narrow?: boolean; title: string; children: ReactNode }) {
  const { openMenu } = useOutletContext<ShellContext>();

  useEffect(() => {
    document.title = `${title} · Aegis`;
  }, [title]);

  return (
    <>
      <header className="topbar">
        <div className="row" style={{ ['--gap' as string]: '12px' }}>
          <button type="button" className="btn btn-ghost btn-sm menu-btn" onClick={openMenu} aria-label="Open navigation">
            <MenuIcon />
          </button>
          <nav aria-label="Breadcrumb" className="crumbs">
            {crumbs.map((c, i) => (
              <Fragment key={c.label}>
                {i > 0 && <span aria-hidden="true">/</span>}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page">{c.label}</span>
                ) : c.to ? (
                  <Link to={c.to}>{c.label}</Link>
                ) : (
                  <span>{c.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
        </div>
      </header>
      <main className={cx('page', narrow && 'narrow')}>{children}</main>
    </>
  );
}
