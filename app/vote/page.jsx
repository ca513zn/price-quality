"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const PRICE_LABELS = {
  1: "Dirt cheap",
  2: "Very cheap",
  3: "Cheap",
  4: "Below average",
  5: "Average",
  6: "Above average",
  7: "Pricey",
  8: "Expensive",
  9: "Very expensive",
  10: "Outrageously expensive",
};

const QUALITY_LABELS = {
  1: "Terrible",
  2: "Very poor",
  3: "Poor",
  4: "Below average",
  5: "Average",
  6: "Above average",
  7: "Good",
  8: "Very good",
  9: "Excellent",
  10: "Perfect",
};

function getQuadrant(price, quality) {
  if (price <= 5 && quality > 5)
    return { label: "Best Value", emoji: "💚", color: "text-green-400" };
  if (price > 5 && quality > 5)
    return { label: "Premium", emoji: "💜", color: "text-purple-400" };
  if (price > 5 && quality <= 5)
    return { label: "Overpriced", emoji: "🔴", color: "text-red-400" };
  return { label: "Budget", emoji: "🟡", color: "text-yellow-400" };
}

export default function QuickVotePage() {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState("vote"); // vote | submitting | result
  const [priceVote, setPriceVote] = useState(null);
  const [qualityVote, setQualityVote] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(null);
  const [stats, setStats] = useState({ remaining: 0, totalVoted: 0 });
  const [allDone, setAllDone] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [hoveredPrice, setHoveredPrice] = useState(null);
  const [hoveredQuality, setHoveredQuality] = useState(null);
  const fetchingRef = useRef(false);
  const timerRef = useRef(null);

  // ── Fetch queue of unvoted products ──────────────────────
  const fetchQueue = useCallback(async (append = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const res = await fetch("/api/products/unvoted?limit=10");
      if (res.status === 401) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAuthenticated(true);

      if (data.products.length === 0 && !append) {
        setAllDone(true);
        setLoading(false);
        return;
      }

      if (append) {
        setQueue((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProducts = data.products.filter(
            (p) => !existingIds.has(p.id)
          );
          return [...prev, ...newProducts];
        });
      } else {
        setQueue(data.products);
        setCurrentIndex(0);
      }

      setStats({ remaining: data.remaining, totalVoted: data.totalVoted });
      setLoading(false);
    } catch {
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchQueue]);

  // Preload more when queue is running low
  useEffect(() => {
    const remaining = queue.length - currentIndex;
    if (remaining <= 3 && remaining > 0 && !fetchingRef.current) {
      fetchQueue(true);
    }
  }, [currentIndex, queue.length, fetchQueue]);

  // Entrance animation
  useEffect(() => {
    if (!loading && queue.length > 0) {
      setAnimateIn(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    }
  }, [currentIndex, loading, queue.length]);

  const currentProduct = queue[currentIndex];

  // ── Handlers ─────────────────────────────────────────────
  const submitVote = async () => {
    if (priceVote === null || qualityVote === null) return;
    setStep("submitting");

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: currentProduct.id,
          priceScore: priceVote,
          qualityScore: qualityVote,
        }),
      });

      if (res.ok) {
        // Refetch updated product to get new averages
        const productRes = await fetch(
          `/api/products/${currentProduct.slug}`
        );
        const productData = productRes.ok ? await productRes.json() : null;
        const product = productData?.product;

        const avgPrice = product?.avgPriceScore || priceVote;
        const avgQuality = product?.avgQualityScore || qualityVote;
        const quadrant = getQuadrant(avgPrice, avgQuality);

        setResult({
          avgPrice,
          avgQuality,
          totalVotes: product?.totalVotes || 1,
          quadrant,
          yourPrice: priceVote,
          yourQuality: qualityVote,
        });
        setStep("result");
        setStats((prev) => ({
          remaining: prev.remaining - 1,
          totalVoted: prev.totalVoted + 1,
        }));

        // Auto-advance after 2.5s
        timerRef.current = setTimeout(() => {
          advanceToNext();
        }, 2500);
      } else {
        // Vote already exists or error — skip
        advanceToNext();
      }
    } catch {
      advanceToNext();
    }
  };

  const advanceToNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      setLoading(true);
      setQueue([]);
      setCurrentIndex(0);
      fetchQueue().then(() => setLoading(false));
      return;
    }

    setCurrentIndex(nextIndex);
    resetVoteState();
  };

  const resetVoteState = () => {
    setPriceVote(null);
    setQualityVote(null);
    setResult(null);
    setHoveredPrice(null);
    setHoveredQuality(null);
    setStep("vote");
  };

  const skipProduct = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advanceToNext();
  };

  // ── Render states ────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  if (authenticated === false) {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🗳️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to Quick Vote
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Rate products in seconds. Sign in to get started.
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You&apos;ve voted on everything!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {stats.totalVoted} products rated. You&apos;re a top contributor!
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
            New products are added regularly — check back soon.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              View the Map
            </Link>
            <Link
              href="/my-votes"
              className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              My Votes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProduct) return null;

  const categories =
    currentProduct.brand?.categories?.map((c) => c.name) || [];
  const progress =
    stats.totalVoted > 0
      ? Math.round(
          (stats.totalVoted / (stats.totalVoted + stats.remaining)) * 100
        )
      : 0;

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-gray-950 flex flex-col">
      {/* ── Top bar ───────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>🗳️ {stats.totalVoted} voted</span>
            <span>·</span>
            <span>{stats.remaining} left</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-lg mx-auto mt-2">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Main card area ────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center p-4">
        <div
          className={`w-full max-w-lg transition-all duration-300 ${
            animateIn
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          {/* Product card */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
            {/* Product image */}
            {currentProduct.imageUrl && (
              <div className="mb-4 rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image
                  src={currentProduct.imageUrl}
                  alt={currentProduct.name}
                  width={500}
                  height={300}
                  className="w-full h-36 sm:h-44 object-contain"
                  unoptimized
                />
              </div>
            )}

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {currentProduct.name}
            </h2>
            <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">
              {currentProduct.brand?.name}
            </p>
            {currentProduct.description && (
              <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                {currentProduct.description}
              </p>
            )}
          </div>

          {/* ── Vote: Price + Quality on one screen ──── */}
          {step === "vote" && (
            <div className="space-y-5">
              {/* Price row */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    💰 How expensive?
                  </h3>
                  <div className="h-4">
                    {hoveredPrice ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in">
                        {PRICE_LABELS[hoveredPrice]}
                      </span>
                    ) : priceVote ? (
                      <span className="text-xs font-medium text-blue-500 dark:text-blue-400">
                        {priceVote}/10 — {PRICE_LABELS[priceVote]}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        1 = cheap · 10 = expensive
                      </span>
                    )}
                  </div>
                </div>
                <HeatmapRow
                  selected={priceVote}
                  onSelect={setPriceVote}
                  hoveredScore={hoveredPrice}
                  setHoveredScore={setHoveredPrice}
                />
              </div>

              {/* Quality row */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    ⭐ How&apos;s the quality?
                  </h3>
                  <div className="h-4">
                    {hoveredQuality ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in">
                        {QUALITY_LABELS[hoveredQuality]}
                      </span>
                    ) : qualityVote ? (
                      <span className="text-xs font-medium text-blue-500 dark:text-blue-400">
                        {qualityVote}/10 — {QUALITY_LABELS[qualityVote]}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        1 = terrible · 10 = perfect
                      </span>
                    )}
                  </div>
                </div>
                <HeatmapRow
                  selected={qualityVote}
                  onSelect={setQualityVote}
                  hoveredScore={hoveredQuality}
                  setHoveredScore={setHoveredQuality}
                />
              </div>

              {/* Submit + Skip */}
              <div className="pt-1 space-y-2">
                <button
                  onClick={submitVote}
                  disabled={priceVote === null || qualityVote === null}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 touch-manipulation
                    bg-blue-600 hover:bg-blue-700 active:scale-[0.98]
                    disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {priceVote !== null && qualityVote !== null
                    ? `Submit Vote — ${priceVote} Price, ${qualityVote} Quality`
                    : "Select both ratings to submit"}
                </button>
                <button
                  onClick={skipProduct}
                  className="w-full py-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                    text-sm transition-colors touch-manipulation"
                >
                  🤷 I don&apos;t know this product — skip
                </button>
              </div>
            </div>
          )}

          {/* ── Submitting ──────────────────────────────── */}
          {step === "submitting" && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Submitting vote...
              </p>
            </div>
          )}

          {/* ── Result ──────────────────────────────────── */}
          {step === "result" && result && (
            <div className="text-center py-4 animate-fade-in">
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <div className="text-4xl mb-2">
                  {result.quadrant.emoji}
                </div>
                <h3
                  className={`text-xl font-bold mb-1 ${result.quadrant.color}`}
                >
                  {result.quadrant.label}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Based on {result.totalVotes}{" "}
                  {result.totalVotes === 1 ? "vote" : "votes"}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">
                      Avg Price
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {result.avgPrice.toFixed(1)}
                      <span className="text-gray-400 font-normal text-sm">
                        /10
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      You voted {result.yourPrice}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">
                      Avg Quality
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {result.avgQuality.toFixed(1)}
                      <span className="text-gray-400 font-normal text-sm">
                        /10
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      You voted {result.yourQuality}
                    </p>
                  </div>
                </div>

                <button
                  onClick={advanceToNext}
                  className="mt-4 text-sm text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Next product →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Heatmap color mapping (red → green) ────────────────────
const HEATMAP_COLORS = {
  1:  { bg: "bg-red-500/15",    border: "border-red-500",    text: "text-red-600 dark:text-red-400",       activeBg: "bg-red-500",       activeText: "text-white" },
  2:  { bg: "bg-red-400/15",    border: "border-red-400",    text: "text-red-500 dark:text-red-400",       activeBg: "bg-red-400",       activeText: "text-white" },
  3:  { bg: "bg-orange-500/15", border: "border-orange-500", text: "text-orange-600 dark:text-orange-400", activeBg: "bg-orange-500",    activeText: "text-white" },
  4:  { bg: "bg-orange-400/15", border: "border-orange-400", text: "text-orange-500 dark:text-orange-400", activeBg: "bg-orange-400",    activeText: "text-white" },
  5:  { bg: "bg-yellow-500/15", border: "border-yellow-500", text: "text-yellow-600 dark:text-yellow-400", activeBg: "bg-yellow-500",    activeText: "text-white" },
  6:  { bg: "bg-yellow-400/15", border: "border-yellow-400", text: "text-yellow-600 dark:text-yellow-300", activeBg: "bg-yellow-400",    activeText: "text-white" },
  7:  { bg: "bg-lime-500/15",   border: "border-lime-500",   text: "text-lime-600 dark:text-lime-400",     activeBg: "bg-lime-500",      activeText: "text-white" },
  8:  { bg: "bg-lime-400/15",   border: "border-lime-400",   text: "text-lime-600 dark:text-lime-300",     activeBg: "bg-lime-400",      activeText: "text-white" },
  9:  { bg: "bg-green-500/15",  border: "border-green-500",  text: "text-green-600 dark:text-green-400",   activeBg: "bg-green-500",     activeText: "text-white" },
  10: { bg: "bg-emerald-500/15",border: "border-emerald-500",text: "text-emerald-600 dark:text-emerald-400",activeBg: "bg-emerald-500",  activeText: "text-white" },
};

// ── Reusable heatmap row of 1–10 buttons ───────────────────
function HeatmapRow({ selected, onSelect, hoveredScore, setHoveredScore }) {
  return (
    <div className="flex gap-1 sm:gap-1.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
        const c = HEATMAP_COLORS[value];
        const isSelected = selected === value;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            onMouseEnter={() => setHoveredScore(value)}
            onMouseLeave={() => setHoveredScore(null)}
            className={`flex-1 aspect-square flex items-center justify-center rounded-lg sm:rounded-xl
              border-2 transition-all duration-150 touch-manipulation active:scale-90
              ${isSelected
                ? `${c.activeBg} ${c.border} ${c.activeText} scale-105 shadow-md`
                : `${c.bg} ${c.border} ${c.text} hover:brightness-110`
              }`}
          >
            <span className="text-sm sm:text-base font-bold">{value}</span>
          </button>
        );
      })}
    </div>
  );
}
