import { PROJECT_NAME, SUPPORT_EMAIL } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Contact Us - ${PROJECT_NAME}`,
  description: `Get in touch with the ${PROJECT_NAME} team for support or business inquiries.`,
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-10 text-gray-800 leading-relaxed">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>

      <p className="mb-8 text-gray-600">We&apos;d love to hear from you. Here&apos;s how you can reach us:</p>

      <div className="bg-white p-8 rounded-xl shadow-md space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">General Support</h3>
          <p className="text-gray-600">
            Email: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-500 hover:underline">{SUPPORT_EMAIL}</a>
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Business Inquiries</h3>
          <p className="text-gray-600">
            Email: <a href="mailto:business@addalive.com" className="text-pink-500 hover:underline">business@addalive.com</a>
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Address</h3>
          <p className="text-gray-600">
            {PROJECT_NAME} HQ<br />
            Dhaka, Bangladesh
          </p>
        </div>
      </div>

      <div className="mt-16 pt-5 border-t border-gray-200 text-center space-x-6">
        <Link href="/" className="text-pink-500 hover:underline">Home</Link>
        <Link href="/privacy" className="text-pink-500 hover:underline">Privacy Policy</Link>
      </div>
    </div>
  );
}
