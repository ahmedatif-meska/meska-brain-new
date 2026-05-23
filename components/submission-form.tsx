"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_OPTIONS,
  Q4_OPTIONS,
  Q5_OPTIONS,
  Q6_OPTIONS,
  Q7_OPTIONS,
  Q8_OPTIONS,
  submissionSchema,
  type SubmissionInput,
} from "@/lib/validation/submission";
import { DEFAULT_DIAL_CODE } from "@/lib/validation/countries";
import { Button } from "@/components/ui/button";
import { Field, fieldInputClass, fieldTextareaClass } from "@/components/ui/field";
import { ChoicePills } from "@/components/ui/choice-pill";
import { PhoneInput } from "@/components/ui/phone-input";
import { CopyPrompt } from "@/components/ui/copy-prompt";
import { DuplicateDialog } from "@/components/duplicate-dialog";
type BannerState =
  | { kind: "none" }
  | { kind: "retry"; message: string }

export function SubmissionForm() {
  const router = useRouter();
  const [banner, setBanner] = React.useState<BannerState>({ kind: "none" });
  const [dupOpen, setDupOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    setFocus,
    getValues,
  } = useForm<SubmissionInput>({
    // Cast: the schema has defaults so input/output types diverge; RHF's
    // resolver generic mismatches in strict mode but the runtime contract holds.
    resolver: zodResolver(submissionSchema) as never,
    defaultValues: {
      displayName: "",
      email: "",
      phoneCountryCode: DEFAULT_DIAL_CODE,
      phoneNational: "",
      jobTitle: "",
      linkedinUrl: "",
      q1: [],
      q3: [],
      aiProfile: "",
      company_website: "",
      confirmUpdate: false,
    },
    mode: "onSubmit",
  });

  async function sendPayload(
    payload: SubmissionInput,
  ): Promise<{ ok: boolean; status: string; id?: string; issues?: unknown[]; retryAfterSeconds?: number }> {
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-requested-with": "fetch",
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status === 201 ? "created" : body.status, ...body };
  }

  async function onSubmit(values: SubmissionInput) {
    setBanner({ kind: "none" });
    setSubmitting(true);
    try {
      const result = await sendPayload({ ...values, confirmUpdate: false });

      if (result.status === "created" || result.status === "updated" || result.status === "dropped") {
        router.push("/thank-you");
        return;
      }
      if (result.status === "exists") {
        setDupOpen(true);
        return;
      }
      if (result.status === "invalid" && Array.isArray(result.issues)) {
        applyServerIssues(result.issues);
        return;
      }
      // Anything else => treat as upstream failure
      setBanner({ kind: "retry", message: "We couldn't reach the server. Please try again." });
    } catch {
      setBanner({ kind: "retry", message: "Network error. Your details are still here — try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function onConfirmUpdate() {
    setSubmitting(true);
    try {
      const values = getValues();
      const result = await sendPayload({ ...values, confirmUpdate: true });
      if (result.status === "updated" || result.status === "created") {
        router.push("/thank-you");
        return;
      }
      setBanner({ kind: "retry", message: "Update failed. Please try again." });
    } catch {
      setBanner({ kind: "retry", message: "Network error during update. Try again." });
    } finally {
      setDupOpen(false);
      setSubmitting(false);
    }
  }

  function applyServerIssues(issues: unknown[]) {
    const fieldMap: Record<string, keyof SubmissionInput> = {
      displayName: "displayName",
      email: "email",
      phoneCountryCode: "phoneCountryCode",
      phoneNational: "phoneNational",
      jobTitle: "jobTitle",
      linkedinUrl: "linkedinUrl",
      q1: "q1",
      q2: "q2",
      q3: "q3",
      q4: "q4",
      q5: "q5",
      q6: "q6",
      q7: "q7",
      q8: "q8",
      aiProfile: "aiProfile",
    };
    let first: keyof SubmissionInput | null = null;
    for (const raw of issues) {
      const issue = raw as { path?: unknown[]; message?: string };
      const key = (issue.path?.[0] ?? "") as string;
      const target = fieldMap[key];
      if (target) {
        setError(target, { message: issue.message ?? "Invalid value" });
        if (!first) first = target;
      }
    }
    if (first) setFocus(first as never);
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, () => {
        const k = Object.keys(errors)[0] as keyof SubmissionInput | undefined;
        if (k) setFocus(k as never);
      })} noValidate className="flex flex-col gap-6">

        {/* Honeypot — visually hidden, off the tab order */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only-honeypot"
          {...register("company_website")}
        />

        <Field
          id="displayName"
          label="Display name"
          required
          hint="At least two names, e.g. first + last."
          error={errors.displayName?.message}
        >
          <input type="text" autoComplete="name" className={fieldInputClass} {...register("displayName")} />
        </Field>

        <Field id="email" label="Email" required error={errors.email?.message}>
          <input type="email" autoComplete="email" className={fieldInputClass} {...register("email")} />
        </Field>

        <Field
          id="phoneNational"
          label="Phone number"
          required
          hint="Pick country code and enter 10 digits."
          error={errors.phoneNational?.message ?? errors.phoneCountryCode?.message}
        >
          <Controller
            control={control}
            name="phoneNational"
            render={({ field: nationalField }) => (
              <Controller
                control={control}
                name="phoneCountryCode"
                render={({ field: codeField }) => (
                  <PhoneInput
                    id="phoneNational"
                    countryCode={codeField.value}
                    national={nationalField.value}
                    onCountryCodeChange={codeField.onChange}
                    onNationalChange={nationalField.onChange}
                    invalid={!!errors.phoneNational}
                  />
                )}
              />
            )}
          />
        </Field>

        <Field id="jobTitle" label="Job title" required error={errors.jobTitle?.message}>
          <input type="text" autoComplete="organization-title" className={fieldInputClass} {...register("jobTitle")} />
        </Field>

        <Field
          id="linkedinUrl"
          label="LinkedIn URL"
          required
          hint="https://www.linkedin.com/in/your-handle"
          error={errors.linkedinUrl?.message}
        >
          <input type="url" autoComplete="url" className={fieldInputClass} {...register("linkedinUrl")} />
        </Field>

        <Controller
          control={control}
          name="q1"
          render={({ field }) => (
            <ChoicePills
              legend="How do you usually discover new AI tools or trends?"
              description="Select all that apply."
              required
              name="q1"
              multi
              options={Q1_OPTIONS}
              value={field.value ?? []}
              onChange={field.onChange}
              error={errors.q1?.message as string | undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="q2"
          render={({ field }) => (
            <ChoicePills
              legend="How often do you actively read or watch AI content?"
              required
              name="q2"
              options={Q2_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.q2?.message as string | undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="q3"
          render={({ field }) => (
            <ChoicePills
              legend="When AI news appears, what makes you click?"
              description="Choose up to 2."
              required
              name="q3"
              multi
              max={2}
              options={Q3_OPTIONS}
              value={field.value ?? []}
              onChange={field.onChange}
              error={errors.q3?.message as string | undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="q4"
          render={({ field }) => (
            <ChoicePills
              legend="Where are you currently using AI the most?"
              required
              name="q4"
              options={Q4_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.q4?.message as string | undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="q5"
          render={({ field }) => (
            <ChoicePills
              legend="Which sentence sounds most like you?"
              required
              name="q5"
              options={Q5_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.q5?.message as string | undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="q6"
          render={({ field }) => (
            <ChoicePills
              legend="On a typical workday, how busy are you?"
              required
              name="q6"
              options={Q6_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.q6?.message as string | undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="q7"
          render={({ field }) => (
            <ChoicePills
              legend="How much time can you realistically spend learning AI weekly?"
              required
              name="q7"
              options={Q7_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.q7?.message as string | undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="q8"
          render={({ field }) => (
            <ChoicePills
              legend="What type of AI content do you enjoy most?"
              required
              name="q8"
              options={Q8_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.q8?.message as string | undefined}
            />
          )}
        />

        <div className="flex flex-col gap-2">
          <CopyPrompt />
          <Field
            id="aiProfile"
            label="AI profile JSON (optional)"
            hint="Paste the JSON response from ChatGPT/Claude here."
            error={errors.aiProfile?.message as string | undefined}
          >
            <textarea
              rows={6}
              placeholder='{ "current_role": "", ... }'
              className={fieldTextareaClass}
              {...register("aiProfile")}
            />
          </Field>
        </div>

        {banner.kind === "retry" && (
          <div role="alert" className="rounded-[var(--radius-brand)] border border-[var(--color-brand-error)] bg-[var(--color-brand-error-bg)] p-3 text-sm text-[var(--color-brand-error)]">
            {banner.message}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full sm:w-auto"
          >
            Submit
          </Button>
        </div>
      </form>

      <DuplicateDialog
        open={dupOpen}
        loading={submitting}
        onCancel={() => setDupOpen(false)}
        onConfirm={onConfirmUpdate}
      />
    </>
  );
}
