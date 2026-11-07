/**
 * Who is signed in and which organization they're working in.
 *
 * Loaded from GET /me when the app starts:
 *   401                          → signed out (show the home page)
 *   200 with organization: null  → signed in, no business yet (→ /onboarding)
 *   200 with organization        → normal workspace
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, USE_MOCKS, delay, request } from '../api/http';
import * as db from '../api/mock-db';
import type { Role } from '../api/types';
import { can, type Permission } from './permissions';

export interface User {
  id: string;
  name: string;
  email: string;
}

/** Shape of GET /me. */
export interface Me {
  user: User;
  organization: { id: string; name: string; slug: string } | null;
  role: Role | null;
}

/** A signed-in user working inside an organization. */
export interface Session {
  user: User;
  organization: { id: string; name: string; slug: string };
  role: Role;
}

async function loadMe(): Promise<Me | null> {
  if (USE_MOCKS) {
    const state = db.mockAuth.get();
    if (state === 'signed-out') return delay(null, 150);
    const me = db.memberships.find((m) => m.person.id === db.CURRENT_USER_ID)!;
    const user = { id: me.person.id, name: me.person.name, email: me.person.email };
    if (state === 'new-user') return delay({ user, organization: null, role: null }, 150);
    return delay({ user, organization: { id: db.organization.id, name: db.organization.name, slug: db.organization.slug }, role: me.role }, 150);
  }
  try {
    return await request<Me>('GET', '/me', undefined, { redirectOnUnauthorized: false });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

interface SessionContextValue {
  /** Signed-in user, with or without an organization. null = signed out. */
  me: Me | null;
  /** Set only when the user is inside an organization. Workspace pages use this. */
  session: Session | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMe(await loadMe());
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const session: Session | null = me?.organization && me.role ? { user: me.user, organization: me.organization, role: me.role } : null;

  return <SessionContext.Provider value={{ me, session, loading, error, refresh }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

/** `const canInvite = useCan('members.invite')` — for showing/hiding UI only. */
export function useCan(permission: Permission): boolean {
  const { session } = useSession();
  return session ? can(session.role, permission) : false;
}
