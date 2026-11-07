import { USE_MOCKS, delay, query, request } from './http';
import * as db from './mock-db';
import { ROLE_LABELS, type Invitation, type InvitationStatus, type Role } from './types';

/** GET /organizations/current/invitations?status= */
export async function listInvitations(status?: InvitationStatus): Promise<Invitation[]> {
  if (USE_MOCKS) return delay(db.invitations.filter((i) => !status || i.status === status));
  return request('GET', `/organizations/current/invitations${query({ status })}`);
}

export interface SendInvitationsInput {
  emails: string[];
  role: Exclude<Role, 'owner'>;
  note?: string;
}

/** POST /organizations/current/invitations — the backend emails a one-time link. */
export async function sendInvitations(input: SendInvitationsInput): Promise<Invitation[]> {
  if (USE_MOCKS) {
    const created = input.emails.map<Invitation>((email, n) => ({
      id: `inv_${Date.now()}_${n}`,
      email,
      role: input.role,
      status: 'pending',
      invitedBy: db.currentUserName(),
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    }));
    db.invitations.unshift(...created);
    created.forEach((i) => db.logEvent('invitation.created', 'invitations', `${i.email} · ${ROLE_LABELS[i.role]}`));
    return delay(created, 600);
  }
  return request('POST', '/organizations/current/invitations', input);
}

/** POST /organizations/current/invitations/:id/resend — issues a new link, old one stops working. */
export async function resendInvitation(id: string): Promise<Invitation> {
  if (USE_MOCKS) {
    const inv = db.invitations.find((i) => i.id === id) ?? db.notFound('Invitation');
    inv.sentAt = new Date().toISOString();
    inv.expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    db.logEvent('invitation.resent', 'invitations', inv.email);
    return delay(inv);
  }
  return request('POST', `/organizations/current/invitations/${id}/resend`);
}

/** POST /organizations/current/invitations/:id/revoke */
export async function revokeInvitation(id: string): Promise<Invitation> {
  if (USE_MOCKS) {
    const inv = db.invitations.find((i) => i.id === id) ?? db.notFound('Invitation');
    inv.status = 'revoked';
    db.logEvent('invitation.revoked', 'invitations', inv.email);
    return delay(inv);
  }
  return request('POST', `/organizations/current/invitations/${id}/revoke`);
}
