import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
              Price vs Quality
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              A community-driven perception map that plots products based on crowd-sourced price and quality ratings.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                  Perception Map
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/brands" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                  Brands
                </Link>
              </li>
              <li>
                <Link href="/vote" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                  Quick Vote
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Community
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/submit-brand" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                  Submit a Brand
                </Link>
              </li>
              <li>
                <Link href="/my-votes" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                  My Votes
                </Link>
              </li>
              <li>
                <Link href="/my-submissions" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                  My Submissions
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {year} Price vs Quality. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Built with Next.js, Prisma &amp; Recharts
          </p>
        </div>
      </div>
    </footer>
  );
}
