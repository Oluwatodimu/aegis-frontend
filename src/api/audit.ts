import { USE_MOCKS, delay, query, request } from './http';
import * as db from './mock-db';
import type { AuditEvent, Page } from './types';

export interface AuditFilters {
  search?: string;
  category?: AuditEvent['category'] | '';
  result?: AuditEvent['result'] | '';
  page?: number;
}

/** GET /organizations/current/audit-events */
export async function listAuditEvents(f: AuditFilters = {}): Promise<Page<AuditEvent>> {
  const page = f.page ?? 1;
  const pageSize = 15;
  if (USE_MOCKS) {
    const s = (f.search ?? '').toLowerCase().trim();
    const rows = db.auditEvents.filter(
      (e) =>
        (!s || `${e.actor} ${e.action} ${e.target}`.toLowerCase().includes(s)) &&
        (!f.category || e.category === f.category) &&
        (!f.result || e.result === f.result),
    );
    return delay({ items: rows.slice(0, page * pageSize), total: rows.length, page, pageSize });
  }
  return request('GET', `/organizations/current/audit-events${query({ search: f.search, category: f.category, result: f.result, page })}`);
}
