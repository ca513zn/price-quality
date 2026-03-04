import prisma from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "All Products — Price vs Quality",
  description: "Browse all products and see their price vs quality ratings.",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { brand: { select: { name: true, slug: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">All Products</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Browse all products and vote on their perceived price and quality.
      </p>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 text-center py-12">No products found.</p>
      )}
    </div>
  );
}
