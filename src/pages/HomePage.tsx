/**
 * Public home page, shown at "/" to anyone who isn't signed in.
 * "Sign in" and "Get started" hand over to Keycloak (see src/api/account.ts).
 */
import { useEffect } from 'react';
import { startRegistration, startSignIn } from '../api/account';
import { Logo } from '../components/ui';

const DOCS_URL = '#docs'; // [YOUR DOCS URL]

const STEPS = [
  { n: '01', title: 'Create your business', body: 'Register, verify your email and set up your organization. You become its Owner.' },
  { n: '02', title: 'Invite your team', body: 'Send invitations by email and give each person a role — Administrator, Manager or Viewer.' },
  { n: '03', title: 'Connect your applications', body: 'Register an app, add its redirect URIs, and your team signs in to it with their Aegis account.' },
];

const FEATURES = [
  { title: 'People, not just logins', body: 'One Aegis account per person. They can belong to several businesses, with a different role in each.' },
  { title: 'Roles scoped to each business', body: 'Being an Administrator at one company gives no rights at another. Permissions are clear and predefined.' },
  { title: 'Applications over OpenID Connect', body: 'Web apps, single-page apps, mobile apps and backend services — each gets the right OAuth flow.' },
  { title: 'Every change on record', body: 'Invitations, role changes, credential rotations and sign-in events land in a searchable audit log.' },
];

const SECURITY = [
  { title: 'Multi-factor authentication', body: 'Require an authenticator app for administrators or for everyone, set per organization.' },
  { title: 'No secrets in the browser', body: 'Sessions use secure cookies. Tokens and client secrets never touch browser storage.' },
  { title: 'Lockout and recovery', body: 'Repeated failed sign-ins lock the account temporarily. Recovery links are single-use and expire.' },
];

export function HomePage() {
  useEffect(() => {
    document.title = 'Aegis — Identity and access management';
  }, []);

  const signIn = () => startSignIn('/');
  const getStarted = () => startRegistration();

  return (
    <div className="home">
      <header className="home-nav">
        <div className="home-wrap row" style={{ ['--gap' as string]: '16px 32px', minHeight: 68, padding: '12px 24px' }}>
          <a href="/" className="home-brand"><Logo stroke="#111214" accent="#2B45D4" /> Aegis</a>
          <nav aria-label="Main" className="row grow" style={{ ['--gap' as string]: '24px' }}>
            <a className="home-link" href="#product">Product</a>
            <a className="home-link" href="#developers">Developers</a>
            <a className="home-link" href="#security">Security</a>
            <a className="home-link" href={DOCS_URL}>Docs</a>
          </nav>
          <div className="row">
            <button type="button" className="btn" onClick={signIn}>Sign in</button>
            <button type="button" className="btn btn-primary" onClick={getStarted}>Get started</button>
          </div>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-wrap home-hero-inner">
          <div className="stack" style={{ flex: '1 1 440px', minWidth: 0, ['--gap' as string]: '24px' }}>
            <span className="eyebrow">Identity &amp; access management</span>
            <h1 className="home-h1">One place to manage identities and control access across your applications.</h1>
            <p className="home-lead">
              Aegis gives your business a single home for people, roles and the applications they sign in to — built on OAuth 2.0
              and OpenID Connect, so you don’t have to run identity infrastructure yourself.
            </p>
            <div className="row" style={{ ['--gap' as string]: '12px' }}>
              <button type="button" className="btn btn-primary btn-lg" onClick={getStarted}>Create your account</button>
              <a className="btn btn-lg" href={DOCS_URL}>Read the docs</a>
            </div>
            <p className="muted">
              Already using Aegis?{' '}
              <button type="button" className="home-inline" onClick={signIn}>Sign in</button>
            </p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section id="product" className="home-wrap home-section">
        <div className="stack" style={{ maxWidth: 640, ['--gap' as string]: '12px' }}>
          <span className="eyebrow">How it works</span>
          <h2 className="home-h2">From sign-up to your first connected app in three steps.</h2>
        </div>
        <ol className="home-grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {STEPS.map((s) => (
            <li key={s.n} className="home-feat">
              <span className="mono" style={{ fontSize: 13, color: 'var(--accent)' }}>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-band">
        <div className="home-wrap home-section home-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="home-feat"><h3>{f.title}</h3><p>{f.body}</p></div>
          ))}
        </div>
      </section>

      <section id="developers" className="home-dark">
        <div className="home-wrap home-hero-inner home-dev">
          <div className="stack" style={{ flex: '1 1 380px', minWidth: 0, ['--gap' as string]: '20px' }}>
            <span className="eyebrow" style={{ color: '#9DA1AA' }}>For developers</span>
            <h2 className="home-h2">Standard endpoints. Any OIDC library.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#B9BCC4' }}>
              Point your app at your organization’s issuer URL. Validate tokens against JWKS, then read the user’s roles from the{' '}
              <span className="mono" style={{ color: '#fff' }}>org</span> claim.
            </p>
            <ul className="stack" style={{ margin: 0, padding: 0, listStyle: 'none', ['--gap' as string]: '10px', fontSize: 14, color: '#D5D7DC' }}>
              <li>Authorization code with PKCE for web, single-page and mobile apps</li>
              <li>Client credentials for service-to-service calls</li>
              <li>Client secrets shown once, rotatable at any time</li>
            </ul>
            <div><a className="btn home-btn-dark" href={DOCS_URL}>View integration guide</a></div>
          </div>
          <pre className="home-code">{`// Verify an Aegis access token
const issuer = 'https://auth.aegis.example/realms/your-org';
const jwks = createRemoteJWKSet(
  new URL(\`\${issuer}/protocol/openid-connect/certs\`)
);

const { payload } = await jwtVerify(token, jwks, {
  issuer, audience: 'your-client-id',
});

payload.org.roles; // ['manager']`}</pre>
        </div>
      </section>

      <section id="security" className="home-wrap home-section">
        <div className="stack" style={{ maxWidth: 640, ['--gap' as string]: '12px' }}>
          <span className="eyebrow">Security</span>
          <h2 className="home-h2">Secure defaults, without the setup.</h2>
        </div>
        <div className="home-grid">
          {SECURITY.map((f) => (
            <div key={f.title} className="home-feat"><h3>{f.title}</h3><p>{f.body}</p></div>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 24px 96px' }}>
        <div className="home-cta">
          <h2 className="home-h2" style={{ fontSize: 'clamp(26px, 3vw, 34px)' }}>Set up your organization</h2>
          <p className="home-lead" style={{ fontSize: 16 }}>Create an account, add your business and invite your first teammate.</p>
          <div className="row" style={{ justifyContent: 'center', ['--gap' as string]: '12px' }}>
            <button type="button" className="btn btn-primary btn-lg" onClick={getStarted}>Get started</button>
            <button type="button" className="btn btn-lg" onClick={signIn}>Sign in</button>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--line-soft)' }}>
        <div className="home-wrap row spread" style={{ padding: '28px 24px', fontSize: 13, color: 'var(--muted)' }}>
          <span>© {new Date().getFullYear()} Aegis</span>
          <nav aria-label="Footer" className="row" style={{ ['--gap' as string]: '24px' }}>
            <a className="home-link" style={{ fontSize: 13 }} href={DOCS_URL}>Docs</a>
            <a className="home-link" style={{ fontSize: 13 }} href="#status">Status</a>
            <a className="home-link" style={{ fontSize: 13 }} href="#privacy">Privacy</a>
            <a className="home-link" style={{ fontSize: 13 }} href="#terms">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Decorative miniature of the dashboard. Hidden from screen readers. */
function ProductPreview() {
  const rows: [string, string, string][] = [
    ['Adaeze Okafor', 'Owner', 'Active'],
    ['Marco Rossi', 'Administrator', 'Active'],
    ['Kemi Adeyemi', 'Manager', 'Active'],
    ['Femi Ojo', 'Viewer', 'Suspended'],
  ];
  return (
    <div className="home-preview" aria-hidden="true">
      <div className="home-preview-nav">
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Aegis</span>
        <span className="bar" style={{ height: 30, background: '#17181C', border: '1px solid #26282E' }} />
        <span className="bar" style={{ height: 22, background: '#23252B' }} />
        {[70, 60, 75, 55].map((w) => <span key={w} className="bar" style={{ height: 8, width: `${w}%`, marginLeft: 6 }} />)}
      </div>
      <div className="home-preview-body">
        <strong style={{ fontSize: 15 }}>People</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {[['Members', '48'], ['Invitations', '5'], ['Apps', '4']].map(([l, v]) => (
            <div key={l} className="card" style={{ padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ borderRadius: 8, overflow: 'hidden', fontSize: 11 }}>
          {[['Name', 'Role', 'Status'] as [string, string, string], ...rows].map(([n, r, s], i) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr', padding: '8px 10px', borderTop: i ? '1px solid #F1F1EE' : 0, background: i ? '#fff' : 'var(--surface-2)', color: i ? 'var(--ink)' : 'var(--muted)' }}>
              <span>{n}</span><span>{r}</span>
              <span style={{ color: i === 0 ? undefined : s === 'Active' ? 'var(--ok)' : 'var(--bad)' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
