"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getQuadrant, getQuadrantColor } from "@/lib/utils";

export default function VoteForm({ productId, productName, onVoteSuccess }) {
  const { user, loading: authLoading } = useAuth();
  const [priceScore, setPriceScore] = useState(5);
  const [qualityScore, setQualityScore] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Existing vote state
  const [existingVote, setExistingVote] = useState(null);
  const [checkingVote, setCheckingVote] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const quadrant = getQuadrant(priceScore, qualityScore);

  // Check if the user already voted on this product
  useEffect(() => {
    if (user && productId) {
      setCheckingVote(true);
      fetch("/api/my-votes")
        .then((res) => (res.ok ? res.json() : { votes: [] }))
        .then((data) => {
          const vote = data.votes.find((v) => v.product?.slug || v.productId === productId);
          // match by productId
          const match = data.votes.find((v) => v.productId === productId);
          if (match) {
            setExistingVote(match);
            setPriceScore(match.priceScore);
            setQualityScore(match.qualityScore);
          } else {
            setExistingVote(null);
          }
        })
        .catch(() => {})
        .finally(() => setCheckingVote(false));
    } else {
      setExistingVote(null);
    }
  }, [user, productId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (existingVote && isEditing) {
        // Update existing vote
        const res = await fetch(`/api/votes/${existingVote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceScore: parseInt(priceScore),
            qualityScore: parseInt(qualityScore),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update vote");
        }
        const data = await res.json();
        setExistingVote(data.vote);
        setIsEditing(false);
        setSubmitted(true);
      } else {
        // Create new vote
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
        const data = await res.json();
        setExistingVote(data.vote);
        setSubmitted(true);
      }
      if (onVoteSuccess) onVoteSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!existingVote) return;
    if (!confirm("Are you sure you want to delete your vote?")) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/votes/${existingVote.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete vote");
      }
      setExistingVote(null);
      setPriceScore(5);
      setQualityScore(5);
      setSubmitted(false);
      setIsEditing(false);
      if (onVoteSuccess) onVoteSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Rate {productName}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Sign in to vote on this product.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Sign In to Vote
        </Link>
      </div>
    );
  }

  // Loading auth or checking existing vote
  if (authLoading || checkingVote) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // Show existing vote (not editing)
  if (existingVote && !isEditing && !submitted) {
    const existQuadrant = getQuadrant(existingVote.priceScore, existingVote.qualityScore);
    const existColor = getQuadrantColor(existQuadrant);

    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Your Vote for <span className="text-blue-600 dark:text-blue-400">{productName}</span>
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Price</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{existingVote.priceScore}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">/10</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Quality</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{existingVote.qualityScore}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">/10</p>
          </div>
        </div>

        <div className="text-center p-2 rounded-md bg-gray-50 dark:bg-gray-800 mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Your perception: </span>
          <span className="font-semibold text-sm" style={{ color: existColor }}>
            {existQuadrant}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setPriceScore(existingVote.priceScore);
              setQualityScore(existingVote.qualityScore);
              setIsEditing(true);
              setSubmitted(false);
            }}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
          >
            Edit Vote
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 px-4 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted && !isEditing) {
    return (
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
        <p className="text-green-800 dark:text-green-200 font-medium text-lg">
          ✅ {existingVote ? "Vote updated!" : "Vote submitted!"}
        </p>
        <p className="text-green-600 dark:text-green-400 mt-1">Thanks for rating {productName}.</p>
        <button
          onClick={() => {
            setSubmitted(false);
          }}
          className="mt-3 text-sm text-green-700 dark:text-green-300 underline hover:text-green-900 dark:hover:text-green-100"
        >
          View your vote
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {isEditing ? "Edit your vote for" : "Rate"}{" "}
        <span className="text-blue-600 dark:text-blue-400">{productName}</span>
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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : isEditing ? "Update Vote" : "Submit Vote"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setPriceScore(existingVote.priceScore);
              setQualityScore(existingVote.qualityScore);
            }}
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
