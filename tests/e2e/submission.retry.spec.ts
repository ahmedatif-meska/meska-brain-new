import { test, expect } from "@playwright/test";

test("503 then success: user retries and lands on /thank-you", async ({ page }) => {
  let call = 0;
  await page.route("**/api/submissions", async (route) => {
    call += 1;
    if (call === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ status: "upstream_unavailable" }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByLabel(/Display name/i).fill("Asma Ali");
  await page.getByLabel(/^Email/i).fill(`retry+${Date.now()}@example.com`);
  await page.getByLabel(/Phone number/i).fill("1234567890");
  await page.getByLabel(/Job title/i).fill("Engineer");
  await page.getByLabel(/LinkedIn URL/i).fill("https://www.linkedin.com/in/asma");
  await page.getByRole("checkbox", { name: /^LinkedIn$/ }).click();
  await page.getByRole("radio", { name: /^Daily$/ }).click();
  await page.getByRole("checkbox", { name: /New AI tools/ }).click();
  await page.getByRole("radio", { name: /Daily work tasks/ }).click();
  await page.getByRole("radio", { name: /I use AI every day/ }).click();
  await page.getByRole("radio", { name: /Busy but manageable/ }).click();
  await page.getByRole("radio", { name: /^1–3 hours$/ }).click();
  await page.getByRole("radio", { name: /Short insights/ }).click();
  await page.getByRole("button", { name: /submit/i }).click();
  await expect(page.getByText(/try again|couldn't reach|network error/i)).toBeVisible();
  await page.getByRole("button", { name: /submit/i }).click();
  await expect(page).toHaveURL(/\/thank-you/);
});
