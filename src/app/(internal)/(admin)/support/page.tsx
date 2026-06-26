import { PROJECT_NAME } from "@/lib/constants";
export const metadata = {
  title: `Support | ${PROJECT_NAME}`,
};

const faqs = [
  {
    q: 'How do I create a voice room?',
    a: 'From your dashboard, click "New Room" in the top navigation or use the quick-create button on the Rooms page. Set a name, choose public or private, and hit Create.',
  },
  {
    q: 'Can I record a voice room session?',
    a: 'Yes — room hosts with a Pro or Team plan can enable recording from the Room Settings panel. Recordings are stored in your media library for 30 days.',
  },
  {
    q: 'How many people can join a single room?',
    a: 'Free rooms support up to 25 listeners. Pro rooms support up to 500 listeners, and Enterprise plans unlock unlimited concurrent listeners.',
  },
  {
    q: 'How do I invite users to my community?',
    a: 'Navigate to Settings → Community → Invite Links. Generate a shareable link or send email invitations directly from the admin panel.',
  },
  {
    q: 'What browsers / devices are supported?',
    a: `${PROJECT_NAME} works on all modern browsers (Chrome, Firefox, Safari, Edge) on desktop and mobile. Native iOS and Android apps are coming soon.`,
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login page, click "Forgot Password" and enter your registered email. You\'ll receive a reset link within a few minutes.',
  },
];

export default function SupportPage() {
  return (
    <div className="container-fluid">
      {/* Page Title */}
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item">
                  <a href="/dashboard">{PROJECT_NAME}</a>
                </li>
                <li className="breadcrumb-item active">Support</li>
              </ol>
            </div>
            <h4 className="page-title">Support Center</h4>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-md-4">
          <div className="card text-center h-100">
            <div className="card-body p-4">
              <div className="avatar-md bg-primary bg-opacity-10 rounded mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: 56, height: 56 }}>
                <i className="ri-book-open-line text-primary fs-2"></i>
              </div>
              <h5>Documentation</h5>
              <p className="text-muted small">Step-by-step guides and API references for every feature.</p>
              <a href="#" className="btn btn-outline-primary btn-sm">Browse Docs</a>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-center h-100">
            <div className="card-body p-4">
              <div className="avatar-md bg-success bg-opacity-10 rounded mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: 56, height: 56 }}>
                <i className="ri-customer-service-2-line text-success fs-2"></i>
              </div>
              <h5>Live Chat</h5>
              <p className="text-muted small">Talk to our support team in real-time — available 9 AM – 6 PM UTC.</p>
              <a href="#" className="btn btn-outline-success btn-sm">Start Chat</a>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-center h-100">
            <div className="card-body p-4">
              <div className="avatar-md bg-warning bg-opacity-10 rounded mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: 56, height: 56 }}>
                <i className="ri-github-fill text-warning fs-2"></i>
              </div>
              <h5>GitHub Issues</h5>
              <p className="text-muted small">Found a bug or have a feature request? Open an issue on GitHub.</p>
              <a href="https://github.com/zamansheikh" target="_blank" rel="noopener noreferrer" className="btn btn-outline-warning btn-sm">
                Open Issue
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="row mt-2">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Frequently Asked Questions</h5>
            </div>
            <div className="card-body">
              <div className="accordion" id="faqAccordion">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="accordion-item border-bottom">
                    <h2 className="accordion-header" id={`faq-heading-${idx}`}>
                      <button
                        className={`accordion-button ${idx !== 0 ? 'collapsed' : ''} fw-semibold`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#faq-collapse-${idx}`}
                        aria-expanded={idx === 0 ? 'true' : 'false'}
                        aria-controls={`faq-collapse-${idx}`}
                      >
                        {faq.q}
                      </button>
                    </h2>
                    <div
                      id={`faq-collapse-${idx}`}
                      className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}
                      aria-labelledby={`faq-heading-${idx}`}
                      data-bs-parent="#faqAccordion"
                    >
                      <div className="accordion-body text-muted">{faq.a}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit a Ticket CTA */}
      <div className="row mt-2">
        <div className="col-12">
          <div className="card bg-primary text-white border-0">
            <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3 py-4 px-4">
              <div>
                <h5 className="text-white mb-1">Still need help?</h5>
                <p className="mb-0 opacity-75">Submit a ticket and our team will get back to you within 24 hours.</p>
              </div>
              <a href="/contact" className="btn btn-light fw-semibold">Submit a Ticket</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
