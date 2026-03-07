import Link from "next/link";

export const metadata = {
  title: "Terms of Use — Price vs Quality",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition">
        ← Back to Home
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-6">
        Terms of Use
      </h1>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
        <p>
          <strong>Last updated:</strong> March 7, 2026
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Price vs Quality, you agree to be bound by these terms. If you do not agree, please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">2. User Accounts</h2>
          <p>
            You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. One account per person is permitted.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">3. Voting &amp; Submissions</h2>
          <p>
            Votes should reflect your genuine perception of a product&apos;s price and quality. Manipulating votes, creating multiple accounts to influence scores, or submitting spam brand submissions is prohibited and may result in account suspension.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">4. Content</h2>
          <p>
            All brand and product data displayed on the site is community-contributed. We do not guarantee the accuracy of any information. Brand names and logos are trademarks of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">5. Disclaimer</h2>
          <p>
            The service is provided &quot;as is&quot; without warranties of any kind. Price and quality scores are subjective perceptions from the community and should not be taken as objective measurements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">6. Modifications</h2>
          <p>
            We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">7. Contact</h2>
          <p>
            For questions about these terms, please open an issue on our GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
