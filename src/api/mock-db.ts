/**
 * In-memory sample data used when VITE_USE_MOCKS=true.
 *
 * Changes (invites, role changes, new apps…) last until you refresh the page.
 * Nothing here is used when the real backend is switched on.
 */
import type {
  Application,
  AuditEvent,
  Invitation,
  Membership,
  Organization,
  Person,
  Role,
} from './types';

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();
const hoursFromNow = (h: number) => new Date(now + h * 3_600_000).toISOString();

export const CURRENT_USER_ID = 'usr_adaeze';

export const organization: Organization = {
  id: 'org_tessaro',
  slug: 'tessaro-labs',
  name: 'Tessaro Labs',
  legalName: 'Tessaro Labs Limited',
  domain: 'tessarolabs.example',
  domainVerified: true,
  country: 'Nigeria',
  status: 'active',
  createdAt: daysAgo(243),
  settings: {
    requireMfaForAdmins: true,
    requireMfaForAll: false,
    restrictInvitesToDomain: false,
    sessionLifetimeHours: 12,
  },
};

function person(id: string, name: string, email: string, extra: Partial<Person> = {}): Person {
  return {
    id,
    name,
    email,
    emailVerified: true,
    mfa: 'totp',
    lastSignInAt: daysAgo(1),
    otherOrganizationCount: 0,
    ...extra,
  };
}

function member(p: Person, role: Role, joinedDaysAgo: number, extra: Partial<Membership> = {}): Membership {
  return {
    id: `mem_${p.id.replace('usr_', '')}`,
    person: p,
    role,
    status: 'active',
    joinedAt: daysAgo(joinedDaysAgo),
    invitedBy: 'Adaeze Okafor',
    applicationIds: ['app_finance', 'app_hub'],
    ...extra,
  };
}

const firstNames = ['Ngozi', 'Daniel', 'Amara', 'Yusuf', 'Hannah', 'Kofi', 'Zainab', 'Lucas', 'Ifeoma', 'Omar', 'Bisi', 'Ethan', 'Aisha', 'Tobi', 'Grace', 'Samuel', 'Halima', 'Victor', 'Esther', 'Malik', 'Funke', 'Noah', 'Chioma', 'Ibrahim', 'Rita', 'Seun', 'Mary', 'Emeka', 'Joy', 'Kunle', 'Ada', 'Bola', 'Peter', 'Lola', 'Uche', 'Dayo', 'Eniola', 'Musa'];
const lastNames = ['Eze', 'Park', 'Nwosu', 'Garba', 'Mensah', 'Asante', 'Bello', 'Silva', 'Okeke', 'Haddad', 'Lawal', 'Cole', 'Sule', 'Ajayi', 'Obi', 'Ade', 'Musa', 'Okon', 'Danjuma', 'Idris'];

const core: Membership[] = [
  member(person('usr_adaeze', 'Adaeze Okafor', 'adaeze@tessarolabs.example', { lastSignInAt: daysAgo(0) }), 'owner', 243, { invitedBy: null, applicationIds: ['app_finance', 'app_hub', 'app_reports'] }),
  member(person('usr_marco', 'Marco Rossi', 'marco@tessarolabs.example', { otherOrganizationCount: 1 }), 'administrator', 241),
  member(person('usr_kemi', 'Kemi Adeyemi', 'kemi@tessarolabs.example', { otherOrganizationCount: 2, lastSignInAt: daysAgo(0) }), 'manager', 203, { applicationIds: ['app_finance', 'app_hub', 'app_reports'] }),
  member(person('usr_tunde', 'Tunde Balogun', 'tunde@tessarolabs.example'), 'manager', 195),
  member(person('usr_priya', 'Priya Nair', 'priya@tessarolabs.example', { mfa: 'passkey' }), 'administrator', 178),
  member(person('usr_femi', 'Femi Ojo', 'femi@tessarolabs.example', { mfa: 'none' }), 'viewer', 163, { status: 'suspended' }),
  member(person('usr_lena', 'Lena Weber', 'lena.weber@auditco.example', { otherOrganizationCount: 3 }), 'viewer', 151, { invitedBy: 'Marco Rossi' }),
  member(person('usr_chidi', 'Chidi Mbah', 'chidi@tessarolabs.example'), 'viewer', 109),
  member(person('usr_sara', 'Sara Osei', 'sara@tessarolabs.example'), 'manager', 62),
];

const generated: Membership[] = Array.from({ length: 39 }, (_, i) => {
  const first = firstNames[i % firstNames.length];
  const last = lastNames[(i * 7) % lastNames.length];
  const p = person(`usr_gen${i}`, `${first} ${last}`, `${first}.${last}@tessarolabs.example`.toLowerCase(), {
    mfa: i % 4 === 0 ? 'none' : 'totp',
  });
  const role: Role = i % 6 === 0 ? 'manager' : 'viewer';
  return member(p, role, 60 - i, { status: i === 11 || i === 27 ? 'suspended' : 'active' });
});

export const memberships: Membership[] = [...core, ...generated];

export const invitations: Invitation[] = [
  { id: 'inv_1', email: 'jide.bello@tessarolabs.example', role: 'manager', status: 'pending', invitedBy: 'Adaeze Okafor', sentAt: daysAgo(0), expiresAt: hoursFromNow(168) },
  { id: 'inv_2', email: 'r.haddad@tessarolabs.example', role: 'viewer', status: 'pending', invitedBy: 'Marco Rossi', sentAt: daysAgo(2), expiresAt: hoursFromNow(120) },
  { id: 'inv_3', email: 'olu.ade@tessarolabs.example', role: 'viewer', status: 'pending', invitedBy: 'Priya Nair', sentAt: daysAgo(4), expiresAt: hoursFromNow(72) },
  { id: 'inv_4', email: 'ops@bridgeline.example', role: 'viewer', status: 'pending', invitedBy: 'Marco Rossi', sentAt: daysAgo(6), expiresAt: hoursFromNow(31) },
  { id: 'inv_5', email: 'm.santos@tessarolabs.example', role: 'administrator', status: 'pending', invitedBy: 'Adaeze Okafor', sentAt: daysAgo(6.7), expiresAt: hoursFromNow(6) },
  { id: 'inv_6', email: 'kemi@tessarolabs.example', role: 'viewer', status: 'accepted', invitedBy: 'Adaeze Okafor', sentAt: daysAgo(204), expiresAt: daysAgo(197) },
  { id: 'inv_7', email: 'sara@tessarolabs.example', role: 'manager', status: 'accepted', invitedBy: 'Marco Rossi', sentAt: daysAgo(63), expiresAt: daysAgo(56) },
  { id: 'inv_8', email: 'l.chen@partner.example', role: 'viewer', status: 'expired', invitedBy: 'Marco Rossi', sentAt: daysAgo(9), expiresAt: daysAgo(2) },
  { id: 'inv_9', email: 'contractor@bridgeline.example', role: 'viewer', status: 'revoked', invitedBy: 'Priya Nair', sentAt: daysAgo(5), expiresAt: daysAgo(-2) },
];

const baseApp = {
  postLogoutRedirectUri: '',
  webOrigins: [] as string[],
  accessTokenMinutes: 15,
  refreshIdleHours: 8,
  allowedRoles: ['owner', 'administrator', 'manager', 'viewer'] as Role[],
  createdBy: 'Adaeze Okafor',
};

export const applications: Application[] = [
  {
    ...baseApp,
    id: 'app_finance',
    name: 'Finance Console',
    description: 'Payables, ledgers and approvals',
    type: 'web',
    clientType: 'confidential',
    clientId: 'finance-console',
    status: 'active',
    createdAt: daysAgo(237),
    redirectUris: ['https://finance.tessarolabs.example/oauth/callback', 'https://finance-staging.tessarolabs.example/oauth/callback'],
    postLogoutRedirectUri: 'https://finance.tessarolabs.example/',
    grantTypes: ['authorization_code', 'refresh_token'],
    allowedRoles: ['owner', 'administrator', 'manager'],
    secretHint: 'aeg_cs_4Hx…Q2m',
    secretRotatedAt: daysAgo(40),
  },
  {
    ...baseApp,
    id: 'app_hub',
    name: 'Customer Hub',
    description: 'Customer records and support',
    type: 'spa',
    clientType: 'public',
    clientId: 'customer-hub-spa',
    status: 'active',
    createdAt: daysAgo(1),
    createdBy: 'Marco Rossi',
    redirectUris: ['https://hub.tessarolabs.example/auth/callback', 'http://localhost:5173/auth/callback'],
    webOrigins: ['https://hub.tessarolabs.example'],
    grantTypes: ['authorization_code', 'refresh_token'],
    secretHint: null,
    secretRotatedAt: null,
  },
  {
    ...baseApp,
    id: 'app_reports',
    name: 'Reporting Service',
    description: 'Nightly exports to the warehouse',
    type: 'm2m',
    clientType: 'confidential',
    clientId: 'reporting-svc',
    status: 'active',
    createdAt: daysAgo(212),
    redirectUris: [],
    grantTypes: ['client_credentials'],
    accessTokenMinutes: 5,
    secretHint: 'aeg_cs_p8T…a1Z',
    secretRotatedAt: daysAgo(212),
  },
  {
    ...baseApp,
    id: 'app_legacy',
    name: 'Admin Portal (legacy)',
    description: 'Replaced by Finance Console',
    type: 'web',
    clientType: 'confidential',
    clientId: 'admin-portal-v1',
    status: 'disabled',
    createdAt: daysAgo(240),
    redirectUris: ['https://admin.tessarolabs.example/callback'],
    grantTypes: ['authorization_code'],
    secretHint: 'aeg_cs_Zz1…0kd',
    secretRotatedAt: daysAgo(240),
  },
];

let eventSeq = 100;
export const auditEvents: AuditEvent[] = [
  { id: 'evt_12', at: daysAgo(0.05), actor: 'Adaeze Okafor', action: 'invitation.created', category: 'invitations', target: 'jide.bello@tessarolabs.example · Manager', result: 'success', sourceIp: '102.89.4.17' },
  { id: 'evt_11', at: daysAgo(0.07), actor: 'tunde@tessarolabs.example', action: 'login.failed', category: 'security', target: 'Account locked after 7 attempts', result: 'failure', sourceIp: '41.58.112.9' },
  { id: 'evt_10', at: daysAgo(0.1), actor: 'Adaeze Okafor', action: 'client.secret.rotated', category: 'credentials', target: 'Finance Console', result: 'success', sourceIp: '102.89.4.17' },
  { id: 'evt_9', at: daysAgo(0.2), actor: 'Kemi Adeyemi', action: 'login.succeeded', category: 'security', target: 'Finance Console · new device', result: 'success', sourceIp: '105.112.30.4' },
  { id: 'evt_8', at: daysAgo(0.8), actor: 'Marco Rossi', action: 'membership.role.changed', category: 'roles', target: 'Kemi Adeyemi · Viewer → Manager', result: 'success', sourceIp: '197.210.8.55' },
  { id: 'evt_7', at: daysAgo(0.82), actor: 'Marco Rossi', action: 'application.created', category: 'applications', target: 'Customer Hub (public client)', result: 'success', sourceIp: '197.210.8.55' },
  { id: 'evt_6', at: daysAgo(1.1), actor: 'Sara Osei', action: 'membership.removed', category: 'members', target: 'Femi Ojo', result: 'denied', sourceIp: '102.88.71.3' },
  { id: 'evt_5', at: daysAgo(2), actor: 'System', action: 'invitation.expired', category: 'invitations', target: 'l.chen@partner.example', result: 'success', sourceIp: null },
  { id: 'evt_4', at: daysAgo(3), actor: 'Adaeze Okafor', action: 'membership.suspended', category: 'members', target: 'Femi Ojo', result: 'success', sourceIp: '102.89.4.17' },
  { id: 'evt_3', at: daysAgo(3.2), actor: 'Priya Nair', action: 'application.redirect_uri.updated', category: 'applications', target: 'Finance Console', result: 'success', sourceIp: '105.112.44.21' },
  { id: 'evt_2', at: daysAgo(4), actor: 'Priya Nair', action: 'invitation.revoked', category: 'invitations', target: 'contractor@bridgeline.example', result: 'success', sourceIp: '105.112.44.21' },
  { id: 'evt_1', at: daysAgo(4.3), actor: 'Marco Rossi', action: 'org.settings.updated', category: 'organization', target: 'MFA required for administrators', result: 'success', sourceIp: '197.210.8.55' },
];

/** Records an event the way the backend would after a successful change. */
export function logEvent(action: string, category: AuditEvent['category'], target: string) {
  auditEvents.unshift({
    id: `evt_${++eventSeq}`,
    at: new Date().toISOString(),
    actor: currentUserName(),
    action,
    category,
    target,
    result: 'success',
    sourceIp: '102.89.4.17',
  });
}

export function currentUserName() {
  return memberships.find((m) => m.person.id === CURRENT_USER_ID)?.person.name ?? 'You';
}

/** Fake secret for demo purposes only. Real secrets come from the backend. */
export function fakeSecret(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let s = 'aeg_cs_';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  for (const b of bytes) s += chars[b % chars.length];
  return s;
}

export function hint(secret: string) {
  return `${secret.slice(0, 10)}…${secret.slice(-3)}`;
}

export function notFound(what: string): never {
  throw new Error(`${what} not found`);
}

/**
 * Mock-mode stand-in for the Keycloak session, so sign-in survives a page
 * refresh while you develop. Only used when VITE_USE_MOCKS=true.
 *   signed-out — the home page is shown
 *   new-user   — just registered, has no business yet (goes to /onboarding)
 *   signed-in  — member of Tessaro Labs
 */
export type MockAuthState = 'signed-out' | 'new-user' | 'signed-in';
const MOCK_AUTH_KEY = 'aegis.mock.auth';

export const mockAuth = {
  get(): MockAuthState {
    try {
      return (sessionStorage.getItem(MOCK_AUTH_KEY) as MockAuthState | null) ?? 'signed-out';
    } catch {
      return 'signed-out';
    }
  },
  set(state: MockAuthState) {
    try {
      sessionStorage.setItem(MOCK_AUTH_KEY, state);
    } catch {
      /* storage blocked: state lasts until refresh */
    }
  },
};
