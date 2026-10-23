# FitLog — Agent Instructions

## Project Overview

FitLog is a fitness-tracking application built with Vue 3, Vite, Vuetify, Pinia, Vue Router, and Supabase.

The goal is to build a reliable, secure, understandable, and maintainable application while supporting the developer's growth in software engineering.

## Collaboration Principles

The developer owns important engineering decisions. AI agents assist with design and may perform most implementation work.

- Communicate explanations and reviews in Dutch.
- Write code, identifiers, and code comments in English.
- Prioritize simple, readable, maintainable solutions.
- Follow existing project conventions unless there is a justified reason to deviate.
- Prefer focused changes over unrelated refactoring.
- Explain relevant trade-offs without overwhelming the developer with trivial implementation details.

## Development Workflow

Adapt the workflow to the complexity and risk of the task.

### 1. Understand

Before modifying code:

- Inspect the relevant existing implementation and dependencies.
- Identify affected components, composables, stores, database objects, and interfaces.
- Distinguish confirmed behavior from assumptions.
- Clarify material uncertainties before making consequential decisions.

Do not require extensive investigation for trivial changes.

### 2. Design

For non-trivial changes:

- Explain the proposed approach.
- Present meaningful alternatives and their trade-offs where appropriate.
- Identify architectural, data-integrity, security, and maintainability implications.
- Propose a focused implementation and validation plan.

Obtain developer approval before implementing consequential design decisions.

### 3. Implement

Once the approach is agreed upon:

- Perform the implementation without requiring the developer to manually write routine code.
- Preserve established patterns and public interfaces unless changes are explicitly approved.
- Avoid unnecessary dependencies and abstractions.
- Keep changes small enough to review meaningfully.
- Do not perform unrelated cleanup without approval.

Routine, low-risk, clearly scoped changes may be implemented directly.

### 4. Review and Validate

After implementation:

- Review the resulting diff for unintended changes.
- Run relevant available checks and tests.
- During read-only tasks, only run non-mutating verification commands.
- Describe what changed and why.
- Report which checks actually ran and their results.
- Explicitly identify unverified behavior and remaining risks.

Never claim that code was tested if the tests were not executed.

## Decision Boundaries

Obtain explicit developer approval before making or changing
consequential decisions involving:

- Database schemas, relationships, constraints, or migrations.
- Authentication, authorization, or Row Level Security policies.
- Significant architectural changes or new dependencies.
- API contracts, major state-management patterns, or data ownership.
- Destructive operations or changes risking data loss.
- Deployments or production infrastructure changes.

Decisions explicitly approved in the current task do not
require renewed approval unless new risks or design choices emerge.

## Security and Data Safety

- Never expose or commit credentials, tokens, or private environment values.
- Never modify production data without explicit approval.
- Treat database migrations and RLS changes as high-risk operations.
- Prefer development or test environments for database verification.
- Do not bypass security controls for implementation convenience.
- Do not weaken existing authorization or data-isolation guarantees.

## Code Organization

- Keep presentation concerns in Vue components.
- Preserve existing responsibilities of composables, stores, and shared utilities.
- Avoid unnecessary duplication of business logic.
- Do not move logic between architectural layers without explaining the rationale.
- Keep asynchronous operations, loading states, and error handling consistent and explicit.
- Follow existing JavaScript conventions; do not introduce TypeScript without approval.

These are guidelines, not justification for large refactors.

## Verification

After implementing changes:

- Run relevant available validation commands.
- Prefer non-mutating checks such as `npm run lint:check`.
- Run `npm run build` when appropriate.
- Report executed checks, failures, and limitations.

## Learning and Code Review

Optimize for engineering understanding rather than manual code production.

When reviewing meaningful changes, explain:

- Why the solution fits the existing architecture.
- Which important decisions were made.
- What alternatives or trade-offs matter.
- How correctness can be verified.
- What limitations or risks remain.

Focus on concepts, responsibilities, and reasoning rather than explaining every line of boilerplate.

## Completion Report

For non-trivial implementation tasks, conclude with:

- Changes made.
- Reasoning behind significant decisions.
- Validation performed and results.
- Remaining risks or follow-up work.

Keep reports concise and proportional to the task.
