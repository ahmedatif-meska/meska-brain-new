import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { SubmissionForm } from "@/components/submission-form";

function setFetchOk(responseBody: Record<string, unknown>, status = 201) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(responseBody), {
        status,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
}

beforeEach(() => {
  pushMock.mockReset();
  vi.unstubAllGlobals();
});

describe("SubmissionForm", () => {
  it("renders submit button and core fields", () => {
    render(<SubmissionForm />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/i)).toBeInTheDocument();
  });

  it("on 201 created, navigates to /thank-you", async () => {
    setFetchOk({ status: "created", id: "00000000-0000-0000-0000-000000000001" }, 201);

    render(<SubmissionForm />);

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

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/thank-you"));
  });
});
