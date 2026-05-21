"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function DuplicateDialog({ open, onConfirm, onCancel, loading }: Props) {
  const confirmRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dup-title"
      aria-describedby="dup-body"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-[var(--radius-brand)] bg-white p-6 shadow-xl">
        <h2 id="dup-title" className="text-lg font-semibold text-[var(--color-foreground)]">
          You already have a record with us
        </h2>
        <p id="dup-body" className="mt-2 text-sm text-[var(--color-brand-muted)]">
          We found an existing entry for this email. Would you like to update it
          with the information you just entered, or cancel and keep the existing
          record as-is?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant="primary"
            onClick={onConfirm}
            loading={loading}
          >
            Update with new info
          </Button>
        </div>
      </div>
    </div>
  );
}
