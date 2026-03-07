import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Price vs Quality",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition">
        ← Back to Home
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-6">
        Privacy Policy
      </h1>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
        <p>
          <strong>Last updated:</strong> March 7, 2026
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">1. Information We Collect</h2>
          <p>
            When you create an account, we collect your name and email address. When you vote on products, we store your ratings. We do not collect payment information, location data, or tracking cookies beyond what is strictly necessary for the service to function.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">2. How We Use Your Information</h2>
          <p>
            Your votes are aggregated anonymously to calculate average price and quality scores displayed on the perception map. Your account information is used solely for authentication and to let you manage your votes and submissions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">3. Data Sharing</h2>
          <p>
            We do not sell, rent, or share your personal information with third parties. Aggregated, anonymized vote data may be displayed publicly on the site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">4. Cookies</h2>
          <p>
            We use a single authentication cookie (<code>pq_session</code>) to keep you signed in. We use a <code>theme</code> preference stored in localStorage. No third-party analytics or advertising cookies are used.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">5. Data Retention</h2>
          <p>
            Your account and vote data are retained for as long as your account is active. You may delete individual votes at any time from the My Votes page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">6. Security</h2>
          <p>
            Passwords are hashed using bcrypt and never stored in plain text. Authentication tokens are stored in httpOnly cookies. All data is transmitted over HTTPS.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">7. Contact</h2>
          <p>
            If you have questions about this privacy policy, please open an issue on our GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
