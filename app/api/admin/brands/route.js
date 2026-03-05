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

// Update a brand (admin only)
export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const slug = slugify(name);

    // Check if another brand with the same slug exists
    const duplicate = await prisma.brand.findFirst({
      where: { slug, NOT: { id } },
    });
    if (duplicate) {
      return NextResponse.json({ error: "A brand with this name already exists" }, { status: 409 });
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete a brand (admin only)
export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }

    const existing = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: `Cannot delete brand with ${existing._count.products} product(s). Delete its products first.` },
        { status: 409 }
      );
    }

    await prisma.brand.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
