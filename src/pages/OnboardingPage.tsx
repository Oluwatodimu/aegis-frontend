import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { signOut, startSignIn } from '../api/account';
import { createOrganization, isSlugAvailable } from '../api/organization';
import { useSession } from '../auth/session';
import { Alert, Button, CheckIcon, Field, Loading, Logo } from '../components/ui';
import { useAction } from '../hooks/useApi';

const toSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/** Shown after a new account comes back from Keycloak registration. */
export function OnboardingPage() {
  const { me, session, loading } = useSession();
  const signedOut = !loading && !me;
  useEffect(() => {
    if (signedOut) startSignIn('/onboarding');
  }, [signedOut]);

  if (loading && !me) return <Loading />;
  if (signedOut) return <Loading label="Redirecting to sign in…" />;
  if (session) return <Navigate to="/" replace />; // already has a business
  return <CreateBusiness firstName={me!.user.name.split(' ')[0] ?? ''} />;
}

function CreateBusiness({ firstName }: { firstName: string }) {
  const navigate = useNavigate();
  const { refresh } = useSession();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [country, setCountry] = useState('Nigeria');
  const [teamSize, setTeamSize] = useState('11–50');
  const action = useAction(createOrganization);

  // Suggest an ID from the name until the user edits it themselves.
  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(name));
  }, [name, slugEdited]);

  useEffect(() => {
    if (!slug) return setAvailable(null);
    let cancelled = false;
    setAvailable(null);
    const t = setTimeout(() => isSlugAvailable(slug).then((ok) => !cancelled && setAvailable(ok)), 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug || available === false) return;
    const result = await action.run({ name: name.trim(), slug, country, teamSize });
    if (result.ok) {
      await refresh();
      navigate('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', background: 'var(--ground)' }}>
      <aside style={{ flex: '1 1 300px', maxWidth: 360, minWidth: 0, padding: '48px 40px', background: 'var(--surface)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div className="row" style={{ fontSize: 17, fontWeight: 600 }}><Logo size={20} stroke="#111214" accent="#2B45D4" /> Aegis</div>
        <ol className="steps" aria-label="Setup progress">
          <li className="step done"><span className="step-dot"><CheckIcon size={12} /></span>Create account</li>
          <li className="step done"><span className="step-dot"><CheckIcon size={12} /></span>Verify email</li>
          <li className="step current" aria-current="step"><span className="step-dot">3</span><span className="stack" style={{ ['--gap' as string]: '2px' }}>Create your business<span className="hint" style={{ fontWeight: 400 }}>You’ll be its Owner</span></span></li>
          <li className="step"><span className="step-dot">4</span><span className="muted">Invite your team (optional)</span></li>
        </ol>
        <p className="hint" style={{ marginTop: 'auto' }}>
          Signed in{firstName ? ` as ${firstName}` : ''} ·{' '}
          <button type="button" className="btn btn-ghost btn-sm" style={{ padding: 0, minHeight: 0, color: 'var(--accent)' }} onClick={() => void signOut()}>Sign out</button>
        </p>
      </aside>

      <main style={{ flex: '999 1 320px', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
        <form onSubmit={submit} style={{ width: 520, maxWidth: '100%' }} className="stack">
          <div className="stack" style={{ ['--gap' as string]: '8px' }}>
            <span className="hint" style={{ fontWeight: 500 }}>Step 3 of 4{firstName ? ` · Welcome, ${firstName}` : ''}</span>
            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>Create your business</h1>
            <p className="muted" style={{ fontSize: 15, lineHeight: 1.55 }}>A business is where your members, applications and roles live. You can belong to more than one.</p>
          </div>
          {action.error && <Alert tone="bad">{action.error}</Alert>}
          <Field label="Business name">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tessaro Labs" required />
          </Field>
          <Field
            label="Organization ID"
            hint={available === false ? undefined : `Used in your issuer URL: auth.aegis.example/realms/${slug || '…'}. Can’t be changed later.`}
            error={available === false ? 'That ID is taken. Try another.' : undefined}
          >
            <input
              className="input mono"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(toSlug(e.target.value));
              }}
            />
          </Field>
          {available && <span className="small" style={{ color: 'var(--ok)', marginTop: -8 }}>Available</span>}
          <div className="grid-auto" style={{ ['--min' as string]: '200px' }}>
            <Field label="Team size">
              <select className="select" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                {['1–10', '11–50', '51–200', '200+'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Country">
              <select className="select" value={country} onChange={(e) => setCountry(e.target.value)}>
                {['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'United States'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Alert>You’ll become the <strong>Owner</strong> of {name || 'this business'} — the only role that can transfer ownership or delete the organization.</Alert>
          <div className="row">
            <Button type="submit" variant="primary" size="lg" busy={action.busy} disabled={available === false}>Create business</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
