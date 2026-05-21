import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

import { SubmissionForm } from "@/components/submission-form";

function fillValid() {
  fireEvent.change(screen.getByLabelText(/Display name/i), { target: { value: "Asma Ali" } });
  fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: "asma@example.com" } });
  fireEvent.change(screen.getByLabelText(/Phone number/i), { target: { value: "1234567890" } });
  fireEvent.change(screen.getByLabelText(/Job title/i), { target: { value: "Engineer" } });
  fireEvent.change(screen.getByLabelText(/LinkedIn URL/i), {
    target: { value: "https://www.linkedin.com/in/asma" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: /LinkedIn$/i }));
  fireEvent.click(screen.getByRole("radio", { name: /^Daily$/i }));
  fireEvent.click(screen.getByRole("checkbox", { name: /New AI tools/i }));
  fireEvent.click(screen.getByRole("radio", { name: /Daily work tasks/i }));
  fireEvent.click(screen.getByRole("radio", { name: /I use AI every day/i }));
  fireEvent.click(screen.getByRole("radio", { name: /Busy but manageable/i }));
  fireEvent.click(screen.getByRole("radio", { name: /^1–3 hours$/i }));
  fireEvent.click(screen.getByRole("radio", { name: /Short insights/i }));
}

beforeEach(() => {
  pushMock.mockReset();
  vi.unstubAllGlobals();
});

describe("SubmissionForm — 503 then 201", () => {
  it("shows a retry banner, then succeeds on retry", async () => {
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        call += 1;
        if (call === 1) {
          return new Response(JSON.stringify({ status: "upstream_unavailable" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ status: "created", id: "abc" }), {
          status: 201,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    render(<SubmissionForm />);
    fillValid();
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/thank-you"));
  });
});
