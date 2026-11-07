import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { createApplication, type CreateApplicationResult } from '../api/applications';
import { APP_TYPE_LABELS, type AppType } from '../api/types';
import { useCan, useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { SecretReveal } from '../components/SecretReveal';
import { Alert, Badge, Button, ButtonLink, Card, CardRow, CopyField, Field, PageHeader } from '../components/ui';
import { useAction } from '../hooks/useApi';

const TYPES: { type: AppType; client: string; desc: string; grant: string; secret: string; tokens: string }[] = [
  { type: 'web', client: 'Confidential', desc: 'Server-rendered app that can keep a secret.', grant: 'Authorization code + PKCE', secret: 'Generated once, shown once', tokens: 'ID + access + refresh' },
  { type: 'spa', client: 'Public', desc: 'Browser app (React, Vue). No secret.', grant: 'Authorization code + PKCE', secret: 'None — public client', tokens: 'ID + access, refresh rotation' },
  { type: 'native', client: 'Public', desc: 'iOS, Android or desktop app.', grant: 'Authorization code + PKCE', secret: 'None — public client', tokens: 'ID + access + refresh' },
  { type: 'm2m', client: 'Confidential', desc: 'Backend service calling your APIs.', grant: 'Client credentials', secret: 'Generated once, shown once', tokens: 'Access token only' },
];

function validateUri(uri: string): string | null {
  try {
    const u = new URL(uri);
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) return 'must use HTTPS (HTTP only for localhost)';
    if (uri.includes('*')) return 'wildcards are not allowed';
    if (u.hash) return 'must not contain a #fragment';
    return null;
  } catch {
    return 'is not a valid URL';
  }
}

export function RegisterApplicationPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const canWrite = useCan('apps.write');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AppType>('web');
  const [redirects, setRedirects] = useState('');
  const [origins, setOrigins] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<CreateApplicationResult | null>(null);
  const action = useAction(createApplication);
  const sel = TYPES.find((t) => t.type === type)!;
  const needsRedirects = type !== 'm2m';

  const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Give the application a name.';
    if (needsRedirects) {
      const uris = lines(redirects);
      if (!uris.length) errs.redirects = 'Add at least one redirect URI.';
      const bad = uris.map((u) => [u, validateUri(u)] as const).find(([, err]) => err);
      if (bad) errs.redirects = `${bad[0]} ${bad[1]}.`;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const result = await action.run({ name: name.trim(), description: description.trim(), type, redirectUris: needsRedirects ? lines(redirects) : [], webOrigins: type === 'spa' ? lines(origins) : [] });
    if (result.ok) setCreated(result.value);
  };

  const crumbs = [{ label: 'Applications', to: '/applications' }, { label: 'Register' }];

  if (!canWrite) {
    return (
      <AppPage title="Register application" crumbs={crumbs}>
        <Alert tone="bad" title="You can’t register applications">Ask an Administrator or Owner of {session!.organization.name}.</Alert>
      </AppPage>
    );
  }

  // Step 2: created — show integration details (and the secret, once).
  if (created) {
    const app = created.application;
    return (
      <AppPage title="Application created" crumbs={crumbs} narrow>
        <PageHeader title={`${app.name} is ready`} description="Configure your application with the values below." />
        {created.secret && <SecretReveal secret={created.secret.clientSecret} onDone={() => navigate(`/applications/${app.id}`)} />}
        <Card title="Integration details">
          <CardRow label="Client ID"><CopyField value={app.clientId} label="client ID" /></CardRow>
          <CardRow label="Client type">{app.clientType === 'confidential' ? 'Confidential' : 'Public (no secret)'}</CardRow>
          <CardRow label="Issuer"><CopyField value={`https://auth.aegis.example/realms/${session!.organization.slug}`} label="issuer URL" /></CardRow>
        </Card>
        <div className="row">
          {!created.secret && <ButtonLink to={`/applications/${app.id}`} variant="primary">Go to application</ButtonLink>}
          <ButtonLink to="/developer">Open integration guide</ButtonLink>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage title="Register application" crumbs={crumbs}>
      <div className="split" style={{ gap: 32 }}>
        <form className="stack" style={{ flex: '999 1 520px', minWidth: 0, ['--gap' as string]: '28px' }} onSubmit={submit} noValidate>
          <PageHeader
            title="Register an application"
            description={<>Create an OAuth 2.0 / OpenID Connect client in the <span className="mono" style={{ color: 'var(--ink)' }}>{session!.organization.slug}</span> realm.</>}
          />

          <section className="stack" style={{ ['--gap' as string]: '14px' }}>
            <h2 className="eyebrow">1 · Details</h2>
            <div className="grid-auto" style={{ ['--min' as string]: '260px' }}>
              <Field label="Application name" error={errors.name}>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer Hub" />
              </Field>
              <Field label={<>Description <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></>}>
                <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="stack" style={{ ['--gap' as string]: '14px' }}>
            <h2 className="eyebrow">2 · Application type</h2>
            <div className="grid-auto" style={{ ['--min' as string]: '220px', gap: 10 }}>
              {TYPES.map((t) => (
                <button key={t.type} type="button" className="choice" aria-pressed={type === t.type} onClick={() => setType(t.type)} style={{ flexDirection: 'column', gap: 6, minHeight: 96 }}>
                  <span className="row spread" style={{ width: '100%' }}>
                    <strong style={{ fontSize: 14, fontWeight: 600 }}>{APP_TYPE_LABELS[t.type]}</strong>
                    <Badge tone={type === t.type ? 'accent' : 'neutral'}>{t.client}</Badge>
                  </span>
                  <span className="hint">{t.desc}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="stack" style={{ ['--gap' as string]: '14px' }}>
            <h2 className="eyebrow">3 · Redirects</h2>
            {needsRedirects ? (
              <>
                <Field label="Allowed redirect URIs" hint="One per line. Exact match — no wildcards. HTTP is allowed for localhost only." error={errors.redirects}>
                  <textarea className="textarea mono" rows={3} value={redirects} onChange={(e) => setRedirects(e.target.value)} placeholder={'https://app.example.com/auth/callback\nhttp://localhost:5173/auth/callback'} />
                </Field>
                {type === 'spa' && (
                  <Field label="Allowed web origins" hint="Origins allowed to call the token endpoint from the browser (CORS). One per line.">
                    <textarea className="textarea mono" rows={2} value={origins} onChange={(e) => setOrigins(e.target.value)} placeholder="https://app.example.com" />
                  </Field>
                )}
              </>
            ) : (
              <p className="card card-pad muted" style={{ fontSize: 13 }}>Machine-to-machine clients use the client credentials grant and have no user sign-in, so no redirect URIs are needed.</p>
            )}
          </section>

          {action.error && <Alert tone="bad">{action.error}</Alert>}
          <div className="row" style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
            <Button type="submit" variant="primary" busy={action.busy}>Create application</Button>
            <ButtonLink to="/applications">Cancel</ButtonLink>
          </div>
        </form>

        <aside className="card card-pad stack" style={{ flex: '1 1 280px', minWidth: 0, ['--gap' as string]: '14px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>What Aegis will create</h2>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '110px 1fr', gap: '10px 12px', fontSize: 13 }}>
            <dt className="muted">Client type</dt><dd style={{ margin: 0 }}>{sel.client}</dd>
            <dt className="muted">Grant</dt><dd style={{ margin: 0 }}>{sel.grant}</dd>
            <dt className="muted">Secret</dt><dd style={{ margin: 0 }}>{sel.secret}</dd>
            <dt className="muted">Tokens</dt><dd style={{ margin: 0 }}>{sel.tokens}</dd>
          </dl>
          <p className="hint" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 14 }}>You can change redirect URIs and token settings after creation. The client type can’t be changed.</p>
        </aside>
      </div>
    </AppPage>
  );
}
