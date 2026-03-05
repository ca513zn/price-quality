"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchBrands();
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

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
        <span className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
          Admin
        </span>
      </div>

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
    </div>
  );
}
