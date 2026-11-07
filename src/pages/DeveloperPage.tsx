import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listApplications } from '../api/applications';
import { getOidcConfig } from '../api/organization';
import { useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { Async, Badge, Card, CopyField, EmptyState, PageHeader } from '../components/ui';
import { useApi } from '../hooks/useApi';

type Lang = 'node' | 'python' | 'curl';

function examples(issuer: string, clientId: string, confidential: boolean): Record<Lang, string> {
  return {
    node: `// Validate an Aegis access token in your API (npm install jose)
import { createRemoteJWKSet, jwtVerify } from 'jose';

const issuer = '${issuer}';
const jwks = createRemoteJWKSet(new URL(\`\${issuer}/protocol/openid-connect/certs\`));

export async function verify(token) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: '${clientId}',
  });
  return payload; // payload.org.roles → ['manager']
}`,
    python: `# Validate an Aegis access token (pip install pyjwt[crypto])
import jwt

ISSUER = "${issuer}"
jwks = jwt.PyJWKClient(f"{ISSUER}/protocol/openid-connect/certs")

def verify(token: str) -> dict:
    key = jwks.get_signing_key_from_jwt(token)
    return jwt.decode(token, key.key, algorithms=["RS256"],
                      audience="${clientId}", issuer=ISSUER)`,
    curl: confidential
      ? `# Machine-to-machine: get an access token with client credentials
curl -X POST '${issuer}/protocol/openid-connect/token' \\
  -d grant_type=client_credentials \\
  -d client_id=${clientId} \\
  -d client_secret="$AEGIS_CLIENT_SECRET"   # from your secrets manager`
      : `# Discover every endpoint for this organization
curl '${issuer}/.well-known/openid-configuration'`,
  };
}

export function DeveloperPage() {
  const { session } = useSession();
  const oidc = useApi(getOidcConfig);
  const apps = useApi(listApplications);
  const [appId, setAppId] = useState('');
  const [lang, setLang] = useState<Lang>('node');

  useEffect(() => {
    if (!appId && apps.data?.length) setAppId(apps.data[0]!.id);
  }, [apps.data, appId]);
  const app = apps.data?.find((a) => a.id === appId);

  return (
    <AppPage title="Integration" crumbs={[{ label: session!.organization.name, to: '/' }, { label: 'Developer' }, { label: 'Integration' }]}>
      <PageHeader
        title="Integrate with Aegis"
        description="Any standards-compliant OpenID Connect library works. Point it at the issuer below and Aegis handles sign-in, MFA and token issuance."
        actions={
          apps.data && apps.data.length > 0 && (
            <label className="row" style={{ fontSize: 13 }}>
              <span className="muted">Application</span>
              <select className="select" style={{ width: 'auto' }} value={appId} onChange={(e) => setAppId(e.target.value)}>
                {apps.data.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          )
        }
      />

      <Async state={oidc}>
        {(cfg) => {
          const rows: [string, string][] = [
            ['Client ID', app?.clientId ?? '—'],
            ['Issuer URL', cfg.issuer],
            ['Discovery endpoint', cfg.discoveryUrl],
            ['JWKS endpoint', cfg.jwksUri],
            ['Authorization', cfg.authorizationEndpoint],
            ['Token', cfg.tokenEndpoint],
          ];
          const code = examples(cfg.issuer, app?.clientId ?? 'your-client-id', app?.clientType === 'confidential');
          return (
            <>
              <Card title="Configuration">
                {rows.map(([label, value]) => (
                  <div key={label} className="card-row"><span>{label}</span><CopyField value={value} label={label} /></div>
                ))}
                <div className="row" style={{ padding: '14px 20px' }}>
                  <span className="muted" style={{ fontSize: 13, marginRight: 6 }}>Supported flows</span>
                  <Badge tone="accent">Authorization code + PKCE</Badge>
                  <Badge tone="accent">Refresh token</Badge>
                  <Badge>Client credentials (M2M apps)</Badge>
                </div>
              </Card>

              {apps.data?.length === 0 && (
                <Card dashed><EmptyState title="No applications yet" action={<Link to="/applications/new">Register an application</Link>}>Register an app to get a client ID.</EmptyState></Card>
              )}

              <div className="split">
                <Card padded title="How sign-in works" style={{ flex: '1 1 300px', minWidth: 0 }}>
                  <ol className="stack" style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55, ['--gap' as string]: '10px' }}>
                    <li>Your app redirects the user to the Aegis <span className="mono">/auth</span> endpoint with a PKCE challenge.</li>
                    <li>The user signs in on the {session!.organization.name}-branded Aegis page (with MFA if required).</li>
                    <li>Aegis redirects back with a one-time code. Your server exchanges it for ID and access tokens.</li>
                    <li>Your API validates the access token’s signature against JWKS, then checks <span className="mono">iss</span>, <span className="mono">aud</span> and <span className="mono">exp</span>.</li>
                    <li>Authorize requests using the organization roles in the token’s <span className="mono">org</span> claim.</li>
                  </ol>
                </Card>

                <section className="card" style={{ flex: '2 1 460px', minWidth: 0 }}>
                  <div className="tabs" role="tablist" aria-label="Example language">
                    {(['node', 'python', 'curl'] as Lang[]).map((l) => (
                      <button key={l} type="button" role="tab" className="tab" aria-selected={lang === l} onClick={() => setLang(l)}>
                        {l === 'node' ? 'Node.js' : l === 'python' ? 'Python' : 'cURL'}
                      </button>
                    ))}
                  </div>
                  <pre className="code" role="tabpanel">{code[lang]}</pre>
                </section>
              </div>

              <Card title="Example access token claims" description="Roles are scoped to the organization the user signed in to.">
                <pre className="code">{JSON.stringify(
                  {
                    iss: cfg.issuer,
                    sub: 'usr_7f3k2q9mxa41',
                    aud: app?.clientId ?? 'your-client-id',
                    exp: 1793404200,
                    org: { id: session!.organization.id, roles: ['manager'] },
                    scope: 'openid profile email',
                  },
                  null,
                  2,
                )}</pre>
              </Card>
            </>
          );
        }}
      </Async>
    </AppPage>
  );
}
