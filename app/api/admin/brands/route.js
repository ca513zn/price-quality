import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// Create a brand (admin only)
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, logoUrl } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const slug = slugify(name);

    const existing = await prisma.brand.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A brand with this name already exists" }, { status: 409 });
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
      },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
