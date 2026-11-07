import { useState } from 'react';
import { listAuditEvents } from '../api/audit';
import type { AuditEvent } from '../api/types';
import { useCan, useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { Alert, Async, Button, EmptyState, PageHeader, StatusBadge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { formatStamp } from '../lib';

const CATEGORIES: { key: AuditEvent['category'] | ''; label: string }[] = [
  { key: '', label: 'All events' },
  { key: 'members', label: 'Members' },
  { key: 'invitations', label: 'Invitations' },
  { key: 'roles', label: 'Roles' },
  { key: 'applications', label: 'Applications' },
  { key: 'credentials', label: 'Credentials' },
  { key: 'security', label: 'Sign-in & security' },
  { key: 'organization', label: 'Organization' },
];

export function AuditLogsPage() {
  const { session } = useSession();
  const allowed = useCan('audit.read');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AuditEvent['category'] | ''>('');
  const [result, setResult] = useState<AuditEvent['result'] | ''>('');
  const [page, setPage] = useState(1);
  const events = useApi(() => listAuditEvents({ search, category, result, page }), [search, category, result, page]);

  const crumbs = [{ label: session!.organization.name, to: '/' }, { label: 'Security' }, { label: 'Audit logs' }];
  if (!allowed) {
    return <AppPage title="Audit logs" crumbs={crumbs}><Alert tone="bad" title="You don’t have access to audit logs">Ask an Administrator or Owner.</Alert></AppPage>;
  }

  return (
    <AppPage title="Audit logs" crumbs={crumbs}>
      <PageHeader title="Audit logs" description={`Administrative and security activity in ${session!.organization.name}. Retained for 90 days.`} />

      <div className="row" role="search">
        <label className="sr-only" htmlFor="audit-search">Search logs</label>
        <input id="audit-search" className="input" style={{ width: 300, maxWidth: '100%' }} placeholder="Search actor, target or action" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <label className="sr-only" htmlFor="audit-result">Result</label>
        <select id="audit-result" className="select" style={{ width: 'auto' }} value={result} onChange={(e) => { setResult(e.target.value as AuditEvent['result'] | ''); setPage(1); }}>
          <option value="">Any result</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="denied">Denied</option>
        </select>
      </div>
      <div className="row" role="group" aria-label="Event category" style={{ ['--gap' as string]: '6px' }}>
        {CATEGORIES.map((c) => (
          <button key={c.label} type="button" className="chip" aria-pressed={category === c.key} onClick={() => { setCategory(c.key); setPage(1); }}>{c.label}</button>
        ))}
      </div>

      <div className="card">
        <Async state={events}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState title="No events match">Try a wider filter.</EmptyState>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th scope="col">Timestamp</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Result</th><th scope="col">Source IP</th></tr>
                    </thead>
                    <tbody>
                      {data.items.map((e) => (
                        <tr key={e.id}>
                          <td className="mono small muted">{formatStamp(e.at)}</td>
                          <td style={{ fontWeight: 500 }}>{e.actor}</td>
                          <td><span className="code-chip">{e.action}</span></td>
                          <td>{e.target}</td>
                          <td><StatusBadge status={e.result} /></td>
                          <td className="mono small muted">{e.sourceIp ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="table-foot">
                  <span>Secrets, passwords, tokens and invitation links are never written to the log.</span>
                  {data.items.length < data.total && <Button size="sm" onClick={() => setPage((p) => p + 1)}>Load older events</Button>}
                </div>
              </>
            )
          }
        </Async>
      </div>
    </AppPage>
  );
}
