/**
 * Every URL in the app and the screen it shows.
 * To add a screen: create it in src/pages, then add a <Route> here and a
 * link in src/components/layout/Sidebar.tsx.
 *
 * Sign-in, registration, password reset and MFA are NOT here: Keycloak serves
 * them with the Aegis login theme (see src/api/account.ts).
 */
import { BrowserRouter, Route, Routes } from 'react-router';
import { SessionProvider } from './auth/session';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/ui';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeveloperPage } from './pages/DeveloperPage';
import { InvitationsPage } from './pages/InvitationsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { OrgSettingsPage } from './pages/OrgSettingsPage';
import { PeoplePage } from './pages/PeoplePage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { RegisterApplicationPage } from './pages/RegisterApplicationPage';
import { RolesPage } from './pages/RolesPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SessionProvider>
          <Routes>
            {/* First sign-in after registering: create a business */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* "/" is the public home page when signed out, the dashboard when signed in.
                Every other page here sends signed-out visitors to Keycloak sign-in. */}
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/people/:id" element={<PersonDetailPage />} />
              <Route path="/invitations" element={<InvitationsPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/applications/new" element={<RegisterApplicationPage />} />
              <Route path="/applications/:id" element={<ApplicationDetailPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/developer" element={<DeveloperPage />} />
              <Route path="/settings" element={<OrgSettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
