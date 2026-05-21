import * as React from "react";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
};

export function Field({ id, label, hint, error, required, children }: FieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null]
    .filter(Boolean)
    .join(" ");

  const control = React.cloneElement(children, {
    id,
    "aria-invalid": !!error,
    "aria-describedby": describedBy || undefined,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-foreground)]">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-[var(--color-brand-error)]">
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-brand-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-err`}
          role="alert"
          className="text-xs font-medium text-[var(--color-brand-error)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export const fieldInputClass =
  "h-11 w-full rounded-[var(--radius-brand)] bg-[var(--color-brand-field-bg)] px-3.5 text-[15px] text-[var(--color-foreground)] placeholder:text-[var(--color-brand-muted)] outline-none border border-transparent focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30 aria-[invalid=true]:border-[var(--color-brand-error)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--color-brand-error)]/25";

export const fieldTextareaClass =
  "min-h-[120px] w-full rounded-[var(--radius-brand)] bg-[var(--color-brand-field-bg)] p-3.5 text-[15px] text-[var(--color-foreground)] placeholder:text-[var(--color-brand-muted)] outline-none border border-transparent focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30 aria-[invalid=true]:border-[var(--color-brand-error)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--color-brand-error)]/25 font-mono";
