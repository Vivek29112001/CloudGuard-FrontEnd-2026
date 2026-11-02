# Frontend build milestones

## Delivered in this starter

- Shared dark navigation matching selected mockup, card-based dashboard, responsive layout
- Secure BFF authentication and workspace isolation mechanisms
- Overview/Scan/Inventory/Assistant/Connections/Findings/Reports/Settings
- Server-backed scanning, inventory edits, chat and API verification views
- Reusable DataTable, state badges, metrics, forms and confirmation dialogs
- Explicit demo data mode for local UI review (no live/production AWS access)

## Before production rollout

1. Integrate and test real FastAPI auth, role verification, scans, evidence and chat contracts.
2. Add `/aws/connections` server endpoint for refresh-safe connection restoration.
3. Replace synchronous scan with job creation, polling and cancellation if needed.
4. Integrate real findings/compliance APIs only when results are auditable.
5. Complete accessibility tests (keyboard focus, dialog focus trap, screen-reader labels), e2e tests and visual regression tests.
6. Add robust rate limiting, per-role authorization tests, reverse-proxy hardening, centralized logs and service-level timeout budgets.
7. Produce and commit a reviewed lockfile; enforce SCA/SAST and dependency updates.
