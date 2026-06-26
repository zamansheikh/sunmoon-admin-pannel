import { PROJECT_NAME, SUPPORT_EMAIL } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Delete Account - ${PROJECT_NAME}`,
  description: `How to delete your ${PROJECT_NAME} account and all associated data.`,
};

export default function DeleteAccountPage() {
  return (
    <div className="max-w-xl mx-auto px-5 py-16">
      <div className="border border-gray-200 rounded-xl p-10 shadow-lg bg-white">
        <h1 className="text-3xl font-bold text-red-600 mb-5">Delete Account</h1>
        <p className="mb-5 text-gray-700">
          We are sorry to see you go. If you wish to delete your {PROJECT_NAME} account and all associated data, you can do
          so directly through the mobile application.
        </p>

        <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-3">How to delete your account:</h3>
        <div className="bg-gray-50 p-5 rounded-lg mb-8">
          <ol className="list-decimal ml-5 space-y-2 text-gray-700 font-medium">
            <li>Open the <strong>{PROJECT_NAME}</strong> app on your device.</li>
            <li>Go to the <strong>Profile</strong> tab.</li>
            <li>Tap on the <strong>Settings</strong> icon (gear icon).</li>
            <li>Scroll down to the bottom and verify your identity if needed.</li>
            <li>Tap on <strong>Delete Account</strong>.</li>
            <li>Type &quot;DELETE&quot; to confirm the action.</li>
          </ol>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-3">What happens when you delete your account?</h3>
        <ul className="list-disc pl-5 mb-5 space-y-2 text-gray-700">
          <li>Your profile, photos, and personal information will be permanently removed.</li>
          <li>Your chat history and messages will be deleted.</li>
          <li>Any virtual currency (Coins/Diamonds) will be forfeited.</li>
          <li>This action is irreversible.</li>
        </ul>

        <p className="text-gray-600 mt-6">
          If you have trouble accessing the app, please contact our support team at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-500 font-semibold hover:underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          for assistance with manual deletion.
        </p>
      </div>

      <div className="mt-10 text-center space-x-4">
        <Link href="/" className="text-gray-500 hover:underline text-sm">Home</Link>
        <Link href="/privacy" className="text-gray-500 hover:underline text-sm">Privacy Policy</Link>
      </div>
    </div>
  );
}
