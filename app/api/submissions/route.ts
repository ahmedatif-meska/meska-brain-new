import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  parseAiProfile,
  submissionSchema,
} from "@/lib/validation/submission";
import { CONSENT_TEXT, CONSENT_VERSION } from "@/lib/copy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_TIMEOUT_MS = 5000;

function getIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function withTimeout<T>(p: PromiseLike<T>): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error("supabase_timeout")),
      SUPABASE_TIMEOUT_MS,
    );
    Promise.resolve(p).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-requested-with") !== "fetch") {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalid", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot — pretend success.
  if (data.company_website && data.company_website.length > 0) {
    return NextResponse.json({ status: "dropped" }, { status: 200 });
  }

  // Rate limit (interim per research R7).
  const ip = getIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { status: "rate_limited", retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429 },
    );
  }

  // AI profile JSON: parse + validate. Treat parse failure as a field error.
  const aiProfile = parseAiProfile(data.aiProfile);
  if (!aiProfile.ok) {
    return NextResponse.json(
      {
        status: "invalid",
        issues: [{ path: ["aiProfile"], message: aiProfile.message }],
      },
      { status: 400 },
    );
  }

  const emailNormalized = data.email.trim().toLowerCase();
  const requestId = crypto.randomUUID();
  const start = Date.now();

  try {
    const supabase = getServerSupabase();

    const existing = await withTimeout(
      supabase
        .from("community_submissions")
        .select("id")
        .eq("email_normalized", emailNormalized)
        .maybeSingle(),
    );

    if (existing.error && existing.error.code !== "PGRST116") {
      throw existing.error;
    }

    const row = {
      email: data.email.trim(),
      display_name: data.displayName.trim(),
      phone_country_code: data.phoneCountryCode,
      phone_national: data.phoneNational,
      job_title: data.jobTitle.trim(),
      linkedin_url: data.linkedinUrl.trim(),
      q1_discovery_channels: data.q1,
      q2_consumption_frequency: data.q2,
      q3_click_drivers: data.q3,
      q4_primary_usage: data.q4,
      q5_self_description: data.q5,
      q6_workday_busyness: data.q6,
      q7_weekly_learning_time: data.q7,
      q8_preferred_content: data.q8,
      ai_profile_json: aiProfile.value,
      consent_text: CONSENT_TEXT,
      consent_version: CONSENT_VERSION,
      consent_accepted_at: new Date().toISOString(),
    };

    if (existing.data?.id) {
      if (!data.confirmUpdate) {
        log(requestId, "exists", start, { id: existing.data.id });
        return NextResponse.json(
          { status: "exists", id: existing.data.id },
          { status: 200 },
        );
      }
      const update = await withTimeout(
        supabase
          .from("community_submissions")
          .update(row)
          .eq("id", existing.data.id)
          .select("id")
          .single(),
      );
      if (update.error) throw update.error;
      log(requestId, "updated", start, { id: update.data.id });
      return NextResponse.json(
        { status: "updated", id: update.data.id },
        { status: 200 },
      );
    }

    const insert = await withTimeout(
      supabase
        .from("community_submissions")
        .insert(row)
        .select("id")
        .single(),
    );

    if (insert.error) {
      // 23505 = unique_violation -> a concurrent first insert won. Treat as exists.
      const code = (insert.error as { code?: string }).code;
      if (code === "23505") {
        const after = await withTimeout(
          supabase
            .from("community_submissions")
            .select("id")
            .eq("email_normalized", emailNormalized)
            .single(),
        );
        if (after.error) throw after.error;
        log(requestId, "exists_race", start, { id: after.data.id });
        return NextResponse.json(
          { status: "exists", id: after.data.id },
          { status: 200 },
        );
      }
      throw insert.error;
    }

    log(requestId, "created", start, { id: insert.data.id });
    return NextResponse.json(
      { status: "created", id: insert.data.id },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "unknown_supabase_error";
    log(requestId, "upstream_unavailable", start, { message });
    return NextResponse.json(
      { status: "upstream_unavailable" },
      { status: 503 },
    );
  }
}

function log(
  requestId: string,
  status: string,
  start: number,
  extra: Record<string, unknown>,
) {
  // No PII in logs.
  console.log(
    JSON.stringify({
      event: "submissions",
      requestId,
      status,
      latencyMs: Date.now() - start,
      ...extra,
    }),
  );
}
