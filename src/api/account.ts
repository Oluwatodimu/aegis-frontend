/**
 * Sign-in, registration and sign-out.
 *
 * The screens themselves (sign in, register, verify email, reset password,
 * MFA…) are served by Keycloak with the Aegis login theme. This app only
 * sends people there and gets them back:
 *
 *   Browser ──► GET  {API}/auth/login?returnTo=/people
 *               backend starts the OIDC authorization-code + PKCE flow
 *           ──► Keycloak sign-in (Aegis theme)
 *           ──► GET  {API}/auth/callback  (backend exchanges the code, sets an HTTP-only session cookie)
 *           ──► redirect to returnTo
 *
 * The browser never sees access tokens, refresh tokens or client secrets.
 */
import { USE_MOCKS, loginUrl, registerUrl, request } from './http';
import { mockAuth } from './mock-db';

/** Go to Keycloak sign-in. `returnTo` is the page to come back to. */
export function startSignIn(returnTo = '/'): void {
  if (USE_MOCKS) {
    mockAuth.set('signed-in');
    window.location.assign(returnTo);
    return;
  }
  window.location.assign(loginUrl(returnTo));
}

/** Go to Keycloak registration. New accounts come back to /onboarding to create a business. */
export function startRegistration(): void {
  if (USE_MOCKS) {
    mockAuth.set('new-user');
    window.location.assign('/onboarding');
    return;
  }
  window.location.assign(registerUrl('/onboarding'));
}

/**
 * Ends the Aegis session, then the Keycloak session.
 * POST /auth/logout → { logoutUrl } (Keycloak's end-session URL with id_token_hint).
 */
export async function signOut(): Promise<void> {
  if (USE_MOCKS) {
    mockAuth.set('signed-out');
    window.location.assign('/');
    return;
  }
  const { logoutUrl } = await request<{ logoutUrl: string }>('POST', '/auth/logout', undefined, { redirectOnUnauthorized: false });
  window.location.assign(logoutUrl || '/');
}
