import { PROJECT_NAME, SUPPORT_EMAIL } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Refund Policy - ${PROJECT_NAME}`,
  description: `${PROJECT_NAME} Refund Policy — virtual currency and subscription refund terms.`,
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-10 text-gray-800 leading-relaxed">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Refund Policy</h1>
      <p className="text-gray-500 italic mb-10">Last Updated: January 26, 2026</p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        1. Virtual Currency
      </h2>
      <p className="mb-5">
        All purchases of virtual currency (Diamonds, Coins) are final and non-refundable. Please ensure you are certain
        before making a purchase.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        2. Subscriptions
      </h2>
      <p className="mb-5">
        If you have a subscription, you can cancel it at any time. Refunds for partial periods are generally not
        provided, subject to applicable laws.
      </p>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        3. Errors
      </h2>
      <p className="mb-5">
        If you believe you have been charged in error, please contact us immediately at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-500 hover:underline">{SUPPORT_EMAIL}</a>.
      </p>

      <div className="mt-16 pt-5 border-t border-gray-200 text-center space-x-6">
        <Link href="/" className="text-pink-500 hover:underline">Home</Link>
        <Link href="/privacy" className="text-pink-500 hover:underline">Privacy Policy</Link>
      </div>
    </div>
  );
}
