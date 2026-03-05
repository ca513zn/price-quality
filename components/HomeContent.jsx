"use client";

import { useState, useMemo } from "react";
import PerceptionMap from "@/components/PerceptionMap";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

const MAX_DOTS_OVERVIEW = 30;

export default function HomeContent({ products, categories }) {
  const [selectedCategory, setSelectedCategory] = useState(null); // null = overview

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) {
      // Overview: show top products by votes (capped for readability)
      return products.slice(0, MAX_DOTS_OVERVIEW);
    }
    return products.filter((p) => p.categoryIds.includes(selectedCategory));
  }, [products, selectedCategory]);

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name || "Category"
    : null;

  const mapLabel = selectedCategoryName
    ? `${selectedCategoryName} — ${filteredProducts.length} products`
    : `Top ${filteredProducts.length} most-voted products`;

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

      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-10">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
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
