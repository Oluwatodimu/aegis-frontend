import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { startSignIn } from '../../api/account';
import { useSession } from '../../auth/session';
import { HomePage } from '../../pages/HomePage';
import { ErrorState, Loading } from '../ui';
import { Sidebar } from './Sidebar';

export interface ShellContext {
  openMenu: () => void;
}

/**
 * Frame for every signed-in screen: sidebar on the left, page on the right.
 *
 *   signed out on "/"          → the public home page
 *   signed out anywhere else   → Keycloak sign-in, then back to that page
 *   signed in, no business yet → /onboarding
 */
export function AppLayout() {
  const { me, session, loading, error, refresh } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const signedOut = !loading && !error && !me;
  const deepLink = signedOut && location.pathname !== '/';

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (deepLink) startSignIn(location.pathname + location.search);
  }, [deepLink, location.pathname, location.search]);

  if (loading && !me) return <Loading label="Loading your workspace…" />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;
  if (signedOut) return deepLink ? <Loading label="Redirecting to sign in…" /> : <HomePage />;
  if (!session) return <Navigate to="/onboarding" replace />;

  return (
    <div className="shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <button type="button" className="nav-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <div className="shell-main">
        <Outlet context={{ openMenu: () => setMenuOpen(true) } satisfies ShellContext} />
      </div>
    </div>
  );
}
