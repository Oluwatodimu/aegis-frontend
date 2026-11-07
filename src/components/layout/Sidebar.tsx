import { NavLink } from 'react-router';
import { signOut } from '../../api/account';
import { ROLE_LABELS } from '../../api/types';
import { useSession } from '../../auth/session';
import { cx, initials } from '../../lib';
import { ChevronsIcon, Logo } from '../ui';

const NAV: { label: string; items: { to: string; label: string; end?: boolean }[] }[] = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', end: true }] },
  { label: 'Identity', items: [{ to: '/people', label: 'People' }, { to: '/invitations', label: 'Invitations' }] },
  { label: 'Applications', items: [{ to: '/applications', label: 'Connected apps', end: true }, { to: '/applications/new', label: 'Register app' }] },
  { label: 'Access', items: [{ to: '/roles', label: 'Roles & permissions' }] },
  { label: 'Security', items: [{ to: '/audit-logs', label: 'Audit logs' }] },
  { label: 'Developer', items: [{ to: '/developer', label: 'Integration' }] },
  { label: 'Organization', items: [{ to: '/settings', label: 'Settings' }] },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session } = useSession();
  if (!session) return null;

  return (
    <nav aria-label="Primary" className={cx('sidebar', open && 'open')} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <NavLink to="/" className="brand">
        <Logo />
        Aegis
      </NavLink>

      {/* Organization switcher. With several memberships this opens a list. */}
      <button type="button" className="org-switch" aria-label={`Current organization: ${session.organization.name}. Switch organization`}>
        <span className="org-avatar">{initials(session.organization.name)}</span>
        <span className="grow stack" style={{ ['--gap' as string]: '2px' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{session.organization.name}</span>
          <span style={{ fontSize: 11, color: '#9DA1AA' }}>Organization · {ROLE_LABELS[session.role]}</span>
        </span>
        <ChevronsIcon />
      </button>

      <div className="stack" style={{ ['--gap' as string]: '18px' }}>
        {NAV.map((group) => (
          <div key={group.label} className="nav-group">
            <div className="nav-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cx('nav-link', isActive && 'active')}>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-foot">
        <div className="row" style={{ padding: '6px 8px', ['--gap' as string]: '10px', flexWrap: 'nowrap' }}>
          <span className="avatar" style={{ width: 30, height: 30, background: '#2A2D35', color: '#fff' }}>{initials(session.user.name)}</span>
          <span className="grow stack" style={{ ['--gap' as string]: '2px' }}>
            <span style={{ fontSize: 13, color: '#fff' }}>{session.user.name}</span>
            <span style={{ fontSize: 11, color: '#9DA1AA', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</span>
          </span>
        </div>
        <button
          type="button"
          className="nav-link"
          style={{ background: 'none', border: 0, font: 'inherit', fontSize: 13, cursor: 'pointer', width: '100%' }}
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
