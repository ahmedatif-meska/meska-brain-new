<!--
Sync Impact Report
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: Initial ratification of the constitution. All placeholder tokens
replaced with concrete principles and governance.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. Code Quality
  - [PRINCIPLE_2_NAME] → II. Testing Standards
  - [PRINCIPLE_3_NAME] → III. User Experience Consistency
  - [PRINCIPLE_4_NAME] → IV. Performance Requirements
  - [PRINCIPLE_5_NAME] → removed (template offered 5 slots; 4 principles requested)

Added sections:
  - Engineering Constraints & Standards
  - Development Workflow & Quality Gates
  - Governance

Removed sections:
  - 5th principle placeholder slot

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md — Constitution Check gate references
    align with the four principles below (no edits required; gate is generic).
  - ✅ .specify/templates/spec-template.md — no constitution-driven mandatory
    sections changed.
  - ✅ .specify/templates/tasks-template.md — task categorization compatible
    with testing, performance, and UX principle-driven task types.
  - ✅ CLAUDE.md — runtime guidance remains consistent with new principles.

Follow-up TODOs:
  - None. RATIFICATION_DATE set to today as this is the first adoption.
-->

# Meska Brain Constitution

## Core Principles

### I. Code Quality

All production code MUST be readable, typed, and lint-clean before merge.

- TypeScript strict mode MUST remain enabled; `any` is forbidden except behind a
  documented `// rationale:` comment at the use site.
- `npm run lint` MUST pass with zero errors and zero new warnings on every PR.
- Functions and modules MUST have a single, well-named responsibility. Dead
  code, commented-out code, and speculative abstractions MUST be removed before
  merge — write for the requirement in front of you, not hypothetical future
  ones.
- Path alias `@/*` MUST be used for cross-directory imports; relative
  `../../..` chains are disallowed beyond one level.
- The React Compiler is enabled, so hand-written `useMemo`/`useCallback`
  micro-optimizations MUST NOT be added unless a measured regression justifies
  them.

**Rationale**: Quality is enforced at the gate, not retroactively. Strict
typing and lint hygiene are the cheapest defects to prevent and the most
expensive to chase later.

### II. Testing Standards

Every behavior change MUST be accompanied by an automated check that would
fail without the change.

- When a test runner is introduced, the project MUST adopt it as the default
  CI gate; until then, every PR MUST include a documented manual verification
  plan in its description (commands run, URLs visited, expected vs. observed).
- New user-facing features MUST include at minimum: one happy-path test and
  one failure-mode test.
- Tests MUST be deterministic. Flaky tests MUST be either fixed or quarantined
  with a tracked ticket within one working day of detection — never silently
  retried.
- Integration boundaries (API routes, external services, persistence) MUST be
  covered by integration tests, not only unit tests with mocks.
- Bug fixes MUST be preceded by a failing regression test that locks in the
  fix.

**Rationale**: Without enforced checks, regressions accumulate silently. A
failing-first test proves both the bug and the fix.

### III. User Experience Consistency

The product MUST present a single, coherent interface to users across all
surfaces.

- Visual primitives (color, spacing, typography, radius, motion) MUST come from
  the Tailwind v4 token layer in `app/globals.css`. Ad-hoc hex codes,
  one-off pixel values, or inline styles MUST NOT be introduced for values
  that already exist as tokens.
- Interactive components MUST share consistent behavior for focus, hover,
  disabled, loading, and error states. New components MUST reuse existing
  primitives before introducing new ones.
- All interactive elements MUST be keyboard reachable and meet WCAG 2.1 AA
  contrast and focus-visible requirements.
- Copy MUST follow a consistent voice: sentence case for UI labels, no
  exclamation marks in errors, error messages MUST tell the user what to do
  next.
- Loading and empty states MUST be designed deliberately — never left as a
  blank screen or spinner-only fallback.

**Rationale**: Consistency is what users perceive as "polish". Drift here is
invisible per-PR but compounds into a product that feels untrustworthy.

### IV. Performance Requirements

Performance is a feature and MUST be budgeted, measured, and defended.

- Core Web Vitals targets on the production build MUST be: LCP ≤ 2.5s, INP ≤
  200ms, CLS ≤ 0.1 at the 75th percentile on a mid-tier mobile profile.
- Initial route JavaScript MUST stay under 200 KB gzipped. Adding a dependency
  that pushes a route past this budget requires an explicit justification in
  the PR description and a sign-off recorded under Governance below.
- Server components MUST be the default; `"use client"` MUST be justified by an
  interactivity, browser-API, or third-party-only requirement.
- Database, network, and filesystem calls in request paths MUST have an
  explicit timeout and a non-throwing failure mode.
- Any code change suspected of affecting hot paths (rendering, request
  handling, build) MUST include a before/after measurement in the PR.

**Rationale**: Performance regressions are statistical and slow-moving;
without budgets and per-change evidence they ship unnoticed and are
exponentially costlier to claw back.

## Engineering Constraints & Standards

- Stack baseline: Next.js 16 App Router, React 19 with the React Compiler,
  TypeScript strict, Tailwind v4. Replacing or upgrading any baseline element
  is a constitution-level decision and requires an amendment.
- Secrets MUST NOT be committed. Configuration MUST be loaded from environment
  variables, with `NEXT_PUBLIC_` prefix used only for values safe to expose to
  the browser.
- Dependencies MUST be evaluated for size, maintenance status, and license
  before addition. Prefer the platform (Web APIs, React, Next.js built-ins)
  over a new dependency.
- Public-facing routes MUST set appropriate caching, `robots`, and security
  headers; new routes MUST declare their caching strategy explicitly.

## Development Workflow & Quality Gates

- Every change ships through a pull request. Direct pushes to `main` are
  forbidden.
- Required PR gates before merge:
  1. `npm run lint` passes.
  2. `npm run build` passes.
  3. Manual or automated verification plan completed and recorded.
  4. At least one reviewer approval; reviewer MUST explicitly confirm
     compliance with the four Core Principles.
- PR descriptions MUST list which principles the change touches and call out
  any deviations under "Complexity Tracking".
- Any deviation from a Core Principle MUST be raised before merge, justified
  in writing in the PR, and either accepted as a tracked exception or removed.

## Governance

- This constitution supersedes ad-hoc conventions, individual preferences, and
  prior informal practices. Where this document and other guidance conflict,
  this document wins until amended.
- Amendments MUST be proposed as a PR that modifies this file, includes a Sync
  Impact Report (as the leading HTML comment), updates dependent templates in
  `.specify/templates/`, and is approved by at least one maintainer.
- Versioning policy (semantic):
  - MAJOR — a principle is removed or its meaning is materially redefined in a
    backward-incompatible way.
  - MINOR — a new principle or governance section is added, or guidance is
    materially expanded.
  - PATCH — wording, clarifications, typos, or non-semantic refinements.
- Compliance reviews: every PR review MUST verify principle compliance.
  Quarterly, maintainers MUST audit a random sample of recent PRs against this
  document and file follow-up issues for any drift discovered.
- Performance and accessibility exceptions are time-boxed: any accepted
  exception MUST have an issue with an owner and a target removal date no
  more than 90 days out.

**Version**: 1.0.0 | **Ratified**: 2026-05-21 | **Last Amended**: 2026-05-21
