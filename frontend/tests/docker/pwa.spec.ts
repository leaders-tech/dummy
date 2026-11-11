/*
Check the built PWA through the Docker gateway, including its service worker.
Edit when caching or production routes change; copy for another built-app browser check.
*/

import { expect, test } from "@playwright/test";

test("service worker leaves API navigation to the backend", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const response = await page.goto("/api/health");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-type"]).toContain("application/json");
  expect(await response?.json()).toEqual({ ok: true, data: { status: "ok" } });
});

test("cached app shell opens offline and shows a readable connection error", async ({ page, context }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  try {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveText("Could not reach the server. Please try again.");
    expect(pageErrors).toEqual([]);
  } finally {
    await context.setOffline(false);
  }
});
