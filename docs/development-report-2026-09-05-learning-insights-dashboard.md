# Phase 6.4 development report — Responsive Learning Insights Dashboard

Date: 2026-09-05

Branch: `feature/learning-insights-dashboard`

Status: implementation, local quality gates, Selenium responsive checks, and direct visual QA complete; feature/main Git delivery remains open in the Phase 6.4 checklist.

## Outcome

The protected `/dashboard` route now gives a learner a useful completion overview instead of a placeholder. It combines the Phase 6.3 learner-scoped analytics response with the existing enrollment response, presents lifetime totals and recent per-course completion activity, and links known courses back to the lesson experience.

The implementation preserves the existing API and route contracts. It adds no backend endpoint, browser-side analytics authority, chart dependency, state-management library, or production mock.

## Structure and maintainability

- API response types live in `src/types/analytics.ts`.
- Pure, independently tested enrollment joining and locale formatting live in `src/features/analytics/learningAnalytics.ts`.
- Fetch lifecycle and page-state orchestration live in `LearningInsightsPage`.
- The existing refresh-aware `AuthContext.request` remains the only authenticated HTTP boundary.
- The obsolete placeholder `DashboardPage` was removed instead of retained as dead code.
- The established protected `/dashboard` route was reused, avoiding a duplicate insights route.
- The authenticated header now enters the dashboard; the page provides an explicit path to `/my-learning`.

## UX and responsive behavior

- Loading state uses a stable status region and skeleton surfaces without flashing the empty state.
- Error state exposes a safe message and a user-triggered retry; it does not retry in a loop.
- Empty state explains how analytics becomes available and links to enrolled courses.
- Data state shows three summary metrics and a backend-ordered, maximum-20 course activity list.
- Missing enrollment/catalog metadata degrades to a deterministic neutral course label while retaining the aggregate.
- Vietnamese number/date formatting uses the browser time zone and invalid timestamps degrade safely.
- Mobile uses a single-column hierarchy; summary cards expand to three columns from the tablet breakpoint.
- Interactive links and buttons have an approximately 44 px minimum height, visible focus behavior, semantic headings/regions/lists, and exact text alongside color.

Direct production-preview verification measured no horizontal overflow at 320 px, 768 px, or 1440 px. The dashboard rendered the authenticated heading, metrics, course metadata, timestamps, and resume action with no browser console warning/error.

## Security and performance

- The request remains `GET /me/learning-analytics?courseLimit=20`; no learner id, email, access token, or other identity is placed in the URL or DOM attributes.
- Authentication and one-time 401 refresh continue through the existing in-memory token boundary.
- Analytics and enrollments load concurrently and are joined in linear time using a course-id map.
- An effect-lifecycle guard prevents stale async state updates after retry or unmount.
- There is no polling, persistence to browser storage, raw HTML rendering, or unbounded client fetch.
- The Selenium authentication/API fixture is injected only into the isolated browser test document through DevTools and is absent from the production bundle.

## Tests and gates

Baseline before implementation:

```text
pnpm lint
pnpm test    — 14 files, 19 tests passed
pnpm build   — passed
```

Final local gate:

```text
pnpm lint
pnpm test    — 16 files, 24 tests passed
pnpm build   — passed (306.44 kB JS / 93.99 kB gzip; 23.65 kB CSS / 5.58 kB gzip)
pnpm test:e2e — passed at 320 px, 768 px, and 1440 px
git diff --check — passed
```

Coverage added:

- Pure join ordering, known metadata, unknown-course fallback, count formatting, and timestamp degradation.
- Page data rendering, bounded endpoint calls, resume link, empty state, API error, and explicit retry.
- Authenticated production-build dashboard rendering and horizontal-overflow checks at all required breakpoints.

## Files changed

- `docs/phase-6.4-learning-insights-dashboard-plan.md`
- `docs/development-report-2026-09-05-learning-insights-dashboard.md`
- `scripts/selenium-smoke.mjs`
- `src/app/App.tsx`
- `src/components/AppHeader.tsx`
- `src/features/analytics/LearningInsightsPage.tsx`
- `src/features/analytics/LearningInsightsPage.test.tsx`
- `src/features/analytics/learningAnalytics.ts`
- `src/features/analytics/learningAnalytics.test.ts`
- `src/types/analytics.ts`
- removed `src/features/learning/DashboardPage.tsx`

## Commits before this report

- `eea89f5 docs: define learning insights dashboard`
- `6326421 feat: model learner analytics insights`
- `7a8d737 feat: add responsive learning insights dashboard`
- `e693f72 test: verify responsive insights dashboard`

## Remaining delivery gate

- Run the final gate on the report-complete feature head.
- Push the feature branch and require green feature CI.
- Merge into `main`, rerun all local gates, push `main`, and require green main CI.
- Record the immutable feature/main CI links and merge commit in the next delivery-evidence update.
