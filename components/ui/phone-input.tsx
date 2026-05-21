"use client";

import * as React from "react";
import { COUNTRIES } from "@/lib/validation/countries";
import { fieldInputClass } from "@/components/ui/field";

type Props = {
  id: string;
  countryCode: string;
  national: string;
  onCountryCodeChange: (next: string) => void;
  onNationalChange: (next: string) => void;
  invalid?: boolean;
  describedBy?: string;
};

export function PhoneInput({
  id,
  countryCode,
  national,
  onCountryCodeChange,
  onNationalChange,
  invalid,
  describedBy,
}: Props) {
  return (
    <div className="flex gap-2">
      <select
        aria-label="Country code"
        value={countryCode}
        onChange={(e) => onCountryCodeChange(e.target.value)}
        className="h-11 w-[88px] shrink-0 rounded-[var(--radius-brand)] bg-[var(--color-brand-field-bg)] px-2 text-[14px] outline-none border border-transparent focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30"
      >
        {COUNTRIES.map((c) => (
          <option key={`${c.code}-${c.dialCode}`} value={c.dialCode} title={c.name}>
            {c.dialCode}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="10-digit number"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={national}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D+/g, "").slice(0, 10);
          onNationalChange(digits);
        }}
        className={fieldInputClass + " flex-1"}
      />
    </div>
  );
}
