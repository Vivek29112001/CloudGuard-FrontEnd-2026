# CloudGuard — Next.js frontend

A modular, evidence-aware frontend based on the supplied AWS Auditor Streamlit UI and approved dark-sidebar dashboard reference.

## Tech stack

- **Next.js 16.4.3 / React 19.3.1 / TypeScript**, App Router
- **Tailwind CSS 4**, shadcn/ui-compatible local primitives in `src/components/ui/`, Lucide icons
- TanStack Query for backend data, TanStack-style reusable table pattern, Recharts for verified resource distribution
- **Existing Python FastAPI + AWS MCP backend retained** (default `http://127.0.0.1:8000/api`)

> **Important:** Security Findings, High Risk and Compliance Score are intentionally marked unavailable until a real findings/compliance API exists. AWS inventory data is not security findings. The mock design numbers are NOT used as live AWS evidence.

## Quick start (Windows PowerShell)

```powershell
cd xyz-aws-auditor-nextjs
Copy-Item .env.example .env.local
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# Paste the generated value into SESSION_SECRET in .env.local
npm install
npm run dev
```

Open `http://localhost:3000/login`. Ensure your existing FastAPI backend is serving `/api` on port 8000 and has matching auth/workspace endpoints.

In **local development only**, set `ENABLE_DEMO=true` in `.env.local` and visit `http://localhost:3000/overview` to preview the design without FastAPI. Sample data is clearly labeled and demo writes are disabled server-side. Never use demo mode for auditing or production.

## Project layout

```text
src/
  app/
    (public)/           login, register, onboarding
    (dashboard)/        overview, scan, inventory, assistant, findings, reports, connections, settings
    api/                auth routes, workspace selection, allowlisted backend BFF gateway
  components/
    ui/                 reusable shadcn-compatible design primitives
    shared/             DataTable, MetricCard, badges, dialog, loading and empty states
    layout/             application shell, sidebar, workspace selector, query provider
  features/             feature-specific container components
  lib/
    api/                typed clients, hooks and backend fetcher
    security/           JWE session cookie and same-origin mutation checks
    fixtures/           explicitly labeled, development-only sample data
    utils/              formatting and className utilities
  types/                backend contract types
```

### Security design

1. Browser **never sees the FastAPI bearer token**: the Next.js BFF stores it in a protected, encrypted, `HttpOnly`, `SameSite=Lax` cookie. It is not persisted in `localStorage` or embedded in HTML.
2. `SESSION_SECRET` must be at least 32 random characters. Cookie uses `__Host-` prefix and `Secure` in production. Deploy only on HTTPS.
3. Next.js gateway uses a **strict allowlist** for supported backend routes and methods. Untrusted upstream URLs and arbitrary client auth headers are rejected.
4. Browser writes are checked against same-origin `Origin` headers (configure `APP_ORIGIN`); production should also configure an explicit origin via trusted reverse-proxy rules and deploy rate limiting, CSP nonces and an audit log at the edge.
5. Workspace selection is checked against the authenticated user's `/workspaces` membership, then server-derived workspace ID is forwarded in `X-Workspace-ID`. **FastAPI remains responsible for tenant authorization on every resource**; frontend checks are not a security boundary.
6. Credentials from client forms are sent only to the same-origin BFF, then to configured FastAPI. Credential persistence/encryption, AWS least privilege, IAM trust policy and STS enforcement remain **backend responsibilities**.
7. React escapes default text and assistant markdown does not permit raw HTML. CSV exports neutralize formula-leading cells. No fabricated scan status/percentages.
8. Do not commit `.env.local`. Enforce secret rotation, production request/body size limits, backend audit logging, rate limits, endpoint tests and SAST in deployment.

### Important backend integration limitations

- The supplied Streamlit UI uses a synchronous `/aws/connections/{id}/scan/refresh`. In production, longer-running scans need a background job with a status endpoint; Next.js/BFF hosting platforms may time out otherwise.
- There is no documented general-purpose `GET /aws/connections` endpoint in the supplied Streamlit file. Before any scan exists, non-secret connection metadata is retained in the encrypted browser session after successful verification, but a new login or expired session may require re-verification. Add a tenant-scoped backend connection-list endpoint for durable restoration.
- Security findings, risk scoring, framework-specific compliance controls and selectable scan categories need new, versioned backend contracts before use. UI provides explicit placeholders rather than fake metrics.
- The existing backend may return additional resource metadata. Extend types and mappers after checking actual JSON responses; do not deduce verified workloads from AWS Config type counts.
- `GET /aws/scans/active` may return 404 when no active scan is present. The frontend treats that as an empty state.

## Dev / quality checks

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Dependencies could not be installed or built in the generation environment due to unavailable npm network access. Perform these commands locally and commit the resulting `package-lock.json` for reproducible builds. Before every deployment, run `npm audit`, patch dependencies and execute backend integration tests against a dedicated test workspace.

## Routing and design

- `/overview`: the reference dashboard layout, real inventory count, no unverified security scores
- `/scan`: full discovery using existing scan-refresh API
- `/inventory`: services, resources, Regions, revisions, billing; service edits gated by backend permissions
- `/assistant`: persisted snapshot-scoped chat, contextual read-only AWS questions
- `/connections`: cross-account AssumeRole and temporary access-key POC
- `/findings`: awaiting validated findings backend
- `/reports`: safe read-only CSV exports from loaded evidence
- `/settings`: workspace create/rename/delete and connection metadata

## Add official shadcn components

The project contains shadcn-compatible basic primitives and `components.json`. To replace or extend with official registry components, run e.g.

```powershell
npx shadcn@latest add dialog sheet table select dropdown-menu tooltip skeleton
```

Review the generated diff and preserve established design tokens, component APIs and accessibility behaviors. Prefer code-owned components over pulling in heavyweight UI suites.
"# Multi-Cloud-MCP-Audit-NLP-Intelligence-Platform-Front-end"
