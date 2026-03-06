"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  // Close on route change (link click)
  const close = () => setMobileOpen(false);

  return (
    <header
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
      ref={menuRef}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" onClick={close}>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">📊</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              Price vs Quality
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Map
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Products
              </Link>
              <Link
                href="/brands"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Brands
              </Link>
              <Link
                href="/vote"
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
              >
                🗳️ Vote
              </Link>
            </nav>
            <ThemeToggle />
            <UserMenu />
          </div>

          {/* Mobile right side: theme + user + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <UserMenu />
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <nav className="flex flex-col px-4 py-3 gap-1">
            <Link
              href="/"
              onClick={close}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              📊 Map
            </Link>
            <Link
              href="/products"
              onClick={close}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              📦 Products
            </Link>
            <Link
              href="/brands"
              onClick={close}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              🏷️ Brands
            </Link>
            <Link
              href="/vote"
              onClick={close}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              🗳️ Quick Vote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
