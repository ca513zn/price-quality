"use client";

import { useState } from "react";
import { getQuadrant, getQuadrantColor } from "@/lib/utils";

export default function VoteForm({ productId, productName, onVoteSuccess }) {
  const [priceScore, setPriceScore] = useState(5);
  const [qualityScore, setQualityScore] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const quadrant = getQuadrant(priceScore, qualityScore);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          priceScore: parseInt(priceScore),
          qualityScore: parseInt(qualityScore),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit vote");
      }

      setSubmitted(true);
      if (onVoteSuccess) onVoteSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
        <p className="text-green-800 dark:text-green-200 font-medium text-lg">✅ Vote submitted!</p>
        <p className="text-green-600 dark:text-green-400 mt-1">Thanks for rating {productName}.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setPriceScore(5);
            setQualityScore(5);
          }}
          className="mt-3 text-sm text-green-700 dark:text-green-300 underline hover:text-green-900 dark:hover:text-green-100"
        >
          Vote again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Rate <span className="text-blue-600 dark:text-blue-400">{productName}</span>
      </h3>

      {/* Price Score */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Perceived Price: <span className="text-blue-600 dark:text-blue-400 font-bold">{priceScore}</span>/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={priceScore}
          onChange={(e) => setPriceScore(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>Very Cheap</span>
          <span>Very Expensive</span>
        </div>
      </div>

      {/* Quality Score */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Perceived Quality: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{qualityScore}</span>/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={qualityScore}
          onChange={(e) => setQualityScore(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>Very Low Quality</span>
          <span>Very High Quality</span>
        </div>
      </div>

      {/* Preview */}
      <div className="text-center p-3 rounded-md bg-gray-50 dark:bg-gray-800">
        <span className="text-sm text-gray-500 dark:text-gray-400">Your perception: </span>
        <span
          className="font-semibold text-sm"
          style={{ color: getQuadrantColor(quadrant) }}
        >
          {quadrant}
        </span>
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : "Submit Vote"}
      </button>
    </form>
  );
}
