import { USE_MOCKS, delay, request } from './http';
import * as db from './mock-db';
import type { AppType, Application, IssuedSecret } from './types';

/** GET /organizations/current/applications */
export async function listApplications(): Promise<Application[]> {
  if (USE_MOCKS) return delay(db.applications);
  return request('GET', '/organizations/current/applications');
}

/** GET /organizations/current/applications/:id */
export async function getApplication(id: string): Promise<Application> {
  if (USE_MOCKS) return delay(db.applications.find((a) => a.id === id) ?? db.notFound('Application'));
  return request('GET', `/organizations/current/applications/${id}`);
}

export interface CreateApplicationInput {
  name: string;
  description: string;
  type: AppType;
  redirectUris: string[];
  webOrigins: string[];
}

export interface CreateApplicationResult {
  application: Application;
  /** Present only for confidential clients. Show once, never store. */
  secret: IssuedSecret | null;
}

/** POST /organizations/current/applications */
export async function createApplication(input: CreateApplicationInput): Promise<CreateApplicationResult> {
  if (USE_MOCKS) {
    const confidential = input.type === 'web' || input.type === 'm2m';
    const secret = confidential ? db.fakeSecret() : null;
    const clientId = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
    const app: Application = {
      id: `app_${Date.now()}`,
      name: input.name,
      description: input.description,
      type: input.type,
      clientType: confidential ? 'confidential' : 'public',
      clientId,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: db.currentUserName(),
      redirectUris: input.type === 'm2m' ? [] : input.redirectUris,
      postLogoutRedirectUri: '',
      webOrigins: input.webOrigins,
      grantTypes: input.type === 'm2m' ? ['client_credentials'] : ['authorization_code', 'refresh_token'],
      accessTokenMinutes: input.type === 'm2m' ? 5 : 15,
      refreshIdleHours: 8,
      allowedRoles: ['owner', 'administrator', 'manager', 'viewer'],
      secretHint: secret ? db.hint(secret) : null,
      secretRotatedAt: secret ? new Date().toISOString() : null,
    };
    db.applications.unshift(app);
    db.logEvent('application.created', 'applications', `${app.name} (${app.clientType} client)`);
    return delay({ application: app, secret: secret ? { clientSecret: secret } : null }, 700);
  }
  return request('POST', '/organizations/current/applications', input);
}

export type ApplicationUpdate = Partial<
  Pick<Application, 'name' | 'description' | 'redirectUris' | 'postLogoutRedirectUri' | 'webOrigins' | 'grantTypes' | 'accessTokenMinutes' | 'refreshIdleHours' | 'allowedRoles' | 'status'>
>;

/** PATCH /organizations/current/applications/:id */
export async function updateApplication(id: string, patch: ApplicationUpdate): Promise<Application> {
  if (USE_MOCKS) {
    const app = db.applications.find((a) => a.id === id) ?? db.notFound('Application');
    Object.assign(app, patch);
    db.logEvent(patch.status ? `application.${patch.status === 'active' ? 'enabled' : 'disabled'}` : 'application.updated', 'applications', app.name);
    return delay(app);
  }
  return request('PATCH', `/organizations/current/applications/${id}`, patch);
}

/** POST /organizations/current/applications/:id/secret/rotate — returns the new secret ONCE. */
export async function rotateSecret(id: string): Promise<IssuedSecret> {
  if (USE_MOCKS) {
    const app = db.applications.find((a) => a.id === id) ?? db.notFound('Application');
    const secret = db.fakeSecret();
    app.secretHint = db.hint(secret);
    app.secretRotatedAt = new Date().toISOString();
    db.logEvent('client.secret.rotated', 'credentials', app.name);
    return delay({ clientSecret: secret }, 600);
  }
  return request('POST', `/organizations/current/applications/${id}/secret/rotate`);
}
