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
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={handleCopy}
          className="bg-gradient-to-br from-[#7ee8ff] via-[#3aa8ff] to-[#0066ff] text-white font-semibold shadow-[0_4px_18px_rgba(30,144,255,0.55)] hover:brightness-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? "Copied!" : "Copy Prompt"}
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
