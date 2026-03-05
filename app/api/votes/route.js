import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in to vote" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, priceScore, qualityScore } = body;

    // Validate inputs
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }
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

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if user already voted on this product
    const existingVote = await prisma.vote.findUnique({
      where: { productId_userId: { productId, userId: user.id } },
    });
    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this product. Edit your existing vote instead." },
        { status: 409 }
      );
    }

    // Create vote
    const vote = await prisma.vote.create({
      data: { productId, userId: user.id, priceScore, qualityScore },
    });

    // Recalculate aggregated scores
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

    return NextResponse.json({ vote }, { status: 201 });
  } catch (error) {
    console.error("Error creating vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const votes = await prisma.vote.findMany({
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ votes });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
