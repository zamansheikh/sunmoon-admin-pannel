"use client";

import { FormEvent, useState } from "react";
import AgoraSubnav from "./AgoraSubnav";

interface TokenResult {
  success: boolean;
  token?: string;
  channelName?: string;
  uid?: string | number;
  expireAt?: string;
  error?: string;
}

function ResultBox({ label, result }: { label: string; result: TokenResult | null }) {
  if (!result) return null;
  if (!result.success) {
    return <div className="alert alert-danger mt-3 fs-13">{result.error || "Failed"}</div>;
  }
  return (
    <div className="alert alert-success mt-3 fs-13">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong>{label} generated</strong>
        <button
          type="button"
          className="btn btn-sm btn-outline-success"
          onClick={() => result.token && navigator.clipboard.writeText(result.token)}
        >
          <i className="ri-file-copy-line me-1"></i> Copy
        </button>
      </div>
      <div className="font-monospace text-break" style={{ wordBreak: "break-all" }}>
        {result.token}
      </div>
      <hr className="my-2" />
      <div className="row fs-12 text-muted">
        {result.channelName && (
          <div className="col-md-4">
            <strong>Channel:</strong> {result.channelName}
          </div>
        )}
        {result.uid !== undefined && (
          <div className="col-md-4">
            <strong>UID:</strong> {String(result.uid)}
          </div>
        )}
        {result.expireAt && (
          <div className="col-md-4">
            <strong>Expires:</strong> {new Date(result.expireAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgoraTester() {
  const [rtcChannel, setRtcChannel] = useState("");
  const [rtmUid, setRtmUid] = useState("");
  const [rtcLoading, setRtcLoading] = useState(false);
  const [rtmLoading, setRtmLoading] = useState(false);
  const [rtcResult, setRtcResult] = useState<TokenResult | null>(null);
  const [rtmResult, setRtmResult] = useState<TokenResult | null>(null);

  const fetchToken = async (url: string): Promise<TokenResult> => {
    const r = await fetch(url);
    return r.json();
  };

  const handleRtc = async (e: FormEvent) => {
    e.preventDefault();
    setRtcLoading(true);
    setRtcResult(null);
    const url = rtcChannel
      ? `/api/agora/token/rtc?channelName=${encodeURIComponent(rtcChannel)}`
      : "/api/agora/token/rtc";
    try {
      setRtcResult(await fetchToken(url));
    } catch {
      setRtcResult({ success: false, error: "Connection error" });
    } finally {
      setRtcLoading(false);
    }
  };

  const handleRtm = async (e: FormEvent) => {
    e.preventDefault();
    setRtmLoading(true);
    setRtmResult(null);
    const url = rtmUid
      ? `/api/agora/token/rtm?uid=${encodeURIComponent(rtmUid)}`
      : "/api/agora/token/rtm";
    try {
      setRtmResult(await fetchToken(url));
    } catch {
      setRtmResult({ success: false, error: "Connection error" });
    } finally {
      setRtmLoading(false);
    }
  };

  return (
    <>
      <AgoraSubnav />

      <div className="row mb-3">
        <div className="col-12">
          <h4 className="mb-1">Token Tester</h4>
          <p className="text-muted fs-13">
            Hits the public token endpoints — same calls your apps make. Leave fields blank to use the configured defaults.
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">
                <i className="ri-vidicon-line text-danger me-2"></i>RTC Token
              </h5>
              <form onSubmit={handleRtc}>
                <div className="mb-3">
                  <label className="form-label">Channel Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Leave empty for default"
                    value={rtcChannel}
                    onChange={(e) => setRtcChannel(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-danger w-100" disabled={rtcLoading}>
                  {rtcLoading ? "Generating…" : "Generate RTC Token"}
                </button>
              </form>
              <ResultBox label="RTC token" result={rtcResult} />
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">
                <i className="ri-message-3-line text-info me-2"></i>RTM Token
              </h5>
              <form onSubmit={handleRtm}>
                <div className="mb-3">
                  <label className="form-label">User ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Leave empty for default"
                    value={rtmUid}
                    onChange={(e) => setRtmUid(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-info w-100 text-white" disabled={rtmLoading}>
                  {rtmLoading ? "Generating…" : "Generate RTM Token"}
                </button>
              </form>
              <ResultBox label="RTM token" result={rtmResult} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
