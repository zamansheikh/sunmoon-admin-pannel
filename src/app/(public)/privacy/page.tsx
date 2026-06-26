import { PROJECT_NAME, WEBSITE_URL, WEBSITE_DOMAIN, SUPPORT_EMAIL } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Privacy Policy - ${PROJECT_NAME}`,
  description: `${PROJECT_NAME} Privacy Policy — how we collect, use, and protect your data.`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-10 text-gray-800 leading-relaxed">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-gray-500 italic mb-10">Last Updated: March 1, 2026</p>

      <p className="mb-5">
        Welcome to <strong>{PROJECT_NAME}</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We are committed to protecting your privacy.
        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile
        application and related services.
      </p>
      <p className="mb-5">
        By using {PROJECT_NAME}, you agree to the collection and use of information in accordance with this policy. If you do
        not agree, please do not use our app.
      </p>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded my-5">
        <strong>Age Requirement:</strong> {PROJECT_NAME} is intended for users aged <strong>18 years and older</strong>. We do
        not knowingly collect data from anyone under 18. If you are under 18, please do not use this app.
      </div>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        1. Information We Collect
      </h2>

      <h3 className="text-lg font-semibold text-gray-600 mt-6 mb-3">A. Information You Provide Directly</h3>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Account Registration:</strong> Email address, username, display name, date of birth, and gender when you create an account.</li>
        <li><strong>Profile Information:</strong> Profile photo, bio, and other details you choose to add.</li>
        <li><strong>User Content:</strong> Audio streams, voice recordings during live sessions, text messages, comments, and chat content.</li>
        <li><strong>Payment Information:</strong> When you purchase virtual coins or diamonds, we process payments through authorized payment providers. We do not store full credit card numbers.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-600 mt-6 mb-3">B. Information Collected Automatically</h3>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Device Information:</strong> Hardware model, operating system version, unique device identifiers, mobile network information, and IP address.</li>
        <li><strong>Usage Data:</strong> Features used, time and duration of sessions, interactions with other users, virtual currency transactions, and gifting activity.</li>
        <li><strong>Log Data:</strong> Error logs, crash reports, and performance data to improve app stability.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-600 mt-6 mb-3">C. Device Permissions We Request</h3>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Microphone (Required):</strong> Used exclusively for live audio streaming and voice chat.</li>
        <li><strong>Camera (Optional):</strong> Used for capturing and uploading profile photos.</li>
        <li><strong>Storage / Media (Optional):</strong> Used to upload profile pictures or save content to your device.</li>
        <li><strong>Internet:</strong> Required to connect to our servers and deliver all app features.</li>
        <li><strong>Notifications (Optional):</strong> Used to send alerts about activity in your rooms and followed hosts.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        2. How We Use Your Information
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>To create and manage your account and profile.</li>
        <li>To operate and deliver live audio streaming features.</li>
        <li>To process virtual currency (coins and diamonds) transactions and gifts.</li>
        <li>To personalize content and recommendations.</li>
        <li>To facilitate communication between users.</li>
        <li>To enforce our Terms of Service and Community Guidelines.</li>
        <li>To detect, investigate, and prevent fraud, abuse, and security incidents.</li>
        <li>To analyze usage trends and improve app performance and features.</li>
        <li>To send service notifications.</li>
        <li>To comply with applicable laws and legal obligations.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        3. Virtual Currency &amp; In-App Purchases
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>Virtual currency has no real-world monetary value and cannot be exchanged for real money.</li>
        <li>All purchases are <strong>final and non-refundable</strong>, except where required by applicable law.</li>
        <li>We use secure, third-party payment processors. Your payment card details are not stored on our servers.</li>
        <li>Transaction records are retained for legal and financial compliance purposes.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        4. Third-Party Services &amp; SDKs
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Agora.io (RTC Engine):</strong> Powers real-time audio streaming. See <a href="https://www.agora.io/en/privacy-policy/" target="_blank" rel="noopener" className="text-pink-500 hover:underline">Agora&apos;s Privacy Policy</a>.</li>
        <li><strong>Google Firebase:</strong> Used for authentication, analytics, and crash reporting. See <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener" className="text-pink-500 hover:underline">Firebase Privacy Policy</a>.</li>
        <li><strong>Google Play Billing:</strong> Used to process in-app purchases on Android. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-pink-500 hover:underline">Google&apos;s Privacy Policy</a>.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        5. Data Sharing &amp; Disclosure
      </h2>
      <p className="mb-3">We do not sell your personal information. We may share data in these limited circumstances:</p>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Service Providers:</strong> Trusted vendors who process data on our behalf under strict confidentiality.</li>
        <li><strong>Other Users:</strong> Your username, profile photo, and public activity are visible to other users by design.</li>
        <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority.</li>
        <li><strong>Safety:</strong> To protect the rights, property, or safety of {PROJECT_NAME}, our users, or the public.</li>
        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        6. Data Retention
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>Account data is kept until you delete your account.</li>
        <li>Transaction records are retained for a minimum of 5 years for financial and legal compliance.</li>
        <li>Chat messages and live session data may be retained for up to 90 days for safety and moderation review.</li>
        <li>After account deletion, some data may be retained in anonymized or aggregated form.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        7. Account Deletion
      </h2>
      <p className="mb-3">You can permanently delete your account and associated data at any time:</p>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>In-App:</strong> Go to <em>Profile → Settings → Delete Account</em>.</li>
        <li><strong>Web Form:</strong> Visit our <Link href="/delete-account" className="text-pink-500 hover:underline">Delete Account</Link> page.</li>
        <li><strong>Email:</strong> Contact us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-500 hover:underline">{SUPPORT_EMAIL}</a>.</li>
      </ul>
      <p className="mb-5">After deletion, your profile, content, and personal data will be removed within 30 days, except where retention is required by law.</p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        8. Your Rights
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Access:</strong> Request a copy of the data we hold about you.</li>
        <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete data.</li>
        <li><strong>Deletion:</strong> Request deletion of your personal data.</li>
        <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
        <li><strong>Objection:</strong> Object to processing of your data for certain purposes.</li>
      </ul>
      <p className="mb-5">To exercise these rights, contact us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-500 hover:underline">{SUPPORT_EMAIL}</a>.</p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        9. Children&apos;s Privacy
      </h2>
      <p className="mb-5">
        {PROJECT_NAME} is <strong>not intended for children under the age of 18</strong>. We do not knowingly collect personal
        information from anyone under 18. If we become aware that a child under 18 has provided us with personal
        information, we will promptly delete such information. Contact us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-500 hover:underline">{SUPPORT_EMAIL}</a>.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        10. Data Security
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>All data transmitted between the app and our servers is encrypted using TLS/HTTPS.</li>
        <li>Passwords are stored using industry-standard one-way hashing.</li>
        <li>Access to personal data is restricted to authorized personnel only.</li>
        <li>We perform regular security audits and vulnerability assessments.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        11. International Data Transfers
      </h2>
      <p className="mb-5">
        {PROJECT_NAME} operates globally. Your information may be transferred to and processed in countries other than the
        country in which you reside. By using {PROJECT_NAME}, you consent to the transfer of your information to these countries.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        12. Changes to This Policy
      </h2>
      <p className="mb-5">
        We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the
        &quot;Last Updated&quot; date and providing a prominent notice within the app. Your continued use of {PROJECT_NAME} after
        changes constitutes acceptance of the updated policy.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        13. Contact Us
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-500 hover:underline">{SUPPORT_EMAIL}</a></li>
        <li><strong>Website:</strong> <a href={WEBSITE_URL} className="text-pink-500 hover:underline">{WEBSITE_DOMAIN}</a></li>
      </ul>

      <div className="mt-16 pt-5 border-t border-gray-200 text-center space-x-6">
        <Link href="/" className="text-pink-500 hover:underline">Home</Link>
        <Link href="/terms" className="text-pink-500 hover:underline">Terms of Service</Link>
        <Link href="/delete-account" className="text-pink-500 hover:underline">Delete Account</Link>
        <Link href="/contact" className="text-pink-500 hover:underline">Contact Us</Link>
      </div>
    </div>
  );
}
