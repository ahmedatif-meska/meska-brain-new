import { z } from "zod";
import { VALID_DIAL_CODES } from "@/lib/validation/countries";

// -----------------------------------------------------------------------------
// Option codes + display labels for choice questions.
// Codes are persisted; labels are UI-only.
// -----------------------------------------------------------------------------

export const Q1_OPTIONS = [
  { code: "linkedin", label: "LinkedIn" },
  { code: "twitter", label: "X / Twitter" },
  { code: "youtube", label: "YouTube" },
  { code: "tiktok", label: "TikTok" },
  { code: "reddit", label: "Reddit" },
  { code: "friends", label: "Friends / Colleagues" },
  { code: "newsletters", label: "Newsletters" },
  { code: "rarely", label: "I rarely follow AI news" },
] as const;

export const Q2_OPTIONS = [
  { code: "multi_daily", label: "Multiple times daily" },
  { code: "daily", label: "Daily" },
  { code: "few_weekly", label: "Few times a week" },
  { code: "occasionally", label: "Occasionally" },
  { code: "work_only", label: "Only when needed for work" },
] as const;

export const Q3_OPTIONS = [
  { code: "new_tools", label: "New AI tools" },
  { code: "business_cases", label: "Real business use cases" },
  { code: "automation", label: "Automation ideas" },
  { code: "productivity", label: "Productivity hacks" },
  { code: "agents", label: "AI agents" },
  { code: "oss_models", label: "Open-source models" },
  { code: "tutorials", label: "Tutorials" },
  { code: "disruption", label: "Industry disruption" },
  { code: "careers", label: "AI jobs / career growth" },
  { code: "companies_using_ai", label: "How companies are using AI" },
] as const;

export const Q4_OPTIONS = [
  { code: "daily_work", label: "Daily work tasks" },
  { code: "learning", label: "Learning / studying" },
  { code: "side_projects", label: "Side projects" },
  { code: "content", label: "Content creation" },
  { code: "coding", label: "Coding / development" },
  { code: "business_ops", label: "Business operations" },
  { code: "exploring", label: "I'm still exploring AI" },
] as const;

export const Q5_OPTIONS = [
  { code: "everyday", label: "I use AI every day." },
  { code: "when_remember", label: "I use AI when I remember." },
  {
    code: "not_yet",
    label: "I know AI is important but haven't integrated it yet.",
  },
  { code: "building_workflows", label: "I'm trying to build AI-powered workflows." },
  { code: "save_time", label: "I want AI to save me time." },
  { code: "make_money", label: "I want AI to help me make money." },
] as const;

export const Q6_OPTIONS = [
  { code: "packed", label: "Fully packed all day" },
  { code: "manageable", label: "Busy but manageable" },
  { code: "flexible", label: "Flexible schedule" },
  { code: "depends", label: "Depends on the day" },
] as const;

export const Q7_OPTIONS = [
  { code: "lt_1h", label: "Less than 1 hour" },
  { code: "1_3h", label: "1–3 hours" },
  { code: "3_5h", label: "3–5 hours" },
  { code: "gt_5h", label: "5+ hours" },
] as const;

export const Q8_OPTIONS = [
  { code: "short_insights", label: "Short insights" },
  { code: "tutorials", label: "Step-by-step tutorials" },
  { code: "case_studies", label: "Real case studies" },
  { code: "tool_recs", label: "AI tool recommendations" },
  { code: "deep_tech", label: "Deep technical breakdowns" },
  { code: "business_strategy", label: "Business strategy" },
  { code: "news_summaries", label: "AI news summaries" },
  { code: "prompt_templates", label: "Ready-to-use prompts / templates" },
] as const;

const codes = <T extends readonly { code: string }[]>(opts: T) =>
  opts.map((o) => o.code) as [T[number]["code"], ...T[number]["code"][]];

const Q1_CODES = codes(Q1_OPTIONS);
const Q2_CODES = codes(Q2_OPTIONS);
const Q3_CODES = codes(Q3_OPTIONS);
const Q4_CODES = codes(Q4_OPTIONS);
const Q5_CODES = codes(Q5_OPTIONS);
const Q6_CODES = codes(Q6_OPTIONS);
const Q7_CODES = codes(Q7_OPTIONS);
const Q8_CODES = codes(Q8_OPTIONS);

// -----------------------------------------------------------------------------
// Field schemas
// -----------------------------------------------------------------------------

const displayNameSchema = z
  .string()
  .trim()
  .min(3, "Please enter your full name (at least 3 characters).")
  .max(120, "Name is too long.")
  .refine(
    (v) => v.split(/\s+/).filter(Boolean).length >= 2,
    "Please enter at least two names (e.g., first and last).",
  );

const emailSchema = z
  .string()
  .trim()
  .max(254, "Email is too long.")
  .regex(
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/i,
    "Enter a valid email address.",
  );

const phoneCountryCodeSchema = z
  .string()
  .trim()
  .refine(
    (v) => VALID_DIAL_CODES.has(v),
    "Choose a country code.",
  );

const phoneNationalSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits.");

const jobTitleSchema = z
  .string()
  .trim()
  .min(1, "Job title is required.")
  .max(120, "Job title is too long.");

const linkedinUrlSchema = z
  .string()
  .trim()
  .max(300, "URL is too long.")
  .regex(
    /^https:\/\/(www\.)?linkedin\.com\/(in|pub)\/[^\s/]+\/?$/i,
    "Enter a LinkedIn profile URL like https://www.linkedin.com/in/your-handle",
  );

// -----------------------------------------------------------------------------
// AI profile JSON schema
// -----------------------------------------------------------------------------

const profileStringArray = z
  .array(z.string().max(200))
  .max(50);

export const aiProfileSchema = z
  .object({
    current_role: z.string().max(200).optional().default(""),
    career_history: profileStringArray.optional().default([]),
    industry: profileStringArray.optional().default([]),
    core_skills: profileStringArray.optional().default([]),
    soft_skills: profileStringArray.optional().default([]),
    key_achievements: profileStringArray.optional().default([]),
    professional_interests: profileStringArray.optional().default([]),
    personal_interests: profileStringArray.optional().default([]),
    learning_goals: profileStringArray.optional().default([]),
    future_goals: profileStringArray.optional().default([]),
    hobbies: profileStringArray.optional().default([]),
    motivations: profileStringArray.optional().default([]),
    work_style: profileStringArray.optional().default([]),
    ai_maturity_level: z.string().max(200).optional().default(""),
    communication_style: profileStringArray.optional().default([]),
    likely_persona: profileStringArray.optional().default([]),
  })
  .strip(); // drop unknown keys silently

// -----------------------------------------------------------------------------
// Full submission schema (used client + server)
// -----------------------------------------------------------------------------

export const submissionSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  phoneCountryCode: phoneCountryCodeSchema,
  phoneNational: phoneNationalSchema,
  jobTitle: jobTitleSchema,
  linkedinUrl: linkedinUrlSchema,

  q1: z
    .array(z.enum(Q1_CODES))
    .min(1, "Pick at least one option."),
  q2: z.enum(Q2_CODES, { message: "Pick one option." }),
  q3: z
    .array(z.enum(Q3_CODES))
    .min(1, "Pick at least one option.")
    .max(2, "Choose up to 2 options."),
  q4: z.enum(Q4_CODES, { message: "Pick one option." }),
  q5: z.enum(Q5_CODES, { message: "Pick one option." }),
  q6: z.enum(Q6_CODES, { message: "Pick one option." }),
  q7: z.enum(Q7_CODES, { message: "Pick one option." }),
  q8: z.enum(Q8_CODES, { message: "Pick one option." }),

  aiProfile: z
    .union([z.literal(""), z.string().max(16 * 1024)])
    .optional()
    .default(""),

  // honeypot — must be absent/empty
  company_website: z.string().optional().default(""),

  // controls the duplicate-update path on the server
  confirmUpdate: z.boolean().optional().default(false),
});

export type SubmissionInput = z.input<typeof submissionSchema>;
export type SubmissionOutput = z.output<typeof submissionSchema>;

// Server-side: parse the aiProfile string (if any) and re-validate JSON shape.
export function parseAiProfile(raw: string | undefined | null):
  | { ok: true; value: Record<string, unknown> | null }
  | { ok: false; message: string } {
  if (!raw || raw.trim().length === 0) return { ok: true, value: null };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, message: "AI profile must be valid JSON." };
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return { ok: false, message: "AI profile must be a JSON object." };
  }
  const result = aiProfileSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, message: "AI profile JSON shape is invalid." };
  }
  return { ok: true, value: result.data as Record<string, unknown> };
}
