-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rawInput" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "filePath" TEXT,
    "extractedData" TEXT,
    "validatedData" TEXT,
    "validationResults" TEXT,
    "missingFields" TEXT,
    "classification" TEXT,
    "riskAssessment" TEXT,
    "recommendations" TEXT,
    "completeness" TEXT,
    "conversationHistory" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'idle',
    "reviewState" TEXT NOT NULL DEFAULT 'pending',
    "commitState" TEXT NOT NULL DEFAULT 'draft',
    "errors" TEXT,
    "qmsId" TEXT,
    "committedAt" DATETIME
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "complaintId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "details" TEXT,
    CONSTRAINT "AuditEvent_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Complaint_processingStatus_idx" ON "Complaint"("processingStatus");

-- CreateIndex
CREATE INDEX "Complaint_reviewState_idx" ON "Complaint"("reviewState");

-- CreateIndex
CREATE INDEX "Complaint_commitState_idx" ON "Complaint"("commitState");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_complaintId_idx" ON "AuditEvent"("complaintId");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_idx" ON "AuditEvent"("eventType");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");
