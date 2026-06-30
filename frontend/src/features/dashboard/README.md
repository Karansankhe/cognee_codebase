# Patient Dashboard

First frontend target for Pulse.

This page should define the shared contract between frontend and backend:

- Patient snapshot
- Connected data sources
- Live symptom and treatment timeline
- Current detected trigger pattern
- Memory graph preview
- Pattern-consistency score
- Evidence citations
- Quick actions for logging, summary generation, and caregiver sharing

Use TypeScript for data shapes and Tailwind utility classes for styling. Avoid page-specific CSS files unless they only contain Tailwind directives required by the app setup.

## Files

- `types/dashboard.types.ts` - shared frontend/backend dashboard contract
- `mocks/dashboard.mock.ts` - local demo data shaped like the expected API response
- `api/dashboard.api.ts` - replace `getDashboardData()` with the real backend call
- `components/` - dashboard-only UI sections
- `../../pages/dashboard/DashboardPage.tsx` - page composition

## Backend Handshake

The first backend endpoint can return the `DashboardData` shape directly:

```ts
GET /api/dashboard
```

Once that endpoint exists, update `api/dashboard.api.ts` and keep the page/components unchanged.
