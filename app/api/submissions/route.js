import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify, normalizeBrandName } from "@/lib/utils";

const MAX_SUBMISSIONS_PER_DAY = 5;

/**
 * POST /api/submissions — Submit a new brand
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to submit a brand" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, websiteUrl, categories } = body;

    // --- Validation ---
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Brand name must be at least 2 characters" }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Brand name must be under 100 characters" }, { status: 400 });
    }
    if (description && description.trim().length > 500) {
      return NextResponse.json({ error: "Description must be under 500 characters" }, { status: 400 });
    }

    // --- Rate limiting ---
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.brandSubmission.count({
      where: {
        submitterId: user.id,
        createdAt: { gte: oneDayAgo },
      },
    });
    if (recentCount >= MAX_SUBMISSIONS_PER_DAY) {
      return NextResponse.json(
        { error: `You can submit up to ${MAX_SUBMISSIONS_PER_DAY} brands per day. Please try again later.` },
        { status: 429 }
      );
    }

    const slug = slugify(name.trim());
    const normalized = normalizeBrandName(name.trim());

    // --- Duplicate detection: exact slug match against Brand ---
    const existingBrand = await prisma.brand.findUnique({ where: { slug } });
    if (existingBrand) {
      return NextResponse.json(
        {
          error: "This brand already exists in our database",
          existingBrand: { name: existingBrand.name, slug: existingBrand.slug },
        },
        { status: 409 }
      );
    }

    // --- Duplicate detection: pending submissions with same slug ---
    const existingSubmission = await prisma.brandSubmission.findFirst({
      where: { slug, status: { in: ["PENDING", "IN_REVIEW"] } },
    });
    if (existingSubmission) {
      return NextResponse.json(
        { error: "A submission for this brand is already pending review" },
        { status: 409 }
      );
    }

    // --- Fuzzy match: check normalized names against existing brands ---
    const allBrands = await prisma.brand.findMany({ select: { id: true, name: true, slug: true } });
    const possibleDuplicates = allBrands.filter((b) => {
      const bNorm = normalizeBrandName(b.name);
      if (bNorm === normalized) return true;
      // Simple Levenshtein-like check: if names differ by 2 chars or less
      if (Math.abs(bNorm.length - normalized.length) <= 2) {
        let diff = 0;
        const maxLen = Math.max(bNorm.length, normalized.length);
        for (let i = 0; i < maxLen; i++) {
          if (bNorm[i] !== normalized[i]) diff++;
          if (diff > 2) break;
        }
        return diff <= 2 && maxLen > 3;
      }
      return false;
    });

    // Determine initial status
    const status = possibleDuplicates.length > 0 ? "IN_REVIEW" : "PENDING";
    const duplicateOfId = possibleDuplicates.length === 1 ? possibleDuplicates[0].id : null;

    const submission = await prisma.brandSubmission.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        websiteUrl: websiteUrl?.trim() || null,
        categories: categories || [],
        status,
        submitterId: user.id,
        duplicateOfId,
      },
      include: {
        submitter: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        submission,
        possibleDuplicates: possibleDuplicates.map((b) => ({ name: b.name, slug: b.slug })),
        message:
          possibleDuplicates.length > 0
            ? "Submission created but flagged for review — possible duplicates detected"
            : "Submission created successfully! It will be reviewed by our team.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/submissions — Get current user's submissions
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await prisma.brandSubmission.findMany({
      where: { submitterId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
