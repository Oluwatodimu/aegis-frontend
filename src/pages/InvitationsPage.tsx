import { useState, type FormEvent } from 'react';
import { listInvitations, resendInvitation, revokeInvitation, sendInvitations } from '../api/invitations';
import { ROLE_LABELS, type Invitation, type InvitationStatus, type Role } from '../api/types';
import { useCan, useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { Alert, Async, Badge, Button, EmptyState, Field, PageHeader, useToast } from '../components/ui';
import { useAction, useApi } from '../hooks/useApi';
import { formatDate, formatExpiry, isEmail } from '../lib';

const TABS: { key: InvitationStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'expired', label: 'Expired' },
  { key: 'revoked', label: 'Revoked' },
];

export function InvitationsPage() {
  const { session } = useSession();
  const toast = useToast();
  const canInvite = useCan('members.invite');
  const canAssignAdmin = useCan('members.role.write');
  const [tab, setTab] = useState<InvitationStatus>('pending');
  const all = useApi(() => listInvitations(), []);
  const rows = (all.data ?? []).filter((i) => i.status === tab);

  const resend = useAction(resendInvitation);
  const revoke = useAction(revokeInvitation);

  const act = async (inv: Invitation, kind: 'resend' | 'revoke') => {
    const result = kind === 'resend' ? await resend.run(inv.id) : await revoke.run(inv.id);
    if (result.ok) {
      toast(kind === 'resend' ? `New invitation sent to ${inv.email}` : `Invitation for ${inv.email} revoked`);
      all.reload();
    }
  };

  return (
    <AppPage title="Invitations" crumbs={[{ label: session!.organization.name, to: '/' }, { label: 'Identity' }, { label: 'Invitations' }]}>
      <PageHeader title="Invitations" description="Invite people by email. Invitations expire after 7 days and can be used once." />

      <div className="split">
        {canInvite && <InviteForm allowAdmin={canAssignAdmin} onSent={all.reload} />}

        <section className="card" style={{ flex: '999 1 560px', minWidth: 0, overflow: 'hidden' }}>
          <div className="tabs" role="tablist" aria-label="Invitation status">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" className="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label} <Badge>{(all.data ?? []).filter((i) => i.status === t.key).length}</Badge>
              </button>
            ))}
          </div>
          <Async state={all}>
            {() =>
              rows.length === 0 ? (
                <EmptyState title={`No ${tab} invitations`}>{tab === 'pending' ? 'Invite someone using the form.' : 'Nothing here yet.'}</EmptyState>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Invited by</th><th scope="col">Sent</th><th scope="col">{tab === 'pending' ? 'Expires' : 'Status'}</th>{tab === 'pending' && canInvite && <th scope="col"><span className="sr-only">Actions</span></th>}</tr>
                    </thead>
                    <tbody>
                      {rows.map((inv) => {
                        const exp = formatExpiry(inv.expiresAt);
                        return (
                          <tr key={inv.id}>
                            <td style={{ fontWeight: 500 }}>{inv.email}</td>
                            <td>{ROLE_LABELS[inv.role]}</td>
                            <td className="muted">{inv.invitedBy}</td>
                            <td className="mono small muted">{formatDate(inv.sentAt)}</td>
                            <td>{tab === 'pending' ? <Badge tone={exp.soon ? 'warn' : 'neutral'}>{exp.text}</Badge> : <Badge>{TABS.find((t) => t.key === tab)!.label}</Badge>}</td>
                            {tab === 'pending' && canInvite && (
                              <td>
                                <div className="row" style={{ justifyContent: 'flex-end', ['--gap' as string]: '6px' }}>
                                  <Button size="sm" onClick={() => act(inv, 'resend')}>Resend</Button>
                                  <Button size="sm" variant="danger" onClick={() => act(inv, 'revoke')}>Revoke</Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            }
          </Async>
          {(resend.error || revoke.error) && <div style={{ padding: '0 20px 12px' }}><Alert tone="bad">{resend.error ?? revoke.error}</Alert></div>}
          <p className="hint" style={{ padding: '12px 20px', borderTop: '1px solid var(--line-soft)' }}>
            Invitation links are never shown here. Resending issues a new link and invalidates the previous one.
          </p>
        </section>
      </div>
    </AppPage>
  );
}

function InviteForm({ allowAdmin, onSent }: { allowAdmin: boolean; onSent: () => void }) {
  const toast = useToast();
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<Exclude<Role, 'owner'>>('viewer');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const action = useAction(sendInvitations);

  const list = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const bad = list.filter((x) => !isEmail(x));
    if (!list.length) return setError('Enter at least one email address.');
    if (bad.length) return setError(`Check these addresses: ${bad.join(', ')}`);
    setError(undefined);
    const result = await action.run({ emails: list, role, note: note || undefined });
    if (result.ok) {
      toast(list.length === 1 ? `Invitation sent to ${list[0]}` : `${list.length} invitations sent`);
      setEmails('');
      setNote('');
      onSent();
    }
  };

  return (
    <form className="card card-pad stack" style={{ flex: '1 1 300px', minWidth: 0 }} onSubmit={submit} noValidate>
      <h2 className="section-title">Invite people</h2>
      <Field label="Email addresses" hint="Separate multiple addresses with commas." error={error}>
        <textarea className="textarea" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="name@company.com" />
      </Field>
      <Field label="Initial role" hint="Owner can’t be assigned by invitation.">
        <select className="select" value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, 'owner'>)}>
          <option value="viewer">Viewer</option>
          <option value="manager">Manager</option>
          {allowAdmin && <option value="administrator">Administrator</option>}
        </select>
      </Field>
      <Field label={<>Personal note <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></>}>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Shown in the invitation email" />
      </Field>
      {action.error && <Alert tone="bad">{action.error}</Alert>}
      <Button type="submit" variant="primary" busy={action.busy}>
        {list.length > 1 ? `Send ${list.length} invitations` : 'Send invitation'}
      </Button>
    </form>
  );
}
