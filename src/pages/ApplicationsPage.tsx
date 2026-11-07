import { useState } from 'react';
import { Link } from 'react-router';
import { listApplications } from '../api/applications';
import { APP_TYPE_LABELS, type AppType } from '../api/types';
import { useCan, useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { AppsIcon, Async, Badge, ButtonLink, Card, EmptyState, PageHeader, StatusBadge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { formatDate, initials } from '../lib';

export function ApplicationsPage() {
  const { session } = useSession();
  const canWrite = useCan('apps.write');
  const apps = useApi(listApplications);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<AppType | ''>('');

  return (
    <AppPage title="Applications" crumbs={[{ label: session!.organization.name, to: '/' }, { label: 'Applications' }]}>
      <PageHeader
        title="Connected applications"
        description="Applications that sign users in through Aegis using OAuth 2.0 and OpenID Connect."
        actions={canWrite && <ButtonLink to="/applications/new" variant="primary">Register application</ButtonLink>}
      />

      <Async state={apps}>
        {(all) => {
          if (all.length === 0) {
            return (
              <Card dashed>
                <EmptyState
                  icon={<AppsIcon />}
                  title="No applications yet"
                  action={canWrite && <ButtonLink to="/applications/new" variant="primary">Register application</ButtonLink>}
                >
                  Register an app to let your team sign in to it with Aegis.
                </EmptyState>
              </Card>
            );
          }
          const s = search.toLowerCase();
          const rows = all.filter((a) => (!s || a.name.toLowerCase().includes(s) || a.clientId.includes(s)) && (!type || a.type === type));
          return (
            <>
              <div className="row" role="search">
                <label className="sr-only" htmlFor="app-search">Search applications</label>
                <input id="app-search" className="input" style={{ width: 300, maxWidth: '100%' }} placeholder="Search by name or client ID" value={search} onChange={(e) => setSearch(e.target.value)} />
                <label className="sr-only" htmlFor="app-type">Type</label>
                <select id="app-type" className="select" style={{ width: 'auto' }} value={type} onChange={(e) => setType(e.target.value as AppType | '')}>
                  <option value="">All types</option>
                  {Object.entries(APP_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="card table-wrap">
                <table className="table">
                  <thead>
                    <tr><th scope="col">Application</th><th scope="col">Type</th><th scope="col">Client</th><th scope="col">Client ID</th><th scope="col">Status</th><th scope="col">Created</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Link to={`/applications/${a.id}`} className="cell-link">
                            <span className="app-icon">{initials(a.name)}</span>
                            <span className="stack" style={{ ['--gap' as string]: '2px' }}>
                              <span>{a.name}</span>
                              <span className="small muted" style={{ fontWeight: 400 }}>{a.description}</span>
                            </span>
                          </Link>
                        </td>
                        <td>{APP_TYPE_LABELS[a.type]}</td>
                        <td><Badge>{a.clientType === 'confidential' ? 'Confidential' : 'Public'}</Badge></td>
                        <td className="mono small">{a.clientId}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td className="mono small muted">{formatDate(a.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length === 0 && <EmptyState title="No applications match">Try a different search or type.</EmptyState>}
              </div>
              <Card dashed padded>
                <div className="row spread">
                  <div className="stack" style={{ ['--gap' as string]: '4px' }}>
                    <strong style={{ fontWeight: 500 }}>Connecting an app?</strong>
                    <span className="muted" style={{ fontSize: 13 }}>The integration guide shows the issuer, discovery and JWKS endpoints plus a working token-validation example.</span>
                  </div>
                  <ButtonLink to="/developer">Open integration guide</ButtonLink>
                </div>
              </Card>
            </>
          );
        }}
      </Async>
    </AppPage>
  );
}
