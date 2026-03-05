"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function SubmitBrandPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [checking, setChecking] = useState(false);

  // Debounced duplicate check
  const checkDuplicates = useCallback(async (value) => {
    if (value.trim().length < 2) {
      setDuplicateMatches([]);
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/submissions/check?name=${encodeURIComponent(value.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setDuplicateMatches(data.matches || []);
      }
    } catch {
      // Ignore check errors
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (name.trim().length >= 2) {
        checkDuplicates(name);
      } else {
        setDuplicateMatches([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [name, checkDuplicates]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.existingBrand) {
          setError(
            `This brand already exists! View it here: ${data.existingBrand.name}`
          );
          return;
        }
        throw new Error(data.error || "Failed to submit brand");
      }

      setSuccess(data.message);
      setName("");
      setDescription("");
      setWebsiteUrl("");
      setDuplicateMatches([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Sign in to submit a brand
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need to be signed in to suggest a new brand for our database.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Submit a Brand
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Can&apos;t find a brand? Submit it for review and we&apos;ll add it to our database.
        </p>
      </div>

      {success ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            Submission Received!
          </h2>
          <p className="text-green-700 dark:text-green-300 mb-4">{success}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setSuccess(null)}
              className="px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition"
            >
              Submit Another
            </button>
            <Link
              href="/my-submissions"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              View My Submissions
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-5">
            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="e.g. Bowers & Wilkins"
              />
              {checking && (
                <p className="text-xs text-gray-400 mt-1">Checking for duplicates...</p>
              )}
            </div>

            {/* Duplicate Warning */}
            {duplicateMatches.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  ⚠️ Did you mean one of these existing brands?
                </p>
                <ul className="space-y-1">
                  {duplicateMatches.map((match) => (
                    <li key={match.slug}>
                      <Link
                        href={`/brands/${match.slug}`}
                        className="text-sm text-amber-700 dark:text-amber-300 hover:underline font-medium"
                      >
                        {match.name} →
                      </Link>
                      <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                        ({match.type === "exact" ? "exact match" : "similar name"})
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  If this is a different brand, you can still submit it.
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Brief description of the brand..."
              />
              <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website URL <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading || name.trim().length < 2}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Brand"}
            </button>
            <p className="text-xs text-gray-400">
              Submissions are reviewed by our team before being added.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
