import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const votes = await prisma.vote.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            brand: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ votes });
  } catch (error) {
    console.error("Error fetching user votes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
