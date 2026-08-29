# Overnight development report — 2026-08-30

## Delivery process

Functional changes use a named feature branch, full existing tests and production build, commit and
push of the branch, merge into `main`, push of `main`, and CI confirmation. This gate was strengthened
after a backend module-isolation test exposed a missing boundary mock.

## Enrollment and My Learning

- Branch: `feature/learning-experience`
- Added authenticated enrollment CTA, payment-required feedback, protected My Learning route, and
  enrollment loading/error/empty/list states.
- Commit: `6a01bd4`; merged to frontend `main` as `8a1f02d`.
- Verification: existing Vitest suite and production build.

## Curriculum, lesson player, and progress

- Branch: `feature/lesson-player`
- Public course detail renders the ordered curriculum and preview labels.
- My Learning links enrolled users into a protected player with curriculum navigation.
- Player loads protected content, restores saved progress, permits explicit position saves, and marks
  lessons complete through the backend transactional progress API.
- Error/loading/completed states are visible and API calls use the existing refresh-aware auth client.
- Verification results are recorded before merge.

## Related backend delivery

See `docs/overnight-development-report-2026-08-30.md` in `ai-learning-api` for Flyway V4/V5,
curriculum contracts, lesson authorization, progress transactions, security rules, commit history,
and the CI correction.

## Phase 3 responsive and browser gate

- Branch: `test/responsive-selenium-smoke`.
- Header and hero typography are mobile-first down to 320px while preserving tablet/desktop density.
- Selenium smoke runs the production preview at 320px, 768px, and 1440px, rejects horizontal overflow,
  verifies the primary home content, and follows the catalog navigation.
- The smoke is part of GitHub Actions after lint, component tests, and production build.
