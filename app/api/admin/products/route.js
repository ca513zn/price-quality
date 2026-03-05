import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// Create a product (admin only)
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
    const { name, brandId, description, imageUrl } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }
    if (!brandId) {
      return NextResponse.json({ error: "Brand is required" }, { status: 400 });
    }

    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const slug = slugify(name);

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A product with this name already exists" }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug,
        brandId,
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
      },
      include: { brand: { select: { name: true } } },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
