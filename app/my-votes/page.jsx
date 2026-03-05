"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getQuadrant, getQuadrantColor } from "@/lib/utils";

export default function MyVotesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState(5);
  const [editQuality, setEditQuality] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchVotes();
    }
  }, [user]);

  async function fetchVotes() {
    try {
      const res = await fetch("/api/my-votes");
      if (res.ok) {
        const data = await res.json();
        setVotes(data.votes);
      }
    } catch {
      console.error("Failed to fetch votes");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(vote) {
    setEditingId(vote.id);
    setEditPrice(vote.priceScore);
    setEditQuality(vote.qualityScore);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveEdit(voteId) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/votes/${voteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceScore: parseInt(editPrice),
          qualityScore: parseInt(editQuality),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update vote");
      }
      setEditingId(null);
      await fetchVotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteVote(voteId) {
    if (!confirm("Are you sure you want to delete this vote?")) return;

    try {
      const res = await fetch(`/api/votes/${voteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete vote");
      }
      setVotes((prev) => prev.filter((v) => v.id !== voteId));
    } catch (err) {
      setError(err.message);
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Votes</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Manage your product ratings. You can edit or remove any of your votes.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : votes.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            You haven&apos;t voted on any products yet.
          </p>
          <Link
            href="/products"
            className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {votes.map((vote) => {
            const isEditing = editingId === vote.id;
            const price = isEditing ? editPrice : vote.priceScore;
            const quality = isEditing ? editQuality : vote.qualityScore;
            const quadrant = getQuadrant(price, quality);
            const quadrantColor = getQuadrantColor(quadrant);

            return (
              <div
                key={vote.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link
                      href={`/products/${vote.product.slug}`}
                      className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      {vote.product.name}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {vote.product.brand?.name} · Voted {new Date(vote.createdAt).toLocaleDateString()}
                      {vote.updatedAt && vote.updatedAt !== vote.createdAt && (
                        <span> · Edited {new Date(vote.updatedAt).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: `${quadrantColor}20`, color: quadrantColor }}
                  >
                    {quadrant}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price: <span className="text-blue-600 dark:text-blue-400 font-bold">{editPrice}</span>/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={editPrice}
                        onChange={(e) => setEditPrice(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        <span>Very Cheap</span>
                        <span>Very Expensive</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quality: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{editQuality}</span>/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={editQuality}
                        onChange={(e) => setEditQuality(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        <span>Very Low Quality</span>
                        <span>Very High Quality</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(vote.id)}
                        disabled={saving}
                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Price: <strong className="text-gray-900 dark:text-gray-100">{vote.priceScore}</strong>/10
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Quality: <strong className="text-gray-900 dark:text-gray-100">{vote.qualityScore}</strong>/10
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(vote)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVote(vote.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
