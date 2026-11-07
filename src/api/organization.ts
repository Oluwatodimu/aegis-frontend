import { USE_MOCKS, delay, request } from './http';
import * as db from './mock-db';
import type { OidcConfig, Organization, OrganizationSettings } from './types';

export type OrganizationUpdate = Partial<Pick<Organization, 'name' | 'legalName' | 'country'>> & {
  settings?: Partial<OrganizationSettings>;
};

/** GET /organizations/current — the organization selected in the switcher. */
export async function getCurrentOrganization(): Promise<Organization> {
  if (USE_MOCKS) return delay(db.organization);
  return request('GET', '/organizations/current');
}

/** PATCH /organizations/current */
export async function updateOrganization(patch: OrganizationUpdate): Promise<Organization> {
  if (USE_MOCKS) {
    Object.assign(db.organization, { ...patch, settings: { ...db.organization.settings, ...patch.settings } });
    db.logEvent('org.settings.updated', 'organization', 'Organization settings');
    return delay(db.organization);
  }
  return request('PATCH', '/organizations/current', patch);
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  country: string;
  teamSize: string;
}

/** POST /organizations — the signed-in user becomes its Owner (enforced by the backend). */
export async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  if (USE_MOCKS) {
    Object.assign(db.organization, { name: input.name, slug: input.slug, country: input.country });
    db.mockAuth.set('signed-in');
    return delay(db.organization, 700);
  }
  return request('POST', '/organizations', input);
}

/** GET /organizations/slug-availability?slug= */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  if (USE_MOCKS) return delay(!['admin', 'aegis', 'master'].includes(slug), 200);
  const res = await request<{ available: boolean }>('GET', `/organizations/slug-availability?slug=${encodeURIComponent(slug)}`);
  return res.available;
}

/** GET /organizations/current/oidc — public OpenID Connect endpoints for this organization. */
export async function getOidcConfig(): Promise<OidcConfig> {
  if (USE_MOCKS) {
    const issuer = `https://auth.aegis.example/realms/${db.organization.slug}`;
    return delay({
      issuer,
      discoveryUrl: `${issuer}/.well-known/openid-configuration`,
      jwksUri: `${issuer}/protocol/openid-connect/certs`,
      authorizationEndpoint: `${issuer}/protocol/openid-connect/auth`,
      tokenEndpoint: `${issuer}/protocol/openid-connect/token`,
    });
  }
  return request('GET', '/organizations/current/oidc');
}
