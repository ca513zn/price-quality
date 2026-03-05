import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify, normalizeBrandName } from "@/lib/utils";

/**
 * GET /api/submissions/check?name=...
 * Real-time duplicate check for the submission form.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ matches: [] });
    }

    const slug = slugify(name.trim());
    const normalized = normalizeBrandName(name.trim());

    // Check exact slug match
    const exactMatch = await prisma.brand.findUnique({
      where: { slug },
      select: { name: true, slug: true },
    });

    if (exactMatch) {
      return NextResponse.json({
        matches: [{ name: exactMatch.name, slug: exactMatch.slug, type: "exact" }],
      });
    }

    // Fuzzy match against all brands
    const allBrands = await prisma.brand.findMany({
      select: { name: true, slug: true },
    });

    const fuzzyMatches = allBrands.filter((b) => {
      const bNorm = normalizeBrandName(b.name);
      if (bNorm === normalized) return true;
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

    return NextResponse.json({
      matches: fuzzyMatches.map((b) => ({ name: b.name, slug: b.slug, type: "similar" })),
    });
  } catch (error) {
    console.error("Error checking submission:", error);
    return NextResponse.json({ matches: [] });
  }
}
