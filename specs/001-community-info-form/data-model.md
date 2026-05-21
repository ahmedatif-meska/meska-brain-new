# Phase 1 Data Model: Community Info Collection Form

## Table: `community_submissions`

One row per community member, keyed by email.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Stable identifier |
| `email` | `text` | NOT NULL | Stored as user typed |
| `email_normalized` | `text` | NOT NULL, generated `lower(trim(email))`, UNIQUE | Duplicate-detection key |
| `display_name` | `text` | NOT NULL, 3–120 chars after trim, ≥ 2 whitespace-separated tokens | |
| `phone_country_code` | `text` | NOT NULL, regex `^\+[1-9][0-9]{0,3}$` | e.g. `+20`, `+1` |
| `phone_national` | `text` | NOT NULL, regex `^[0-9]{10}$` | Exactly 10 digits |
| `phone_e164` | `text` | NOT NULL, generated `phone_country_code || phone_national` | E.164-like canonical |
| `job_title` | `text` | NOT NULL, 1–120 chars after trim | |
| `linkedin_url` | `text` | NOT NULL, regex `^https://(www\.)?linkedin\.com/(in|pub)/[^\s/]+/?$`, ≤ 300 chars | |
| `q1_discovery_channels` | `text[]` | NOT NULL, `array_length >= 1`, values ∈ Q1 enum | Multi-select |
| `q2_consumption_frequency` | `text` | NOT NULL, value ∈ Q2 enum | Single-select |
| `q3_click_drivers` | `text[]` | NOT NULL, `array_length BETWEEN 1 AND 2`, values ∈ Q3 enum | Up to 2 |
| `q4_primary_usage` | `text` | NOT NULL, value ∈ Q4 enum | Single-select |
| `q5_self_description` | `text` | NOT NULL, value ∈ Q5 enum | Single-select |
| `q6_workday_busyness` | `text` | NOT NULL, value ∈ Q6 enum | Single-select |
| `q7_weekly_learning_time` | `text` | NOT NULL, value ∈ Q7 enum | Single-select |
| `q8_preferred_content` | `text` | NOT NULL, value ∈ Q8 enum | Single-select |
| `ai_profile_json` | `jsonb` | NULLABLE | See AI Profile schema below; `NULL` when user did not paste anything |
| `consent_text` | `text` | NOT NULL | Exact wording shown |
| `consent_version` | `text` | NOT NULL | e.g., `"2026-05-21"` |
| `consent_accepted_at` | `timestamptz` | NOT NULL | Server clock at write |
| `created_at` | `timestamptz` | NOT NULL default `now()` | |
| `last_updated_at` | `timestamptz` | NOT NULL default `now()` | Trigger updates on write |

### Option-code enums (stored as `text`; validated by CHECK or by `text[]` element checks)

- **Q1 Discovery channels**: `linkedin`, `twitter`, `youtube`, `tiktok`,
  `reddit`, `friends`, `newsletters`, `rarely`.
- **Q2 Consumption frequency**: `multi_daily`, `daily`, `few_weekly`,
  `occasionally`, `work_only`.
- **Q3 Click drivers**: `new_tools`, `business_cases`, `automation`,
  `productivity`, `agents`, `oss_models`, `tutorials`, `disruption`,
  `careers`, `companies_using_ai`.
- **Q4 Primary usage**: `daily_work`, `learning`, `side_projects`,
  `content`, `coding`, `business_ops`, `exploring`.
- **Q5 Self-description**: `everyday`, `when_remember`, `not_yet`,
  `building_workflows`, `save_time`, `make_money`.
- **Q6 Workday busyness**: `packed`, `manageable`, `flexible`, `depends`.
- **Q7 Weekly learning**: `lt_1h`, `1_3h`, `3_5h`, `gt_5h`.
- **Q8 Preferred content**: `short_insights`, `tutorials`, `case_studies`,
  `tool_recs`, `deep_tech`, `business_strategy`, `news_summaries`,
  `prompt_templates`.

Display labels (UI-facing strings) live in `lib/validation/submission.ts`
and are NOT stored in the DB — only the codes above are persisted, which
keeps storage stable when copy changes.

### Indexes & constraints

- `PRIMARY KEY (id)`.
- `UNIQUE (email_normalized)` — duplicate-detection key; raises `23505`
  on race-condition collisions.
- Length / regex CHECKs as noted in the column table.
- Array element CHECKs verifying values come from the enums above (Q1, Q3).

### Row Level Security

- `ALTER TABLE community_submissions ENABLE ROW LEVEL SECURITY;`
- No policies are created. Anon and authenticated roles have zero access.
  All reads/writes use the service-role key from the Route Handler.

### Lifecycle / state transitions

```
(no row) ──insert──▶ [persisted]
[persisted] ──update (user confirms popup)──▶ [persisted, last_updated_at bumped]
```

No deletes from the app; operator deletes happen in the Supabase dashboard.

### AI Profile JSON (jsonb shape)

Validated server-side with a zod schema before insert/update. Allowed keys
(all optional; missing keys default to `""` or `[]` as appropriate):

```jsonc
{
  "current_role": "",                 // string, ≤ 200 chars
  "career_history": [],               // string[], each ≤ 200 chars
  "industry": [],                     // string[]
  "core_skills": [],
  "soft_skills": [],
  "key_achievements": [],
  "professional_interests": [],
  "personal_interests": [],
  "learning_goals": [],
  "future_goals": [],
  "hobbies": [],
  "motivations": [],
  "work_style": [],
  "ai_maturity_level": "",            // string, ≤ 100 chars
  "communication_style": [],
  "likely_persona": []
}
```

Constraints:
- Arrays ≤ 50 elements each; each element ≤ 200 chars.
- String fields ≤ 200 chars (`current_role`, `ai_maturity_level`).
- Total serialized size ≤ 16 KB.
- Unknown keys are silently dropped on the server (keeps storage clean).
