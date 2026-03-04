import prisma from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "All Brands — Price vs Quality",
  description: "Browse all brands and explore their products on the perception map.",
};

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">All Brands</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Explore brands and see how their products are perceived.
      </p>

      {brands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition group"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition text-lg">
                {brand.name}
              </h3>
              {brand.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {brand.description}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                {brand._count.products} product{brand._count.products !== 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 text-center py-12">No brands found.</p>
      )}
    </div>
  );
}
