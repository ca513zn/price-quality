"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import PerceptionMap from "@/components/PerceptionMap";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";

const MAX_DOTS_OVERVIEW = 30;
const MAX_DOTS_PER_CATEGORY = 10;

const TYPEWRITER_PHRASES = [
  "See how products are perceived by real users. Vote on price and quality to help place them on the map.",
  "Discover which products give you the most bang for your buck — powered by community votes.",
  "Is it worth the price? The crowd has spoken. Explore the map and cast your vote.",
  "Real opinions, real data. Help us map every product from budget gems to premium picks.",
  "Find overpriced products, hidden gems, and everything in between — one vote at a time.",
];

function useTypewriter(phrases, { typeSpeed = 35, deleteSpeed = 20, pauseMs = 3000 } = {}) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const full = phrases[phraseIndex];

    if (!isDeleting) {
      if (charIndex < full.length) {
        const timer = setTimeout(() => setCharIndex((c) => c + 1), typeSpeed);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setIsDeleting(true), pauseMs);
        return () => clearTimeout(timer);
      }
    } else {
      if (charIndex > 0) {
        const timer = setTimeout(() => setCharIndex((c) => c - 1), deleteSpeed);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setIsDeleting(false);
          setPhraseIndex((p) => (p + 1) % phrases.length);
        }, deleteSpeed);
        return () => clearTimeout(timer);
      }
    }
  }, [phrases, phraseIndex, charIndex, isDeleting, typeSpeed, deleteSpeed, pauseMs]);

  return phrases[phraseIndex].slice(0, charIndex);
}

export default function HomeContent({ products, categories }) {
  const [selectedCategories, setSelectedCategories] = useState([]); // empty = show top voted
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const typewriterText = useTypewriter(TYPEWRITER_PHRASES);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  function toggleCategory(id) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function clearCategories() {
    setSelectedCategories([]);
    setDropdownOpen(false);
  }

  const filteredProducts = useMemo(() => {
    if (selectedCategories.length === 0) {
      return products.slice(0, MAX_DOTS_OVERVIEW);
    }
    return products
      .filter((p) => p.categoryIds.some((id) => selectedCategories.includes(id)))
      .slice(0, MAX_DOTS_PER_CATEGORY * selectedCategories.length);
  }, [products, selectedCategories]);

  const selectedCategoryNames = selectedCategories
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean);

  const mapLabel =
    selectedCategories.length === 0
      ? `Top ${filteredProducts.length} most-voted products`
      : selectedCategories.length === 1
        ? `Top ${filteredProducts.length} in ${selectedCategoryNames[0]}`
        : `Top ${filteredProducts.length} across ${selectedCategories.length} categories`;

  const gridTitle =
    selectedCategories.length === 0
      ? "Most Voted Products"
      : selectedCategories.length === 1
        ? `Top ${selectedCategoryNames[0]} Products`
        : `Top Products (${selectedCategories.length} categories)`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Hero */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
          Price vs Quality{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
            Perception Map
          </span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto h-12 sm:h-10">
          {typewriterText}
          <span className="inline-block w-[2px] h-4 bg-blue-500 dark:bg-blue-400 ml-0.5 align-middle animate-pulse" />
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

      {/* Category Filter — multiselect dropdown */}
      <div className="mb-4 flex flex-col items-center gap-2">
        <div className="relative w-full max-w-sm" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 transition"
          >
            <span className="truncate">
              {selectedCategories.length === 0
                ? "All Categories — Top Voted"
                : `${selectedCategories.length} ${selectedCategories.length === 1 ? "category" : "categories"} selected`}
            </span>
            <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Selected tags */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedCategoryNames.map((name, i) => (
                <button
                  key={selectedCategories[i]}
                  onClick={() => toggleCategory(selectedCategories[i])}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                >
                  {name}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={clearCategories}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition px-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Dropdown list */}
          {dropdownOpen && (
            <div className="absolute z-40 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1">
              <button
                onClick={clearCategories}
                className={`w-full text-left px-3 py-2 text-sm transition ${
                  selectedCategories.length === 0
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                All Categories — Top Voted
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition flex items-center justify-between ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {cat.name}
                    {isSelected && (
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {mapLabel}
        </p>
      </div>



      {/* Top Products Grid */}
      {filteredProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {gridTitle}
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
