import { listMembers } from '../api/people';
import { ROLE_LABELS, type Role } from '../api/types';
import { PERMISSIONS, ROLE_DESCRIPTIONS, can } from '../auth/permissions';
import { useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { Badge, Card, PageHeader } from '../components/ui';
import { useApi } from '../hooks/useApi';

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export function RolesPage() {
  const { session } = useSession();
  // Count members per role (pageSize large enough to read everyone).
  const members = useApi(() => listMembers({ pageSize: 1000 }), []);
  const count = (r: Role) => members.data?.items.filter((m) => m.role === r).length;

  return (
    <AppPage title="Roles & permissions" crumbs={[{ label: session!.organization.name, to: '/' }, { label: 'Access' }, { label: 'Roles & permissions' }]}>
      <PageHeader
        title="Roles & permissions"
        description={<>Every role is scoped to <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{session!.organization.name}</strong>. A person who is an Administrator here has no extra rights in any other organization.</>}
      />

      <div className="grid-auto">
        {ROLES.map((r) => (
          <div key={r} className="card card-pad stack" style={{ ['--gap' as string]: '8px' }}>
            <div className="row spread">
              <span style={{ fontSize: 15, fontWeight: 600 }}>{ROLE_LABELS[r]}</span>
              <Badge>{count(r) ?? '…'} {count(r) === 1 ? 'member' : 'members'}</Badge>
            </div>
            <span className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{ROLE_DESCRIPTIONS[r]}</span>
            <span className="mono small muted">org:{r}</span>
          </div>
        ))}
      </div>

      <Card title="Permission matrix" actions={<Badge>Predefined roles · custom roles coming later</Badge>}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Permission</th>
                {ROLES.map((r) => <th key={r} scope="col" style={{ textAlign: 'center' }}>{ROLE_LABELS[r]}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((group) => [
                <tr key={group.group}>
                  <td colSpan={ROLES.length + 1} className="eyebrow" style={{ background: 'var(--surface-2)', fontSize: 11, padding: '8px 16px' }}>{group.group}</td>
                </tr>,
                ...group.items.map((p) => (
                  <tr key={p.key}>
                    <th scope="row" style={{ background: 'var(--surface)', color: 'var(--ink)', fontWeight: 400, fontSize: 13 }}>
                      {p.label}
                      <span className="mono small muted" style={{ display: 'block', marginTop: 2 }}>{p.key}</span>
                    </th>
                    {ROLES.map((r) => (
                      <td key={r} style={{ textAlign: 'center' }}>
                        {can(r, p.key) ? (
                          <svg role="img" aria-label="Allowed" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="#2B45D4" /><path d="m5.5 9.2 2.3 2.3 4.7-5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        ) : (
                          <svg role="img" aria-label="Not allowed" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 9h8" stroke="#B9BBC0" strokeWidth="1.6" strokeLinecap="round" /></svg>
                        )}
                      </td>
                    ))}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="hint">Permissions are enforced by the Aegis API on every request. The dashboard hides actions you can’t perform, but never relies on that for security.</p>
    </AppPage>
  );
}
