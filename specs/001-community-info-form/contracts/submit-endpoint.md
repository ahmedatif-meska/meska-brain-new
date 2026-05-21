# Contract: `POST /api/submissions`

Single endpoint that handles create, duplicate-detect, and update.

## Runtime

- Next.js Route Handler, **Node runtime**.
- Reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment.
- Hard timeout: 5 seconds for the Supabase round trip; returns `503` on
  timeout.

## Request

`Content-Type: application/json`

```jsonc
{
  "fullName": "Asma Ali",
  "email": "ASMA@example.com",
  "phone": "+201234567890",
  "extraFields": { "city": "Cairo" },
  "consent": true,
  "consentVersion": "2026-05-21",
  "company_website": "",           // honeypot — must be empty
  "confirmUpdate": false            // true only on the user's confirm-popup retry
}
```

Validation: zod schema in `lib/validation/submission.ts`. Server re-validates
on every request regardless of client.

## Responses

| Status | Body | When |
|---|---|---|
| `201 Created` | `{ "status": "created", "id": "<uuid>" }` | No row matched `email_normalized`; a new row was inserted. |
| `200 OK` | `{ "status": "exists", "id": "<uuid>" }` | A row already exists and `confirmUpdate` was `false`. No write performed. |
| `200 OK` | `{ "status": "updated", "id": "<uuid>" }` | A row already exists and `confirmUpdate` was `true`. Row updated in place. |
| `200 OK` | `{ "status": "dropped" }` | Honeypot field non-empty. Silently dropped, looks identical to success from a bot's view. |
| `400 Bad Request` | `{ "status": "invalid", "issues": [...] }` | Zod validation failed. `issues` is the standard zod issue array. |
| `429 Too Many Requests` | `{ "status": "rate_limited", "retryAfterSeconds": N }` | Per-IP rate limit exceeded. |
| `503 Service Unavailable` | `{ "status": "upstream_unavailable" }` | Supabase call timed out or failed. Client preserves form values and shows a retry message. |

All non-2xx responses are safe to retry from the client without
side-effects (idempotent semantics enforced server-side via the email
unique key + the `confirmUpdate` flag).

## Client flow

```
POST { confirmUpdate: false }
   ├── 201 created   → router.push('/thank-you')
   ├── 200 exists    → show DuplicateDialog
   │                     ├── user clicks "Update" → POST { confirmUpdate: true } → 200 updated → router.push('/thank-you')
   │                     └── user cancels/dismisses → stay on form, no further calls
   ├── 200 updated   → router.push('/thank-you')
   ├── 200 dropped   → router.push('/thank-you')      // bot path, indistinguishable
   ├── 400 invalid   → set field errors from issues, focus first invalid
   ├── 429 rate_limited → show retry message with retryAfterSeconds
   └── 503 upstream_unavailable → show retry banner, keep form values
```

## Logging

Server logs (no PII in messages):
- request id, status, latency ms, `confirmUpdate`, row id (when known),
  rate-limit decision.
- never logs `fullName`, `email`, `phone`, or `extraFields` contents.

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is never read in client code; lint rule:
  importing from `lib/supabase/server.ts` is forbidden in any file under
  `app/**` that does NOT match `app/api/**` or has `"use server"`.
- CORS: same-origin only.
- CSRF: requests must include header `x-requested-with: fetch`; the
  endpoint rejects requests without it (defense in depth for a JSON-only
  endpoint).
