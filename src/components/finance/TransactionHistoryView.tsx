"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminCoinHistory, CoinHistoryEntry } from "@/lib/api";

export type TxView = "all" | "recharge" | "profit";

const titles: Record<TxView, { title: string; crumb: string; description: string; icon: string; iconCls: string }> = {
  all:      { title: "Transaction History", crumb: "Transaction History", description: "All coin transactions across the platform.",                           icon: "ri-exchange-line",       iconCls: "text-primary" },
  recharge: { title: "Recharge History",    crumb: "Recharge History",    description: "Coins delivered to end users (recharges).",                            icon: "ri-bank-card-line",      iconCls: "text-success" },
  profit:   { title: "Recharge Profit",     crumb: "Recharge Profit",     description: "Profit summary derived from recharge transactions, grouped by sender.", icon: "ri-line-chart-line",     iconCls: "text-warning-emphasis" },
};

const formatAmount = (n: number) => n.toLocaleString();
const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return "—"; }
};

const roleBadgeCls = (role?: string) => {
  const r = (role ?? "").toLowerCase();
  if (r === "admin") return "bg-danger";
  if (r === "merchant") return "bg-success";
  if (r === "reseller" || r === "re-seller") return "bg-info text-dark";
  if (r === "agency") return "bg-primary";
  if (r === "user") return "bg-secondary";
  if (r === "host") return "bg-purple";
  return "bg-secondary";
};

export default function TransactionHistoryView({ view }: { view: TxView }) {
  const meta = titles[view];
  const [entries, setEntries] = useState<CoinHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setPageError("");
    try {
      const resp = await getAdminCoinHistory({ page: "1", limit: "200" });
      setEntries(resp.data ?? []);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (view === "recharge") {
      // Recharges = anything that lands in an end user's wallet.
      list = list.filter((e) => (e.receiverRole ?? "").toLowerCase() === "user");
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) =>
      (e.senderName ?? "").toLowerCase().includes(q) ||
      (e.receiverName ?? "").toLowerCase().includes(q) ||
      String(e.senderUserId ?? "").includes(q) ||
      String(e.receiverUserId ?? "").includes(q) ||
      String(e.amount ?? "").includes(q)
    );
  }, [entries, view, searchQuery]);

  const totals = useMemo(() => {
    const sum = filteredEntries.reduce((acc, e) => acc + (e.amount ?? 0), 0);
    return { count: filteredEntries.length, sum };
  }, [filteredEntries]);

  // For "profit" view we group recharges by sender (the upstream merchant/reseller).
  const profitGroups = useMemo(() => {
    if (view !== "profit") return [];
    const recharges = entries.filter((e) => (e.receiverRole ?? "").toLowerCase() === "user");
    const map = new Map<string, { senderId: string; senderRole: string; senderName?: string; total: number; count: number }>();
    recharges.forEach((e) => {
      const key = e.senderId ?? "unknown";
      const existing = map.get(key) ?? {
        senderId: key,
        senderRole: e.senderRole,
        senderName: e.senderName,
        total: 0,
        count: 0,
      };
      existing.total += e.amount ?? 0;
      existing.count += 1;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [entries, view]);

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">{view === "profit" ? "Revenue" : "Finance"}</li>
                <li className="breadcrumb-item active">{meta.crumb}</li>
              </ol>
            </div>
            <h4 className="page-title">{meta.title}</h4>
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4">
          <div className="card mb-0">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className={`rounded ${meta.iconCls} bg-opacity-10 d-flex align-items-center justify-content-center`}
                style={{ width: 48, height: 48, background: "rgba(0,0,0,0.04)" }}
              >
                <i className={`${meta.icon} fs-3 ${meta.iconCls}`}></i>
              </div>
              <div>
                <div className="text-muted fs-13">Records</div>
                <div className="fs-3 fw-bold">{totals.count.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card mb-0">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="rounded text-warning-emphasis d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48, background: "rgba(255,193,7,0.15)" }}
              >
                <i className="ri-copper-coin-line fs-3"></i>
              </div>
              <div>
                <div className="text-muted fs-13">Total Coins</div>
                <div className="fs-3 fw-bold">{formatAmount(totals.sum)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card mb-0">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="rounded text-info d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48, background: "rgba(13,202,240,0.15)" }}
              >
                <i className="ri-information-line fs-3"></i>
              </div>
              <div>
                <div className="text-muted fs-13">Scope</div>
                <div className="fw-medium fs-13">{meta.description}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <div className="input-group">
            <span className="input-group-text"><i className="ri-search-line"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search sender, receiver or amount…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="btn btn-outline-secondary" onClick={() => setSearchQuery("")}>
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {pageError && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>{pageError}
          <button className="btn-close ms-auto" onClick={() => setPageError("")} />
        </div>
      )}

      {/* Profit aggregation table */}
      {view === "profit" && (
        <div className="card mb-3">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="header-title mb-0">
              <i className="ri-pie-chart-line me-2 text-warning-emphasis"></i>
              Profit by Sender
            </h4>
            <button className="btn btn-sm btn-outline-secondary" onClick={fetchData} disabled={loading}>
              <i className={`ri-refresh-line${loading ? " spin-anim" : ""}`}></i>
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : profitGroups.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="ri-pie-chart-line fs-1 d-block mb-2"></i>
                No recharge profit recorded yet
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-nowrap mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Sender</th>
                      <th>Role</th>
                      <th>Recharges</th>
                      <th>Total Coins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitGroups.map((g) => (
                      <tr key={g.senderId}>
                        <td>
                          <div className="fw-medium">{g.senderName ?? "—"}</div>
                          <div className="text-muted fs-12">ID: {g.senderId.slice(-10)}</div>
                        </td>
                        <td>
                          <span className={`badge ${roleBadgeCls(g.senderRole)} text-capitalize`}>
                            {g.senderRole}
                          </span>
                        </td>
                        <td>{g.count.toLocaleString()}</td>
                        <td className="fw-bold">
                          <i className="ri-copper-coin-line text-warning me-1"></i>
                          {formatAmount(g.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed entries table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className={`${meta.icon} me-2 ${meta.iconCls}`}></i>
            {view === "profit" ? "Underlying Transactions" : meta.title}{" "}
            <span className="badge bg-secondary ms-1">{filteredEntries.length}</span>
          </h4>
          {view !== "profit" && (
            <button className="btn btn-sm btn-outline-secondary" onClick={fetchData} disabled={loading}>
              <i className={`ri-refresh-line${loading ? " spin-anim" : ""}`}></i>
            </button>
          )}
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className={`${meta.icon} fs-1 d-block mb-2`}></i>
              No transactions to show
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-nowrap mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>When</th>
                    <th>Sender</th>
                    <th>→</th>
                    <th>Receiver</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((e) => (
                    <tr key={e._id}>
                      <td className="fs-13 text-muted">{formatDate(e.createdAt)}</td>
                      <td>
                        <div className="fs-13">{e.senderName ?? "—"}</div>
                        <span className={`badge ${roleBadgeCls(e.senderRole)} text-capitalize fs-11`}>
                          {e.senderRole}
                        </span>
                      </td>
                      <td className="text-muted"><i className="ri-arrow-right-line"></i></td>
                      <td>
                        <div className="fs-13">{e.receiverName ?? "—"}</div>
                        <span className={`badge ${roleBadgeCls(e.receiverRole)} text-capitalize fs-11`}>
                          {e.receiverRole}
                        </span>
                      </td>
                      <td className="text-end fw-bold">
                        <i className="ri-copper-coin-line text-warning me-1"></i>
                        {formatAmount(e.amount ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
