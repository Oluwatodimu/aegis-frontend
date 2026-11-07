import { useEffect, useState } from 'react';
import { getCurrentOrganization, updateOrganization } from '../api/organization';
import type { Organization } from '../api/types';
import { useCan, useSession } from '../auth/session';
import { AppPage } from '../components/layout/AppPage';
import { Alert, Async, Badge, Button, Card, CardRow, Modal, PageHeader, StatusBadge, ToggleRow, useToast } from '../components/ui';
import { useAction, useApi } from '../hooks/useApi';
import { formatDate, initials } from '../lib';

export function OrgSettingsPage() {
  const org = useApi(getCurrentOrganization);
  return (
    <AppPage title="Organization settings" narrow crumbs={[{ label: org.data?.name ?? '…', to: '/' }, { label: 'Organization settings' }]}>
      <Async state={org}>{(o) => <SettingsForm org={o} onSaved={org.reload} />}</Async>
    </AppPage>
  );
}

function SettingsForm({ org, onSaved }: { org: Organization; onSaved: () => void }) {
  const toast = useToast();
  const { refresh } = useSession();
  const canEdit = useCan('org.settings.write');
  const isOwner = useCan('org.delete');
  const pick = (o: Organization) => ({ name: o.name, legalName: o.legalName, country: o.country, settings: { ...o.settings } });
  const [draft, setDraft] = useState(() => pick(org));
  useEffect(() => setDraft(pick(org)), [org]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(pick(org));
  const save = useAction(updateOrganization);
  const [dangerOpen, setDangerOpen] = useState<'transfer' | 'delete' | null>(null);

  const setSetting = <K extends keyof Organization['settings']>(k: K, v: Organization['settings'][K]) => setDraft({ ...draft, settings: { ...draft.settings, [k]: v } });

  const onSave = async () => {
    const result = await save.run(draft);
    if (result.ok) {
      toast('Settings saved');
      onSaved();
      void refresh(); // organization name in the sidebar
    }
  };

  return (
    <>
      <PageHeader
        title="Organization settings"
        description={<span className="row">Status <StatusBadge status={org.status} /> · Created {formatDate(org.createdAt)} · <span className="mono">{org.id}</span></span>}
      />
      {!canEdit && <Alert>Only Owners and Administrators can change these settings.</Alert>}

      <Card title="Business profile" description="Shown on sign-in pages and invitation emails.">
        <CardRow label="Logo">
          <div className="row" style={{ ['--gap' as string]: '12px' }}>
            <span className="org-avatar" style={{ width: 44, height: 44, borderRadius: 10, fontSize: 14 }}>{initials(draft.name || org.name)}</span>
            <Button disabled={!canEdit}>Upload</Button>
            <span className="hint">PNG or SVG, 256×256</span>
          </div>
        </CardRow>
        <CardRow label="Business name" htmlFor="org-name"><input id="org-name" className="input" value={draft.name} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></CardRow>
        <CardRow label="Legal name" htmlFor="org-legal"><input id="org-legal" className="input" value={draft.legalName} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, legalName: e.target.value })} /></CardRow>
        <CardRow label="Verified domain"><span className="row"><span className="mono">{org.domain}</span>{org.domainVerified ? <Badge tone="ok">Verified</Badge> : <Badge tone="warn">Not verified</Badge>}</span></CardRow>
        <CardRow label="Organization ID"><span className="mono">{org.slug}</span> <span className="hint">· can’t be changed</span></CardRow>
        <CardRow label="Country" htmlFor="org-country">
          <select id="org-country" className="select" value={draft.country} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, country: e.target.value })}>
            {['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'United States'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </CardRow>
      </Card>

      <Card title="Security policy" description="Applies to every member when they sign in to this organization.">
        <ToggleRow title="Require MFA for administrators and owners" hint="Members without MFA are asked to enrol on next sign-in." checked={draft.settings.requireMfaForAdmins} disabled={!canEdit} onChange={(v) => setSetting('requireMfaForAdmins', v)} />
        <ToggleRow title="Require MFA for all members" checked={draft.settings.requireMfaForAll} disabled={!canEdit} onChange={(v) => setSetting('requireMfaForAll', v)} />
        <ToggleRow title="Only allow invitations to the verified domain" hint="Outside collaborators need an Owner to approve." checked={draft.settings.restrictInvitesToDomain} disabled={!canEdit} onChange={(v) => setSetting('restrictInvitesToDomain', v)} />
        <CardRow label="Session lifetime" htmlFor="org-session">
          <select id="org-session" className="select" value={draft.settings.sessionLifetimeHours} disabled={!canEdit} onChange={(e) => setSetting('sessionLifetimeHours', Number(e.target.value))}>
            {[8, 12, 24].map((h) => <option key={h} value={h}>{h} hours</option>)}
          </select>
        </CardRow>
      </Card>

      {isOwner && (
        <Card title={<span style={{ color: 'var(--bad)' }}>Danger zone</span>} style={{ borderColor: 'var(--bad-line)' }}>
          <div className="toggle-row">
            <div className="stack" style={{ ['--gap' as string]: '3px' }}><span style={{ fontSize: 13, fontWeight: 500 }}>Transfer ownership</span><span className="hint">Make another Administrator the Owner. You’ll become an Administrator.</span></div>
            <Button onClick={() => setDangerOpen('transfer')}>Transfer…</Button>
          </div>
          <div className="toggle-row">
            <div className="stack" style={{ ['--gap' as string]: '3px' }}><span style={{ fontSize: 13, fontWeight: 500 }}>Delete organization</span><span className="hint">Removes all memberships and applications. People keep their Aegis accounts.</span></div>
            <Button variant="danger" onClick={() => setDangerOpen('delete')}>Delete…</Button>
          </div>
        </Card>
      )}

      {save.error && <Alert tone="bad">{save.error}</Alert>}
      {canEdit && (
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button disabled={!dirty} onClick={() => setDraft(pick(org))}>Discard</Button>
          <Button variant="primary" disabled={!dirty} busy={save.busy} onClick={onSave}>Save changes</Button>
        </div>
      )}

      <Modal
        open={!!dangerOpen}
        onClose={() => setDangerOpen(null)}
        title={dangerOpen === 'delete' ? `Delete ${org.name}?` : 'Transfer ownership'}
        description="This flow needs the backend design (confirmation by email, re-authentication) before it can be built. It’s here as a placeholder."
        footer={<Button onClick={() => setDangerOpen(null)}>Close</Button>}
      />
    </>
  );
}
