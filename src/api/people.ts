import { USE_MOCKS, delay, query, request } from './http';
import * as db from './mock-db';
import { ROLE_LABELS, type Membership, type Page, type Role } from './types';

export interface MemberFilters {
  search?: string;
  role?: Role | '';
  status?: Membership['status'] | '';
  page?: number;
  pageSize?: number;
}

/** GET /organizations/current/members */
export async function listMembers(f: MemberFilters = {}): Promise<Page<Membership>> {
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 10;
  if (USE_MOCKS) {
    const s = (f.search ?? '').toLowerCase().trim();
    const rows = db.memberships.filter(
      (m) =>
        (!s || m.person.name.toLowerCase().includes(s) || m.person.email.toLowerCase().includes(s)) &&
        (!f.role || m.role === f.role) &&
        (!f.status || m.status === f.status),
    );
    return delay({ items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize });
  }
  return request('GET', `/organizations/current/members${query({ search: f.search, role: f.role, status: f.status, page, pageSize })}`);
}

/** GET /organizations/current/members/:id */
export async function getMember(id: string): Promise<Membership> {
  if (USE_MOCKS) return delay(db.memberships.find((m) => m.id === id) ?? db.notFound('Member'));
  return request('GET', `/organizations/current/members/${id}`);
}

/** PATCH /organizations/current/members/:id  { role } */
export async function changeRole(id: string, role: Role): Promise<Membership> {
  if (USE_MOCKS) {
    const m = db.memberships.find((x) => x.id === id) ?? db.notFound('Member');
    const from = m.role;
    m.role = role;
    db.logEvent('membership.role.changed', 'roles', `${m.person.name} · ${ROLE_LABELS[from]} → ${ROLE_LABELS[role]}`);
    return delay(m);
  }
  return request('PATCH', `/organizations/current/members/${id}`, { role });
}

/** PATCH /organizations/current/members/:id  { status } */
export async function setMembershipStatus(id: string, status: Membership['status']): Promise<Membership> {
  if (USE_MOCKS) {
    const m = db.memberships.find((x) => x.id === id) ?? db.notFound('Member');
    m.status = status;
    db.logEvent(status === 'suspended' ? 'membership.suspended' : 'membership.restored', 'members', m.person.name);
    return delay(m);
  }
  return request('PATCH', `/organizations/current/members/${id}`, { status });
}

/** DELETE /organizations/current/members/:id — removes the membership, not the person's account. */
export async function removeMember(id: string): Promise<void> {
  if (USE_MOCKS) {
    const i = db.memberships.findIndex((x) => x.id === id);
    if (i < 0) db.notFound('Member');
    const [m] = db.memberships.splice(i, 1);
    db.logEvent('membership.removed', 'members', m.person.name);
    return delay(undefined);
  }
  return request('DELETE', `/organizations/current/members/${id}`);
}
