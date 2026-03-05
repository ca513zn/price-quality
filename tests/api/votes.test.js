import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth before importing routes
const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getCurrentUser: (...args) => mockGetCurrentUser(...args),
}));

// Mock Prisma before importing routes
vi.mock("@/lib/prisma", () => {
  return {
    default: {
      vote: {
        create: vi.fn(),
        aggregate: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      brand: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    },
  };
});

import prisma from "@/lib/prisma";

const mockUser = { id: "user1", email: "test@example.com", name: "Test User", role: "USER" };

// ─── Helpers ────────────────────────────────────────────────────────────────

function createRequest(body) {
  return new Request("http://localhost:3000/api/votes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── POST /api/votes ────────────────────────────────────────────────────────

describe("POST /api/votes", () => {
  let POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Default: user is authenticated
    mockGetCurrentUser.mockResolvedValue(mockUser);
    // Default: no existing vote (no duplicate)
    prisma.vote.findUnique.mockResolvedValue(null);
    const mod = await import("@/app/api/votes/route");
    POST = mod.POST;
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const req = createRequest({ productId: "prod1", priceScore: 5, qualityScore: 5 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("logged in");
  });

  it("returns 400 when productId is missing", async () => {
    const req = createRequest({ priceScore: 5, qualityScore: 5 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("productId is required");
  });

  it("returns 400 when priceScore is out of range (0)", async () => {
    const req = createRequest({ productId: "abc", priceScore: 0, qualityScore: 5 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("priceScore");
  });

  it("returns 400 when priceScore is out of range (11)", async () => {
    const req = createRequest({ productId: "abc", priceScore: 11, qualityScore: 5 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("priceScore");
  });

  it("returns 400 when priceScore is a float", async () => {
    const req = createRequest({ productId: "abc", priceScore: 5.5, qualityScore: 5 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("priceScore");
  });

  it("returns 400 when qualityScore is out of range (0)", async () => {
    const req = createRequest({ productId: "abc", priceScore: 5, qualityScore: 0 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("qualityScore");
  });

  it("returns 400 when qualityScore is out of range (11)", async () => {
    const req = createRequest({ productId: "abc", priceScore: 5, qualityScore: 11 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("qualityScore");
  });

  it("returns 404 when product does not exist", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const req = createRequest({ productId: "nonexistent", priceScore: 5, qualityScore: 5 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Product not found");
  });

  it("returns 201 and creates a vote when input is valid", async () => {
    const mockProduct = { id: "prod1", name: "Test Product" };
    const mockVote = { id: "vote1", productId: "prod1", userId: "user1", priceScore: 7, qualityScore: 8 };

    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.vote.create.mockResolvedValue(mockVote);
    prisma.vote.aggregate.mockResolvedValue({
      _avg: { priceScore: 7, qualityScore: 8 },
      _count: { id: 1 },
    });
    prisma.product.update.mockResolvedValue({});

    const req = createRequest({ productId: "prod1", priceScore: 7, qualityScore: 8 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.vote).toEqual(mockVote);
  });

  it("recalculates aggregated scores after creating a vote", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "prod1" });
    prisma.vote.create.mockResolvedValue({ id: "vote1" });
    prisma.vote.aggregate.mockResolvedValue({
      _avg: { priceScore: 6.5, qualityScore: 7.333333 },
      _count: { id: 3 },
    });
    prisma.product.update.mockResolvedValue({});

    const req = createRequest({ productId: "prod1", priceScore: 5, qualityScore: 6 });
    await POST(req);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: "prod1" },
      data: {
        avgPriceScore: 6.5,
        avgQualityScore: 7.33,
        totalVotes: 3,
      },
    });
  });

  it("accepts boundary values (1 and 10)", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "prod1" });
    prisma.vote.create.mockResolvedValue({ id: "vote1" });
    prisma.vote.aggregate.mockResolvedValue({
      _avg: { priceScore: 1, qualityScore: 10 },
      _count: { id: 1 },
    });
    prisma.product.update.mockResolvedValue({});

    const req = createRequest({ productId: "prod1", priceScore: 1, qualityScore: 10 });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it("returns 500 when Prisma throws an error", async () => {
    prisma.product.findUnique.mockRejectedValue(new Error("DB down"));

    const req = createRequest({ productId: "prod1", priceScore: 5, qualityScore: 5 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});

// ─── GET /api/votes ─────────────────────────────────────────────────────────

describe("GET /api/votes", () => {
  let GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/votes/route");
    GET = mod.GET;
  });

  it("returns recent votes", async () => {
    const mockVotes = [
      { id: "v1", priceScore: 7, qualityScore: 8, product: { name: "P1", slug: "p1" } },
      { id: "v2", priceScore: 3, qualityScore: 4, product: { name: "P2", slug: "p2" } },
    ];
    prisma.vote.findMany.mockResolvedValue(mockVotes);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.votes).toEqual(mockVotes);
    expect(data.votes).toHaveLength(2);
  });

  it("returns 500 on database error", async () => {
    prisma.vote.findMany.mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
