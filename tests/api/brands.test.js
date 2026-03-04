import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  return {
    default: {
      brand: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    },
  };
});

import prisma from "@/lib/prisma";

// ─── GET /api/brands ────────────────────────────────────────────────────────

describe("GET /api/brands", () => {
  let GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/brands/route");
    GET = mod.GET;
  });

  it("returns a list of brands with product counts", async () => {
    const mockBrands = [
      { id: "b1", name: "Apple", slug: "apple", _count: { products: 2 } },
      { id: "b2", name: "Samsung", slug: "samsung", _count: { products: 3 } },
    ];
    prisma.brand.findMany.mockResolvedValue(mockBrands);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.brands).toHaveLength(2);
    expect(data.brands[0]._count.products).toBe(2);
  });

  it("returns empty array when no brands exist", async () => {
    prisma.brand.findMany.mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.brands).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    prisma.brand.findMany.mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});

// ─── GET /api/brands/[slug] ─────────────────────────────────────────────────

describe("GET /api/brands/[slug]", () => {
  let GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/brands/[slug]/route");
    GET = mod.GET;
  });

  it("returns a brand with its products", async () => {
    const mockBrand = {
      id: "b1",
      name: "Apple",
      slug: "apple",
      products: [
        { id: "p1", name: "iPhone 16 Pro", slug: "iphone-16-pro" },
        { id: "p2", name: "MacBook Pro M4", slug: "macbook-pro-m4" },
      ],
    };
    prisma.brand.findUnique.mockResolvedValue(mockBrand);

    const req = new Request("http://localhost:3000/api/brands/apple");
    const res = await GET(req, { params: Promise.resolve({ slug: "apple" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.brand.name).toBe("Apple");
    expect(data.brand.products).toHaveLength(2);
  });

  it("returns 404 for non-existent brand slug", async () => {
    prisma.brand.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/brands/nonexistent");
    const res = await GET(req, { params: Promise.resolve({ slug: "nonexistent" }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Brand not found");
  });

  it("returns 500 on database error", async () => {
    prisma.brand.findUnique.mockRejectedValue(new Error("DB error"));

    const req = new Request("http://localhost:3000/api/brands/apple");
    const res = await GET(req, { params: Promise.resolve({ slug: "apple" }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
