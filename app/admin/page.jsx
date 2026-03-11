"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";

const STATUS_STYLES = {
  PENDING: { label: "Pending", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200" },
  IN_REVIEW: { label: "In Review", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-200" },
  APPROVED: { label: "Approved", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-200" },
  REJECTED: { label: "Rejected", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-200" },
  DUPLICATE: { label: "Duplicate", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
};

// Reusable row for editing a product image (used in both Missing and All views)
function ImageRow({ product, inputValue, uploading, saving, error, success, onInputChange, onUpload, onSave, onCancel, fileInputRef }) {
  const localFileRef = useRef(null);
  const setRef = (el) => {
    localFileRef.current = el;
    if (fileInputRef) fileInputRef(el);
  };
  return (
    <div
      className={`bg-white dark:bg-gray-900 border rounded-lg p-3 sm:p-4 transition-all ${
        success
          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {/* Product info */}
        <div className="min-w-0 sm:w-48 shrink-0">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {product.name}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {product.brand?.name}
          </p>
        </div>

        {/* URL input + preview */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {inputValue && (
            <div className="shrink-0 w-8 h-8 rounded border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                src={inputValue}
                alt=""
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          )}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Paste image URL..."
            className="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            ref={setRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => localFileRef.current?.click()}
            disabled={uploading || saving}
            className="px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
            title="Upload image file"
          >
            {uploading ? (
              <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              "📎"
            )}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || uploading || !inputValue?.trim()}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-50 ${
              success
                ? "bg-green-600 text-white"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {saving ? (
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : success ? (
              "✓"
            ) : (
              "Save"
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 pl-0 sm:pl-48 sm:ml-3">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("submissions");

  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  // Brand form
  const [brandName, setBrandName] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState(null);
  const [brandSuccess, setBrandSuccess] = useState(null);

  // Product form
  const [productName, setProductName] = useState("");
  const [productBrandId, setProductBrandId] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);
  const [productSuccess, setProductSuccess] = useState(null);

  // Submissions
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [submissionFilter, setSubmissionFilter] = useState("PENDING");
  const [moderating, setModerating] = useState(null); // submission being reviewed
  const [modAction, setModAction] = useState("approve");
  const [modNotes, setModNotes] = useState("");
  const [modRejectionReason, setModRejectionReason] = useState("");
  const [modEditName, setModEditName] = useState("");
  const [modEditDesc, setModEditDesc] = useState("");
  const [modDuplicateBrandId, setModDuplicateBrandId] = useState("");
  const [modLoading, setModLoading] = useState(false);
  const [modError, setModError] = useState(null);

  // Images tab
  const [missingImageProducts, setMissingImageProducts] = useState([]);
  const [allImageProducts, setAllImageProducts] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [imageView, setImageView] = useState("missing"); // "missing" | "all"
  const [imageSearch, setImageSearch] = useState("");
  const [imageInputs, setImageInputs] = useState({}); // { [productId]: url string }
  const [imageUploading, setImageUploading] = useState({}); // { [productId]: boolean }
  const [imageSaving, setImageSaving] = useState({}); // { [productId]: boolean }
  const [imageErrors, setImageErrors] = useState({}); // { [productId]: string }
  const [imageSuccess, setImageSuccess] = useState({}); // { [productId]: true }
  const [editingImageId, setEditingImageId] = useState(null); // product id being edited
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchBrands();
    fetchSubmissions();
    fetchMissingImages();
  }, []);

  async function fetchBrands() {
    try {
      const res = await fetch("/api/brands");
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands);
      }
    } catch {
      console.error("Failed to fetch brands");
    } finally {
      setLoadingBrands(false);
    }
  }

  async function fetchMissingImages() {
    setLoadingImages(true);
    try {
      const res = await fetch("/api/admin/products/missing-images");
      if (res.ok) {
        const data = await res.json();
        setMissingImageProducts(data.products);
      }
    } catch {
      console.error("Failed to fetch products without images");
    } finally {
      setLoadingImages(false);
    }
  }

  async function fetchAllProducts() {
    setLoadingImages(true);
    try {
      const res = await fetch("/api/admin/products/all-images");
      if (res.ok) {
        const data = await res.json();
        setAllImageProducts(data.products);
      }
    } catch {
      console.error("Failed to fetch all products");
    } finally {
      setLoadingImages(false);
    }
  }

  function switchImageView(view) {
    setImageView(view);
    setImageSearch("");
    setEditingImageId(null);
    if (view === "missing") fetchMissingImages();
    else fetchAllProducts();
  }

  function setImageInput(productId, value) {
    setImageInputs((prev) => ({ ...prev, [productId]: value }));
    setImageErrors((prev) => ({ ...prev, [productId]: null }));
    setImageSuccess((prev) => ({ ...prev, [productId]: false }));
  }

  async function handleFileUpload(productId, file) {
    if (!file) return;
    setImageUploading((prev) => ({ ...prev, [productId]: true }));
    setImageErrors((prev) => ({ ...prev, [productId]: null }));

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImageInputs((prev) => ({ ...prev, [productId]: data.url }));
    } catch (err) {
      setImageErrors((prev) => ({ ...prev, [productId]: err.message }));
    } finally {
      setImageUploading((prev) => ({ ...prev, [productId]: false }));
    }
  }

  async function handleSaveImage(productId) {
    const url = imageInputs[productId]?.trim();
    if (!url) {
      setImageErrors((prev) => ({ ...prev, [productId]: "Enter a URL or upload an image" }));
      return;
    }
    setImageSaving((prev) => ({ ...prev, [productId]: true }));
    setImageErrors((prev) => ({ ...prev, [productId]: null }));

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, imageUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setImageSuccess((prev) => ({ ...prev, [productId]: true }));

      if (imageView === "missing") {
        // Remove from missing list after brief delay
        setTimeout(() => {
          setMissingImageProducts((prev) => prev.filter((p) => p.id !== productId));
          setImageInputs((prev) => { const n = { ...prev }; delete n[productId]; return n; });
          setImageSuccess((prev) => { const n = { ...prev }; delete n[productId]; return n; });
        }, 600);
      } else {
        // Update in-place in all-products list
        setAllImageProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, imageUrl: url } : p))
        );
        setTimeout(() => {
          setEditingImageId(null);
          setImageInputs((prev) => { const n = { ...prev }; delete n[productId]; return n; });
          setImageSuccess((prev) => { const n = { ...prev }; delete n[productId]; return n; });
        }, 600);
      }
    } catch (err) {
      setImageErrors((prev) => ({ ...prev, [productId]: err.message }));
    } finally {
      setImageSaving((prev) => ({ ...prev, [productId]: false }));
    }
  }

  async function handleCreateBrand(e) {
    e.preventDefault();
    setBrandLoading(true);
    setBrandError(null);
    setBrandSuccess(null);

    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brandName,
          description: brandDesc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create brand");

      setBrandSuccess(`Brand "${data.brand.name}" created!`);
      setBrandName("");
      setBrandDesc("");
      await fetchBrands();
    } catch (err) {
      setBrandError(err.message);
    } finally {
      setBrandLoading(false);
    }
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    setProductLoading(true);
    setProductError(null);
    setProductSuccess(null);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          brandId: productBrandId,
          description: productDesc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      setProductSuccess(`Product "${data.product.name}" created!`);
      setProductName("");
      setProductDesc("");
    } catch (err) {
      setProductError(err.message);
    } finally {
      setProductLoading(false);
    }
  }

  async function fetchSubmissions() {
    setLoadingSubmissions(true);
    try {
      const url = submissionFilter
        ? `/api/admin/submissions?status=${submissionFilter}`
        : "/api/admin/submissions";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
      }
    } catch {
      console.error("Failed to fetch submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  }

  useEffect(() => {
    if (user?.role === "ADMIN") fetchSubmissions();
  }, [submissionFilter, user]);

  function openModerate(sub) {
    setModerating(sub);
    setModAction("approve");
    setModNotes("");
    setModRejectionReason("");
    setModEditName(sub.name);
    setModEditDesc(sub.description || "");
    setModDuplicateBrandId(sub.duplicateOfId || "");
    setModError(null);
  }

  function closeModerate() {
    setModerating(null);
    setModError(null);
  }

  async function handleModerate(e) {
    e.preventDefault();
    setModLoading(true);
    setModError(null);

    try {
      const body = {
        id: moderating.id,
        action: modAction,
        reviewNotes: modNotes || undefined,
      };
      if (modAction === "approve") {
        body.editedName = modEditName;
        body.editedDescription = modEditDesc;
      }
      if (modAction === "reject") {
        body.rejectionReason = modRejectionReason || "Does not meet criteria";
      }
      if (modAction === "duplicate") {
        body.duplicateBrandId = modDuplicateBrandId;
      }

      const res = await fetch("/api/admin/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to moderate submission");

      closeModerate();
      fetchSubmissions();
      if (modAction === "approve") fetchBrands();
    } catch (err) {
      setModError(err.message);
    } finally {
      setModLoading(false);
    }
  }

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
        <span className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
          Admin
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 sm:mb-8 border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide">
        {[
          { key: "submissions", label: "Submissions", count: submissions.length },
          { key: "images", label: "Images", count: missingImageProducts.length },
          { key: "create", label: "Create" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Submissions Tab ── */}
      {activeTab === "submissions" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-6">
            {["PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "DUPLICATE", ""].map((status) => (
              <button
                key={status}
                onClick={() => setSubmissionFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  submissionFilter === status
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {status || "All"}
              </button>
            ))}
          </div>

          {loadingSubmissions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 animate-pulse">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-lg">No submissions {submissionFilter ? `with status "${submissionFilter}"` : "found"}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const style = STATUS_STYLES[sub.status] || STATUS_STYLES.PENDING;
                const isPending = sub.status === "PENDING" || sub.status === "IN_REVIEW";
                return (
                  <div key={sub.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{sub.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </div>
                        {sub.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{sub.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <span className="truncate max-w-[200px]">By {sub.submitter?.name || "Unknown"} ({sub.submitter?.email})</span>
                          <span>{new Date(sub.createdAt).toLocaleString()}</span>
                          {sub.websiteUrl && <a href={sub.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{sub.websiteUrl}</a>}
                        </div>
                        {sub.categories?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {sub.categories.map((cat) => (
                              <span key={cat} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">{cat}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isPending && (
                        <button
                          onClick={() => openModerate(sub)}
                          className="shrink-0 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Moderation Modal */}
          {moderating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeModerate}>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Review Submission</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Submitted by {moderating.submitter?.name} on {new Date(moderating.createdAt).toLocaleDateString()}
                </p>

                <form onSubmit={handleModerate} className="space-y-4">
                  {/* Action selector */}
                  <div className="flex gap-2">
                    {["approve", "reject", "duplicate"].map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => setModAction(action)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          modAction === action
                            ? action === "approve"
                              ? "bg-green-600 text-white"
                              : action === "reject"
                              ? "bg-red-600 text-white"
                              : "bg-gray-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Approve: editable name + description */}
                  {modAction === "approve" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand Name</label>
                        <input type="text" value={modEditName} onChange={(e) => setModEditName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea value={modEditDesc} onChange={(e) => setModEditDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none" />
                      </div>
                    </>
                  )}

                  {/* Reject: reason */}
                  {modAction === "reject" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rejection Reason</label>
                      <select value={modRejectionReason} onChange={(e) => setModRejectionReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition">
                        <option value="">Select reason...</option>
                        <option value="Duplicate of existing brand">Duplicate of existing brand</option>
                        <option value="Not a real brand">Not a real brand</option>
                        <option value="Insufficient information">Insufficient information</option>
                        <option value="Inappropriate content">Inappropriate content</option>
                        <option value="Does not meet criteria">Does not meet criteria</option>
                      </select>
                    </div>
                  )}

                  {/* Duplicate: select brand */}
                  {modAction === "duplicate" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duplicate of Brand</label>
                      <select value={modDuplicateBrandId} onChange={(e) => setModDuplicateBrandId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition">
                        <option value="">Select brand...</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Notes (always shown) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                    <textarea value={modNotes} onChange={(e) => setModNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none" placeholder="Notes for the submitter..." />
                  </div>

                  {modError && <p className="text-red-600 dark:text-red-400 text-sm">{modError}</p>}

                  <div className="flex gap-2 justify-end pt-1">
                    <button type="button" onClick={closeModerate} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">Cancel</button>
                    <button type="submit" disabled={modLoading} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${modAction === "approve" ? "bg-green-600 hover:bg-green-700" : modAction === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"}`}>
                      {modLoading ? "Processing..." : modAction === "approve" ? "Approve & Create Brand" : modAction === "reject" ? "Reject Submission" : "Mark as Duplicate"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Images Tab ── */}
      {activeTab === "images" && (
        <div>
          {/* View toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => switchImageView("missing")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  imageView === "missing"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Missing ({missingImageProducts.length})
              </button>
              <button
                onClick={() => switchImageView("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  imageView === "all"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                All Products
              </button>
            </div>

            {imageView === "all" && (
              <input
                type="text"
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full sm:w-64 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
            )}
          </div>

          {loadingImages ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : imageView === "missing" ? (
            /* ── Missing Images View ── */
            missingImageProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-lg">All products have images!</p>
                <p className="text-sm mt-1">
                  Switch to <button onClick={() => switchImageView("all")} className="text-purple-500 hover:text-purple-600 underline">All Products</button> to edit existing images.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {missingImageProducts.map((product) => (
                  <ImageRow
                    key={product.id}
                    product={product}
                    inputValue={imageInputs[product.id] || ""}
                    uploading={imageUploading[product.id]}
                    saving={imageSaving[product.id]}
                    error={imageErrors[product.id]}
                    success={imageSuccess[product.id]}
                    onInputChange={(val) => setImageInput(product.id, val)}
                    onUpload={(file) => handleFileUpload(product.id, file)}
                    onSave={() => handleSaveImage(product.id)}
                    fileInputRef={(el) => (fileInputRefs.current[product.id] = el)}
                  />
                ))}
              </div>
            )
          ) : (
            /* ── All Products View ── */
            (() => {
              const filtered = imageSearch.trim()
                ? allImageProducts.filter(
                    (p) =>
                      p.name.toLowerCase().includes(imageSearch.toLowerCase()) ||
                      p.brand?.name?.toLowerCase().includes(imageSearch.toLowerCase())
                  )
                : allImageProducts;
              return filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                  <p className="text-lg">No products found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((product) => {
                    const isEditing = editingImageId === product.id;
                    if (isEditing) {
                      return (
                        <ImageRow
                          key={product.id}
                          product={product}
                          inputValue={imageInputs[product.id] ?? product.imageUrl ?? ""}
                          uploading={imageUploading[product.id]}
                          saving={imageSaving[product.id]}
                          error={imageErrors[product.id]}
                          success={imageSuccess[product.id]}
                          onInputChange={(val) => setImageInput(product.id, val)}
                          onUpload={(file) => handleFileUpload(product.id, file)}
                          onSave={() => handleSaveImage(product.id)}
                          onCancel={() => {
                            setEditingImageId(null);
                            setImageInputs((prev) => { const n = { ...prev }; delete n[product.id]; return n; });
                            setImageErrors((prev) => { const n = { ...prev }; delete n[product.id]; return n; });
                          }}
                          fileInputRef={(el) => (fileInputRefs.current[product.id] = el)}
                        />
                      );
                    }
                    return (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 flex items-center gap-3"
                      >
                        {/* Current image or placeholder */}
                        <div className="shrink-0 w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt=""
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          )}
                        </div>

                        {/* Product info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {product.brand?.name}
                          </p>
                        </div>

                        {/* Status + Edit */}
                        <div className="flex items-center gap-2 shrink-0">
                          {product.imageUrl ? (
                            <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                          ) : (
                            <span className="text-xs text-gray-400">missing</span>
                          )}
                          <button
                            onClick={() => {
                              setEditingImageId(product.id);
                              setImageInputs((prev) => ({ ...prev, [product.id]: product.imageUrl || "" }));
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ── Create Tab ── */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create Brand */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Brand</h2>

          <form onSubmit={handleCreateBrand} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="e.g. Nike"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={brandDesc}
                onChange={(e) => setBrandDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Brief description..."
              />
            </div>

            {brandError && (
              <p className="text-red-600 dark:text-red-400 text-sm">{brandError}</p>
            )}
            {brandSuccess && (
              <p className="text-green-600 dark:text-green-400 text-sm">{brandSuccess}</p>
            )}

            <button
              type="submit"
              disabled={brandLoading}
              className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {brandLoading ? "Creating..." : "Create Brand"}
            </button>
          </form>
        </div>

        {/* Create Product */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Product</h2>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="e.g. Air Max 90"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brand *
              </label>
              <select
                value={productBrandId}
                onChange={(e) => setProductBrandId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              >
                <option value="">Select a brand...</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {loadingBrands && (
                <p className="text-xs text-gray-400 mt-1">Loading brands...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Brief description..."
              />
            </div>

            {productError && (
              <p className="text-red-600 dark:text-red-400 text-sm">{productError}</p>
            )}
            {productSuccess && (
              <p className="text-green-600 dark:text-green-400 text-sm">{productSuccess}</p>
            )}

            <button
              type="submit"
              disabled={productLoading}
              className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {productLoading ? "Creating..." : "Create Product"}
            </button>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
