"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

const STATUS_STYLES = {
  PENDING: { label: "Pending", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200" },
  IN_REVIEW: { label: "In Review", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-200" },
  APPROVED: { label: "Approved", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-200" },
  REJECTED: { label: "Rejected", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-200" },
  DUPLICATE: { label: "Duplicate", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
};

export default function MySubmissionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchSubmissions();
  }, [user]);

  async function fetchSubmissions() {
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
      }
    } catch {
      console.error("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Submissions
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track the status of your brand submissions.
          </p>
        </div>
        <Link
          href="/submit-brand"
          className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Submit Brand
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No submissions yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Can&apos;t find a brand? Submit it and we&apos;ll review it.
          </p>
          <Link
            href="/submit-brand"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Submit a Brand
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const style = STATUS_STYLES[sub.status] || STATUS_STYLES.PENDING;
            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {sub.name}
                    </h3>
                    {sub.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {sub.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Submitted {new Date(sub.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>

                {/* Review details */}
                {sub.status === "REJECTED" && sub.rejectionReason && (
                  <div className="mt-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Reason: {sub.rejectionReason}
                    </p>
                    {sub.reviewNotes && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{sub.reviewNotes}</p>
                    )}
                  </div>
                )}

                {sub.status === "APPROVED" && sub.promotedBrandId && (
                  <div className="mt-3">
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ✅ Brand added to database
                    </span>
                  </div>
                )}

                {sub.status === "DUPLICATE" && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      This brand already exists in our database.
                    </span>
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
