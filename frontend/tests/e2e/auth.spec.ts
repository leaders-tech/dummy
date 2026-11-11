/*
This file checks the main browser flows: login, notes, logout, and admin access.
Edit this file when the real user flow changes across pages, cookies, or redirects.
Copy a test pattern here when you add another end-to-end browser flow.
*/

import { expect, test } from "@playwright/test";

test("user can login, manage notes, and logout", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open login page" }).click();
  await expect(page.getByLabel("Username")).toHaveValue("");
  await expect(page.getByLabel("Password")).toHaveValue("");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("user");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("WebSocket: connected", { exact: true })).toBeVisible();

  await page.getByPlaceholder("Write a short note").fill("Playwright note");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByRole("article").getByText("Playwright note")).toBeVisible();

  const note = page.getByRole("article").filter({ hasText: "Playwright note" });
  await note.getByRole("button", { name: "Edit" }).click();
  await page.getByPlaceholder("Write a short note").fill("Updated Playwright note");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByRole("article").getByText("Updated Playwright note")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("article").getByText("Updated Playwright note")).toBeVisible();
  await page.getByRole("article").filter({ hasText: "Updated Playwright note" }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("article").getByText("Updated Playwright note")).toHaveCount(0);

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("refresh cookie restores the session and notes update in a second tab", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("user");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("WebSocket: connected", { exact: true })).toBeVisible();

  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === "template_access")).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  const refreshCookie = cookies.find((cookie) => cookie.name === "template_refresh");
  expect(refreshCookie).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/api/auth" });
  await context.clearCookies({ name: "template_access" });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  expect((await context.cookies()).find((cookie) => cookie.name === "template_refresh")?.value).not.toBe(refreshCookie?.value);

  const second = await context.newPage();
  await second.goto("/dashboard");
  await expect(second.getByText("WebSocket: connected", { exact: true })).toBeVisible();
  const text = `Live note ${Date.now()}`;
  await page.getByPlaceholder("Write a short note").fill(text);
  await page.getByRole("button", { name: "Add note" }).click();
  const liveNote = second.getByRole("article").filter({ hasText: text });
  await expect(liveNote).toBeVisible();
  await liveNote.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("article").getByText(text)).toHaveCount(0);
  await second.close();
});

test("failed note save keeps the draft and shows an error", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("user");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.route("**/api/notes/save", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: { code: "server_error", message: "Please try saving again." } }),
    }),
  );
  await page.getByPlaceholder("Write a short note").fill("Keep my draft");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByRole("alert")).toHaveText("Please try saving again.");
  await expect(page.getByPlaceholder("Write a short note")).toHaveValue("Keep my draft");
  expect(pageErrors).toEqual([]);
});

test("normal user cannot access admin page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("user");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("admin can access admin page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin page" })).toBeVisible();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^admin$/ })
      .first(),
  ).toBeVisible();
});

test("expired access cookie is refreshed when saving a note without a page reload", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("user");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await context.clearCookies({ name: "template_access" });
  const text = `Saved after refresh ${Date.now()}`;
  await page.getByPlaceholder("Write a short note").fill(text);
  await page.getByRole("button", { name: "Add note" }).click();

  const note = page.getByRole("article").filter({ hasText: text });
  await expect(note).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect((await context.cookies()).some((cookie) => cookie.name === "template_access")).toBe(true);
  await note.getByRole("button", { name: "Delete" }).click();
  await expect(note).toHaveCount(0);
});

test("unknown address shows the not found page", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Go to home page" }).click();
  await expect(page).toHaveURL("/");
});
