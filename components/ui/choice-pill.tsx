"use client";

import * as React from "react";

type Option = { code: string; label: string };

type CommonProps = {
  legend: string;
  description?: string;
  required?: boolean;
  options: readonly Option[];
  error?: string;
  name: string;
};

type SingleProps = CommonProps & {
  multi?: false;
  value: string | undefined;
  onChange: (next: string) => void;
};

type MultiProps = CommonProps & {
  multi: true;
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
};

export type ChoicePillsProps = SingleProps | MultiProps;

const pillBase =
  "inline-flex min-h-[44px] select-none items-center justify-center rounded-[var(--radius-brand)] border px-3.5 py-2 text-sm leading-snug text-left cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-1";

const pillUnselected =
  "bg-[var(--color-brand-field-bg)] border-transparent text-[var(--color-foreground)] hover:bg-[var(--color-brand-field-bg-hover)]";

const pillSelected =
  "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-[var(--color-brand-on-primary)] hover:bg-[var(--color-brand-primary-hover)]";

export function ChoicePills(props: ChoicePillsProps) {
  const { legend, description, required, options, error, name } = props;
  const errId = `${name}-err`;
  const descId = description ? `${name}-desc` : undefined;
  const describedBy = [descId, error ? errId : null].filter(Boolean).join(" ");

  function isSelected(code: string): boolean {
    return props.multi ? props.value.includes(code) : props.value === code;
  }

  function toggle(code: string) {
    if (props.multi) {
      const current = props.value;
      if (current.includes(code)) {
        props.onChange(current.filter((c) => c !== code));
      } else {
        const next = [...current, code];
        if (props.max && next.length > props.max) {
          // Drop the oldest to keep within max
          next.shift();
        }
        props.onChange(next);
      }
    } else {
      props.onChange(code);
    }
  }

  return (
    <fieldset aria-describedby={describedBy || undefined} aria-invalid={!!error}>
      <legend className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
        {legend}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-[var(--color-brand-error)]">
            *
          </span>
        )}
      </legend>
      {description && (
        <p id={descId} className="mb-2 text-xs text-[var(--color-brand-muted)]">
          {description}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = isSelected(opt.code);
          return (
            <button
              key={opt.code}
              type="button"
              role={props.multi ? "checkbox" : "radio"}
              aria-checked={selected}
              onClick={() => toggle(opt.code)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  toggle(opt.code);
                }
              }}
              className={[pillBase, selected ? pillSelected : pillUnselected].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p id={errId} role="alert" className="mt-2 text-xs font-medium text-[var(--color-brand-error)]">
          {error}
        </p>
      )}
    </fieldset>
  );
}
