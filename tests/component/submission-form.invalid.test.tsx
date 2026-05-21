import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { SubmissionForm } from "@/components/submission-form";

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("SubmissionForm — invalid input", () => {
  it("shows the display-name two-name error and marks the field invalid", async () => {
    render(<SubmissionForm />);
    fireEvent.change(screen.getByLabelText(/Display name/i), { target: { value: "Asma" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least two names/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Display name/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("shows multiple errors when submitting an empty form", async () => {
    render(<SubmissionForm />);
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
  });
});
