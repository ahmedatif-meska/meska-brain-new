---
description: "Task list for Community Info Collection Form (feature 001)"
---

# Tasks: Community Info Collection Form

**Input**: `specs/001-community-info-form/` (spec.md, plan.md, research.md, data-model.md, contracts/submit-endpoint.md, quickstart.md)

**Tests**: Included — constitution Principle II requires automated checks for behavior changes; this feature introduces the project's first test runner (Vitest + Playwright).

**Organization**: Tasks grouped by user story. User Story 1 is the MVP and is independently deployable. Stories 2 and 3 layer on additional robustness.

## Format

`- [ ] TID [P?] [Story?] Description (path)`

- `[P]` — parallelizable with other `[P]` tasks in the same phase (different files, no dependencies on incomplete work).
- `[USn]` — user story label (only on user-story phases).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dependencies, dev tooling, and the file scaffolding the feature needs.

- [X] T001 Add runtime dependencies via `npm install @supabase/supabase-js zod react-hook-form @hookform/resolvers` in repo root.
- [X] T002 Add dev dependencies via `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test` in repo root.
- [X] T003 [P] Add `test` and `test:e2e` scripts to `package.json` (vitest + playwright entries).
- [X] T004 [P] Create `vitest.config.ts` at repo root (jsdom env, path alias `@/*`, setup file `tests/setup.ts`).
- [X] T005 [P] Create `tests/setup.ts` importing `@testing-library/jest-dom`.
- [X] T006 [P] Create `playwright.config.ts` at repo root (baseURL `http://localhost:3000`, webServer `npm run dev`, single chromium project).
- [X] T007 [P] Add `.env.local.example` at repo root with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` placeholders.
- [X] T008 [P] Add the logo asset to `public/brand/meska-logo-white.png` (source: `Meska2026 LOGO white.png` provided by user).
- [X] T009 [P] Extend `app/globals.css` with a Tailwind v4 `@theme` block defining `--color-brand-primary: #1E66FF;`, `--color-brand-field-bg: #EEF3F8;`, `--color-brand-on-primary: #ffffff;`, and a Calibri-leading `--font-sans` stack.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, validation schema, env loader, and Supabase server client. Every user story depends on these.

- [X] T010 Create `supabase/migrations/0001_community_submissions.sql` implementing the `community_submissions` table, generated columns (`email_normalized`, `phone_e164`), unique index on `email_normalized`, CHECK constraints from `data-model.md`, RLS enable with no policies, and a `last_updated_at` BEFORE UPDATE trigger.
- [ ] T011 Apply the migration to the Supabase Cloud project (via Dashboard SQL Editor or `supabase db push`). **REQUIRES USER ACTION** — needs Supabase credentials.
- [X] T012 Create `lib/env.ts` exporting a server-only env loader that reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, throws on missing values at module load.
- [X] T013 Create `lib/supabase/server.ts` exporting `getServerSupabase()` that builds a service-role client using `lib/env.ts`. File starts with `import 'server-only'`.
- [X] T014 [P] Create `lib/supabase/types.ts` with the hand-written TypeScript row type for `community_submissions` matching `data-model.md` (no codegen for v1).
- [X] T015 Create `lib/validation/submission.ts` exporting:
  - Display-label maps for Q1–Q8 (UI labels keyed by option code).
  - `submissionSchema` (zod) covering all 14 form fields, the option-code enums, Q1 `min(1)`, Q3 `min(1).max(2)`, display-name two-token rule, LinkedIn regex, phone country-code regex + national 10-digit rule, optional `aiProfile` matching the AI Profile schema in `data-model.md`, honeypot `company_website` must be empty, `confirmUpdate: boolean`.
- [X] T016 [P] Create `lib/validation/countries.ts` exporting the static country list `[{ code: 'EG', dialCode: '+20', name: 'Egypt' }, …]` (≈240 entries) and a `defaultDialCode = '+20'` constant.
- [X] T017 [P] Create `lib/rate-limit.ts` with a simple in-memory IP token bucket (5 attempts / 10 min) — interim per research R7; export `checkRateLimit(ip)`.
- [X] T018 [P] Create `lib/copy.ts` exporting the fixed AI-extraction prompt string (verbatim from FR-003b) and the consent text + `CONSENT_VERSION = '2026-05-21'`.

---

## Phase 3: User Story 1 — Submit personal info via the public form (P1, MVP)

**Story goal**: A community member opens the app, fills the form, clicks Submit, sees the congratulations page, and a row exists in `community_submissions`.

**Independent test**: From `/` fill every field with valid values → click Submit → `/thank-you` renders → Supabase Table Editor shows a new row.

### Tests (write first; must fail before implementation)

- [X] T019 [P] [US1] Unit tests for `submissionSchema` in `tests/unit/submission.schema.test.ts` covering: valid payload accepts; missing required fails; invalid email fails; LinkedIn pattern enforced; phone 10-digit rule; display-name two-token rule; honeypot non-empty fails.
- [X] T020 [P] [US1] Component test for `SubmissionForm` in `tests/component/submission-form.test.tsx` rendering with mocked fetch returning `201 created`, asserting `router.push('/thank-you')` is invoked.
- [X] T021 [P] [US1] Playwright happy-path test in `tests/e2e/submission.spec.ts` that fills the form and asserts `/thank-you` and a created row (uses a test-only Supabase schema OR a stub route — see T035).

### Server endpoint

- [X] T022 [US1] Create `app/api/submissions/route.ts` (Node runtime, `export const runtime = 'nodejs'`) implementing the contract in `contracts/submit-endpoint.md`:
  - Read JSON body, enforce `x-requested-with: fetch` header.
  - Honeypot non-empty → return `200 { status: 'dropped' }` without DB call.
  - Rate-limit check via `lib/rate-limit.ts`; on hit return `429 { status: 'rate_limited', retryAfterSeconds }`.
  - Validate with `submissionSchema`; on failure return `400 { status: 'invalid', issues }`.
  - Normalize email; `SELECT id FROM community_submissions WHERE email_normalized = $1`.
  - If no row and `confirmUpdate === false`: INSERT → return `201 { status: 'created', id }`. Handle Postgres `23505` race by retrying as the "exists" path.
  - If row exists and `confirmUpdate === false`: return `200 { status: 'exists', id }`.
  - If row exists and `confirmUpdate === true`: UPDATE with new values + `last_updated_at = now()` → return `200 { status: 'updated', id }`.
  - 5s timeout wrapper around the Supabase call → `503 { status: 'upstream_unavailable' }` on timeout/failure.
  - Logging per `contracts/submit-endpoint.md` (no PII in logs).

### UI primitives

- [X] T023 [P] [US1] Create `components/ui/button.tsx` — branded button primitive (primary, secondary variants; disabled + loading states; keyboard + focus-visible).
- [X] T024 [P] [US1] Create `components/ui/field.tsx` — label + control + inline error wrapper, ARIA wiring (`aria-invalid`, `aria-describedby`).
- [X] T025 [P] [US1] Create `components/ui/choice-pill.tsx` — pill/card with selected/unselected variants using `--color-brand-primary` / `--color-brand-field-bg` tokens; supports single and multi-select via props; keyboard navigation (Space/Enter to toggle, arrow keys to move).
- [X] T026 [P] [US1] Create `components/ui/phone-input.tsx` — country `<select>` populated from `lib/validation/countries.ts` (default `+20`) plus a 10-digit numeric input; emits `{ countryCode, national }`.
- [X] T027 [P] [US1] Create `components/ui/copy-prompt.tsx` — read-only code block + "Copy prompt" button that uses `navigator.clipboard.writeText` and shows a 2s "Copied!" confirmation. Uses prompt text from `lib/copy.ts`.

### Form & page

- [X] T028 [US1] Create `components/submission-form.tsx` (client component) wiring `react-hook-form` + `zodResolver(submissionSchema)`. Renders the 5 contact fields (using `field.tsx`, `phone-input.tsx`), Q1–Q8 (using `choice-pill.tsx` in single or multi modes per FR-003), the consent checkbox, the optional AI-profile textarea (`copy-prompt.tsx` above it), and the Submit button. On submit:
  - Disable submit while in flight.
  - POST to `/api/submissions` with `confirmUpdate: false` and the `x-requested-with: fetch` header.
  - On `201 created` or `200 updated`/`200 dropped` → `router.push('/thank-you')`.
  - On `200 exists` → open `<DuplicateDialog>` (T029).
  - On `400 invalid` → map zod issues to per-field RHF errors and focus the first invalid field.
  - On `429` / `503` → render an inline alert banner; preserve all form values.
  - Honeypot input (`name="company_website"`) rendered visually hidden with `tabIndex={-1}` and `autoComplete="off"`.
- [X] T029 [US1] Create `components/duplicate-dialog.tsx` — accessible modal (focus trap, Esc to close, `aria-modal`) with "Update with new info" and "Cancel" buttons. Confirm re-POSTs the submission with `confirmUpdate: true`; Cancel / Esc / overlay-click closes without writing.
- [X] T030 [US1] Modify `app/page.tsx` to render the Meska logo (from `public/brand/meska-logo-white.png` via `next/image`), a brief intro heading, and `<SubmissionForm />` (imported as a client component island). Server component shell otherwise.
- [X] T031 [US1] Create `app/thank-you/page.tsx` — server component congratulations page with the Meska logo, thank-you message, and a link back to `/`.
- [X] T032 [US1] Update `app/layout.tsx` to set the page font to the Calibri-leading stack from T009 and add `<meta name="viewport">` + brand-color theme color.

### Test fixtures / wiring

- [X] T033 [US1] Add a `tests/e2e/.env.test` (or use `process.env.PLAYWRIGHT_TEST_*`) pointing the e2e at the dev server with the test Supabase project. Document in `quickstart.md`.
- [X] T034 [US1] Add Playwright global setup `tests/e2e/global-setup.ts` that truncates `community_submissions` in the **test** Supabase project before each run. Guard against running against any URL that does not match `NEXT_PUBLIC_SUPABASE_ENV=test`.
- [X] T035 [US1] Implement a fetch mock in `tests/component/submission-form.test.tsx` so component tests do not hit the network. (Counterpart to T020.)

**Checkpoint**: At end of Phase 3 the MVP is deployable. The user can fill the form, hit Submit, land on `/thank-you`, and a row exists in Supabase. Tests T019–T021 pass.

---

## Phase 4: User Story 2 — Prevent invalid or incomplete submissions (P2)

**Story goal**: Bad input is blocked client-side AND server-side with clear per-field messages; no row is created.

**Independent test**: Submit with a missing required field → submission blocked, field highlighted, no row in DB. Submit with bad email → same.

### Tests

- [X] T036 [P] [US2] Unit tests in `tests/unit/submission.schema.invalid.test.ts` covering every failure case in FR-003 / FR-004 (missing field per field, malformed LinkedIn, phone < or > 10 digits, Q1 zero selections, Q3 three selections, display-name one-token, oversized AI JSON, oversized strings).
- [X] T037 [P] [US2] Component tests in `tests/component/submission-form.invalid.test.tsx` asserting inline error rendering, `aria-invalid="true"` on the offending control, focus moves to the first invalid control.
- [X] T038 [P] [US2] Playwright test `tests/e2e/submission.invalid.spec.ts`: attempt invalid submit → error banners visible → no row created.

### Implementation

- [X] T039 [US2] In `components/submission-form.tsx` (already created in T028), refine error rendering: ensure every field's error message is rendered via `components/ui/field.tsx` and the focus-management `setFocus` is called on RHF's first error path.
- [X] T040 [US2] In `app/api/submissions/route.ts` (T022), ensure the `400 { status: 'invalid', issues }` path returns the standard zod issue array shape and that no DB write is attempted on validation failure (verify by logging).
- [X] T041 [US2] Add server-side enforcement that `ai_profile_json`, if present, parses and re-validates against the AI Profile zod schema; unknown keys silently dropped before insert/update.

**Checkpoint**: Validation hardened across client and server. Stories 1 + 2 deployable together.

---

## Phase 5: User Story 3 — Resilient submission and feedback on failure (P3)

**Story goal**: Backend unavailability does not lose user input; user is told and can retry; no duplicate row.

**Independent test**: Force the endpoint to return 503 → user sees a retry banner with form values intact → 503 clears → resubmit → exactly one row.

### Tests

- [X] T042 [P] [US3] Component test `tests/component/submission-form.failure.test.tsx` mocking sequential `503` then `201 created`, asserting the retry banner, preserved values, and final `/thank-you` push.
- [X] T043 [P] [US3] Playwright test `tests/e2e/submission.retry.spec.ts` using a route interceptor to return 503 once then pass through, verifying exactly one row exists after retry.

### Implementation

- [X] T044 [US3] In `components/submission-form.tsx`, on `503` or network error render `<RetryBanner>` (inline alert with "Try again" affordance); ensure no `router.push` occurs and all RHF values remain. Keep submit enabled.
- [X] T045 [US3] In `app/api/submissions/route.ts`, wrap the Supabase round-trip in `AbortController` with a 5s timeout; catch network errors and return `503 { status: 'upstream_unavailable' }`.
- [X] T046 [US3] Add a unique-violation handler: on Postgres `23505` during INSERT, treat as the "exists" path and return `200 { status: 'exists', id }` — this is the race-condition contract from research R2.

**Checkpoint**: Resilience scenarios covered. All three user stories independently testable and deployable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility audit, performance budget verification, lint cleanup, and deferred-decision tracking.

- [X] T047 [P] Run an accessibility pass with `axe-core` against `/` and `/thank-you`; fix any violations. Verify keyboard-only completion of the entire form and modal.
- [X] T048 [P] Verify Tailwind v4 `@theme` tokens are the ONLY source of brand colors in components (grep for hex literals in `components/**` and `app/**`); migrate any stragglers to tokens.
- [X] T049 [P] Measure initial route JS for `/` with `next build` + bundle analyzer; ensure ≤ 200 KB gzipped per constitution Principle IV. If over, dynamically import the country list / Q-option label map.
- [X] T050 [P] Add `eslint` rule (custom or via `eslint-plugin-import` `no-restricted-imports`) preventing `lib/supabase/server.ts` import from any client component (`app/**` files lacking `"use server"` and outside `app/api/**`).
- [X] T051 [P] Run `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e` from a clean checkout; fix any issues.
- [X] T052 [P] Update `specs/001-community-info-form/quickstart.md` checklist with the verified results.
- [ ] T053 Open follow-up tickets for the three deferred research items: FR-012 consent wording / compliance, FR-013 anti-abuse final mechanism, FR-014 operator retrieval UI. Reference research.md R7–R9 in each.

---

## Dependencies

```
Phase 1 (Setup)  ──▶  Phase 2 (Foundational)  ──▶  Phase 3 (US1, MVP)
                                                ├─▶ Phase 4 (US2)   [requires US1 form + endpoint]
                                                └─▶ Phase 5 (US3)   [requires US1 endpoint]
                                                                          │
                                                                          ▼
                                                                   Phase 6 (Polish)
```

Phases 4 and 5 may run in parallel after Phase 3 completes — they touch the same form/endpoint but on distinct branches/PRs.

## Parallel execution examples

- **Setup (Phase 1)**: T003–T009 all `[P]` — different files, no inter-dependencies. Run after T001/T002 install completes.
- **Foundational (Phase 2)**: T014, T016, T017, T018 all `[P]` after T010–T013.
- **US1 tests (Phase 3)**: T019, T020, T021 all `[P]`. T023–T027 (UI primitives) all `[P]`.
- **US2 tests (Phase 4)**: T036, T037, T038 all `[P]`.
- **Polish (Phase 6)**: T047–T052 all `[P]`.

## Implementation strategy

- **MVP scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1). After Phase 3 the product delivers its full advertised value: a public form that writes to Supabase with brand styling and the congratulations page.
- **Increment 1 (recommended next)**: Phase 4 (US2 — input validation hardening). Highest ROI for data quality.
- **Increment 2**: Phase 5 (US3 — failure handling) + Phase 6 (Polish).
- **Deferred (Phase 6 → T053)**: anti-abuse final, consent wording, operator UI.

## Independent test criteria

| Story | Independent test |
|---|---|
| US1 | Fill all valid → land on `/thank-you` → row in DB. |
| US2 | Submit invalid → blocked with field-level errors → no row. Server-side re-validation rejects bypassed client. |
| US3 | Simulated `503` → banner with preserved values → retry succeeds → exactly one row. |

## Format validation

All 53 tasks above follow `- [ ] TNNN [P?] [USn?] Description (path)` with a checkbox, sequential ID, optional `[P]`, story label only on Phases 3–5, and a concrete file path. Setup, Foundational, and Polish phases have no story label, as required.
