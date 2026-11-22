# Contributing to An-Atomized

This project is a learning prototype. Keep changes small, maintainable, and
focused on the requested task.

## Feature workflow

1. Read `BACKLOG.md` and confirm which item the next request covers. Do not
   reorder the backlog without approval.
2. Create a Git checkpoint before changing application behavior.
3. Inspect the related code and preserve existing working functionality.
4. Implement one complete feature. Do not start the next backlog item early.
5. Run the TypeScript check, production build, and browser smoke tests:
   `npm run typecheck`, `npm run build`, and `npm run test:e2e`.
6. If a check fails, stop and resolve or report the failure before proceeding.
7. Review `git diff` for unrelated changes. Commit the feature only after all
   checks pass.
8. Report the changed files, checks run, and any remaining issues.

## Browser tests

Install the project's dependencies with `npm install`. Install Playwright's
Chromium browser once with `npx playwright install chromium`, then run the
smoke tests with `npm run test:e2e`.

The smoke tests are a complement to visual inspection, not a replacement for
it. Anatomy assets and clinical claims require separate quality and licensing
review.
