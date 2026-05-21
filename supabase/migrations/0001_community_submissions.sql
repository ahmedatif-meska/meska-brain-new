-- Migration: community_submissions
-- Spec: specs/001-community-info-form/data-model.md
-- Idempotent enough for first apply; not designed for re-runs in prod.

create extension if not exists pgcrypto;

create table if not exists public.community_submissions (
  id uuid primary key default gen_random_uuid(),

  email text not null,
  email_normalized text generated always as (lower(btrim(email))) stored,

  display_name text not null,

  phone_country_code text not null,
  phone_national text not null,
  phone_e164 text generated always as (phone_country_code || phone_national) stored,

  job_title text not null,
  linkedin_url text not null,

  q1_discovery_channels text[] not null,
  q2_consumption_frequency text not null,
  q3_click_drivers text[] not null,
  q4_primary_usage text not null,
  q5_self_description text not null,
  q6_workday_busyness text not null,
  q7_weekly_learning_time text not null,
  q8_preferred_content text not null,

  ai_profile_json jsonb,

  consent_text text not null,
  consent_version text not null,
  consent_accepted_at timestamptz not null,

  created_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),

  -- Field-level checks
  constraint display_name_length check (char_length(btrim(display_name)) between 3 and 120),
  constraint display_name_two_tokens check (
    array_length(regexp_split_to_array(btrim(display_name), '\s+'), 1) >= 2
  ),
  constraint email_shape check (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254
  ),
  constraint phone_country_code_shape check (phone_country_code ~ '^\+[1-9][0-9]{0,3}$'),
  constraint phone_national_shape check (phone_national ~ '^[0-9]{10}$'),
  constraint job_title_length check (char_length(btrim(job_title)) between 1 and 120),
  constraint linkedin_url_shape check (
    linkedin_url ~* '^https://(www\.)?linkedin\.com/(in|pub)/[^\s/]+/?$'
    and char_length(linkedin_url) <= 300
  ),

  -- Q1 multi-select: at least 1, values from enum
  constraint q1_non_empty check (array_length(q1_discovery_channels, 1) >= 1),
  constraint q1_values check (
    q1_discovery_channels <@ array[
      'linkedin','twitter','youtube','tiktok','reddit','friends','newsletters','rarely'
    ]::text[]
  ),

  -- Q2 single
  constraint q2_values check (
    q2_consumption_frequency = any (array[
      'multi_daily','daily','few_weekly','occasionally','work_only'
    ])
  ),

  -- Q3 up-to-2 multi-select
  constraint q3_size check (array_length(q3_click_drivers, 1) between 1 and 2),
  constraint q3_values check (
    q3_click_drivers <@ array[
      'new_tools','business_cases','automation','productivity','agents',
      'oss_models','tutorials','disruption','careers','companies_using_ai'
    ]::text[]
  ),

  -- Q4..Q8 single
  constraint q4_values check (
    q4_primary_usage = any (array[
      'daily_work','learning','side_projects','content','coding','business_ops','exploring'
    ])
  ),
  constraint q5_values check (
    q5_self_description = any (array[
      'everyday','when_remember','not_yet','building_workflows','save_time','make_money'
    ])
  ),
  constraint q6_values check (
    q6_workday_busyness = any (array['packed','manageable','flexible','depends'])
  ),
  constraint q7_values check (
    q7_weekly_learning_time = any (array['lt_1h','1_3h','3_5h','gt_5h'])
  ),
  constraint q8_values check (
    q8_preferred_content = any (array[
      'short_insights','tutorials','case_studies','tool_recs','deep_tech',
      'business_strategy','news_summaries','prompt_templates'
    ])
  )
);

create unique index if not exists community_submissions_email_normalized_key
  on public.community_submissions (email_normalized);

-- last_updated_at trigger
create or replace function public.tg_community_submissions_set_updated()
returns trigger language plpgsql as $$
begin
  new.last_updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated on public.community_submissions;
create trigger trg_set_updated
before update on public.community_submissions
for each row execute function public.tg_community_submissions_set_updated();

-- RLS: enabled with no policies => only service-role can read/write.
alter table public.community_submissions enable row level security;
