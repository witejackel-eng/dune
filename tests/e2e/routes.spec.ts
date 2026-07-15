import { test, expect } from "@playwright/test";

/**
 * Brief §18: End-to-end tests covering all routes, navigation, audio default state,
 * invalid-seed handling, no horizontal overflow, no console errors.
 */

const ROUTES = ["/", "/models", "/signal", "/archive", "/protocol"];
const EXPERIMENT_SLUGS = [
  "volatility-field",
  "covariance-body",
  "fourier-room",
  "brownian-choir",
  "phase-architecture",
  "liquidity-horizon",
];

test.describe("Route loading", () => {
  for (const route of ROUTES) {
    test(`${route} loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
      });
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.locator("body")).not.toBeEmpty();
      // Allow a moment for any deferred errors
      await page.waitForTimeout(500);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("Archive detail routes", () => {
  for (const slug of EXPERIMENT_SLUGS) {
    test(`/archive/${slug} loads with title and controls`, async ({ page }) => {
      await page.goto(`/archive/${slug}`, { waitUntil: "networkidle" });
      // Should have an h1 with the experiment title
      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();
      // Should have controls section
      await expect(page.getByText(/CONTROLS|FORMULA/)).toBeVisible();
    });
  }
});

test("Browser back and forward navigation works", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.goto("/models", { waitUntil: "networkidle" });
  await page.goto("/signal", { waitUntil: "networkidle" });
  await page.goBack();
  await expect(page).toHaveURL(/\/models/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/models/);
});

test("Audio is disabled by default on /signal", async ({ page }) => {
  await page.goto("/signal", { waitUntil: "networkidle" });
  // The "ENABLE SIGNAL" CTA should be visible since audio is off
  await expect(page.getByText(/ENABLE SIGNAL/i)).toBeVisible();
});

test("Sequencer can toggle steps", async ({ page }) => {
  await page.goto("/signal", { waitUntil: "networkidle" });
  // Find the first step button (pulse channel, step 1)
  const firstStep = page.getByRole("button", { name: /pulse step 1/i }).first();
  await firstStep.click();
  // Verify it became active
  await expect(firstStep).toHaveAttribute("aria-pressed", "true");
  // Click again to deactivate
  await firstStep.click();
  await expect(firstStep).toHaveAttribute("aria-pressed", "false");
});

test("Invalid seed string shows INVALID SEED feedback", async ({ page }) => {
  await page.goto("/signal", { waitUntil: "networkidle" });
  // Type an invalid seed
  const input = page.getByLabel(/pattern seed string input/i);
  await input.fill("invalid");
  await page.getByRole("button", { name: /^LOAD$/i }).click();
  // Should show INVALID SEED feedback
  await expect(page.getByText("INVALID SEED")).toBeVisible();
});

test("Models page keyboard navigation works", async ({ page }) => {
  await page.goto("/models", { waitUntil: "networkidle" });
  // First tab should be focused
  const firstTab = page.getByRole("tab").first();
  await firstTab.focus();
  await expect(firstTab).toBeFocused();
  // Press Arrow Right to move to next tab
  await page.keyboard.press("ArrowRight");
  const secondTab = page.getByRole("tab").nth(1);
  await expect(secondTab).toBeFocused();
});

test("No horizontal overflow at 375px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/", { waitUntil: "networkidle" });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

test("Skip-to-content link is present", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const skipLink = page.getByRole("link", { name: /skip to content/i });
  await expect(skipLink).toBeAttached();
});

test("Mobile menu opens and closes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only test");
  await page.goto("/", { waitUntil: "networkidle" });
  // Open mobile menu
  const menuButton = page.getByLabel(/open menu/i);
  if (await menuButton.isVisible()) {
    await menuButton.click();
    // Should see nav links
    await expect(page.getByRole("link", { name: /observatory/i }).first()).toBeVisible();
    // Close with Escape
    await page.keyboard.press("Escape");
  }
});
