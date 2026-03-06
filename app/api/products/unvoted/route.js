import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    // Get IDs of products the user has already voted on
    const votedProducts = await prisma.vote.findMany({
      where: { userId: user.id },
      select: { productId: true },
    });
    const votedIds = votedProducts.map((v) => v.productId);

    // Count unvoted products
    const totalUnvoted = await prisma.product.count({
      where: votedIds.length > 0 ? { id: { notIn: votedIds } } : {},
    });

    if (totalUnvoted === 0) {
      return NextResponse.json({
        products: [],
        remaining: 0,
        totalVoted: votedIds.length,
      });
    }

    // Random offset for pseudo-random selection
    const skip =
      totalUnvoted > limit
        ? Math.floor(Math.random() * (totalUnvoted - limit))
        : 0;

    const products = await prisma.product.findMany({
      where: votedIds.length > 0 ? { id: { notIn: votedIds } } : {},
      include: {
        brand: {
          select: {
            name: true,
            slug: true,
            categories: {
              select: { name: true },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    });

    // Shuffle for randomness
    const shuffled = products.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      products: shuffled,
      remaining: totalUnvoted,
      totalVoted: votedIds.length,
    });
  } catch (error) {
    console.error("Error fetching unvoted products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
