# Quickstart: Community Info Collection Form

## Prerequisites

- Node 20+ and npm
- A Supabase Cloud project (free tier is fine for v1)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (unused at runtime; kept for parity),
  and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase dashboard

## 1. Install new dependencies

```bash
npm install @supabase/supabase-js zod react-hook-form @hookform/resolvers
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  jsdom @playwright/test
```

## 2. Configure environment

Create `.env.local` (never committed):

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## 3. Apply database migration

Run the SQL in `supabase/migrations/0001_community_submissions.sql` against
the Supabase project (Dashboard → SQL Editor, or `supabase db push` if the
CLI is set up). This creates the table, the unique index on
`email_normalized`, RLS enable, and the `last_updated_at` trigger.

## 4. Set brand tokens

Edit `app/globals.css`, replace placeholder values inside the `@theme`
block with the company's brand colors / font / radii / spacing.

## 5. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 — you should see the form on the landing page.

## 6. Manual verification (golden path)

1. Fill every required field with valid values, tick consent, click Submit.
2. You are routed to `/thank-you` within ~2s.
3. In Supabase Dashboard → Table Editor → `community_submissions`, one new
   row exists with the values you entered.
4. Reload the form, enter the **same email** with a different name, click
   Submit.
5. The duplicate popup appears. Click "Update with new info".
6. You are routed to `/thank-you`. The same row now shows the new name and
   a refreshed `last_updated_at`. No new row was created.
7. Repeat step 4. This time click Cancel. No write occurs.

## 7. Run automated tests

```bash
npm run test         # vitest, unit + component
npm run test:e2e     # playwright, against the dev server
```

## 8. Production checklist

- [ ] Set the three env vars in the hosting environment (Vercel /
      equivalent), service role key marked as a **server-only** secret.
- [ ] Configure the rate limiter backend (Vercel KV or in-memory for v1).
- [ ] Finalize consent wording with legal; bump `CONSENT_VERSION`.
- [ ] Decide and document the anti-abuse posture (FR-013).
- [ ] Verify Core Web Vitals on a production build under the mobile profile.
- [ ] Confirm WCAG 2.1 AA via axe + keyboard walkthrough.
