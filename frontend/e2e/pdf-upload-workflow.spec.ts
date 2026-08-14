import { test, expect } from "@playwright/test";

const complaintId = "demo-pdf-complaint";

const processedComplaint = {
  id: complaintId,
  raw_input: "Processing uploaded document: sample_complaint.pdf",
  status: "review",
  extraction: {
    complaint_source: "Phone Call",
    customer_name: "Greenfield Pharmacy",
    product_name: "Amoxicillin 500mg Capsules",
    product_strength: "500 mg",
    batch_number: "AMX-2026-B147",
    manufacturing_date: "March 2026",
    expiry_date: "March 2028",
    affected_quantity: "120 capsules (2 bottles)",
    complaint_type: "Product Defect",
    complaint_date: "August 12, 2026",
    complaint_description: "Several capsules were stuck together and discolored yellowish-brown.",
    initial_severity: "Major",
    priority: "High",
  },
  classification: {
    category: "Product Defect",
    subcategory: "Discoloration",
    reasoning: "The complaint describes a visible product quality defect in a named batch.",
  },
  risk_assessment: {
    overall_severity: "high",
    risk_factors: [
      { factor: "Product quality issue reported", severity: "high", reasoning: "The product appearance is abnormal." },
      { factor: "Specific batch identified", severity: "medium", reasoning: "The affected lot can be investigated." },
    ],
    reasoning: "The compromised inner barrier and discoloration warrant QA investigation.",
    recommended_action: "Route to QA investigation and review the affected batch.",
    confidence: "high",
  },
  completeness: {
    score: 1,
    required_fields: ["complaint_source", "customer_name", "product_name", "batch_number", "complaint_type", "complaint_date", "complaint_description"],
    present_fields: 7,
    missing_fields: [],
    explanation: null,
  },
  created_at: "2026-08-14T00:00:00Z",
  updated_at: "2026-08-14T00:00:00Z",
};

test.describe("PDF Upload Workflow", () => {
  test("processes the demo PDF, shows AI risk assessment, and supports human review", async ({ page }) => {
    await page.route("**/api/v1/complaints", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ...processedComplaint, extraction: null, classification: null, risk_assessment: null, completeness: null }),
      });
    });

    await page.route("**/api/v1/complaints/**", async (route) => {
      const request = route.request();
      const url = request.url();

      if (url.endsWith("/upload") && request.method() === "POST") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(processedComplaint) });
        return;
      }
      if (url.endsWith("/process") && request.method() === "POST") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(processedComplaint) });
        return;
      }
      if (url.endsWith("/commit") && request.method() === "POST") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, complaint_id: complaintId, message: "Complaint committed to QMS successfully" }) });
        return;
      }
      await route.continue();
    });

    await page.goto("/");
    await page.locator("#complaint-file").setInputFiles({
      name: "sample_complaint.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 demo complaint"),
    });

    await expect(page.getByText("Document processed successfully")).toBeVisible();
    await expect(page.getByLabel("Customer Name")).toHaveValue("Greenfield Pharmacy");
    await expect(page.getByLabel("Product Name")).toHaveValue("Amoxicillin 500mg Capsules");
    await expect(page.getByLabel("Batch/Lot Number")).toHaveValue("AMX-2026-B147");
    await expect(page.getByRole("heading", { name: "AI Analysis" })).toBeVisible();
    await expect(page.getByText("Product Defect").first()).toBeVisible();
    await expect(page.getByText("Risk Assessment", { exact: true })).toBeVisible();
    await expect(page.getByText("Recommended Action")).toBeVisible();
    await expect(page.getByText("Route to QA investigation and review the affected batch.")).toBeVisible();
    await expect(page.getByText("Ready for Review")).toBeVisible();

    await page.getByRole("button", { name: /open review & commit panel/i }).click();
    await expect(page.getByText("Review Complaint")).toBeVisible();
    await page.getByLabel(/i have reviewed the complaint data/i).check();
    await page.getByRole("button", { name: /commit to qms/i }).click();
    await expect(page.getByRole("status").filter({ hasText: /committed to qms successfully/i })).toBeVisible();
  });
});
