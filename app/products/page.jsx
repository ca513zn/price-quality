"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getQuadrant, getQuadrantColor } from "@/lib/utils";

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit modal state
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBrandId, setEditBrandId] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/brands").then((r) => r.json()),
    ]).then(([prodData, brandData]) => {
      setProducts(prodData.products || []);
      setBrands(brandData.brands || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand?.name && p.brand.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, search]);

  function openEdit(product) {
    setEditing(product);
    setEditName(product.name);
    setEditBrandId(product.brandId || product.brand?.id || "");
    setEditDesc(product.description || "");
    setEditError(null);
  }

  function closeEdit() {
    setEditing(null);
    setEditError(null);
  }

  async function saveEdit(e) {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: editName,
          brandId: editBrandId,
          description: editDesc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? { ...p, name: data.product.name, slug: data.product.slug, description: data.product.description, brand: data.product.brand || p.brand }
            : p
        )
      );
      closeEdit();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  async function deleteProduct(product) {
    if (!confirm(`Delete "${product.name}"? All its votes will also be deleted.`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">All Products</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Browse all products and vote on their perceived price and quality.
      </p>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or brands..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const quadrant = getQuadrant(product.avgPriceScore, product.avgQualityScore);
            const color = getQuadrantColor(quadrant);

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition group relative"
              >
                <Link href={`/products/${product.slug}`} className="block">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {product.brand?.name || ""}
                      </p>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {quadrant}
                    </span>
                  </div>

                  {product.totalVotes > 0 ? (
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Price</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {product.avgPriceScore.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Quality</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {product.avgQualityScore.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Votes</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {product.totalVotes}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">No votes yet</p>
                  )}
                </Link>

                {isAdmin && (
                  <div className="absolute top-3 right-14 flex gap-1">
                    <button
                      onClick={(e) => { e.preventDefault(); openEdit(product); }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition"
                      title="Edit product"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); deleteProduct(product); }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition"
                      title="Delete product"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 text-center py-12">
          {search ? `No products matching "${search}".` : "No products found."}
        </p>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeEdit}>
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Product</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand *</label>
                <select
                  value={editBrandId}
                  onChange={(e) => setEditBrandId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="">Select a brand...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              {editError && <p className="text-red-600 dark:text-red-400 text-sm">{editError}</p>}

              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={closeEdit} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  Cancel
                </button>
                <button type="submit" disabled={editLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
