import "dotenv/config";

export default async function globalSetup() {
  const env = process.env.NEXT_PUBLIC_SUPABASE_ENV;
  if (env !== "test") {
    console.warn(
      "[playwright] Skipping DB truncate: NEXT_PUBLIC_SUPABASE_ENV is not 'test'. " +
        "Set it to 'test' on a dedicated Supabase project to enable cleanup.",
    );
    return;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("[playwright] SUPABASE_URL / SERVICE_ROLE_KEY missing — skipping truncate.");
    return;
  }
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase
    .from("community_submissions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    console.warn("[playwright] Truncate failed:", error.message);
  }
}
