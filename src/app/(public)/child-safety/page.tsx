import { PROJECT_NAME, SUPPORT_EMAIL } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Child Safety Standards - ${PROJECT_NAME}`,
  description: `${PROJECT_NAME} child safety standards and child sexual abuse and exploitation (CSAE) prevention practices.`,
};

export default function ChildSafetyPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-10 text-gray-800 leading-relaxed">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Child Safety Standards</h1>
      <p className="text-gray-500 italic mb-10">Last Updated: March 5, 2026</p>

      <p className="mb-5">
        {PROJECT_NAME} is committed to protecting children and preventing child sexual abuse and exploitation (CSAE). This page
        outlines our child safety standards and the measures we have implemented to ensure a safe environment for all users.
      </p>

      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded my-5">
        <strong>18+ Only:</strong> {PROJECT_NAME} is <strong>strictly for users aged 18 and older</strong>. We do not permit
        anyone under 18 to create an account or use our platform. Users who misrepresent their age will have their
        accounts terminated immediately.
      </div>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        1. Age Verification & Enforcement
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Mandatory Age Gate:</strong> During registration, users are required to provide their date of birth. The app enforces an 18+ age requirement by restricting the date picker to ensure users cannot select a birth date that would make them under 18.</li>
        <li><strong>Secondary Validation:</strong> The app includes a secondary check during profile submission that verifies users are at least 18 years old. Any user attempting to register with a birth date indicating they are under 18 will be blocked and shown an error message.</li>
        <li><strong>Account Termination:</strong> If we discover that a user is under 18, their account will be terminated immediately, and all associated data will be deleted within 30 days.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        2. Content Moderation & User-Generated Content (UGC)
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Live Stream Monitoring:</strong> All live streams and audio rooms may be monitored in real-time for policy violations, including inappropriate or harmful content.</li>
        <li><strong>Recording for Safety:</strong> Live sessions may be recorded and retained for up to 90 days for safety review, compliance verification, and investigation of reports.</li>
        <li><strong>Content Restrictions:</strong> Users are strictly prohibited from broadcasting or sharing:
          <ul className="list-circle pl-5 mt-2 space-y-1 ml-4">
            <li>Nudity, sexually explicit material, or graphic violence</li>
            <li>Child exploitation material (CSAM)</li>
            <li>Hate speech, harassment, or abusive content</li>
            <li>Non-consensual intimate images</li>
            <li>Grooming or coercion of any person</li>
          </ul>
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        3. Reporting & Removal
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>In-App Reporting:</strong> During live streams and audio rooms, viewers can tap the report flag icon to report inappropriate content or user behavior. A modal appears with reasons for the report (Inappropriate content, Harassment, Spam, Violence, Hate speech, Other).</li>
        <li><strong>Rapid Response:</strong> Reports are reviewed by our trust and safety team within 24 hours. Confirmed violations result in immediate account suspension and content removal.</li>
        <li><strong>Law Enforcement Cooperation:</strong> If we suspect a report involves CSAM or child exploitation, we will:
          <ul className="list-circle pl-5 mt-2 space-y-1 ml-4">
            <li>Immediately remove the content</li>
            <li>Terminate the account</li>
            <li>Report the incident to the National Center for Missing &amp; Exploited Children (NCMEC) via CyberTipline</li>
            <li>Cooperate fully with law enforcement investigations</li>
          </ul>
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        4. Privacy & Data Protection
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Minimal Data Collection:</strong> We collect only the minimum personal data needed to operate the service and verify age.</li>
        <li><strong>No Tracking of Minors:</strong> If a minor is identified using the platform, their account, sessions, and personal data are deleted immediately.</li>
        <li><strong>Encryption:</strong> All data is encrypted in transit using TLS/HTTPS. User communications are not accessible to third parties.</li>
        <li><strong>Parental Access:</strong> If the account belongs to a minor, parents/guardians may contact us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-600 hover:underline">{SUPPORT_EMAIL}</a> to request account deletion and data removal.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        5. Community Guidelines
      </h2>
      <p className="mb-3">All users agree to our Terms of Service and Community Guidelines, which explicitly prohibit:</p>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li>Sexual exploitation or abuse of any person</li>
        <li>Non-consensual intimate imagery</li>
        <li>Grooming, manipulation, or coercion</li>
        <li>Solicitation or advertising of illegal services</li>
        <li>Harassment, bullying, or threats</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        6. Report Child Sexual Abuse and Exploitation (CSAE)
      </h2>
      <p className="mb-5">
        If you encounter child sexual abuse material (CSAM), child grooming, exploitation, or any other child safety concern
        on {PROJECT_NAME}, please report it immediately to:
      </p>
      <div className="bg-gray-50 p-5 rounded-lg mb-5 border-l-4 border-red-500">
        <p className="mb-3"><strong>National Center for Missing &amp; Exploited Children (NCMEC)</strong></p>
        <p className="mb-2"><strong>CyberTipline:</strong> <a href="https://www.cybertipline.org" target="_blank" rel="noopener" className="text-pink-600 hover:underline">https://www.cybertipline.org</a></p>
        <p className="mb-2"><strong>Email:</strong> <a href="mailto:CyberTipline@ncmec.org" className="text-pink-600 hover:underline">CyberTipline@ncmec.org</a></p>
        <p><strong>Phone:</strong> 1-800-THE-LOST (1-800-843-5678)</p>
      </div>

      <p className="mb-5">You may also report directly to {PROJECT_NAME} at:</p>
      <div className="bg-gray-50 p-5 rounded-lg mb-5">
        <p className="mb-2"><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-600 hover:underline">{SUPPORT_EMAIL}</a></p>
        <p><strong>Subject Line:</strong> CSAE Report / Child Safety Concern</p>
      </div>

      <p className="mb-5 text-sm text-gray-600">
        <strong>Important:</strong> Reports of CSAE are confidential and will be treated with the highest priority. Provide as
        much detail as possible, including:
      </p>
      <ul className="list-disc pl-5 mb-5 space-y-1 text-sm">
        <li>Username(s) of accounts involved</li>
        <li>Stream/room ID or content timestamp</li>
        <li>Screenshots or recording (if applicable)</li>
        <li>Description of the violation</li>
        <li>Your contact information (optional but helpful for follow-up)</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        7. Staff Training & Accountability
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><strong>Training:</strong> All trust and safety personnel receive regular training on identifying and responding to CSAE.</li>
        <li><strong>Accountability:</strong> We maintain internal processes to ensure proper handling of reports and escalation of serious matters to law enforcement.</li>
        <li><strong>Transparency:</strong> We publish transparency reports regarding the number of CSAE reports received and actions taken.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        8. Contact Information for CSAE Concerns
      </h2>
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-5">
        <p className="mb-4"><strong>CSAE Point of Contact (Child Safety Officer):</strong></p>
        <p className="mb-1"><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-600 hover:underline">{SUPPORT_EMAIL}</a></p>
        <p className="mb-4 text-sm text-gray-600">Include &quot;CSAE Report&quot; in the subject line for priority routing.</p>

        <p className="mb-4"><strong>General Support:</strong></p>
        <p><a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-600 hover:underline">{SUPPORT_EMAIL}</a></p>
      </div>

      <h2 className="text-2xl font-semibold text-gray-700 mt-10 mb-4 border-b-2 border-gray-200 pb-2">
        9. Resources for Help
      </h2>
      <ul className="list-disc pl-5 mb-5 space-y-1">
        <li><a href="https://www.ncmec.org" target="_blank" rel="noopener" className="text-pink-600 hover:underline">National Center for Missing &amp; Exploited Children (NCMEC)</a> — Resources for families and children</li>
        <li><a href="https://www.thorn.org" target="_blank" rel="noopener" className="text-pink-600 hover:underline">Thorn</a> — Technology to defend children from CSAM</li>
        <li><a href="https://www.iwf.org.uk" target="_blank" rel="noopener" className="text-pink-600 hover:underline">Internet Watch Foundation (IWF)</a> — Global CSAM reporting</li>
      </ul>

      <div className="mt-16 pt-5 border-t border-gray-200 text-center space-x-6">
        <Link href="/" className="text-pink-500 hover:underline">Home</Link>
        <Link href="/privacy" className="text-pink-500 hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="text-pink-500 hover:underline">Terms of Service</Link>
        <Link href="/contact" className="text-pink-500 hover:underline">Contact Us</Link>
      </div>
    </div>
  );
}
