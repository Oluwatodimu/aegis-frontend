import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getApplication, rotateSecret, updateApplication, type ApplicationUpdate } from '../api/applications';
import { APP_TYPE_LABELS, ROLE_LABELS, type Application, type GrantType, type Role } from '../api/types';
import { useCan } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { SecretReveal } from '../components/SecretReveal';
import { Alert, Async, Badge, Button, ButtonLink, Card, CardRow, CopyField, Modal, StatusBadge, useToast } from '../components/ui';
import { useAction, useApi } from '../hooks/useApi';
import { formatDate, formatRelative, initials } from '../lib';

const GRANT_LABELS: Record<GrantType, string> = {
  authorization_code: 'Authorization code (PKCE required)',
  refresh_token: 'Refresh token',
  client_credentials: 'Client credentials',
};

export function ApplicationDetailPage() {
  const { id = '' } = useParams();
  const app = useApi(() => getApplication(id), [id]);
  return (
    <AppPage title={app.data?.name ?? 'Application'} crumbs={[{ label: 'Applications', to: '/applications' }, { label: app.data?.name ?? '…' }]}>
      <Async state={app}>{(a) => <ApplicationDetail key={a.id} app={a} onChanged={app.reload} />}</Async>
    </AppPage>
  );
}

function ApplicationDetail({ app, onChanged }: { app: Application; onChanged: () => void }) {
  const toast = useToast();
  const canWrite = useCan('apps.write');
  const canRotate = useCan('apps.credentials.rotate');

  // Editable copy of the settings; saved together with "Save changes".
  const toDraft = (a: Application) => ({
    name: a.name,
    description: a.description,
    redirectUris: a.redirectUris.join('\n'),
    postLogoutRedirectUri: a.postLogoutRedirectUri,
    grantTypes: a.grantTypes,
    accessTokenMinutes: a.accessTokenMinutes,
    refreshIdleHours: a.refreshIdleHours,
    allowedRoles: a.allowedRoles,
  });
  const [draft, setDraft] = useState(() => toDraft(app));
  useEffect(() => setDraft(toDraft(app)), [app]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(app));

  const save = useAction(updateApplication);
  const rotate = useAction(rotateSecret);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const onSave = async () => {
    const patch: ApplicationUpdate = { ...draft, redirectUris: draft.redirectUris.split('\n').map((s) => s.trim()).filter(Boolean) };
    const result = await save.run(app.id, patch);
    if (result.ok) {
      toast('Changes saved');
      onChanged();
    }
  };

  const onRotate = async () => {
    const result = await rotate.run(app.id);
    setConfirmRotate(false);
    if (result.ok) setNewSecret(result.value.clientSecret);
  };

  const onToggleStatus = async () => {
    const result = await save.run(app.id, { status: app.status === 'active' ? 'disabled' : 'active' });
    setConfirmDisable(false);
    if (result.ok) {
      toast(app.status === 'active' ? 'Application disabled' : 'Application enabled');
      onChanged();
    }
  };

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const readOnly = !canWrite;

  return (
    <>
      <div className="row" style={{ ['--gap' as string]: '14px' }}>
        <span className="app-icon" style={{ width: 44, height: 44, borderRadius: 10, fontSize: 14 }}>{initials(app.name)}</span>
        <div className="grow stack" style={{ ['--gap' as string]: '6px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{app.name}</h1>
          <div className="row" style={{ ['--gap' as string]: '6px' }}>
            <StatusBadge status={app.status} />
            <Badge>{APP_TYPE_LABELS[app.type]}</Badge>
            <Badge>{app.clientType === 'confidential' ? 'Confidential client' : 'Public client'}</Badge>
          </div>
        </div>
        <ButtonLink to="/developer">Integration guide</ButtonLink>
      </div>

      {newSecret && <SecretReveal secret={newSecret} onDone={() => { setNewSecret(null); onChanged(); }} />}

      <Card title="Credentials" description="Used by your server to identify itself to Aegis.">
        <CardRow label="Client ID"><CopyField value={app.clientId} label="client ID" /></CardRow>
        {app.clientType === 'confidential' ? (
          <>
            <CardRow label="Client secret">
              <div className="stack" style={{ ['--gap' as string]: '8px' }}>
                <div className="copy-field"><span className="value muted">{app.secretHint ?? '—'}</span>{app.secretRotatedAt && <Badge>Rotated {formatRelative(app.secretRotatedAt)}</Badge>}</div>
                <span className="hint">The full secret is never shown again after it’s issued. Rotate it if it’s lost or exposed.</span>
              </div>
            </CardRow>
            {canRotate && (
              <CardRow label="Rotation">
                <Button onClick={() => setConfirmRotate(true)}>Rotate secret…</Button>
              </CardRow>
            )}
          </>
        ) : (
          <CardRow label="Client secret"><span className="muted">None — public clients can’t keep a secret, so they use PKCE instead.</span></CardRow>
        )}
      </Card>

      <Card title="General">
        <CardRow label="Name" htmlFor="app-name"><input id="app-name" className="input" value={draft.name} disabled={readOnly} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></CardRow>
        <CardRow label="Description" htmlFor="app-desc"><input id="app-desc" className="input" value={draft.description} disabled={readOnly} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></CardRow>
        <CardRow label="Created">{formatDate(app.createdAt)} by {app.createdBy}</CardRow>
      </Card>

      <Card title="Authentication" description="OAuth 2.0 / OpenID Connect settings for this client.">
        {app.type !== 'm2m' && (
          <>
            <CardRow label="Redirect URIs" htmlFor="app-redirects">
              <textarea id="app-redirects" className="textarea mono" rows={Math.max(2, draft.redirectUris.split('\n').length)} value={draft.redirectUris} disabled={readOnly} onChange={(e) => setDraft({ ...draft, redirectUris: e.target.value })} />
            </CardRow>
            <CardRow label="Post-logout redirect" htmlFor="app-logout">
              <input id="app-logout" className="input mono" value={draft.postLogoutRedirectUri} disabled={readOnly} onChange={(e) => setDraft({ ...draft, postLogoutRedirectUri: e.target.value })} />
            </CardRow>
          </>
        )}
        <CardRow label="Grant types">
          <div className="stack" style={{ ['--gap' as string]: '8px' }}>
            {(app.type === 'm2m' ? (['client_credentials'] as GrantType[]) : (['authorization_code', 'refresh_token'] as GrantType[])).map((g) => (
              <label key={g} className="check">
                <input type="checkbox" checked={draft.grantTypes.includes(g)} disabled={readOnly || g !== 'refresh_token'} onChange={() => setDraft({ ...draft, grantTypes: toggle(draft.grantTypes, g) })} />
                {GRANT_LABELS[g]}
              </label>
            ))}
          </div>
        </CardRow>
        <CardRow label="Token lifetimes">
          <div className="grid-auto" style={{ ['--min' as string]: '160px', gap: 10 }}>
            <label className="field"><span className="hint">Access token</span>
              <select className="select" value={draft.accessTokenMinutes} disabled={readOnly} onChange={(e) => setDraft({ ...draft, accessTokenMinutes: Number(e.target.value) })}>
                {[5, 15, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </label>
            {app.type !== 'm2m' && (
              <label className="field"><span className="hint">Refresh (idle)</span>
                <select className="select" value={draft.refreshIdleHours} disabled={readOnly} onChange={(e) => setDraft({ ...draft, refreshIdleHours: Number(e.target.value) })}>
                  {[8, 24, 72].map((h) => <option key={h} value={h}>{h} hours</option>)}
                </select>
              </label>
            )}
          </div>
        </CardRow>
      </Card>

      {app.type !== 'm2m' && (
        <Card title="Access" description="Who in this organization may sign in to this application.">
          <CardRow label="Allowed roles">
            <div className="row">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <label key={r} className="check" style={{ marginRight: 8 }}>
                  <input type="checkbox" checked={draft.allowedRoles.includes(r)} disabled={readOnly || r === 'owner'} onChange={() => setDraft({ ...draft, allowedRoles: toggle(draft.allowedRoles, r) })} />
                  {ROLE_LABELS[r]}
                </label>
              ))}
            </div>
          </CardRow>
        </Card>
      )}

      {save.error && <Alert tone="bad">{save.error}</Alert>}
      {canWrite && (
        <div className="row">
          <Button variant="danger" onClick={() => setConfirmDisable(true)} style={{ marginRight: 'auto' }}>
            {app.status === 'active' ? 'Disable application' : 'Enable application'}
          </Button>
          <Button disabled={!dirty} onClick={() => setDraft(toDraft(app))}>Discard</Button>
          <Button variant="primary" disabled={!dirty} busy={save.busy} onClick={onSave}>Save changes</Button>
        </div>
      )}

      <Modal
        open={confirmRotate}
        onClose={() => setConfirmRotate(false)}
        title={`Rotate secret for ${app.name}?`}
        description="A new secret is generated and shown once. The current secret stops working — update your deployed services right away."
        footer={<><Button onClick={() => setConfirmRotate(false)}>Cancel</Button><Button variant="primary" busy={rotate.busy} onClick={onRotate}>Rotate secret</Button></>}
      >
        {rotate.error && <Alert tone="bad">{rotate.error}</Alert>}
      </Modal>

      <Modal
        open={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        title={app.status === 'active' ? `Disable ${app.name}?` : `Enable ${app.name}?`}
        description={app.status === 'active' ? 'Nobody will be able to sign in to it, and new tokens won’t be issued. You can enable it again later.' : 'People with an allowed role will be able to sign in again.'}
        footer={<><Button onClick={() => setConfirmDisable(false)}>Cancel</Button><Button variant={app.status === 'active' ? 'danger' : 'primary'} busy={save.busy} onClick={onToggleStatus}>{app.status === 'active' ? 'Disable' : 'Enable'}</Button></>}
      />
    </>
  );
}
