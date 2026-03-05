import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function recalculateProductScores(productId) {
  const aggregation = await prisma.vote.aggregate({
    where: { productId },
    _avg: { priceScore: true, qualityScore: true },
    _count: { id: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgPriceScore: parseFloat((aggregation._avg.priceScore || 0).toFixed(2)),
      avgQualityScore: parseFloat((aggregation._avg.qualityScore || 0).toFixed(2)),
      totalVotes: aggregation._count.id,
    },
  });
}

// Update a vote (owner only)
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vote = await prisma.vote.findUnique({ where: { id } });

    if (!vote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }
    if (vote.userId !== user.id) {
      return NextResponse.json({ error: "You can only edit your own votes" }, { status: 403 });
    }

    const body = await request.json();
    const { priceScore, qualityScore } = body;

    if (
      !Number.isInteger(priceScore) ||
      priceScore < 1 ||
      priceScore > 10
    ) {
      return NextResponse.json(
        { error: "priceScore must be an integer between 1 and 10" },
        { status: 400 }
      );
    }
    if (
      !Number.isInteger(qualityScore) ||
      qualityScore < 1 ||
      qualityScore > 10
    ) {
      return NextResponse.json(
        { error: "qualityScore must be an integer between 1 and 10" },
        { status: 400 }
      );
    }

    const updated = await prisma.vote.update({
      where: { id },
      data: { priceScore, qualityScore },
    });

    await recalculateProductScores(vote.productId);

    return NextResponse.json({ vote: updated });
  } catch (error) {
    console.error("Error updating vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete a vote (owner only)
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vote = await prisma.vote.findUnique({ where: { id } });

    if (!vote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }
    if (vote.userId !== user.id) {
      return NextResponse.json({ error: "You can only delete your own votes" }, { status: 403 });
    }

    await prisma.vote.delete({ where: { id } });
    await recalculateProductScores(vote.productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
