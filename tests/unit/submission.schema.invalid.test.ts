import { describe, it, expect } from "vitest";
import { submissionSchema, parseAiProfile } from "@/lib/validation/submission";

const base = {
  displayName: "Asma Ali",
  email: "asma@example.com",
  phoneCountryCode: "+20",
  phoneNational: "1234567890",
  jobTitle: "Engineer",
  linkedinUrl: "https://www.linkedin.com/in/asma",
  q1: ["linkedin"],
  q2: "daily",
  q3: ["new_tools"],
  q4: "daily_work",
  q5: "everyday",
  q6: "manageable",
  q7: "1_3h",
  q8: "short_insights",
  aiProfile: "",
  company_website: "",
  confirmUpdate: false,
};

describe("submissionSchema — exhaustive invalid cases", () => {
  it.each([
    ["empty displayName", { displayName: "" }],
    ["one-token name", { displayName: "Asma" }],
    ["oversized job title", { jobTitle: "x".repeat(121) }],
    ["bad LinkedIn host", { linkedinUrl: "https://example.com/in/asma" }],
    ["unknown q1 code", { q1: ["unknown_channel"] }],
    ["empty q1", { q1: [] }],
    ["q3 length 3", { q3: ["new_tools", "automation", "productivity"] }],
    ["bad dial code", { phoneCountryCode: "20" }],
    ["non-digit phone", { phoneNational: "1234abcd90" }],
  ])("rejects: %s", (_, patch) => {
    const r = submissionSchema.safeParse({ ...base, ...patch });
    expect(r.success).toBe(false);
  });
});

describe("parseAiProfile", () => {
  it("treats empty string as null", () => {
    const r = parseAiProfile("");
    expect(r.ok && r.value === null).toBe(true);
  });

  it("rejects non-JSON", () => {
    const r = parseAiProfile("nope");
    expect(r.ok).toBe(false);
  });

  it("rejects array", () => {
    const r = parseAiProfile("[]");
    expect(r.ok).toBe(false);
  });

  it("accepts a partial object and drops unknown keys", () => {
    const r = parseAiProfile(
      JSON.stringify({ current_role: "Eng", career_history: ["A"], surprise: "x" }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toMatchObject({ current_role: "Eng" });
      expect((r.value as Record<string, unknown>).surprise).toBeUndefined();
    }
  });
});
