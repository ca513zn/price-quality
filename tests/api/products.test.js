import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  return {
    default: {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    },
  };
});

import prisma from "@/lib/prisma";

// ─── GET /api/products ──────────────────────────────────────────────────────

describe("GET /api/products", () => {
  let GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/products/route");
    GET = mod.GET;
  });

  it("returns a list of products with brand info", async () => {
    const mockProducts = [
      {
        id: "p1",
        name: "iPhone 16 Pro",
        slug: "iphone-16-pro",
        avgPriceScore: 8.5,
        avgQualityScore: 9.0,
        totalVotes: 20,
        brand: { name: "Apple", slug: "apple" },
      },
      {
        id: "p2",
        name: "Galaxy A15",
        slug: "galaxy-a15",
        avgPriceScore: 3.0,
        avgQualityScore: 4.0,
        totalVotes: 15,
        brand: { name: "Samsung", slug: "samsung" },
      },
    ];
    prisma.product.findMany.mockResolvedValue(mockProducts);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.products).toHaveLength(2);
    expect(data.products[0].brand.name).toBe("Apple");
  });

  it("returns empty array when no products exist", async () => {
    prisma.product.findMany.mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.products).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    prisma.product.findMany.mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});

// ─── GET /api/products/[slug] ───────────────────────────────────────────────

describe("GET /api/products/[slug]", () => {
  let GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/products/[slug]/route");
    GET = mod.GET;
  });

  it("returns a product by slug", async () => {
    const mockProduct = {
      id: "p1",
      name: "iPhone 16 Pro",
      slug: "iphone-16-pro",
      brand: { name: "Apple", slug: "apple" },
      votes: [{ id: "v1", priceScore: 8, qualityScore: 9 }],
    };
    prisma.product.findUnique.mockResolvedValue(mockProduct);

    const req = new Request("http://localhost:3000/api/products/iphone-16-pro");
    const res = await GET(req, { params: Promise.resolve({ slug: "iphone-16-pro" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.product.name).toBe("iPhone 16 Pro");
    expect(data.product.votes).toHaveLength(1);
  });

  it("returns 404 for non-existent slug", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/products/does-not-exist");
    const res = await GET(req, { params: Promise.resolve({ slug: "does-not-exist" }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Product not found");
  });

  it("returns 500 on database error", async () => {
    prisma.product.findUnique.mockRejectedValue(new Error("DB error"));

    const req = new Request("http://localhost:3000/api/products/test");
    const res = await GET(req, { params: Promise.resolve({ slug: "test" }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
