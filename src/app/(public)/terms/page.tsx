import { PROJECT_NAME, WEBSITE_URL, WEBSITE_DOMAIN, SUPPORT_EMAIL } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Terms of Service - ${PROJECT_NAME}`,
  description: `${PROJECT_NAME} Terms of Service — rules and conditions for using our platform.`,
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-10 text-gray-800 leading-relaxed">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-gray-500 italic mb-10">Last Updated: March 1, 2026</p>

      <p className="mb-5">
        Welcome to <strong>{PROJECT_NAME}</strong>. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the
        {PROJECT_NAME} mobile application and related services (&quot;Service&quot;). By creating an account or using {PROJECT_NAME},
        you agree to be bound by these Terms.
      </p>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded my-5">
        <strong>Age Requirement:</strong> You must be at least <strong>18 years of age</strong> to use {PROJECT_NAME}. By
        using this app, you confirm that you meet this age requirement. Users under 18 are not permitted and will have
        their accounts terminated.
      </div>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        1. User Accounts
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>Provide accurate, current, and complete information during registration.</li>
        <li>Maintain the security of your account and password.</li>
        <li>Notify us immediately of any unauthorized use at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-500 hover:underline">{SUPPORT_EMAIL}</a>.</li>
        <li>Not create more than one account per person.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        2. Virtual Currency &amp; In-App Purchases
      </h2>
      <p className="mb-3">
        {PROJECT_NAME} offers two types of in-app currency: <strong>Coins</strong> (purchased by users) and{" "}
        <strong>Diamonds</strong> (earned by hosts).
      </p>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Coins (User Currency):</strong> Purchased by users, final and non-refundable. Coins have no real-world monetary value and cannot be exchanged for cash by users.</li>
        <li><strong>Diamonds (Creator Earnings):</strong> Earned by verified host/creator accounts when they receive virtual gifts. Verified hosts may withdraw accumulated Diamonds as creator earnings through {PROJECT_NAME}&apos;s salary programme, subject to platform fees, minimum thresholds, and applicable law.</li>
        <li><strong>Non-Transferable:</strong> Virtual currency is tied to your account and may not be transferred.</li>
        <li><strong>No Refunds:</strong> All purchases are final, except as required by applicable law or our <Link href="/refund" className="text-pink-500 hover:underline">Refund Policy</Link>.</li>
        <li><strong>Expiration:</strong> Virtual Currency may expire if your account is suspended or terminated.</li>
        <li><strong>Price Changes:</strong> We reserve the right to change pricing at any time.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        3. Live Streaming &amp; Audio Rooms
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>You are solely responsible for the content you broadcast during live sessions.</li>
        <li>Live streams may be monitored and recorded for safety and moderation purposes.</li>
        <li>You grant {PROJECT_NAME} a non-exclusive, royalty-free license to display, record, and use your streams for service operation, safety enforcement, and promotional purposes.</li>
        <li>Room hosts are responsible for managing their rooms and ensuring compliance with these Terms.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        4. Content Policy
      </h2>
      <p className="mb-3">
        You retain ownership of your content, but grant {PROJECT_NAME} a worldwide, non-exclusive, royalty-free license to use,
        store, display, and distribute it in connection with operating our services. You agree <strong>not</strong> to
        post content that:
      </p>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>Is illegal, harmful, threatening, abusive, harassing, defamatory, or hateful.</li>
        <li>Contains nudity, sexually explicit material, or graphic violence.</li>
        <li>Infringes on intellectual property rights.</li>
        <li>Impersonates another person or entity.</li>
        <li>Contains viruses, malware, or other harmful code.</li>
        <li>Violates the privacy of any third party.</li>
        <li>Constitutes spam, unauthorized advertising, or pyramid schemes.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        5. Prohibited Conduct
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>Violate any applicable law or regulation.</li>
        <li>Use the app for gambling, solicitation, or unauthorized commercial activity.</li>
        <li>Harass, bully, intimidate, or harm other users.</li>
        <li>Attempt unauthorized access to the Service or other users&apos; accounts.</li>
        <li>Use automated bots or scripts.</li>
        <li>Reverse engineer, decompile, or extract the source code.</li>
        <li>Manipulate virtual currency, rankings, or in-app systems through exploits.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        6. Intellectual Property
      </h2>
      <p className="mb-5">
        {PROJECT_NAME} and its licensors own all rights to the Service, including the app, its design, logos, trademarks, and
        underlying technology. You may not use our branding without prior written permission.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        7. Privacy
      </h2>
      <p className="mb-5">
        Your use of {PROJECT_NAME} is also governed by our{" "}
        <Link href="/privacy" className="text-pink-500 hover:underline">Privacy Policy</Link>, which is incorporated into
        these Terms by reference.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        8. Disclaimers &amp; Limitation of Liability
      </h2>
      <p className="mb-5">
        {PROJECT_NAME} is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. To the maximum extent
        permitted by law, {PROJECT_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive
        damages arising from your use of the Service.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        9. Termination
      </h2>
      <p className="mb-3">We may terminate or suspend your account at any time for violations of these Terms. Upon termination:</p>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>Your right to access the Service immediately ceases.</li>
        <li>Any unused Virtual Currency will be forfeited, except where required by law.</li>
        <li>You may request a refund of recent purchases per our Refund Policy.</li>
      </ul>
      <p className="mb-5">You may delete your account at any time via <em>Profile → Settings → Delete Account</em>.</p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        10. Changes to Terms
      </h2>
      <p className="mb-5">
        We reserve the right to modify these Terms at any time. Your continued use after changes constitutes acceptance.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        11. Governing Law
      </h2>
      <p className="mb-5">
        These Terms shall be governed by and construed in accordance with the laws of Bangladesh. Any disputes shall be
        subject to the exclusive jurisdiction of the courts in Dhaka, Bangladesh.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        12. Contact Us
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-500 hover:underline">{SUPPORT_EMAIL}</a></li>
        <li><strong>Website:</strong> <a href={WEBSITE_URL} className="text-pink-500 hover:underline">{WEBSITE_DOMAIN}</a></li>
      </ul>

      <div className="mt-16 pt-5 border-t border-gray-200 text-center space-x-6">
        <Link href="/" className="text-pink-500 hover:underline">Home</Link>
        <Link href="/privacy" className="text-pink-500 hover:underline">Privacy Policy</Link>
        <Link href="/refund" className="text-pink-500 hover:underline">Refund Policy</Link>
        <Link href="/contact" className="text-pink-500 hover:underline">Contact Us</Link>
      </div>
    </div>
  );
}
