import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { listMembers, removeMember, setMembershipStatus } from '../api/people';
import { ROLE_LABELS, type Membership, type Role } from '../api/types';
import { useCan, useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { RowMenu } from '../components/RowMenu';
import { Async, Button, ButtonLink, EmptyState, Modal, PageHeader, StatusBadge, useToast } from '../components/ui';
import { useAction, useApi } from '../hooks/useApi';
import { formatDate, initials } from '../lib';

export function PeoplePage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const canInvite = useCan('members.invite');
  const canManage = useCan('members.remove');
  const canChangeRole = useCan('members.role.write');

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<Membership['status'] | ''>('');
  const [page, setPage] = useState(1);
  const members = useApi(() => listMembers({ search, role, status, page }), [search, role, status, page]);

  const [confirm, setConfirm] = useState<{ kind: 'suspend' | 'restore' | 'remove'; member: Membership } | null>(null);
  const statusAction = useAction(setMembershipStatus);
  const removeAction = useAction(removeMember);

  const applyConfirm = async () => {
    if (!confirm) return;
    const { kind, member } = confirm;
    const result = kind === 'remove' ? await removeAction.run(member.id) : await statusAction.run(member.id, kind === 'suspend' ? 'suspended' : 'active');
    if (!result.ok) return;
    toast(kind === 'remove' ? `${member.person.name} removed from ${session!.organization.name}` : kind === 'suspend' ? 'Membership suspended' : 'Membership restored');
    setConfirm(null);
    members.reload();
  };

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <AppPage title="People" crumbs={[{ label: session!.organization.name, to: '/' }, { label: 'Identity' }, { label: 'People' }]}>
      <PageHeader
        title="People"
        description={`Members of ${session!.organization.name}. Roles and status here apply to this organization only — a person’s Aegis account may also belong to other organizations.`}
        actions={canInvite && <ButtonLink to="/invitations" variant="primary">Invite member</ButtonLink>}
      />

      <div className="row" role="search">
        <label className="sr-only" htmlFor="people-search">Search people</label>
        <input id="people-search" className="input" style={{ width: 300, maxWidth: '100%' }} placeholder="Search by name or email" value={search} onChange={(e) => resetPage(setSearch)(e.target.value)} />
        <label className="sr-only" htmlFor="people-role">Role</label>
        <select id="people-role" className="select" style={{ width: 'auto' }} value={role} onChange={(e) => resetPage(setRole)(e.target.value as Role | '')}>
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="sr-only" htmlFor="people-status">Status</label>
        <select id="people-status" className="select" style={{ width: 'auto' }} value={status} onChange={(e) => resetPage(setStatus)(e.target.value as Membership['status'] | '')}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        {members.data && <span className="muted" style={{ marginLeft: 'auto', fontSize: 13 }}>{members.data.total} members</span>}
      </div>

      <div className="card">
        <Async state={members}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState title="No one matches these filters">Try a different name, role or status.</EmptyState>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Status</th><th scope="col">Organization role</th><th scope="col">Other orgs</th><th scope="col">Date added</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
                    </thead>
                    <tbody>
                      {data.items.map((m) => {
                        const isOwner = m.role === 'owner';
                        return (
                          <tr key={m.id}>
                            <td><Link to={`/people/${m.id}`} className="cell-link"><span className="avatar">{initials(m.person.name)}</span>{m.person.name}</Link></td>
                            <td className="muted">{m.person.email}</td>
                            <td><StatusBadge status={m.status} /></td>
                            <td>{ROLE_LABELS[m.role]}</td>
                            <td className="muted">{m.person.otherOrganizationCount || '—'}</td>
                            <td className="mono small muted">{formatDate(m.joinedAt)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <RowMenu
                                label={`Actions for ${m.person.name}`}
                                items={[
                                  { label: 'View person', onSelect: () => navigate(`/people/${m.id}`) },
                                  { label: 'Change membership role…', onSelect: () => navigate(`/people/${m.id}?changeRole=1`), hidden: !canChangeRole || isOwner },
                                  { label: 'Suspend membership', onSelect: () => setConfirm({ kind: 'suspend', member: m }), hidden: !canManage || isOwner || m.status === 'suspended' },
                                  { label: 'Restore membership', onSelect: () => setConfirm({ kind: 'restore', member: m }), hidden: !canManage || m.status === 'active' },
                                  { label: `Remove from ${session!.organization.name}`, danger: true, onSelect: () => setConfirm({ kind: 'remove', member: m }), hidden: !canManage || isOwner },
                                ]}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="table-foot">
                  <span>Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}</span>
                  <div className="row">
                    <Button size="sm" disabled={data.page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button size="sm" disabled={data.page * data.pageSize >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </>
            )
          }
        </Async>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.kind === 'remove' ? `Remove ${confirm.member.person.name}?` : confirm?.kind === 'suspend' ? `Suspend ${confirm.member.person.name}?` : `Restore ${confirm?.member.person.name}?`
        }
        description={
          confirm?.kind === 'remove'
            ? `They lose access to ${session!.organization.name} and its applications. Their Aegis account is not deleted, and they stay in any other organizations.`
            : confirm?.kind === 'suspend'
              ? 'They can’t sign in to this organization’s applications until restored. Their role is kept.'
              : 'They’ll be able to sign in again with their existing role.'
        }
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant={confirm?.kind === 'restore' ? 'primary' : 'danger'} busy={statusAction.busy || removeAction.busy} onClick={applyConfirm}>
              {confirm?.kind === 'remove' ? 'Remove member' : confirm?.kind === 'suspend' ? 'Suspend' : 'Restore'}
            </Button>
          </>
        }
      >
        {(statusAction.error || removeAction.error) && <p className="error-text">{statusAction.error ?? removeAction.error}</p>}
      </Modal>
    </AppPage>
  );
}
