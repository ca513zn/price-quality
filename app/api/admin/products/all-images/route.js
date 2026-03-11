import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Get all products with image info for the admin images panel
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
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        brand: { select: { name: true } },
        totalVotes: true,
      },
      orderBy: [
        { imageUrl: "asc" }, // nulls first (products without images at top)
        { totalVotes: "desc" },
      ],
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching all products for images:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
