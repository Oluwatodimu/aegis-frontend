import { USE_MOCKS, delay, request } from './http';
import * as db from './mock-db';
import type { DashboardSummary } from './types';

/** GET /organizations/current/summary */
export async function getDashboard(): Promise<DashboardSummary> {
  if (USE_MOCKS) {
    const pending = db.invitations.filter((i) => i.status === 'pending');
    const soon = Date.now() + 48 * 3_600_000;
    return delay({
      totalMembers: db.memberships.length,
      activeMembers: db.memberships.filter((m) => m.status === 'active').length,
      suspendedMembers: db.memberships.filter((m) => m.status === 'suspended').length,
      pendingInvitations: pending.length,
      invitationsExpiringSoon: pending.filter((i) => new Date(i.expiresAt).getTime() < soon).length,
      applications: db.applications.length,
      activeApplications: db.applications.filter((a) => a.status === 'active').length,
      alerts: [
        { id: 'al_1', severity: 'high', title: '7 failed sign-ins for tunde@tessarolabs.example', detail: 'Account temporarily locked · 41.58.x.x · 18 min ago' },
        { id: 'al_2', severity: 'high', title: 'Client secret older than 180 days', detail: 'Reporting Service · rotate credentials' },
        { id: 'al_3', severity: 'info', title: 'New device sign-in for Kemi Adeyemi', detail: 'Chrome on macOS · Lagos · 2 h ago' },
      ],
      recentActivity: db.auditEvents.slice(0, 6),
    });
  }
  return request('GET', '/organizations/current/summary');
}
