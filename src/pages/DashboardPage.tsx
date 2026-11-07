import { Link } from 'react-router';
import { getDashboard } from '../api/dashboard';
import { useCan, useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { Async, Badge, ButtonLink, Card, PageHeader, Stat } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { formatRelative, initials } from '../lib';

export function DashboardPage() {
  const { session } = useSession();
  const summary = useApi(getDashboard);
  const canInvite = useCan('members.invite');
  const canApps = useCan('apps.write');

  return (
    <AppPage title="Overview" crumbs={[{ label: session!.organization.name, to: '/' }, { label: 'Overview' }]}>
      <PageHeader
        title="Overview"
        description={<>Identity environment for {session!.organization.name} · Realm <span className="mono" style={{ color: 'var(--ink)' }}>{session!.organization.slug}</span></>}
        actions={
          <>
            {canApps && <ButtonLink to="/applications/new">Register app</ButtonLink>}
            {canInvite && <ButtonLink to="/invitations" variant="primary">Invite member</ButtonLink>}
          </>
        }
      />

      <Async state={summary}>
        {(d) => (
          <>
            <div className="grid-auto" style={{ ['--min' as string]: '200px' }}>
              <Stat label="Total members" value={d.totalMembers} note={`${d.suspendedMembers} suspended`} />
              <Stat label="Active members" value={d.activeMembers} note="Can sign in today" />
              <Stat label="Pending invitations" value={d.pendingInvitations} note={d.invitationsExpiringSoon ? `${d.invitationsExpiringSoon} expire within 48h` : 'None expiring soon'} noteTone={d.invitationsExpiringSoon ? 'warn' : undefined} />
              <Stat label="Applications" value={d.applications} note={`${d.activeApplications} active · ${d.applications - d.activeApplications} disabled`} />
            </div>

            <div className="split">
              <Card className="main" title="Recent administrative activity" actions={<Link to="/audit-logs" style={{ fontSize: 13 }}>View audit log</Link>}>
                {d.recentActivity.map((e) => (
                  <div key={e.id} className="row" style={{ padding: '13px 20px', borderBottom: '1px solid #F1F1EE', flexWrap: 'nowrap', ['--gap' as string]: '14px' }}>
                    <span className="avatar" style={{ width: 30, height: 30, borderRadius: 15 }}>{e.actor === 'System' ? 'SY' : initials(e.actor)}</span>
                    <div className="grow" style={{ fontSize: 13, lineHeight: 1.45 }}>
                      <strong style={{ fontWeight: 500 }}>{e.actor}</strong> <span className="code-chip">{e.action}</span> {e.target}
                    </div>
                    <span className="mono small muted" style={{ whiteSpace: 'nowrap' }}>{formatRelative(e.at)}</span>
                  </div>
                ))}
              </Card>

              <div className="side stack">
                <Card
                  title="Security events"
                  actions={d.alerts.some((a) => a.severity === 'high') && <Badge tone="bad">{d.alerts.filter((a) => a.severity === 'high').length} need review</Badge>}
                >
                  {d.alerts.length === 0 && <p className="card-pad muted">No security events. You’re all set.</p>}
                  {d.alerts.map((a) => (
                    <div key={a.id} className="row" style={{ padding: '14px 20px', borderBottom: '1px solid #F1F1EE', alignItems: 'flex-start', flexWrap: 'nowrap', ['--gap' as string]: '12px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, flex: 'none', background: a.severity === 'high' ? '#C9372C' : '#9DA1AA' }} aria-hidden="true" />
                      <div className="stack" style={{ ['--gap' as string]: '4px', fontSize: 13 }}>
                        <span style={{ fontWeight: 500 }}>{a.title}</span>
                        <span className="muted">{a.detail}</span>
                      </div>
                    </div>
                  ))}
                </Card>
                <SetupChecklist members={d.totalMembers} apps={d.applications} />
              </div>
            </div>
          </>
        )}
      </Async>
    </AppPage>
  );
}

/** Guides new organizations; disappears once everything is done. */
function SetupChecklist({ members, apps }: { members: number; apps: number }) {
  const steps = [
    { label: 'Create business', done: true, to: '/settings' },
    { label: 'Invite your first teammate', done: members > 1, to: '/invitations' },
    { label: 'Register an application', done: apps > 0, to: '/applications/new' },
    { label: 'Read the integration guide', done: apps > 0, to: '/developer' },
    { label: 'Require MFA for administrators', done: false, to: '/settings' },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <Card padded title="Setup" actions={<span className="small muted">{done} of {steps.length} done</span>}>
      <div className="progress" aria-hidden="true"><span style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, ['--gap' as string]: '10px', fontSize: 13 }}>
        {steps.map((s) => (
          <li key={s.label}>
            {s.done ? <span className="muted" style={{ textDecoration: 'line-through' }}>{s.label}</span> : <Link to={s.to} style={{ fontWeight: 500 }}>{s.label} →</Link>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
