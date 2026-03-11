import Link from "next/link";
import Image from "next/image";
import { getQuadrant, getQuadrantColor } from "@/lib/utils";

export default function ProductCard({ product }) {
  const quadrant = getQuadrant(product.avgPriceScore, product.avgQualityScore);
  const color = getQuadrantColor(quadrant);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Product avatar */}
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 overflow-hidden flex items-center justify-center">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
                {product.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {product.brand?.name || product.brandName || ""}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {quadrant}
        </span>
      </div>

      {product.totalVotes > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Price</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {product.avgPriceScore.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Quality</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {product.avgQualityScore.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Votes</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {product.totalVotes}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">No votes yet</p>
      )}
    </Link>
  );
}
