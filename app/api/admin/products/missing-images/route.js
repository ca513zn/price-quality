import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Get all products that don't have an imageUrl (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [{ imageUrl: null }, { imageUrl: "" }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: { select: { name: true } },
        totalVotes: true,
      },
      orderBy: { totalVotes: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products without images:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
