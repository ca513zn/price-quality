import prisma from "@/lib/prisma";
import HomeContent from "@/components/HomeContent";

export const metadata = {
  title: "Price vs Quality — Perception Map",
  description:
    "See how products rank on price vs quality. Vote and help build the perception map.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        brand: {
          select: {
            name: true,
            slug: true,
            categories: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      where: { totalVotes: { gt: 0 } },
      orderBy: { totalVotes: "desc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { brands: true },
        },
      },
    }),
  ]);

  // Attach category info to each product (derived from brand)
  const productsWithCategories = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl || null,
    avgPriceScore: p.avgPriceScore,
    avgQualityScore: p.avgQualityScore,
    totalVotes: p.totalVotes,
    brandName: p.brand?.name || "",
    brandSlug: p.brand?.slug || "",
    categoryIds: p.brand?.categories?.map((c) => c.id) || [],
  }));

  // Only show categories that actually have products with votes
  const usedCategoryIds = new Set(productsWithCategories.flatMap((p) => p.categoryIds));
  const activeCategories = categories.filter((c) => usedCategoryIds.has(c.id));

  return (
    <HomeContent
      products={productsWithCategories}
      categories={activeCategories}
    />
  );
}
