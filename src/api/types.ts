/**
 * Data shapes shared between the frontend and the Aegis backend.
 *
 * If your backend returns different field names, change them here first —
 * TypeScript will then point at every screen that needs updating.
 */

export type Role = 'owner' | 'administrator' | 'manager' | 'viewer';

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  administrator: 'Administrator',
  manager: 'Manager',
  viewer: 'Viewer',
};

/** The organization (business) the user is currently working in. */
export interface Organization {
  id: string;
  slug: string; // used in the issuer URL, e.g. "tessaro-labs"
  name: string;
  legalName: string;
  domain: string;
  domainVerified: boolean;
  country: string;
  status: 'active' | 'suspended';
  createdAt: string; // ISO date
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  requireMfaForAdmins: boolean;
  requireMfaForAll: boolean;
  restrictInvitesToDomain: boolean;
  sessionLifetimeHours: number;
}

/** A person's global Aegis account. Owned by the person, not by an organization. */
export interface Person {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  mfa: 'none' | 'totp' | 'passkey';
  lastSignInAt: string | null;
  otherOrganizationCount: number; // count only: roles elsewhere are private
}

/** A person's membership in THIS organization. */
export interface Membership {
  id: string;
  person: Person;
  role: Role;
  status: 'active' | 'suspended';
  joinedAt: string;
  invitedBy: string | null;
  applicationIds: string[];
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  invitedBy: string;
  sentAt: string;
  expiresAt: string;
}

export type AppType = 'web' | 'spa' | 'native' | 'm2m';
export type ClientType = 'confidential' | 'public';

export const APP_TYPE_LABELS: Record<AppType, string> = {
  web: 'Web application',
  spa: 'Single-page app',
  native: 'Native / mobile',
  m2m: 'Machine-to-machine',
};

export interface Application {
  id: string;
  name: string;
  description: string;
  type: AppType;
  clientType: ClientType;
  clientId: string;
  status: 'active' | 'disabled';
  createdAt: string;
  createdBy: string;
  redirectUris: string[];
  postLogoutRedirectUri: string;
  webOrigins: string[];
  grantTypes: GrantType[];
  accessTokenMinutes: number;
  refreshIdleHours: number;
  allowedRoles: Role[];
  /** Masked hint of the current secret, e.g. "aeg_cs_9Rk2…5Ed". Never the full secret. */
  secretHint: string | null;
  secretRotatedAt: string | null;
}

export type GrantType = 'authorization_code' | 'refresh_token' | 'client_credentials';

/** Returned ONLY by create/rotate. The UI shows it once and never stores it. */
export interface IssuedSecret {
  clientSecret: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string; // e.g. "membership.role.changed"
  category: 'members' | 'invitations' | 'roles' | 'applications' | 'credentials' | 'security' | 'organization';
  target: string;
  result: 'success' | 'failure' | 'denied';
  sourceIp: string | null;
}

export interface SecurityAlert {
  id: string;
  severity: 'high' | 'info';
  title: string;
  detail: string;
}

export interface DashboardSummary {
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  pendingInvitations: number;
  invitationsExpiringSoon: number;
  applications: number;
  activeApplications: number;
  alerts: SecurityAlert[];
  recentActivity: AuditEvent[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OidcConfig {
  issuer: string;
  discoveryUrl: string;
  jwksUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
}
