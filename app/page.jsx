import prisma from "@/lib/prisma";
import PerceptionMap from "@/components/PerceptionMap";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export const metadata = {
  title: "Price vs Quality — Perception Map",
  description:
    "See how products rank on price vs quality. Vote and help build the perception map.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    include: { brand: { select: { name: true, slug: true } } },
    where: { totalVotes: { gt: 0 } },
    orderBy: { totalVotes: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
          Price vs Quality Perception Map
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          See how products are perceived by real users. Vote on price and quality
          to help place them on the map.
        </p>
      </div>

      {/* Perception Map */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-10">
        {products.length > 0 ? (
          <PerceptionMap products={products} />
        ) : (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-lg">No products with votes yet.</p>
            <p className="mt-1">
              <Link href="/products" className="text-blue-600 dark:text-blue-400 underline">
                Browse products
              </Link>{" "}
              and cast the first vote!
            </p>
          </div>
        )}
      </div>

      {/* Top Products Grid */}
      {products.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Top Rated Products</h2>
            <Link
              href="/products"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
