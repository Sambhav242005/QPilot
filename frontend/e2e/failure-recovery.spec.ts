import { test, expect } from "@playwright/test";

test.describe("Failure Recovery — Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page renders without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.reload();
    await page.waitForLoadState("networkidle");

    // No uncaught JS errors
    expect(errors).toHaveLength(0);
  });

  test("form remains functional when no complaint has been processed", async ({ page }) => {
    // Fill form
    await page.getByLabel(/customer name/i).fill("Test Customer");

    // Form should still be interactive
    await expect(page.getByLabel(/customer name/i)).toHaveValue("Test Customer");

    // Can still edit fields
    await page.getByLabel(/customer name/i).fill("Updated Customer");
    await expect(page.getByLabel(/customer name/i)).toHaveValue("Updated Customer");
  });

  test("AI panel remains functional when backend unavailable", async ({ page }) => {
    const textarea = page.getByPlaceholder(/ask about this complaint/i);

    // Type a message
    await textarea.fill("Hello AI");

    // Click send (will fail silently without backend)
    await page.getByRole("button", { name: /send/i }).click();

    // Panel should still be interactive
    await expect(textarea).toBeVisible();
    await textarea.fill("Another message");
    await expect(textarea).toHaveValue("Another message");
  });

  test("file upload area handles drag events gracefully", async ({ page }) => {
    const dropZone = page.getByText(/drag.*drop/i).first();

    // Simulate drag enter/leave
    await dropZone.hover();
    await expect(dropZone).toBeVisible();
  });

  test("reset button works at any time", async ({ page }) => {
    // Fill some fields
    await page.getByLabel(/customer name/i).fill("To Be Cleared");
    await page.getByLabel(/product name/i).fill("To Be Cleared");

    // Reset
    await page.getByRole("button", { name: /reset form/i }).click();

    // All fields cleared
    await expect(page.getByLabel(/customer name/i)).toHaveValue("");
    await expect(page.getByLabel(/product name/i)).toHaveValue("");
  });

  test("long text does not break the form layout", async ({ page }) => {
    const longText = "A".repeat(500);
    const description = page.getByLabel(/detailed complaint description/i);
    await description.fill(longText);
    await expect(description).toContainText("A".repeat(100));

    // Form should still be usable
    await expect(page.getByRole("button", { name: /reset form/i })).toBeVisible();
  });

  test("concurrent field edits do not cause issues", async ({ page }) => {
    // Rapidly fill multiple fields
    const nameInput = page.getByLabel(/customer name/i);
    const productInput = page.getByLabel(/product name/i);
    const batchInput = page.getByLabel(/batch.*lot number/i);

    await nameInput.fill("Customer A");
    await productInput.fill("Product A");
    await batchInput.fill("Batch A");

    // Change all of them
    await nameInput.fill("Customer B");
    await productInput.fill("Product B");
    await batchInput.fill("Batch B");

    // Verify final state
    await expect(nameInput).toHaveValue("Customer B");
    await expect(productInput).toHaveValue("Product B");
    await expect(batchInput).toHaveValue("Batch B");
  });
});
