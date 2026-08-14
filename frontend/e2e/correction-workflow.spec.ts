import { test, expect } from "@playwright/test";

test.describe("Correction Workflow — User Edits", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("user can edit multiple fields sequentially", async ({ page }) => {
    // Fill customer name
    const nameInput = page.getByLabel(/customer name/i);
    await nameInput.fill("First Customer");
    await expect(nameInput).toHaveValue("First Customer");

    // Change to different value
    await nameInput.fill("Second Customer");
    await expect(nameInput).toHaveValue("Second Customer");
  });

  test("selecting a complaint type updates the field", async ({ page }) => {
    const typeSelect = page.getByRole("combobox").nth(1); // complaint type
    await typeSelect.click();
    await page.getByRole("option", { name: /product defect/i }).click();
    await expect(typeSelect).toContainText(/product defect/i);
  });

  test("selecting priority updates the field", async ({ page }) => {
    const prioritySelect = page.getByRole("combobox").nth(3); // priority
    await prioritySelect.click();
    await page.getByRole("option", { name: /high/i }).click();
    await expect(prioritySelect).toContainText(/high/i);
  });

  test("form preserves values across field edits", async ({ page }) => {
    // Fill customer name
    await page.getByLabel(/customer name/i).fill("Stable Customer");

    // Fill product name
    await page.getByLabel(/product name/i).fill("Aspirin 100mg");

    // Both should retain their values
    await expect(page.getByLabel(/customer name/i)).toHaveValue("Stable Customer");
    await expect(page.getByLabel(/product name/i)).toHaveValue("Aspirin 100mg");
  });

  test("AI panel textarea allows typing messages", async ({ page }) => {
    const textarea = page.getByPlaceholder(/ask about this complaint/i);
    await textarea.fill("What is the complaint category?");
    await expect(textarea).toHaveValue("What is the complaint category?");
  });

  test("date fields accept date input", async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    const firstDate = dateInputs.first();
    await firstDate.fill("2025-01-15");
    await expect(firstDate).toHaveValue("2025-01-15");
  });

  test("batch number field accepts alphanumeric input", async ({ page }) => {
    const batchInput = page.getByLabel(/batch.*lot number/i);
    await batchInput.fill("BATCH-2025-001");
    await expect(batchInput).toHaveValue("BATCH-2025-001");
  });

  test("quantity field accepts numeric input", async ({ page }) => {
    const quantityInput = page.getByLabel(/quantity affected/i);
    await quantityInput.fill("500");
    await expect(quantityInput).toHaveValue("500");
  });

  test("can fill complete complaint form", async ({ page }) => {
    // Section 1: Origin & Customer
    const sourceSelect = page.getByRole("combobox").first();
    await sourceSelect.click();
    await page.getByRole("option", { name: /hospital/i }).click();
    await page.getByLabel(/customer name/i).fill("Metro General Hospital");

    // Section 2: Product & Batch
    await page.getByLabel(/product name/i).fill("Amoxicillin 500mg");
    await page.getByLabel(/product strength/i).fill("500mg capsules");
    await page.getByLabel(/batch.*lot number/i).fill("AMX-2025-042");
    await page.locator('input[type="date"]').nth(0).fill("2025-03-01");
    await page.locator('input[type="date"]').nth(1).fill("2027-03-01");
    await page.getByLabel(/quantity affected/i).fill("1000");

    // Section 3: Complaint Details
    const typeSelect = page.getByRole("combobox").nth(1);
    await typeSelect.click();
    await page.getByRole("option", { name: /packaging issue/i }).click();
    await page.locator('input[type="date"]').nth(2).fill("2025-06-15");
    await page.getByLabel(/detailed complaint description/i).fill(
      "Capsules found with cracked shells upon delivery. Packaging integrity compromised."
    );

    // Section 4: Assessment
    const severitySelect = page.getByRole("combobox").nth(2);
    await severitySelect.click();
    await page.getByRole("option", { name: /major/i }).click();
    const prioritySelect = page.getByRole("combobox").nth(3);
    await prioritySelect.click();
    await page.getByRole("option", { name: /high/i }).click();

    // Verify all values
    await expect(page.getByLabel(/customer name/i)).toHaveValue("Metro General Hospital");
    await expect(page.getByLabel(/product name/i)).toHaveValue("Amoxicillin 500mg");
    await expect(page.getByLabel(/batch.*lot number/i)).toHaveValue("AMX-2025-042");
  });
});
