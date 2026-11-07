# Aegis frontend

The web dashboard for Aegis: sign-in pages, onboarding, and the organization
workspace (people, invitations, applications, roles, audit logs, developer
integration, settings).

Sign-in, registration, password reset and MFA are **not** in this app —
Keycloak serves those screens with the Aegis login theme. This app shows the
public home page, sends people to Keycloak, and takes over once they're back.

It runs on **sample data** out of the box, so you can click through every
screen before the backend exists. When the backend is ready you change one
setting and the API functions in `src/api/` start calling it.

---

## 1. Run it

You need **Node.js 20 or newer** (free, from https://nodejs.org — pick "LTS").
Check with `node -v`.

```bash
cd aegis-frontend
npm install        # first time only: downloads the libraries into node_modules/
npm run dev        # starts the app
```

Open the link it prints (usually http://localhost:5173). Edits to files show up
in the browser instantly — no restart needed. Stop it with `Ctrl + C`.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run typecheck` | Checks every file for type errors (like a compiler pass) |
| `npm run build` | Typechecks, then produces the production site in `dist/` |
| `npm run preview` | Serves the `dist/` build locally to test it |

In mock mode you start signed out on the home page. **Sign in** takes you
straight to the dashboard; **Get started** acts like a brand-new account and
takes you to "Create your business". The sample data resets when you refresh
the page (the signed-in state survives a refresh until you close the tab).

---

## 2. The stack, in backend terms

| Tool | Think of it as |
| --- | --- |
| **React** | The view layer. Each screen is a function that returns HTML-like markup (JSX) from data. |
| **TypeScript** | Same idea as types in Go/Java/C#. `src/api/types.ts` is your DTOs. |
| **React Router** | The URL → handler table. See `src/App.tsx`. |
| **Vite** | Dev server + bundler (the "build tool"). You rarely touch it. |
| **Plain CSS** | One stylesheet, `src/styles/global.css`. Colours and fonts are variables at the top. |

No state-management or UI framework is used, on purpose — fewer things to learn.

---

## 3. Where things live

```
src/
├── App.tsx              Every URL and which page it shows (the route table)
├── main.tsx             Entry point. You won't need to edit it.
├── api/                 ← Your main area. All backend calls.
│   ├── http.ts          The single fetch() wrapper: base URL, cookies, errors
│   ├── types.ts         Data shapes (Organization, Membership, Application…)
│   ├── people.ts        listMembers, getMember, changeRole, removeMember…
│   ├── invitations.ts   listInvitations, sendInvitations, resend, revoke
│   ├── applications.ts  list/get/create/update, rotateSecret
│   ├── organization.ts  current org, settings, OIDC endpoints, create org
│   ├── audit.ts         listAuditEvents
│   ├── dashboard.ts     getDashboard (summary counts + alerts)
│   ├── account.ts       Hand-off to Keycloak: startSignIn, startRegistration, signOut
│   └── mock-db.ts       The sample data used in mock mode
├── auth/
│   ├── session.tsx      Who's signed in + which org + their role (GET /me)
│   └── permissions.ts   Role → permission table (UI hints only, see §5)
├── hooks/useApi.ts      useApi() loads data; useAction() runs a change
├── components/
│   ├── ui/              Buttons, badges, cards, form fields, modal, toast…
│   ├── layout/          Sidebar, top bar, page frame, auth split-screen
│   ├── RowMenu.tsx      The "⋯" menu on table rows
│   └── SecretReveal.tsx The "copy your client secret now" panel
├── pages/               One file per screen (HomePage = public "/", OnboardingPage = create business)
└── styles/global.css    All styling
```

### How a screen works (read this once)

Open `src/pages/InvitationsPage.tsx`. The pattern is the same everywhere:

```tsx
const all = useApi(() => listInvitations(), []);   // load data when the page opens
const revoke = useAction(revokeInvitation);         // a change, with busy/error state

const result = await revoke.run(inv.id);            // call it from a button
if (result.ok) { toast('Revoked'); all.reload(); }  // then refresh the list
```

`<Async state={all}>` shows a spinner while loading, an error with "Try again"
if it fails, and your content when the data arrives.

---

## 4. Connecting the real backend

1. Copy `.env.example` to `.env.local` and set:
   ```
   VITE_USE_MOCKS=false
   VITE_API_BASE_URL=https://your-backend.example.com/api
   ```
2. Restart `npm run dev`.

Each function in `src/api/*.ts` has the HTTP call it expects written above it,
for example:

```ts
/** PATCH /organizations/current/members/:id  { role } */
export async function changeRole(id: string, role: Role): Promise<Membership> {
  if (USE_MOCKS) { ...sample data... }
  return request('PATCH', `/organizations/current/members/${id}`, { role });
}
```

If your endpoint paths or JSON fields differ, change them **only in `src/api/`**.
If you rename a field in `types.ts`, run `npm run typecheck` — it lists every
screen that needs updating.

Things the frontend expects from the backend:

- **Sign-in through the backend (backend-for-frontend).** The app never talks
  to Keycloak directly. It sends the browser to:
  - `GET /auth/login?returnTo=/people` — start the OIDC authorization-code +
    PKCE flow against Keycloak, then come back to `returnTo`.
  - `GET /auth/register?returnTo=/onboarding` — same, but open Keycloak's
    registration page (e.g. `prompt=create`).
  - `GET /auth/callback` — your redirect URI: exchange the code, set an
    HTTP-only, `Secure`, `SameSite=Lax` session cookie, redirect to `returnTo`.
  - `POST /auth/logout` → `{ "logoutUrl": "…" }` — end the Aegis session and
    return Keycloak's end-session URL.
  - **Only accept a `returnTo` that is a path on this site** (starts with one
    `/`, not `//`), otherwise it's an open redirect.
- **Session via HTTP-only cookie.** Every request is sent with
  `credentials: 'include'`. The browser never stores tokens or secrets. If your
  API is on a different domain, it must allow CORS with credentials for the
  dashboard's origin.
- **`GET /me`** returns `{ user, organization, role }` (see `auth/session.tsx`).
  - `401` → signed out: `/` shows the home page, any other page goes to sign-in.
  - `organization: null` → signed in without a business: the app opens `/onboarding`.
- **401 on any other call** → session expired: the app sends the browser to
  `/auth/login` and back to the same page.
- **Errors** as JSON `{ "message": "…", "code": "…" }`. The message is shown to
  the user as-is, so keep it human-readable.
- **Client secrets** are returned only by create and rotate. List and detail
  responses should include just `secretHint` (e.g. `aeg_cs_9Rk…5Ed`).
- **Member roles in other organizations** should not be returned — only
  `otherOrganizationCount`.

---

## 5. Security notes

- `auth/permissions.ts` only decides what buttons to **show**. The backend must
  check the same permissions on every request; a user can always call the API
  directly.
- A newly issued client secret is held only in the page's memory and is gone
  when the user clicks **Done** or leaves. It is never written to
  localStorage, the URL or logs.
- Nothing sensitive is stored in localStorage or sessionStorage.

---

## 6. Not done yet / decisions for later

- **Keycloak login theme.** Build it from the "Home & sign-in / registration
  flows" section of the design canvas (sign in, MFA, register, recovery,
  required actions).
- **Invitation acceptance.** Not built yet: depends on whether invitations use
  Keycloak Organizations or your own backend.
- **Docs link.** `DOCS_URL` at the top of `src/pages/HomePage.tsx` is a placeholder.
- **Organization switcher.** The button in the sidebar is in place; it needs a
  `GET /me/organizations` call and a way to switch the active organization.
- **Ownership transfer and organization deletion** open a placeholder dialog
  (they need re-authentication and confirmation on the backend).
- **Not built (from the PRD's "later" list):** active sessions, the platform
  admin console, custom access policies.

---

## 7. Changing the look

- Colours, fonts, corner radius: the variables at the top of
  `src/styles/global.css`.
- A button, badge, card etc.: its component in `src/components/ui/` plus its
  class in `global.css` (`.btn`, `.badge`, `.card`…).
- Sidebar links: the `NAV` list in `src/components/layout/Sidebar.tsx`.
- Adding a screen: create `src/pages/MyPage.tsx`, add a `<Route>` in
  `src/App.tsx`, and a link in the sidebar `NAV` list.
