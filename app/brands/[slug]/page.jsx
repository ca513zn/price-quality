import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import PerceptionMap from "@/components/PerceptionMap";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });

  if (!brand) {
    return { title: "Brand Not Found" };
  }

  return {
    title: `${brand.name} — Price vs Quality`,
    description: `See how ${brand.name} products are perceived on the price vs quality map.`,
  };
}

export default async function BrandPage({ params }) {
  const { slug } = await params;

  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!brand) {
    notFound();
  }

  const productsWithBrand = brand.products.map((p) => ({
    ...p,
    brand: { name: brand.name, slug: brand.slug },
  }));

  const productsWithVotes = productsWithBrand.filter((p) => p.totalVotes > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/brands" className="hover:text-gray-700">Brands</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{brand.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900">{brand.name}</h1>
      {brand.description && (
        <p className="text-gray-600 mt-2 max-w-2xl">{brand.description}</p>
      )}

      {/* Brand Perception Map */}
      {productsWithVotes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {brand.name} Perception Map
          </h2>
          <PerceptionMap products={productsWithVotes} />
        </div>
      )}

      {/* Products */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Products ({brand.products.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productsWithBrand.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
