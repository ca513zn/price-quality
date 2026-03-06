"use client";

import { useState, useMemo } from "react";
import PerceptionMap from "@/components/PerceptionMap";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

const MAX_DOTS_OVERVIEW = 30;
const MAX_DOTS_CATEGORY = 5;

export default function HomeContent({ products, categories }) {
  const [selectedCategory, setSelectedCategory] = useState(null); // null = overview

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) {
      // Overview: show top products by votes (capped for readability)
      return products.slice(0, MAX_DOTS_OVERVIEW);
    }
    // Category view: top 5 most-voted products in that category
    return products
      .filter((p) => p.categoryIds.includes(selectedCategory))
      .slice(0, MAX_DOTS_CATEGORY);
  }, [products, selectedCategory]);

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name || "Category"
    : null;

  const mapLabel = selectedCategoryName
    ? `Top ${filteredProducts.length} most-voted in ${selectedCategoryName}`
    : `Top ${filteredProducts.length} most-voted products`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Hero */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
          Price vs Quality Perception Map
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          See how products are perceived by real users. Vote on price and quality
          to help place them on the map.
        </p>
      </div>

      {/* Category Filter — horizontally scrollable on mobile */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              !selectedCategory
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            🔥 Top Voted
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
          {mapLabel}
        </p>
      </div>

      {/* Perception Map */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-2 sm:p-6 mb-8 sm:mb-10">
        {filteredProducts.length > 0 ? (
          <PerceptionMap
            products={filteredProducts}
            showLabels={filteredProducts.length <= 25}
          />
        ) : (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-lg">No products with votes in this category.</p>
            <p className="mt-1">
              <Link
                href="/products"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                Browse products
              </Link>{" "}
              and cast the first vote!
            </p>
          </div>
        )}
      </div>

      {/* Top Products Grid */}
      {filteredProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {selectedCategoryName ? `Top ${selectedCategoryName} Products` : "Most Voted Products"}
            </h2>
            <Link
              href="/products"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
