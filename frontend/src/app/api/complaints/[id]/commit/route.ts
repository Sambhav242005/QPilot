import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── POST /api/complaints/[id]/commit ────────────────────────────────
// Commit a complaint to QMS (final step)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const complaint = await prisma.complaint.findUnique({ where: { id } });

    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    // Validation checks before commit
    if (complaint.reviewState !== "approved") {
      return NextResponse.json(
        { success: false, error: "Complaint must be approved before commit" },
        { status: 400 },
      );
    }

    if (complaint.commitState === "committed") {
      return NextResponse.json(
        { success: false, error: "Complaint already committed" },
        { status: 400 },
      );
    }

    // Generate QMS ID (in production, this would come from the QMS system)
    const qmsId = `QMS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Commit the complaint
    const committed = await prisma.complaint.update({
      where: { id },
      data: {
        commitState: "committed",
        qmsId,
        committedAt: new Date(),
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        complaintId: id,
        eventType: "committed",
        description: `Committed to QMS with ID: ${qmsId}`,
        actor: "user",
        details: JSON.stringify({
          qmsId,
          committedAt: committed.committedAt,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: committed.id,
        qmsId: committed.qmsId,
        committedAt: committed.committedAt,
        message: "Complaint successfully committed to QMS",
      },
    });
  } catch (error) {
    console.error("Failed to commit complaint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to commit complaint" },
      { status: 500 },
    );
  }
}
