import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        products: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
