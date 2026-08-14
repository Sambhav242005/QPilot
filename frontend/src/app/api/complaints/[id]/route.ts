import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET /api/complaints/[id] ────────────────────────────────────────
// Get a single complaint by ID

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { auditEvents: { orderBy: { createdAt: "desc" } } },
    });

    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Failed to fetch complaint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch complaint" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/complaints/[id] ──────────────────────────────────────
// Update a complaint (extracted data, status, etc.)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check complaint exists
    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (body.extractedData !== undefined)
      updateData.extractedData = JSON.stringify(body.extractedData);
    if (body.validatedData !== undefined)
      updateData.validatedData = JSON.stringify(body.validatedData);
    if (body.classification !== undefined)
      updateData.classification = JSON.stringify(body.classification);
    if (body.riskAssessment !== undefined)
      updateData.riskAssessment = JSON.stringify(body.riskAssessment);
    if (body.recommendations !== undefined)
      updateData.recommendations = JSON.stringify(body.recommendations);
    if (body.completeness !== undefined)
      updateData.completeness = JSON.stringify(body.completeness);
    if (body.conversationHistory !== undefined)
      updateData.conversationHistory = JSON.stringify(body.conversationHistory);
    if (body.missingFields !== undefined)
      updateData.missingFields = JSON.stringify(body.missingFields);
    if (body.errors !== undefined) updateData.errors = JSON.stringify(body.errors);

    if (body.processingStatus) updateData.processingStatus = body.processingStatus;
    if (body.reviewState) updateData.reviewState = body.reviewState;
    if (body.commitState) updateData.commitState = body.commitState;

    const complaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
    });

    // Create audit event for significant updates
    if (body.processingStatus || body.reviewState || body.commitState) {
      await prisma.auditEvent.create({
        data: {
          complaintId: id,
          eventType: "updated",
          description: `Status updated: processing=${complaint.processingStatus}, review=${complaint.reviewState}, commit=${complaint.commitState}`,
          actor: "user",
          details: JSON.stringify(body),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Failed to update complaint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update complaint" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/complaints/[id] ─────────────────────────────────────
// Delete a complaint (only if draft)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.complaint.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    if (existing.commitState === "committed") {
      return NextResponse.json(
        { success: false, error: "Cannot delete committed complaint" },
        { status: 400 },
      );
    }

    // Delete audit events first
    await prisma.auditEvent.deleteMany({ where: { complaintId: id } });

    // Delete complaint
    await prisma.complaint.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Complaint deleted",
    });
  } catch (error) {
    console.error("Failed to delete complaint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete complaint" },
      { status: 500 },
    );
  }
}
