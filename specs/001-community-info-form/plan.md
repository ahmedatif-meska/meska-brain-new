# Implementation Plan: Community Info Collection Form

**Branch**: `001-community-info-form` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-community-info-form/spec.md`

## Summary

Public, single-page Next.js App Router app that lands a community member
directly on a branded form, validates and submits their personal info, and
upserts into a Supabase Postgres table keyed by email. On a matching email,
the user sees a confirmation popup offering to update; on confirm, the
existing row is updated. Success routes to a dedicated congratulations page.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node 20 LTS (runtime).

**Primary Dependencies**: Next.js 16 (App Router, React Compiler enabled),
React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), `@supabase/supabase-js`
(server-side, called from Route Handlers / Server Actions), `zod` for shared
client/server validation schemas. No component library is added; primitives
are hand-rolled with Tailwind tokens.

**Storage**: Supabase Cloud (managed Postgres). One table:
`community_submissions`. Email is the natural unique key (lowercased,
trimmed). RLS is enabled; the public anon key has NO access to the table.
Writes go through a Next.js server endpoint using a `SUPABASE_SERVICE_ROLE_KEY`
held only on the server.

**Testing**: No test runner is configured in the repo yet. For this feature:
- Add **Vitest** + **@testing-library/react** for component/unit tests.
- Add **Playwright** for one end-to-end happy-path + duplicate-popup test.
- Constitution Principle II requires a failing-first regression test for bug
  fixes and at least one happy-path + one failure-mode test per feature; this
  setup is the minimum to comply.

**Target Platform**: Modern evergreen browsers, mobile 320px → desktop
1920px. Served from Vercel (or equivalent) edge/Node runtime; the submission
endpoint runs on the Node runtime (Supabase service key requires Node).

**Project Type**: Web application — single Next.js app, no separate backend.

**Performance Goals**: Per constitution Principle IV:
- LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at p75 mobile.
- Initial route JS ≤ 200 KB gzipped.
- Submission round-trip (click → congrats page interactive) ≤ 2s p95 on
  Wi-Fi.

**Constraints**:
- No client-side Supabase calls — submission endpoint is server-side only.
- Form must work without JavaScript? **No** — JS is required; a clear
  noscript message is shown if JS is disabled. (Documented assumption.)
- WCAG 2.1 AA: keyboard reachable, visible focus, label-for-control, error
  text announced.
- Brand tokens live in `app/globals.css` via Tailwind v4 `@theme`. Brand
  values themselves are TBD from the user during implementation.

**Scale/Scope**: Small. Expected ≤ 10k total submissions, ≤ 50 concurrent
submitters at launch peaks. Single Supabase project, single table, single
page route, one congratulations route, one API route.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Project constitution v1.0.0. Four principles evaluated:

| Principle | Check | Status |
|-----------|-------|--------|
| I. Code Quality | Strict TS, lint-clean, no speculative abstractions, React-Compiler-aware. Plan adopts strict TS, uses `@/*` alias, no manual memoization. | ✅ |
| II. Testing Standards | Vitest + Playwright introduced as the project's first test runner; happy-path + failure-mode tests planned per the spec's three user stories. | ✅ |
| III. UX Consistency | All visual primitives bound to Tailwind v4 tokens in `app/globals.css`; keyboard + WCAG AA enforced; deliberate empty/loading/success/error states; congratulations page is a designed state. | ✅ |
| IV. Performance Requirements | Server Components default for the form shell; one Client Component island for the interactive form; route JS budget tracked; Supabase calls on Node runtime with explicit timeouts. | ✅ |

**Gate result**: PASS. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/001-community-info-form/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── submit-endpoint.md   # Server endpoint contract
└── checklists/
    └── requirements.md      # Spec quality checklist
```

### Source Code (repository root)

Single Next.js app (the existing scaffold). New files added under the
existing `app/` directory plus a new `lib/` and `components/` tree. Tests
live in a colocated `tests/` directory.

```text
app/
├── layout.tsx                       # existing root layout (brand fonts/meta)
├── globals.css                      # existing — extend Tailwind @theme tokens here
├── page.tsx                         # MODIFIED — render <SubmissionForm/>
├── thank-you/
│   └── page.tsx                     # NEW — congratulations page
└── api/
    └── submissions/
        └── route.ts                 # NEW — POST handler (Node runtime)

components/
├── submission-form.tsx              # NEW — client component, the form
├── duplicate-dialog.tsx             # NEW — popup for existing-email case
└── ui/
    ├── field.tsx                    # NEW — label + input + error primitive
    └── button.tsx                   # NEW — branded button primitive

lib/
├── supabase/
│   ├── server.ts                    # NEW — service-role client factory
│   └── types.ts                     # NEW — generated DB types
├── validation/
│   └── submission.ts                # NEW — zod schema shared client+server
└── env.ts                           # NEW — server env loader (fails fast)

tests/
├── unit/
│   └── submission.schema.test.ts    # NEW — zod schema tests
├── component/
│   └── submission-form.test.tsx     # NEW — RTL form tests
└── e2e/
    └── submission.spec.ts           # NEW — Playwright happy-path + duplicate

supabase/
└── migrations/
    └── 0001_community_submissions.sql  # NEW — table + RLS policy
```

**Structure Decision**: Single Next.js app (Option 1 — single project,
adapted for App Router). Server Components by default; one Client Component
island (`submission-form.tsx`) drives interactivity. The Supabase service
client is constructed only inside the Route Handler — never imported into a
client module.

## Complexity Tracking

> No constitution violations — section intentionally empty.
