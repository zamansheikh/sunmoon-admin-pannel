"use client";

import { useState } from "react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const INITIAL_FAQS: FaqItem[] = [
  { id: 1, question: "How do I create an account?", answer: "Download the AddaLive app, tap 'Sign Up', and follow the on-screen instructions to create your account using your phone number or social media account." },
  { id: 2, question: "What are coins and how do I get them?", answer: "Coins are the virtual currency used on AddaLive. You can purchase coins through the in-app store using your preferred payment method." },
  { id: 3, question: "How do I host a live audio room?", answer: "Tap the '+' button on the home screen, select 'Create Room', customize your room settings, and tap 'Go Live' to start your broadcast." },
  { id: 4, question: "How do I send a gift?", answer: "While in a live room, tap on the gift icon at the bottom of the screen, choose your gift, and select the recipient to send it." },
  { id: 5, question: "How do I report a user?", answer: "Tap on the user's profile, select the three-dot menu, and choose 'Report'. Select the reason and submit your report for review." },
];

let nextId = INITIAL_FAQS.length + 1;

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>(INITIAL_FAQS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (faq: FaqItem) => {
    setEditingId(faq.id);
    setEditQ(faq.question);
    setEditA(faq.answer);
    setAddMode(false);
  };

  const saveEdit = async () => {
    if (!editQ.trim() || !editA.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setFaqs((prev) => prev.map((f) => f.id === editingId ? { ...f, question: editQ.trim(), answer: editA.trim() } : f));
    setEditingId(null);
    setSaving(false);
  };

  const deleteFaq = (id: number) => {
    if (!confirm("Delete this FAQ item?")) return;
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const addFaq = async () => {
    if (!newQ.trim() || !newA.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setFaqs((prev) => [...prev, { id: nextId++, question: newQ.trim(), answer: newA.trim() }]);
    setNewQ("");
    setNewA("");
    setAddMode(false);
    setSaving(false);
  };

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">CMS</li>
                <li className="breadcrumb-item active">FAQ</li>
              </ol>
            </div>
            <h4 className="page-title">FAQ Management</h4>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-primary" onClick={() => { setAddMode(true); setEditingId(null); }}>
          <i className="ri-add-line me-1"></i>Add FAQ
        </button>
      </div>

      {/* Add Form */}
      {addMode && (
        <div className="card border border-primary mb-3">
          <div className="card-header bg-primary bg-opacity-10">
            <h5 className="mb-0 text-primary"><i className="ri-add-circle-line me-2"></i>New FAQ Item</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label fw-semibold">Question <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter question..."
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Answer <span className="text-danger">*</span></label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Enter answer..."
                value={newA}
                onChange={(e) => setNewA(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-outline-secondary" onClick={() => { setAddMode(false); setNewQ(""); setNewA(""); }}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={saving || !newQ.trim() || !newA.trim()} onClick={addFaq}>
                {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ri-check-line me-1"></i>}
                Add FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-question-answer-line me-2 text-primary"></i>
            FAQ Items <span className="badge bg-secondary ms-1">{faqs.length}</span>
          </h4>
        </div>
        <div className="card-body p-0">
          {faqs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-question-line fs-1 d-block mb-2"></i>
              No FAQ items yet.
              <div className="mt-2">
                <button className="btn btn-sm btn-outline-primary" onClick={() => setAddMode(true)}>
                  <i className="ri-add-line me-1"></i>Add First FAQ
                </button>
              </div>
            </div>
          ) : (
            <div className="accordion accordion-flush" id="faqAccordion">
              {faqs.map((faq, index) => (
                <div key={faq.id} className="accordion-item border-bottom">
                  {editingId === faq.id ? (
                    <div className="p-3">
                      <div className="mb-2">
                        <label className="form-label fw-semibold fs-13">Question</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editQ}
                          onChange={(e) => setEditQ(e.target.value)}
                        />
                      </div>
                      <div className="mb-2">
                        <label className="form-label fw-semibold fs-13">Answer</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={3}
                          value={editA}
                          onChange={(e) => setEditA(e.target.value)}
                        />
                      </div>
                      <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                        <button className="btn btn-sm btn-primary" disabled={saving} onClick={saveEdit}>
                          {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="accordion-header d-flex align-items-start gap-2 px-3 py-2">
                      <span className="badge bg-primary-subtle text-primary mt-1 flex-shrink-0">Q{index + 1}</span>
                      <div className="flex-grow-1">
                        <div className="fw-semibold fs-14">{faq.question}</div>
                        <div className="text-muted fs-13 mt-1">{faq.answer}</div>
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0 ms-2 mt-1">
                        <button className="btn btn-sm btn-soft-primary" title="Edit" onClick={() => startEdit(faq)}>
                          <i className="ri-edit-line"></i>
                        </button>
                        <button className="btn btn-sm btn-soft-danger" title="Delete" onClick={() => deleteFaq(faq.id)}>
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
