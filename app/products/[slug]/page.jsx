import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuadrant, getQuadrantColor } from "@/lib/utils";
import ProductVoteSection from "./ProductVoteSection";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { brand: { select: { name: true } } },
  });

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${product.name} by ${product.brand.name} — Price vs Quality`,
    description: `See how ${product.name} is rated on price (${product.avgPriceScore.toFixed(1)}/10) and quality (${product.avgQualityScore.toFixed(1)}/10). Cast your vote!`,
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      votes: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) {
    notFound();
  }

  const quadrant = getQuadrant(product.avgPriceScore, product.avgQualityScore);
  const quadrantColor = getQuadrantColor(quadrant);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-gray-700 dark:hover:text-gray-300">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
          <Link
            href={`/brands/${product.brand.slug}`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mt-1 inline-block"
          >
            {product.brand.name}
          </Link>

          {product.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-4">{product.description}</p>
          )}

          {/* Scores */}
          <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Aggregated Scores</h2>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${quadrantColor}20`, color: quadrantColor }}
              >
                {quadrant}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {product.avgPriceScore.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">/10</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Quality</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {product.avgQualityScore.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">/10</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Votes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {product.totalVotes}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Votes */}
          {product.votes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Votes</h3>
              <div className="space-y-2">
                {product.votes.map((vote) => (
                  <div
                    key={vote.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md px-4 py-2 text-sm"
                  >
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(vote.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-4 text-gray-700 dark:text-gray-300">
                      <span>
                        Price: <strong>{vote.priceScore}</strong>
                      </span>
                      <span>
                        Quality: <strong>{vote.qualityScore}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vote Form */}
        <div>
          <ProductVoteSection
            productId={product.id}
            productName={product.name}
          />
        </div>
      </div>
    </div>
  );
}
