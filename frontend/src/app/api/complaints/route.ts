import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET /api/complaints ─────────────────────────────────────────────
// List all complaints with optional filtering

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const reviewState = searchParams.get("reviewState");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const where: Record<string, string> = {};
    if (status) where.processingStatus = status;
    if (reviewState) where.reviewState = reviewState;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.complaint.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: complaints,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    console.error("Failed to fetch complaints:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch complaints" },
      { status: 500 },
    );
  }
}

// ─── POST /api/complaints ────────────────────────────────────────────
// Create a new complaint

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawInput, inputType = "text", filePath } = body;

    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json({ success: false, error: "rawInput is required" }, { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        rawInput,
        inputType,
        filePath,
        processingStatus: "idle",
        reviewState: "pending",
        commitState: "draft",
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        complaintId: complaint.id,
        eventType: "created",
        description: "Complaint created",
        actor: "user",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: complaint,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create complaint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create complaint" },
      { status: 500 },
    );
  }
}
