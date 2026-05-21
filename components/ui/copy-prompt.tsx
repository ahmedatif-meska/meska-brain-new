"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AI_EXTRACTION_PROMPT } from "@/lib/copy";

export function CopyPrompt() {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(AI_EXTRACTION_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the textarea for manual copy.
      const ta = document.getElementById("ai-prompt-source") as HTMLTextAreaElement | null;
      ta?.select();
    }
  }

  return (
    <div className="rounded-[var(--radius-brand)] border border-[var(--color-brand-field-border)] bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--color-brand-muted)]">
          Optional: copy this prompt → paste in ChatGPT or Claude → paste the JSON back below.
        </p>
        <Button type="button" variant="secondary" size="md" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy prompt"}
        </Button>
      </div>
      <textarea
        id="ai-prompt-source"
        readOnly
        rows={6}
        className="block w-full resize-none rounded-[8px] bg-[var(--color-brand-field-bg)] p-3 font-mono text-xs text-[var(--color-foreground)]"
        value={AI_EXTRACTION_PROMPT}
      />
    </div>
  );
}
