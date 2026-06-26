"use client";

/**
 * Reusable SVGA preview modal used on store / SVIP / VIP management pages.
 * Lazy-loads svgaplayerweb from a CDN the first time the modal opens, so
 * the admin panel doesn't need a hard npm dependency or build step for it.
 *
 * Each entry can have an svgaUrl, a previewUrl, or both. The left sidebar
 * lists every entry and the right stage plays the active one's SVGA. If
 * an entry has only a previewUrl (no SVGA), the stage shows the preview
 * image instead.
 */

import { useEffect, useRef, useState } from "react";
import type { StoreItem } from "@/lib/api";

export interface SvgaPreviewEntry {
  /** Short human label rendered in the sidebar (e.g. "frame", "entry"). */
  label: string;
  /** Absolute URL to the .svga file. Optional — entries without one fall
   *  back to showing [previewUrl] as a static image. */
  svgaUrl?: string;
  /** Absolute URL to a preview thumbnail image (PNG/JPG). */
  previewUrl?: string;
}

/**
 * Maps a [StoreItem] into the list of preview entries the modal renders.
 * Bundle items (SVIP / VIP) expand into one entry per bundle file; single
 * items collapse to one entry from their top-level svgaFile / previewFile.
 * Used by store / SVIP / VIP management pages so they don't each
 * reimplement the same mapping.
 */
export function buildSvgaPreviewEntries(item: StoreItem): SvgaPreviewEntry[] {
  if (item.bundleFiles && item.bundleFiles.length > 0) {
    return item.bundleFiles.map((b) => ({
      label: b.categoryName,
      svgaUrl: b.svgaFile || undefined,
      previewUrl: b.previewFile || undefined,
    }));
  }
  if (item.svgaFile || item.previewFile) {
    return [
      {
        label: item.name,
        svgaUrl: item.svgaFile || undefined,
        previewUrl: item.previewFile || undefined,
      },
    ];
  }
  return [];
}

export interface SvgaPreviewModalProps {
  open: boolean;
  title: string;
  entries: SvgaPreviewEntry[];
  onClose: () => void;
}

// ── SVGA runtime loader (CDN, no npm dep) ───────────────────────────

interface SvgaParser {
  load: (
    url: string,
    success: (movie: unknown) => void,
    failure: (err: unknown) => void
  ) => void;
}

interface SvgaPlayer {
  setVideoItem: (movie: unknown) => void;
  startAnimation: () => void;
  stopAnimation: () => void;
  clear: () => void;
  setContentMode?: (mode: string) => void;
}

interface SvgaGlobal {
  Parser: new () => SvgaParser;
  Player: new (target: HTMLDivElement) => SvgaPlayer;
}

declare global {
  interface Window {
    SVGA?: SvgaGlobal;
  }
}

const SVGA_CDN_URL =
  "https://cdn.jsdelivr.net/npm/svgaplayerweb@2.3.1/build/svga.min.js";

let svgaScriptPromise: Promise<void> | null = null;

function loadSvgaScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.SVGA) return Promise.resolve();
  if (svgaScriptPromise) return svgaScriptPromise;
  svgaScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SVGA_CDN_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      svgaScriptPromise = null; // allow retry on next open
      reject(new Error("Failed to load SVGA player from CDN"));
    };
    document.body.appendChild(script);
  });
  return svgaScriptPromise;
}

// ── Component ───────────────────────────────────────────────────────

export default function SvgaPreviewModal({
  open,
  title,
  entries,
  onClose,
}: SvgaPreviewModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<SvgaPlayer | null>(null);

  // Reset index whenever the modal is reopened or the entry list changes.
  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open, entries]);

  // Load + play whenever the active entry changes (and the modal is open).
  useEffect(() => {
    if (!open) return;
    const entry = entries[activeIndex];
    if (!entry?.svgaUrl) {
      setStatus("idle");
      setErrorMsg(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setErrorMsg(null);

    (async () => {
      try {
        await loadSvgaScript();
        if (cancelled) return;
        const stage = stageRef.current;
        if (!stage || !window.SVGA) return;

        // Tear down any existing player before mounting a new one.
        disposePlayer(playerRef.current);
        playerRef.current = null;
        while (stage.firstChild) stage.removeChild(stage.firstChild);

        const player = new window.SVGA.Player(stage);
        playerRef.current = player;
        player.setContentMode?.("AspectFit");

        const parser = new window.SVGA.Parser();
        parser.load(
          entry.svgaUrl!,
          (movie) => {
            if (cancelled) return;
            try {
              player.setVideoItem(movie);
              player.startAnimation();
              setStatus("ready");
            } catch (err) {
              setErrorMsg(
                err instanceof Error ? err.message : "Failed to start animation"
              );
              setStatus("error");
            }
          },
          (err) => {
            if (cancelled) return;
            console.error("SVGA load error", err);
            setErrorMsg(
              "Failed to load SVGA. Showing preview image if available."
            );
            setStatus("error");
          }
        );
      } catch (err: unknown) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, activeIndex, entries]);

  // Stop + clear the player when the modal closes so the SVGA stops looping
  // in the background.
  useEffect(() => {
    if (open) return;
    disposePlayer(playerRef.current);
    playerRef.current = null;
  }, [open]);

  if (!open) return null;
  const activeEntry = entries[activeIndex];

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        // Stack above any other Bootstrap modal (default 1055), so the
        // preview is visible when triggered from inside an upload form
        // that already has a modal open.
        zIndex: 2000,
      }}
      onClick={(e) => {
        // Click on the backdrop closes the modal.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ri-image-line me-2"></i>
              {title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {entries.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i
                  className="ri-image-line d-block mb-2"
                  style={{ fontSize: 36 }}
                />
                No assets to preview.
              </div>
            ) : (
              <div className="row g-3">
                {/* Sidebar: one entry per bundle file */}
                <div className="col-md-4">
                  <div className="list-group" style={{ maxHeight: 400, overflowY: "auto" }}>
                    {entries.map((entry, i) => (
                      <button
                        key={`${entry.label}-${i}`}
                        type="button"
                        onClick={() => setActiveIndex(i)}
                        className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${
                          i === activeIndex ? "active" : ""
                        }`}
                      >
                        {entry.previewUrl ? (
                          <img
                            src={entry.previewUrl}
                            alt={entry.label}
                            style={{
                              width: 32,
                              height: 32,
                              objectFit: "cover",
                              borderRadius: 4,
                              flexShrink: 0,
                              background: "#fff",
                            }}
                          />
                        ) : (
                          <span
                            className="d-inline-flex align-items-center justify-content-center"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              background: "rgba(0,0,0,0.08)",
                              flexShrink: 0,
                            }}
                          >
                            <i className="ri-file-line" />
                          </span>
                        )}
                        <span className="text-truncate" title={entry.label}>
                          {entry.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stage: plays the active SVGA, falls back to preview image */}
                <div className="col-md-8">
                  <div
                    style={{
                      width: "100%",
                      height: 360,
                      borderRadius: 12,
                      // Subtle checker pattern so transparent SVGA assets are
                      // visible.
                      background:
                        "repeating-conic-gradient(#f4f4f4 0 25%, #e9e9e9 0 50%) 0/24px 24px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      ref={stageRef}
                      style={{ position: "absolute", inset: 0 }}
                    />
                    {/* No-SVGA fallback: just show preview image */}
                    {!activeEntry?.svgaUrl && activeEntry?.previewUrl && (
                      <img
                        src={activeEntry.previewUrl}
                        alt={activeEntry.label}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    )}
                    {/* Loading spinner */}
                    {status === "loading" && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        />
                      </div>
                    )}
                    {/* Error fallback: show preview if available */}
                    {status === "error" && activeEntry?.previewUrl && (
                      <img
                        src={activeEntry.previewUrl}
                        alt="preview fallback"
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </div>

                  {activeEntry && (
                    <div className="mt-2 small text-muted">
                      <strong>{activeEntry.label}</strong>
                      {activeEntry.svgaUrl && (
                        <>
                          {" · "}
                          <a
                            href={activeEntry.svgaUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open SVGA
                          </a>
                        </>
                      )}
                      {activeEntry.previewUrl && (
                        <>
                          {" · "}
                          <a
                            href={activeEntry.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open preview
                          </a>
                        </>
                      )}
                    </div>
                  )}

                  {errorMsg && status === "error" && (
                    <div className="alert alert-warning py-2 mt-2 mb-0 small">
                      <i className="ri-error-warning-line me-1" />
                      {errorMsg}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function disposePlayer(player: SvgaPlayer | null) {
  if (!player) return;
  try {
    player.stopAnimation();
    player.clear();
  } catch {
    // Player may already be torn down — safe to ignore.
  }
}

// ── Upload preview hook ─────────────────────────────────────────────

/** One asset to preview while it's still a local File pending upload.
 *  Either provide a [svgaFile] / [previewFile] (newly selected by the
 *  admin), or fall back to existing remote URLs (edit mode). */
export interface UploadPreviewItem {
  label: string;
  svgaFile?: File | null;
  previewFile?: File | null;
  svgaUrl?: string;
  previewUrl?: string;
}

interface UploadPreviewState {
  title: string;
  entries: SvgaPreviewEntry[];
  blobs: string[];
}

/**
 * Hook that wires the [SvgaPreviewModal] to local files chosen in an
 * upload form. Creates blob URLs from the [File]s on demand and revokes
 * them when the preview closes / the component unmounts, so there are
 * no leaked URLs.
 *
 * Usage:
 *   const preview = useUploadPreview();
 *   ...
 *   <button onClick={() => preview.open({
 *     title: 'New gift',
 *     items: [{ label: 'svga', svgaFile, previewFile }],
 *   })}>Preview</button>
 *   ...
 *   <SvgaPreviewModal {...preview.modalProps} />
 */
export function useUploadPreview() {
  const [state, setState] = useState<UploadPreviewState | null>(null);

  // Revoke any outstanding blobs when the host unmounts (covers the case
  // where the modal is open but the user navigates away).
  useEffect(() => {
    return () => {
      if (state) state.blobs.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (state) state.blobs.forEach((u) => URL.revokeObjectURL(u));
    setState(null);
  };

  const open = (params: { title: string; items: UploadPreviewItem[] }) => {
    // Revoke any previous batch first.
    if (state) state.blobs.forEach((u) => URL.revokeObjectURL(u));

    const blobs: string[] = [];
    const entries: SvgaPreviewEntry[] = params.items.map((item) => {
      const svgaUrl = item.svgaFile
        ? (() => {
            const url = URL.createObjectURL(item.svgaFile!);
            blobs.push(url);
            return url;
          })()
        : item.svgaUrl;
      const previewUrl = item.previewFile
        ? (() => {
            const url = URL.createObjectURL(item.previewFile!);
            blobs.push(url);
            return url;
          })()
        : item.previewUrl;
      return { label: item.label, svgaUrl, previewUrl };
    });
    setState({ title: params.title, entries, blobs });
  };

  return {
    open,
    close,
    modalProps: {
      open: state !== null,
      title: state?.title ?? "",
      entries: state?.entries ?? [],
      onClose: close,
    },
  };
}
