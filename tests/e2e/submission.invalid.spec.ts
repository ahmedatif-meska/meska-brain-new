import { test, expect } from "@playwright/test";

test("invalid submit shows field errors and does not navigate", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /submit/i }).click();
  // We never leave the form
  await expect(page).toHaveURL(/\/$/);
  // At least one error message is visible
  await expect(page.getByRole("alert").first()).toBeVisible();
});
