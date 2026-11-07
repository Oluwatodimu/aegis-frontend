import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { listApplications } from '../api/applications';
import { changeRole, getMember, setMembershipStatus } from '../api/people';
import { ROLE_LABELS, type Membership, type Role } from '../api/types';
import { ROLE_DESCRIPTIONS, ROLE_PERMISSIONS, PERMISSIONS } from '../auth/permissions';
import { useCan, useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { Alert, Async, Badge, Button, Card, CardRow, Modal, StatusBadge, useToast } from '../components/ui';
import { useAction, useApi } from '../hooks/useApi';
import { formatDate, formatRelative, initials } from '../lib';

const MFA_LABELS = { none: 'Not set up', totp: 'Authenticator app', passkey: 'Passkey' } as const;

export function PersonDetailPage() {
  const { id = '' } = useParams();
  const { session } = useSession();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const member = useApi(() => getMember(id), [id]);
  const apps = useApi(listApplications);
  const canChangeRole = useCan('members.role.write');
  const canSuspend = useCan('members.remove');
  const statusAction = useAction(setMembershipStatus);

  const roleModalOpen = params.get('changeRole') === '1';
  const closeRoleModal = () => setParams({}, { replace: true });

  const toggleStatus = async (m: Membership) => {
    const result = await statusAction.run(m.id, m.status === 'active' ? 'suspended' : 'active');
    if (result.ok) {
      toast(result.value.status === 'suspended' ? 'Membership suspended' : 'Membership restored');
      member.reload();
    }
  };

  const name = member.data?.person.name ?? 'Person';

  return (
    <AppPage title={name} crumbs={[{ label: 'People', to: '/people' }, { label: name }]}>
      <Async state={member}>
        {(m) => {
          const isOwner = m.role === 'owner';
          const appNames = (apps.data ?? []).filter((a) => m.applicationIds.includes(a.id)).map((a) => a.name);
          return (
            <>
              <div className="row" style={{ ['--gap' as string]: '16px' }}>
                <span className="avatar avatar-lg">{initials(m.person.name)}</span>
                <div className="grow stack" style={{ ['--gap' as string]: '6px' }}>
                  <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{m.person.name}</h1>
                  <div className="row muted" style={{ fontSize: 13 }}>
                    {m.person.email} <StatusBadge status={m.status} /> <Badge tone="accent">{ROLE_LABELS[m.role]}</Badge>
                  </div>
                </div>
                {!isOwner && (
                  <div className="row">
                    {canSuspend && <Button busy={statusAction.busy} onClick={() => toggleStatus(m)}>{m.status === 'active' ? 'Suspend membership' : 'Restore membership'}</Button>}
                    {canChangeRole && <Button variant="primary" onClick={() => setParams({ changeRole: '1' })}>Change role</Button>}
                  </div>
                )}
              </div>
              {statusAction.error && <Alert tone="bad">{statusAction.error}</Alert>}

              <div className="split">
                <Card
                  className="main"
                  title={<span className="row"><Badge tone="accent">Organization-scoped</Badge> Membership in {session!.organization.name}</span>}
                  description={`You can change these. They affect access to ${session!.organization.name} only.`}
                >
                  <CardRow label="Role">{ROLE_LABELS[m.role]}</CardRow>
                  <CardRow label="Membership status"><StatusBadge status={m.status} /></CardRow>
                  <CardRow label="Joined">{formatDate(m.joinedAt)}{m.invitedBy && ` · invited by ${m.invitedBy}`}</CardRow>
                  <CardRow label="Application access">
                    <div className="row">{appNames.length ? appNames.map((n) => <Badge key={n}>{n}</Badge>) : <span className="muted">None</span>}</div>
                  </CardRow>
                </Card>

                <Card
                  className="side dashed"
                  title={<span className="row"><Badge>Global</Badge> Aegis account</span>}
                  description="The person’s identity across Aegis. Managed by them — read-only for organization admins."
                >
                  <CardRow label="User ID"><span className="mono small">{m.person.id}</span></CardRow>
                  <CardRow label="Email">{m.person.emailVerified ? 'Verified' : 'Not verified'}</CardRow>
                  <CardRow label="Multi-factor auth"><Badge tone={m.person.mfa === 'none' ? 'warn' : 'ok'}>{MFA_LABELS[m.person.mfa]}</Badge></CardRow>
                  <CardRow label="Last sign-in">{m.person.lastSignInAt ? formatRelative(m.person.lastSignInAt) : 'Never'}</CardRow>
                  <CardRow label="Organizations">
                    {session!.organization.name}{m.person.otherOrganizationCount ? ` + ${m.person.otherOrganizationCount} other${m.person.otherOrganizationCount > 1 ? 's' : ''}` : ''}
                    {m.person.otherOrganizationCount > 0 && <p className="hint">Roles in other organizations are not visible to you.</p>}
                  </CardRow>
                </Card>
              </div>

              <ChangeRoleModal open={roleModalOpen && canChangeRole && !isOwner} member={m} onClose={closeRoleModal} onChanged={() => { closeRoleModal(); member.reload(); }} />
            </>
          );
        }}
      </Async>
    </AppPage>
  );
}

function ChangeRoleModal({ open, member, onClose, onChanged }: { open: boolean; member: Membership; onClose: () => void; onChanged: () => void }) {
  const { session } = useSession();
  const toast = useToast();
  const [role, setRole] = useState<Role>(member.role);
  const action = useAction(changeRole);
  useEffect(() => setRole(member.role), [member.role, open]);

  // Only an Owner may create another Owner (ownership transfer lives in Settings).
  const assignable: Role[] = ['administrator', 'manager', 'viewer'];
  const gained = ROLE_PERMISSIONS[role].filter((p) => !ROLE_PERMISSIONS[member.role].includes(p));
  const lost = ROLE_PERMISSIONS[member.role].filter((p) => !ROLE_PERMISSIONS[role].includes(p));
  const label = (key: string) => PERMISSIONS.flatMap((g) => g.items).find((i) => i.key === key)?.label ?? key;

  const save = async () => {
    const result = await action.run(member.id, role);
    if (result.ok) {
      toast(`${member.person.name} is now ${ROLE_LABELS[role]}`);
      onChanged();
    }
  };

  const first = member.person.name.split(' ')[0];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Change role for ${member.person.name}`}
      description={`Applies to ${session!.organization.name} only. Takes effect on their next token refresh.`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={role === member.role} busy={action.busy} onClick={save}>Change to {ROLE_LABELS[role]}</Button>
        </>
      }
    >
      <fieldset style={{ border: 0, margin: 0, padding: 0 }} className="stack">
        <legend className="sr-only">Role</legend>
        {assignable.map((r) => (
          <label key={r} className="choice">
            <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
            <span className="stack" style={{ ['--gap' as string]: '3px' }}>
              <strong style={{ fontWeight: 500 }}>
                {ROLE_LABELS[r]} {r === member.role && <Badge>Current</Badge>}
              </strong>
              <span className="muted">{ROLE_DESCRIPTIONS[r]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {gained.length > 0 && <Alert tone="warn">{first} will gain: {gained.map(label).join(' · ')}</Alert>}
      {lost.length > 0 && <Alert>{first} will lose: {lost.map(label).join(' · ')}</Alert>}
      {action.error && <Alert tone="bad">{action.error}</Alert>}
    </Modal>
  );
}
