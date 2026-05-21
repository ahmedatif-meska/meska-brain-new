# Phase 0 Research: Community Info Collection Form

## R1 — Supabase write pattern from Next.js App Router

**Decision**: Writes go through a single Next.js Route Handler at
`POST /api/submissions`, running on the Node runtime, using
`createClient(url, serviceRoleKey)` from `@supabase/supabase-js`. The
service-role key is read from `SUPABASE_SERVICE_ROLE_KEY` (server-only).
The client component calls this endpoint via `fetch('/api/submissions',
{ method: 'POST', body: JSON.stringify(...) })`.

**Rationale**:
- The service role key MUST NOT be shipped to the browser. Centralizing the
  write in one server endpoint keeps the surface small and auditable.
- Route Handlers are simpler than Server Actions for this case because we
  need explicit JSON request/response semantics for the duplicate-detection
  flow (200 with `{ status: 'exists' }`, then a follow-up confirm call).
- Node runtime is required: the Supabase JS client expects Node primitives
  and the service-role path is not safe for the Edge runtime in this project.

**Alternatives considered**:
- *Server Actions*: tighter framework integration, but the two-step
  duplicate-popup flow is cleaner with explicit JSON status codes.
- *Direct PostgREST calls from the browser with anon key + RLS*: would
  require RLS policies that allow inserts/updates from anonymous users,
  enlarging the attack surface and forcing application-level secrets into
  RLS. Rejected.

---

## R2 — Duplicate detection & upsert semantics

**Decision**: Two-step flow.
1. Client POSTs to `/api/submissions` with the form values and a
   `confirmUpdate: false` flag.
2. Server normalizes email (`trim().toLowerCase()`), runs
   `select id from community_submissions where email = $1`.
   - If no row exists → insert; respond `201 { status: 'created', id }`.
   - If a row exists → respond `200 { status: 'exists', id }` without
     writing.
3. If the client receives `exists`, it shows the duplicate dialog. On
   "Update with new info" it re-POSTs the same payload with
   `confirmUpdate: true`. The server then updates the existing row by email
   and responds `200 { status: 'updated', id }`. On Cancel the client does
   nothing further.

**Rationale**:
- Keeps the database table's natural-key uniqueness as the source of truth
  (Postgres unique index on `lower(email)` enforces it even under race).
- Avoids client-side queries to the database.
- Makes the "user explicitly chose to overwrite" decision auditable —
  `confirmUpdate: true` is logged.

**Alternatives considered**:
- *Single-call upsert with `on_conflict`*: simpler but silently overwrites
  existing data, which violates the clarified UX requirement.
- *Two endpoints (`/check` + `/submit`)*: more routes, no real benefit over
  one endpoint with a request flag.

**Race condition**: Two simultaneous first-time submissions of the same
email could both pass the initial `select`. The unique index on
`lower(email)` makes the second insert fail; the server catches the
`23505` error, treats it as "exists", and returns `{ status: 'exists' }`.

---

## R3 — Validation strategy (client + server)

**Decision**: Single `zod` schema in `lib/validation/submission.ts` consumed
both by the client (React Hook Form resolver) and the server (Route
Handler). Server re-validates on every request and rejects with `400`
`{ status: 'invalid', issues }` on failure.

**Rationale**: Shared schema eliminates client/server drift. Server-side
re-validation is a constitution requirement (FR-005).

**Alternatives considered**: hand-rolled validators (drift risk), Yup
(less ergonomic with TS), Valibot (smaller but less battle-tested).

---

## R4 — Form library

**Decision**: `react-hook-form` + `@hookform/resolvers/zod`.

**Rationale**: Minimal re-renders (good with React Compiler), first-class
zod integration, accessible by default (manages aria-invalid /
aria-describedby), small footprint (~9KB gzip).

**Alternatives considered**:
- *Plain `useState` + manual validation*: cheaper bundle, but reimplements
  field touch/error/aria plumbing and the constitution forbids inventing
  what already exists.
- *Formik*: larger and slower; weaker TS story.

---

## R5 — Tailwind v4 brand tokens

**Decision**: Define brand colors, font family, spacing, and radii via
Tailwind v4 `@theme` directive in `app/globals.css`. All component classes
reference token names (e.g., `bg-brand-primary`, `text-brand-on-primary`)
— no hex literals in components. Brand values are placeholder until the
user provides actual hex codes; placeholders are marked in `globals.css`.

**Rationale**: Constitution Principle III mandates token-only styling. v4's
`@theme` is the canonical mechanism; no extra config file needed.

**Alternatives considered**: tailwind.config.js — not needed in v4 for this
scope; CSS variables only — viable but loses Tailwind utility ergonomics.

---

## R6 — Congratulations page

**Decision**: A dedicated static route at `/thank-you` rendered as a Server
Component. On successful submission/update the client component calls
`router.push('/thank-you')`. The page renders a thank-you message, brand
art, and a link back to the form.

**Rationale**: Dedicated route gives a shareable URL, clean separation, and
allows future analytics tagging. Matches the clarified UX requirement.

**Alternatives considered**: inline success state inside the form — rejected
because the user explicitly asked for a congratulations page.

---

## R7 — Anti-abuse (deferred from spec FR-013)

**Decision (interim, MUST be revisited before launch)**:
1. Hidden honeypot field (`<input name="company_website" tabIndex={-1}>`)
   — submissions with it filled are silently dropped (200 OK, no write).
2. Per-IP rate limit at the Route Handler: 5 successful or attempted
   submissions per 10 minutes via Vercel KV or an in-memory token bucket
   for v1.

**Rationale**: Spec marks FR-013 as `[NEEDS CLARIFICATION]`. This baseline
is the minimum that respects the constitution's security defaults without
adding a third-party CAPTCHA dependency. Final decision tracked as an open
question.

**Alternatives considered**: Cloudflare Turnstile (extra dep + privacy
review), visible reCAPTCHA (UX cost), no protection (unsafe for a public
form with PII).

---

## R8 — Consent & compliance (deferred from spec FR-012)

**Decision (interim)**: A required checkbox immediately above the Submit
button: "I agree that {Company} may store the information I've entered to
contact me about community activities." The exact wording and any
GDPR/CCPA-specific disclosures are placeholders pending legal review.
Consent text, version, and timestamp are persisted with the submission.

**Rationale**: Storing consent text + version per record is the lowest-cost
way to remain compliant later without a schema migration if the wording
changes.

---

## R9 — Operator data retrieval (deferred from spec FR-014)

**Decision (interim, MUST be revisited)**: Operators query Supabase
directly via the Supabase dashboard for v1. No in-product admin view is
built. Access to the dashboard is restricted to the company's Supabase
project members.

**Rationale**: Minimum-viable; building an admin view inflates v1 scope.

---

## R10 — Testing toolchain

**Decision**: Add Vitest (unit + component) and Playwright (e2e). Wire
both into `package.json` scripts: `test`, `test:e2e`. CI integration not
in scope for this plan.

**Rationale**: Constitution Principle II requires automated checks for
behavior changes; the repo currently has none, so introducing the runner
is part of this feature's cost.

---

## Open questions (carried from spec)

- FR-012 consent wording & jurisdictional compliance — assumed interim per R8.
- FR-013 anti-abuse mechanism — assumed interim per R7.
- FR-014 operator retrieval — assumed interim per R9.
- Final list of community-context form fields beyond name/email/phone —
  user will provide during implementation.
- Brand color hex values, font, and logo asset — user will provide during
  implementation.
