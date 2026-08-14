import { test, expect } from "@playwright/test";

test.describe("Accessibility — Keyboard Nav & ARIA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page has no duplicate IDs", async ({ page }) => {
    const ids = await page.evaluate(() => {
      const elements = document.querySelectorAll("[id]");
      return Array.from(elements).map((el) => el.id);
    });
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("all interactive elements are focusable", async ({ page }) => {
    // Tab through form fields
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["INPUT", "TEXTAREA", "BUTTON", "SELECT", "A"]).toContain(firstFocused);
  });

  test("form inputs have associated labels", async ({ page }) => {
    const inputs = page.locator("input:not([type='hidden'])");
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");

      // Each input should have either an id with label, or aria-label
      const hasLabel = id || ariaLabel || ariaLabelledBy;
      expect(hasLabel).toBeTruthy();
    }
  });

  test("buttons have accessible names", async ({ page }) => {
    const buttons = page.getByRole("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute("aria-label");
      const text = await button.textContent();
      // Button should have either aria-label or visible text
      expect(name || text?.trim()).toBeTruthy();
    }
  });

  test("comboboxes are keyboard accessible", async ({ page }) => {
    const combobox = page.getByRole("combobox").first();
    await combobox.focus();

    // Open with Enter or Space
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Should see options
    const options = page.getByRole("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // Close with Escape
    await page.keyboard.press("Escape");
  });

  test("page has proper heading hierarchy", async ({ page }) => {
    const headings = await page.evaluate(() => {
      const elements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      return Array.from(elements).map((el) => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent?.trim(),
      }));
    });

    // Should have at least one h1
    expect(headings.some((h) => h.level === 1)).toBeTruthy();

    // h1 should come first
    const firstH1Index = headings.findIndex((h) => h.level === 1);
    expect(firstH1Index).toBe(0);
  });

  test("textareas are keyboard accessible", async ({ page }) => {
    const textarea = page.getByPlaceholder(/ask about this complaint/i);
    await textarea.focus();
    await page.keyboard.type("Typed via keyboard");
    await expect(textarea).toHaveValue("Typed via keyboard");
  });

  test("reset button is keyboard activatable", async ({ page }) => {
    const resetButton = page.getByRole("button", { name: /reset form/i });
    await resetButton.focus();
    await page.keyboard.press("Enter");
    await expect(resetButton).toBeDisabled();
  });
});
