# Feature Specification: Community Info Collection Form

**Feature Branch**: `001-community-info-form`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "i want to build an app that help my company to collect personal info from their community through a form designed according to the brand colors then save it in our data base. The user journey: 1) user opens the app and lands directly on it without a sign-in page; 2) the page contains a form (details to be provided during planning) designed cleanly with our brand colors; 3) the user fills the form and clicks submit; 4) the data is saved in our database."

## Clarifications

### Session 2026-05-21

- Q: Duplicate-submission policy — what happens when the same person submits again? → A: Show a popup informing the user a record already exists, giving them an explicit choice to update the existing record with the new values or cancel. On confirm, the existing record is updated in place (upsert); on cancel, nothing changes.
- Q: Identity key used to detect a duplicate → A: Email address, matched case-insensitively after trimming whitespace. (Default; user did not select an alternative.)
- Q: Post-submission experience → A: After a successful submission, the user is taken to a dedicated congratulations page (not just an inline confirmation).
- Q: Brand identity → A: Logo file `Meska2026 LOGO white.png` (the Meska "M" mark) is the app logo. Primary brand colors are neon blue (≈ `#1E66FF`, sampled from the logo — tunable token) and white. Form-field background color is `#EEF3F8`. UI font is Calibri-like (system fallback stack: `"Calibri", "Segoe UI", system-ui, -apple-system, sans-serif`).
- Q: Final form field list → A: Five contact fields (Display name, Email, Phone with country code, Job title, LinkedIn URL) + eight choice questions (Q1 multi-select, Q2 single, Q3 up-to-2, Q4 single, Q5 single, Q6 single, Q7 single, Q8 single) + one optional "AI-generated profile JSON" textarea with a fixed copy-to-clipboard prompt. Exact option lists and prompt text captured in Functional Requirements and Key Entities.
- Q: Choice-question selected-state styling → A: Selected option pills/cards are filled with the brand neon blue (`#1E66FF`) with white text; unselected options use the `#EEF3F8` field background with neutral text.
- Q: Display-name validation → A: Must contain at least two whitespace-separated tokens (e.g., a first and last name), each ≥ 1 character; total length 3–120 chars after trim.
- Q: Phone country code picker scope → A: Full international country picker with `+20` (Egypt) as default; national number validated as exactly 10 digits regardless of country (assumed default; pending explicit confirmation).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit personal information via the public form (Priority: P1)

A community member opens the app's URL on their phone or laptop. They land
directly on a single page that shows the company brand and a clean form asking
for their personal information. They fill in the requested fields, press
Submit, and see a confirmation that their information has been received.

**Why this priority**: This is the entire purpose of the product. Without it
there is no value delivered. It is also the only flow the end-user ever
performs, so the MVP is exactly this story.

**Independent Test**: Open the deployed URL in a browser, complete every
required field with valid data, click Submit, and verify (a) the user sees a
clear success confirmation and (b) the submitted data appears in the company
database with the correct values and a timestamp.

**Acceptance Scenarios**:

1. **Given** a community member visits the app for the first time, **When**
   the page loads, **Then** they see the form directly with no login, signup,
   or gate in front of it.
2. **Given** the form is visible, **When** the member fills every required
   field with valid values and clicks Submit, **Then** the system stores the
   submission and navigates the user to a dedicated congratulations page.
3. **Given** a successful submission, **When** a company operator looks up the
   database, **Then** they find one new record with all submitted values and
   the submission timestamp.
4. **Given** a submitted email already exists in the database, **When** the
   user clicks Submit, **Then** the system shows a popup explaining a record
   already exists and offers the user a choice to update with the new values
   or cancel; on confirm the existing record is updated in place; on cancel
   nothing is written.

---

### User Story 2 - Prevent invalid or incomplete submissions (Priority: P2)

A community member tries to submit the form with a missing required field or
an invalid value (e.g., malformed email). The app prevents submission and
guides them to correct the issue.

**Why this priority**: Protects database quality and prevents user frustration,
but the product still delivers value (Story 1) without it for a small pilot.

**Independent Test**: Attempt to submit the form leaving a required field
blank or entering a clearly invalid email; verify the form blocks submission,
shows an inline message identifying the offending field, and that no record
is created in the database.

**Acceptance Scenarios**:

1. **Given** at least one required field is empty, **When** the user clicks
   Submit, **Then** submission is blocked and the empty field is highlighted
   with a clear message telling the user what to fix.
2. **Given** an email field contains a malformed value, **When** the user
   clicks Submit, **Then** submission is blocked and the email field shows a
   clear corrective message.
3. **Given** any validation error occurred, **When** the user inspects the
   database, **Then** no new record exists for that attempt.

---

### User Story 3 - Resilient submission and feedback on failure (Priority: P3)

A community member submits the form while the network or backend is briefly
unavailable. The app does not silently lose their input; it informs them and
lets them retry without re-typing.

**Why this priority**: Nice-to-have for reliability and trust, but the core
value (Stories 1 and 2) is intact without it.

**Independent Test**: Simulate a backend failure on submission and verify the
user sees a clear error message, their entered values remain in the form, and
clicking Submit again after the failure succeeds and writes exactly one
record.

**Acceptance Scenarios**:

1. **Given** the backend is unreachable, **When** the user clicks Submit,
   **Then** a clear error message appears and the form values are preserved.
2. **Given** the failure has cleared, **When** the user clicks Submit again,
   **Then** exactly one record is stored (no duplicate from the failed
   attempt).

---

### Edge Cases

- A user submits the form multiple times in quick succession — the system MUST
  not create duplicate records from a single click. For deliberate repeat
  submissions by the same person (matched by email), the system MUST detect
  the existing record and present a popup asking the user whether to update
  it with the new values or cancel.
- A user dismisses the duplicate-detected popup (closes it without choosing)
  — the system MUST treat this as cancel and write nothing.
- A user changes their email between two submissions — the system treats this
  as a new person; no duplicate is detected.
- A user pastes extremely long input into a text field — the system MUST
  enforce maximum lengths and reject overflows gracefully.
- A user submits non-Latin characters, emoji, or right-to-left text — the
  system MUST store and display these correctly.
- A user opens the form on a small mobile screen — the layout MUST remain
  usable without horizontal scrolling.
- A user disables JavaScript — the experience MAY degrade, but the form MUST
  either work or display a clear message that JavaScript is required.
- A bot or automated script submits the form — see [NEEDS CLARIFICATION]
  below regarding anti-abuse measures.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST present the form on the landing page with no
  authentication, sign-in, or sign-up gate in front of it.
- **FR-002**: The app MUST visually conform to the Meska brand:
  - Logo: `Meska2026 LOGO white.png` (the Meska "M" mark), displayed at the
    top of the form page and the congratulations page.
  - Primary color: neon blue `#1E66FF` (sampled from the logo; exact token
    name `--brand-primary`).
  - Background / page color: white `#FFFFFF`.
  - Form-field background color: `#EEF3F8` (token `--brand-field-bg`).
  - Selected choice-option background: `#1E66FF` with white text; unselected:
    `#EEF3F8` with neutral text.
  - Font: Calibri-like system stack
    `"Calibri", "Segoe UI", system-ui, -apple-system, sans-serif`.
- **FR-003**: The form MUST collect the following fields, in this order:
  1. **Display name** — required text; MUST contain at least two
     whitespace-separated tokens (e.g., first + last name), each ≥ 1 char;
     length 3–120 chars after trim.
  2. **Email** — required, RFC-shaped email, ≤ 254 chars; normalized to
     lowercase + trimmed for uniqueness.
  3. **Phone number** — required; a separate country-code selector (default
     `+20` Egypt; full international list supported) immediately followed by
     the national number. National number validation is captured in FR-003a.
  4. **Job title** — required text, 1–120 chars.
  5. **LinkedIn URL** — required URL; MUST match a LinkedIn profile URL
     pattern (`https://(www\.)?linkedin\.com/(in|pub)/[^\s/]+/?`), ≤ 300 chars.
  6. **Q1 — How do you usually discover new AI tools or trends?** (required,
     multi-select, ≥ 1): LinkedIn, X/Twitter, YouTube, TikTok, Reddit,
     Friends/Colleagues, Newsletters, I rarely follow AI news.
  7. **Q2 — How often do you actively read/watch AI content?** (required,
     single-select): Multiple times daily, Daily, Few times a week,
     Occasionally, Only when needed for work.
  8. **Q3 — When AI news appears, what makes you click?** (required, choose
     up to 2): New AI tools, Real business use cases, Automation ideas,
     Productivity hacks, AI agents, Open-source models, Tutorials, Industry
     disruption, AI jobs/career growth, "How companies are using AI".
  9. **Q4 — Where are you currently using AI the most?** (required,
     single-select): Daily work tasks, Learning/studying, Side projects,
     Content creation, Coding/development, Business operations, I'm still
     exploring AI.
  10. **Q5 — Which sentence sounds most like you?** (required, single-select):
      "I use AI every day.", "I use AI when I remember.", "I know AI is
      important but haven't integrated it yet.", "I'm trying to build
      AI-powered workflows.", "I want AI to save me time.", "I want AI to
      help me make money."
  11. **Q6 — On a typical workday, how busy are you?** (required,
      single-select): Fully packed all day, Busy but manageable, Flexible
      schedule, Depends on the day.
  12. **Q7 — How much time can you realistically spend learning AI weekly?**
      (required, single-select): Less than 1 hour, 1–3 hours, 3–5 hours,
      5+ hours.
  13. **Q8 — What type of AI content do you enjoy most?** (required,
      single-select): Short insights, Step-by-step tutorials, Real case
      studies, AI tool recommendations, Deep technical breakdowns, Business
      strategy, AI news summaries, Ready-to-use prompts/templates.
  14. **AI profile JSON** (OPTIONAL) — multi-line textarea, ≤ 16 KB. Above
      the textarea, a read-only code block shows a fixed prompt (see
      FR-003b) and a "Copy prompt" button that copies it to clipboard. The
      user is expected to paste the prompt into ChatGPT/Claude and paste
      back the JSON response. If provided, the server MUST validate it
      parses as a JSON object matching the schema defined in Key Entities;
      if it does not parse or does not match, the field is rejected with a
      field-level error.
- **FR-003a**: Phone validation — national number MUST be exactly 10 digits
  (digits only, leading zeros allowed). The country code is selected
  separately and stored alongside the national number. Stored value
  is the concatenation `+<country_code><national_number>` (E.164-like).
- **FR-003b**: The copy-prompt feature MUST display the following fixed
  prompt text verbatim and copy it to the clipboard when the user clicks
  "Copy prompt":

  > You are an information extraction system.
  > Your task is to build a structured user profile based ONLY on explicitly
  > stated information found in: Chat history, Memory records, User-provided
  > statements.
  > STRICT RULES: Do NOT guess or infer missing information; Do NOT
  > hallucinate traits, skills, motivations, or roles; If a field has no
  > explicit evidence, return an empty array `[]` or empty string `""`; Only
  > include information that can be directly traced to a user statement; Do
  > NOT add explanations, interpretations, or assumptions; Output MUST be
  > valid JSON only.
  > INPUT SOURCES: Saved memory facts, Prior conversation messages, Direct
  > user statements. Ignore: General knowledge, Behavioral assumptions,
  > Personality predictions, Probabilistic reasoning.
  > OUTPUT FORMAT — return a single valid JSON object with this schema:
  > `{ "current_role": "", "career_history": [], "industry": [],
  > "core_skills": [], "soft_skills": [], "key_achievements": [],
  > "professional_interests": [], "personal_interests": [],
  > "learning_goals": [], "future_goals": [], "hobbies": [],
  > "motivations": [], "work_style": [], "ai_maturity_level": "",
  > "communication_style": [], "likely_persona": [] }`
  > EXTRA RULE: If information is partially mentioned but unclear, DO NOT
  > complete it. Prefer missing data over incorrect data.

  Clicking "Copy prompt" MUST show a brief visual confirmation (e.g.,
  "Copied!") and MUST NOT submit the form.
- **FR-003c**: Visual selection state — every choice option (Q1–Q8) MUST
  render as a clickable pill/card. Selected state MUST set background to
  `#1E66FF` and text to white. Unselected state MUST use `#EEF3F8`
  background. Q1 and Q3 MUST enforce their selection-count constraints
  (Q1 ≥ 1; Q3 ≤ 2) with inline error messages when violated.
- **FR-004**: The form MUST validate each field client-side before submission
  (required fields present, email well-formed, phone exactly 10 digits,
  LinkedIn URL pattern matches, choice-count constraints satisfied, field
  lengths within limits) and display inline, field-specific error messages.
- **FR-005**: The system MUST re-validate every submission server-side and
  reject any submission that fails validation, even if client validation was
  bypassed.
- **FR-006**: On successful submission the system MUST persist exactly one
  record in the company database containing the submitted values plus a
  server-generated submission timestamp and a unique identifier.
- **FR-006a**: Before persisting a new record the system MUST look up any
  existing record whose email matches the submitted email (case-insensitive,
  trimmed). If a match exists, the system MUST NOT create a new record;
  instead it MUST show the user a popup stating that a record already exists
  and present two clear actions: "Update with new info" and "Cancel".
  - On "Update with new info": the existing record is updated in place with
    the submitted values; a `last_updated_at` timestamp is set; the unique
    identifier is preserved.
  - On "Cancel" (or popup dismissal): no write occurs; the user remains on
    the form with their values intact.
- **FR-007**: On successful submission (new record created OR existing record
  updated) the user MUST be navigated to a dedicated congratulations page
  that thanks them and confirms their information was saved. The page MUST
  reach a usable state within 2 seconds of clicking Submit.
- **FR-008**: On submission failure (validation or backend) the user MUST see
  a clear, actionable error message and their entered values MUST be
  preserved.
- **FR-009**: The submit action MUST be debounced/disabled while a submission
  is in flight to prevent duplicate records from rapid clicks.
- **FR-010**: The form MUST be fully usable via keyboard and meet WCAG 2.1 AA
  contrast and focus-visible requirements.
- **FR-011**: The form MUST be responsive and usable on screens from 320px
  wide up to desktop widths without horizontal scrolling.
- **FR-012**: The system MUST collect and store consent text acknowledging
  that the user agrees to the company storing their personal information,
  along with the timestamp of consent. [NEEDS CLARIFICATION: exact consent
  wording and whether jurisdictional compliance (GDPR/CCPA/local) is required
  for v1]
- **FR-013**: The system MUST protect the submission endpoint against bulk
  automated abuse. [NEEDS CLARIFICATION: acceptable anti-abuse mechanism —
  invisible CAPTCHA, rate limiting per IP, honeypot field, or another
  approach]
- **FR-014**: The system MUST allow company operators to retrieve submitted
  records from the database. [NEEDS CLARIFICATION: is an in-product admin
  view required for v1, or is direct database access by operators
  sufficient?]
- **FR-015**: Personal data MUST be stored at rest in the company database
  with access restricted to authorized operators only.

### Key Entities *(include if feature involves data)*

- **Submission**: A single record representing one community member's
  information. Attributes: unique identifier; email (unique key, normalized
  lowercase + trimmed); display name; phone country code + 10-digit national
  number (stored E.164-like); job title; LinkedIn URL; the eight choice-
  question answers (Q1 and Q3 stored as arrays of selected option codes; Q2
  and Q4–Q8 stored as the selected option code); optional AI profile JSON
  (validated against the schema below); creation timestamp; last-updated
  timestamp; consent acknowledgment flag, text, version, and timestamp.
  Email uniqueness is enforced at the database level.
- **Community Member**: The person submitting the form. Not authenticated;
  identity is established by the email they enter on the form.
- **AI Profile JSON** (optional, embedded in Submission): A JSON object
  matching:
  `{ "current_role": "", "career_history": [], "industry": [],
  "core_skills": [], "soft_skills": [], "key_achievements": [],
  "professional_interests": [], "personal_interests": [],
  "learning_goals": [], "future_goals": [], "hobbies": [],
  "motivations": [], "work_style": [], "ai_maturity_level": "",
  "communication_style": [], "likely_persona": [] }`
  String fields are strings ≤ 500 chars; array fields are arrays of strings
  each ≤ 200 chars; unknown keys are dropped on the server.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can open the app, complete the form, and
  see a success confirmation in under 90 seconds (median) on a mid-tier
  mobile device.
- **SC-002**: At least 95% of valid submissions complete successfully on the
  first Submit click (no retries needed).
- **SC-003**: 100% of successfully confirmed submissions appear in the
  company database within 5 seconds of confirmation.
- **SC-004**: Zero submissions with missing required fields or malformed
  email/phone reach the database (server-side validation enforced).
- **SC-005**: The page is usable on screens from 320px to 1920px wide with
  no horizontal scrolling and no broken layouts.
- **SC-006**: The form meets WCAG 2.1 AA for color contrast and keyboard
  operability, verified by an accessibility audit.
- **SC-007**: Community members rate the form clarity at 4 / 5 or higher in
  a post-launch pilot survey of at least 20 respondents.

## Assumptions

- The form is publicly reachable; anyone with the URL can submit. There is
  no sign-in for community members, by explicit user requirement.
- Final field set is locked in FR-003: 5 contact fields + 8 choice questions
  + 1 optional AI-profile JSON textarea. Form scrolls on a single page.
- Duplicate-submission policy for v1: email is the identity key. A repeat
  submission with an existing email triggers an in-app popup that lets the
  user update the existing record or cancel. No silent merging, no
  duplicates created.
- The "company database" is a managed datastore the engineering team will
  select during planning; this spec is database-agnostic.
- English is the only required language for v1; right-to-left and non-Latin
  characters must render and store correctly but no additional UI translation
  is in scope.
- Brand assets are locked: logo `Meska2026 LOGO white.png`; primary
  `#1E66FF`; field background `#EEF3F8`; font Calibri with a system
  fallback. Tokens live in `app/globals.css` under Tailwind v4 `@theme`.
  The logo file MUST be placed under `public/brand/meska-logo-white.png` at
  implementation time.
- Hosting and operational ownership are by the existing company engineering
  team; uptime expectations follow the team's standard public-web SLOs and
  are not redefined here.
- Email/phone are stored as the user typed them; normalization (e.g., E.164
  for phone) is deferred to a later iteration unless required by the chosen
  database.
