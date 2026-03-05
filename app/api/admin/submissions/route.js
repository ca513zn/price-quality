import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

/**
 * GET /api/admin/submissions — List all submissions for moderation
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // optional filter

    const where = status ? { status } : {};

    const submissions = await prisma.brandSubmission.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/submissions — Approve, reject, or mark as duplicate
 */
export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await request.json();
    const { id, action, reviewNotes, rejectionReason, editedName, editedDescription, duplicateBrandId } = body;

    if (!id) return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });

    const submission = await prisma.brandSubmission.findUnique({ where: { id } });
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    if (submission.status === "APPROVED" || submission.status === "REJECTED" || submission.status === "DUPLICATE") {
      return NextResponse.json({ error: "This submission has already been resolved" }, { status: 400 });
    }

    // ── APPROVE ──
    if (action === "approve") {
      const brandName = (editedName || submission.name).trim();
      const brandSlug = slugify(brandName);

      // Check for slug collision before creating
      const existing = await prisma.brand.findUnique({ where: { slug: brandSlug } });
      if (existing) {
        return NextResponse.json(
          { error: `A brand with slug "${brandSlug}" already exists. Use a different name or mark as duplicate.` },
          { status: 409 }
        );
      }

      // Atomic: create brand + update submission
      const [brand, updated] = await prisma.$transaction([
        prisma.brand.create({
          data: {
            name: brandName,
            slug: brandSlug,
            description: (editedDescription || submission.description)?.trim() || null,
          },
        }),
        prisma.brandSubmission.update({
          where: { id },
          data: {
            status: "APPROVED",
            reviewerId: user.id,
            reviewNotes: reviewNotes?.trim() || null,
            promotedBrandId: undefined, // will be set below
            reviewedAt: new Date(),
          },
        }),
      ]);

      // Set promotedBrandId (we need the brand.id from the transaction)
      const finalSubmission = await prisma.brandSubmission.update({
        where: { id },
        data: { promotedBrandId: brand.id },
        include: {
          submitter: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        submission: finalSubmission,
        brand,
        message: `Brand "${brand.name}" created and submission approved`,
      });
    }

    // ── REJECT ──
    if (action === "reject") {
      const updated = await prisma.brandSubmission.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewerId: user.id,
          reviewNotes: reviewNotes?.trim() || null,
          rejectionReason: rejectionReason || "Does not meet criteria",
          reviewedAt: new Date(),
        },
        include: {
          submitter: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ submission: updated, message: "Submission rejected" });
    }

    // ── MARK AS DUPLICATE ──
    if (action === "duplicate") {
      if (!duplicateBrandId) {
        return NextResponse.json({ error: "duplicateBrandId is required for duplicate action" }, { status: 400 });
      }

      const existingBrand = await prisma.brand.findUnique({ where: { id: duplicateBrandId } });
      if (!existingBrand) {
        return NextResponse.json({ error: "Target brand not found" }, { status: 404 });
      }

      const updated = await prisma.brandSubmission.update({
        where: { id },
        data: {
          status: "DUPLICATE",
          reviewerId: user.id,
          reviewNotes: reviewNotes?.trim() || null,
          duplicateOfId: duplicateBrandId,
          promotedBrandId: duplicateBrandId,
          reviewedAt: new Date(),
        },
        include: {
          submitter: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        submission: updated,
        message: `Submission marked as duplicate of "${existingBrand.name}"`,
      });
    }

    return NextResponse.json({ error: "Invalid action. Use: approve, reject, or duplicate" }, { status: 400 });
  } catch (error) {
    console.error("Error moderating submission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
