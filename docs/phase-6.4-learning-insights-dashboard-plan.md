# Phase 6.4 — Responsive Learning Insights Dashboard

## Outcome

An authenticated learner can understand completed-learning activity at a glance and resume a course from the same protected learning space. The UI consumes the bounded analytics contract delivered in Phase 6.3; it does not calculate authoritative analytics in the browser or accept another learner's identity.

## Existing API contract

```http
GET /api/v1/me/learning-analytics?courseLimit=20
Authorization: Bearer <access token>
```

```json
{
  "completedLessons": 12,
  "coursesWithCompletions": 3,
  "lastCompletedAt": "2026-09-04T10:00:00Z",
  "courses": [
    {
      "courseId": "8aff449f-cfa6-4ed8-a3e7-5461090ee101",
      "completedLessons": 5,
      "lastCompletedAt": "2026-09-04T10:00:00Z"
    }
  ]
}
```

The analytics projection intentionally contains stable identifiers and counts, not mutable catalog text. The page joins those bounded aggregates with the learner's existing enrollment response in memory. Unknown course ids remain visible with a neutral fallback label instead of causing the whole dashboard to fail.

## Frontend structure

- Keep API response types in `src/types/analytics.ts`.
- Keep pure presentation formatting and enrollment-to-analytics joining in `src/features/analytics/learningAnalytics.ts`.
- Keep data loading and page-state orchestration in `LearningInsightsPage`.
- Reuse the refresh-aware authenticated `request` boundary from `AuthContext`.
- Replace the placeholder at the existing protected `/dashboard` route and add an authenticated navigation entry; do not introduce a second route for the same concept.
- Do not add a generic state library, chart dependency, API wrapper, or premature abstraction for this single read model.

## UX states and information hierarchy

- Loading: stable skeleton-like regions with status text; no empty-state flash.
- Error: safe Vietnamese message and an explicit retry action.
- Empty: explain that insights appear after a completed lesson and link to the learner's courses.
- Data: summary cards, latest activity, and a bounded course list ordered by backend activity order.
- Course metadata unavailable: show a short stable-id fallback and keep the aggregate visible.
- Dates use Vietnamese locale and the browser's time zone; invalid timestamps degrade to a neutral label.
- Counts use Vietnamese number formatting and correct singular/plural phrasing.

## Responsive and accessible behavior

- Mobile-first at 320 px; no horizontal scrolling or fixed-width chart canvas.
- Summary cards use one column on small screens, then expand at tablet/desktop widths.
- Course rows retain a readable text hierarchy and at least 44 px interactive targets.
- Semantic landmarks, headings, lists, `time` elements, status regions, visible focus, and retry button labels are required.
- Meaning is never conveyed by color alone. Decorative progress bars are hidden from assistive technology and paired with exact text counts.
- Respect the existing color and spacing system; use restrained data visualization instead of copying another product's branding or layout.

## Security and performance constraints

- Never place user id, access token, email, or other personal data in the analytics URL, logs, DOM attributes, or persistent browser storage.
- Fetch only the fixed server-bounded `courseLimit=20` response and current enrollments.
- Cancel stale state updates when the page unmounts and avoid retry loops.
- Keep derived joins linear through a course-id map; do not add client polling because analytics is an on-demand summary.
- Render server-provided text as React text content only.

## Delivery checklist

- [x] Confirm API Phase 6.3 feature/main CI success and clean frontend `main`.
- [x] Run baseline type-check, 19 unit/component tests, and production build.
- [x] Record contract, component boundaries, UX states, security, performance, and responsive constraints before implementation.
- [x] Add analytics types plus pure formatting/join behavior with unit tests.
- [x] Add the protected responsive insights page with loading, error/retry, empty, fallback, and data states.
- [x] Add route and authenticated navigation without changing existing public routes.
- [x] Extend responsive browser smoke coverage to 320 px, 768 px, and 1440 px.
- [x] Run type-check, all component tests, production build, and Selenium smoke with no skipped gate.
- [x] Audit accessibility, token/identity leakage, unsafe rendering, request bounds, overflow, and diff formatting.
- [ ] Commit cohesive slices, push feature, require green feature CI, merge `main`, rerun all gates, push, and require green main CI.
- [x] Publish the Phase 6.4 development report with file, test, security, responsive, commit, and CI evidence.
