import { test, expect } from "@playwright/test";

test.describe("Complaint Workflow — Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct title and branding", async ({ page }) => {
    await expect(page).toHaveTitle(/QPilot/);
    await expect(page.getByText("QPilot")).toBeVisible();
    await expect(page.getByText("AI Complaint Intelligence")).toBeVisible();
  });

  test("complaint form renders all sections", async ({ page }) => {
    await expect(page.getByText(/log customer complaint/i)).toBeVisible();
    await expect(page.getByText(/1\. origin & customer details/i)).toBeVisible();
    await expect(page.getByText(/2\. product & batch/i)).toBeVisible();
    await expect(page.getByText(/3\. complaint details/i)).toBeVisible();
    await expect(page.getByText(/4\. initial assessment/i)).toBeVisible();
  });

  test("form has all expected input fields", async ({ page }) => {
    // Text inputs
    await expect(page.getByPlaceholder(/awaiting ai extraction/i).first()).toBeVisible();

    // Select/combobox fields
    const comboboxes = page.getByRole("combobox");
    await expect(comboboxes).toHaveCount(4);

    // Date inputs
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(3);
  });

  test("form has a reset action before a complaint is processed", async ({ page }) => {
    await expect(page.getByRole("button", { name: /reset form/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /commit to qms/i })).toHaveCount(0);
  });

  test("AI assistant panel renders with welcome message", async ({ page }) => {
    await expect(
      page.getByText(/upload a complaint document or paste text/i)
    ).toBeVisible();
  });

  test("AI panel has text input and send button", async ({ page }) => {
    const textarea = page.getByPlaceholder(/ask about this complaint/i);
    await expect(textarea).toBeVisible();

    const sendButton = page.getByRole("button", { name: /send/i });
    await expect(sendButton).toBeVisible();
  });

  test("file upload area is visible", async ({ page }) => {
    await expect(page.getByText(/drag.*drop/i).first()).toBeVisible();
    await expect(page.getByText(/pdf.*docx.*txt/i).first()).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /complaints/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /reports/i })).toBeVisible();
  });

  test("user can type in customer name field", async ({ page }) => {
    const nameInput = page.getByLabel(/customer name/i);
    await nameInput.fill("Acme Pharma Inc.");
    await expect(nameInput).toHaveValue("Acme Pharma Inc.");
  });

  test("user can type in product name field", async ({ page }) => {
    const productInput = page.getByLabel(/product name/i);
    await productInput.fill("Ibuprofen 200mg Tablets");
    await expect(productInput).toHaveValue("Ibuprofen 200mg Tablets");
  });

  test("user can select complaint source from dropdown", async ({ page }) => {
    const sourceSelect = page.getByRole("combobox").first();
    await sourceSelect.click();
    await page.getByRole("option", { name: /pharmacy/i }).click();
    await expect(sourceSelect).toContainText(/pharmacy/i);
  });

  test("user can select severity from dropdown", async ({ page }) => {
    // Find the severity combobox (3rd combobox = index 2)
    const severitySelect = page.getByRole("combobox").nth(2);
    await severitySelect.click();
    await page.getByRole("option", { name: /major/i }).click();
    await expect(severitySelect).toContainText(/major/i);
  });

  test("user can type in complaint description", async ({ page }) => {
    const description = page.getByLabel(/detailed complaint description/i);
    await description.fill("Product arrived with broken seals and discoloration.");
    await expect(description).toHaveValue(/broken seals/);
  });

  test("reset button clears form fields", async ({ page }) => {
    // Fill a field first
    const nameInput = page.getByLabel(/customer name/i);
    await nameInput.fill("Test Customer");

    // Click reset
    await page.getByRole("button", { name: /reset form/i }).click();

    // Field should be cleared
    await expect(nameInput).toHaveValue("");
  });

  test("badge shows Pending Triage status", async ({ page }) => {
    await expect(page.getByText(/pending triage/i)).toBeVisible();
  });

  test("version badge is visible", async ({ page }) => {
    await expect(page.getByText("v0.1.0")).toBeVisible();
  });
});
