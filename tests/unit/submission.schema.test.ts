import { describe, it, expect } from "vitest";
import { submissionSchema } from "@/lib/validation/submission";

const valid = {
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

describe("submissionSchema — happy path", () => {
  it("accepts a fully valid payload", () => {
    const r = submissionSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });
});

describe("submissionSchema — failures", () => {
  it("rejects single-token display name", () => {
    const r = submissionSchema.safeParse({ ...valid, displayName: "Asma" });
    expect(r.success).toBe(false);
  });

  it("rejects malformed email", () => {
    const r = submissionSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rejects phone shorter than 10 digits", () => {
    const r = submissionSchema.safeParse({ ...valid, phoneNational: "123" });
    expect(r.success).toBe(false);
  });

  it("rejects phone longer than 10 digits", () => {
    const r = submissionSchema.safeParse({ ...valid, phoneNational: "12345678901" });
    expect(r.success).toBe(false);
  });

  it("rejects non-LinkedIn URL", () => {
    const r = submissionSchema.safeParse({ ...valid, linkedinUrl: "https://twitter.com/x" });
    expect(r.success).toBe(false);
  });

  it("requires Q1 at least one selection", () => {
    const r = submissionSchema.safeParse({ ...valid, q1: [] });
    expect(r.success).toBe(false);
  });

  it("rejects Q3 with more than 2 selections", () => {
    const r = submissionSchema.safeParse({
      ...valid,
      q3: ["new_tools", "automation", "productivity"],
    });
    expect(r.success).toBe(false);
  });

  it("accepts empty honeypot", () => {
    const r = submissionSchema.safeParse({ ...valid, company_website: "" });
    expect(r.success).toBe(true);
  });
});
