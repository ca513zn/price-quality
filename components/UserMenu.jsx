"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function UserMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
      >
        Sign In
      </Link>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <span className="hidden sm:inline">{user.name}</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            {user.role === "ADMIN" && (
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
          </div>

          <Link
            href="/my-votes"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            My Votes
          </Link>

          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Admin Panel
            </Link>
          )}

          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
