import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  return {
    default: {
      brandSubmission: {
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
      brand: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getCurrentUser: (...args) => mockGetCurrentUser(...args),
}));

import prisma from "@/lib/prisma";

// ─── POST /api/submissions ──────────────────────────────────────────────────

describe("POST /api/submissions", () => {
  let POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/submissions/route");
    POST = mod.POST;
  });

  it("returns 401 if not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Brand" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 if name is too short", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "USER" });

    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 429 if rate limit exceeded", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "USER" });
    prisma.brandSubmission.count.mockResolvedValue(5);

    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Brand" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("returns 409 if brand already exists", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "USER" });
    prisma.brandSubmission.count.mockResolvedValue(0);
    prisma.brand.findUnique.mockResolvedValue({ id: "b1", name: "Nike", slug: "nike" });

    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Nike" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.existingBrand).toBeDefined();
  });

  it("returns 409 if a pending submission with same slug exists", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "USER" });
    prisma.brandSubmission.count.mockResolvedValue(0);
    prisma.brand.findUnique.mockResolvedValue(null);
    prisma.brandSubmission.findFirst.mockResolvedValue({ id: "s1", slug: "test-brand", status: "PENDING" });

    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Brand" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("creates a submission successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "USER" });
    prisma.brandSubmission.count.mockResolvedValue(0);
    prisma.brand.findUnique.mockResolvedValue(null);
    prisma.brandSubmission.findFirst.mockResolvedValue(null);
    prisma.brand.findMany.mockResolvedValue([]); // no fuzzy matches
    prisma.brandSubmission.create.mockResolvedValue({
      id: "s1",
      name: "New Brand",
      slug: "new-brand",
      status: "PENDING",
      submitter: { id: "u1", name: "Test User" },
    });

    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Brand", description: "A new brand" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.submission.name).toBe("New Brand");
    expect(data.submission.status).toBe("PENDING");
  });
});

// ─── GET /api/submissions ───────────────────────────────────────────────────

describe("GET /api/submissions", () => {
  let GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/submissions/route");
    GET = mod.GET;
  });

  it("returns 401 if not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns user submissions", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "USER" });
    prisma.brandSubmission.findMany.mockResolvedValue([
      { id: "s1", name: "Brand A", status: "PENDING" },
      { id: "s2", name: "Brand B", status: "APPROVED" },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.submissions).toHaveLength(2);
  });
});
