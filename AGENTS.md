# FitLog — Agent Instructions

## Project

FitLog is a fitness-tracking application built with Vue 3, Vite, Vuetify, Pinia, Vue Router, and Supabase, with frontend hosting and deployment on Vercel.

The goal is to build reliable, secure, and maintainable software while supporting the developer's growth in software engineering.

The developer owns consequential engineering decisions; AI handles routine implementation.

## Engineering Rules

- Communicate explanations, design discussions, and reviews in Dutch. Write code, identifiers, and code comments in English.
- Inspect relevant existing code before making changes.
- Follow existing conventions and architectural boundaries.
- Prefer simple, maintainable solutions and focused changes over unnecessary abstractions or refactoring.
- Do not introduce TypeScript or new dependencies without approval.
- Implement routine, low-risk tasks independently.
- Before consequential architecture, security, authentication, authorization, or data-model decisions, explain the recommended approach and obtain developer approval.
- Treat an explicitly approved implementation plan as authorization to implement its agreed scope.
- If new consequential decisions or significant risks emerge, discuss them before proceeding.
- Do not perform unrelated changes without approval.

## Environments and Deployment

### Development

- Frontend: Vue 3 + Vite, running locally.
- Database: Supabase `FitlogDB-test` (`yfupaojunwlqjnthxrlc`).
- Local environment variables are stored in `.env` and must not be committed.
- Use the development database for feature development and testing.
- Treat the remote development database as persistent; do not reset or destroy it without explicit approval.

### Production

- Frontend: Hosted on Vercel, deployed from the `main` branch.
- Database: Supabase `FitlogDB-prod` (`uxmvhvtsthukvicjajdw`).
- Production environment variables are configured in Vercel.
- Production contains real user data and must be treated as non-disposable.

### Git and Deployment

- Prefer feature branches and small, reviewable commits.
- Do not push directly to `main` or merge pull requests without explicit developer approval.
- Changes merged into `main` may automatically trigger a Vercel production deployment.
- Frontend deployments and database migrations are separate operations.
- Do not assume merging code automatically applies database migrations.
- Consider frontend/database schema compatibility when planning releases.
- Vercel preview deployments must not unintentionally connect to the production database.

### Database Safety

- Never run production migrations, resets, destructive SQL, or data modifications without explicit developer approval.
- Never reset a remote Supabase database, including development, without explicit approval.
- Always verify the target Supabase project before executing remote database commands.
- Do not infer the Supabase CLI target from frontend environment variables.
- Create schema changes as version-controlled SQL migrations in `supabase/migrations/`.
- Validate migrations in development before proposing production deployment.
- Prefer read-only inspection and dry-run commands when available.
- Before production database changes, explain the target, intended commands, expected impact, and rollback considerations.
- Do not weaken existing authorization or data-isolation guarantees.

### Secrets

- Never commit `.env` files, passwords, tokens, secret keys, or service-role keys.
- Never expose secrets in logs, commits, or completion reports.

## Testing and Verification

- Add or update automated tests for new features, bug fixes, and changed behavior when they provide meaningful regression protection.
- Prioritize business logic, data validation, authentication, authorization, and error handling.
- Design new logic to be testable without introducing unnecessary abstractions solely for testing.
- Follow existing testing tools and conventions; do not introduce a new testing framework without approval.
- Prefer tests that verify observable behavior over implementation details.
- Run relevant tests and checks before completing a task.
- Use `npm run lint:check`, `npm run format:check`, and `npm run build` when appropriate.
- Review the resulting diff for unintended changes.
- If tests are not added or cannot be executed, explain why and identify remaining verification gaps.
- Do not fix unrelated pre-existing failures without approval.
- Never claim tests or checks passed unless they were actually executed.

## Completion Report

After completing a task, provide a concise report covering:

- **Changes:** What behavior changed and which relevant files were modified.
- **Decisions:** Important implementation choices, assumptions, and deviations from the agreed plan.
- **Verification:** Commands executed, test and build results, and acceptance criteria status when defined.
- **Remaining concerns:** Known limitations, unverified behavior, and remaining risks.

Keep reports proportional to the task. Omit irrelevant details, but never omit failed checks or significant risks.
