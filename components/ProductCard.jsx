import Link from "next/link";
import { getQuadrant, getQuadrantColor } from "@/lib/utils";

export default function ProductCard({ product }) {
  const quadrant = getQuadrant(product.avgPriceScore, product.avgQualityScore);
  const color = getQuadrantColor(quadrant);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {product.brand?.name || product.brandName || ""}
          </p>
        </div>
        <span
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {quadrant}
        </span>
      </div>

      {product.totalVotes > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-400">Price</p>
            <p className="text-sm font-semibold text-gray-700">
              {product.avgPriceScore.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Quality</p>
            <p className="text-sm font-semibold text-gray-700">
              {product.avgQualityScore.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Votes</p>
            <p className="text-sm font-semibold text-gray-700">
              {product.totalVotes}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-gray-400">No votes yet</p>
      )}
    </Link>
  );
}
