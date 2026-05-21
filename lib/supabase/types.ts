export type CommunitySubmissionRow = {
  id: string;
  email: string;
  email_normalized: string;
  display_name: string;
  phone_country_code: string;
  phone_national: string;
  phone_e164: string;
  job_title: string;
  linkedin_url: string;
  q1_discovery_channels: string[];
  q2_consumption_frequency: string;
  q3_click_drivers: string[];
  q4_primary_usage: string;
  q5_self_description: string;
  q6_workday_busyness: string;
  q7_weekly_learning_time: string;
  q8_preferred_content: string;
  ai_profile_json: Record<string, unknown> | null;
  consent_text: string;
  consent_version: string;
  consent_accepted_at: string;
  created_at: string;
  last_updated_at: string;
};

export type CommunitySubmissionInsert = Omit<
  CommunitySubmissionRow,
  "id" | "email_normalized" | "phone_e164" | "created_at" | "last_updated_at"
>;
