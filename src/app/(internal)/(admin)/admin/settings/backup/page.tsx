"use client";

import { useState } from "react";

interface BackupRecord {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  type: "manual" | "auto";
}

const MOCK_BACKUPS: BackupRecord[] = [
  { id: "b1", name: "backup_2026-03-06_02-00.zip", size: "245 MB", createdAt: "2026-03-06 02:00 AM", type: "auto" },
  { id: "b2", name: "backup_2026-03-05_02-00.zip", size: "243 MB", createdAt: "2026-03-05 02:00 AM", type: "auto" },
  { id: "b3", name: "manual_backup_2026-03-04.zip", size: "241 MB", createdAt: "2026-03-04 04:15 PM", type: "manual" },
  { id: "b4", name: "backup_2026-03-04_02-00.zip", size: "238 MB", createdAt: "2026-03-04 02:00 AM", type: "auto" },
  { id: "b5", name: "backup_2026-03-03_02-00.zip", size: "235 MB", createdAt: "2026-03-03 02:00 AM", type: "auto" },
];

export default function BackupRestorePage() {
  const [backups, setBackups] = useState<BackupRecord[]>(MOCK_BACKUPS);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [autoBackup, setAutoBackup] = useState(true);
  const [autoTime, setAutoTime] = useState("02:00");
  const [retentionDays, setRetentionDays] = useState("7");

  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const now = new Date();
      const name = `manual_backup_${now.toISOString().slice(0, 10)}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}.zip`;
      const newBackup: BackupRecord = {
        id: `b${Date.now()}`,
        name,
        size: "246 MB",
        createdAt: now.toLocaleString(),
        type: "manual",
      };
      setBackups((prev) => [newBackup, ...prev]);
    } finally {
      setCreatingBackup(false);
    }
  };

  const deleteBackup = async (id: string) => {
    if (!confirm("Delete this backup? This cannot be undone.")) return;
    setDeleting(id);
    await new Promise((r) => setTimeout(r, 600));
    setBackups((prev) => prev.filter((b) => b.id !== id));
    setDeleting(null);
  };

  const restoreBackup = async (id: string) => {
    if (!confirm("Restore from this backup? This will overwrite all current data. This action cannot be undone.")) return;
    setRestoring(id);
    await new Promise((r) => setTimeout(r, 2500));
    setRestoring(null);
    alert("Restore completed successfully. Please restart the server.");
  };

  const downloadBackup = async (id: string) => {
    setDownloading(id);
    await new Promise((r) => setTimeout(r, 800));
    setDownloading(null);
    // In real implementation, this triggers a file download
  };

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">System Settings</li>
                <li className="breadcrumb-item active">Backup & Restore</li>
              </ol>
            </div>
            <h4 className="page-title">Backup & Restore</h4>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">

        {/* Create Backup */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-save-3-line me-2 text-primary"></i>Create Backup
              </h4>
            </div>
            <div className="card-body d-flex flex-column justify-content-between">
              <p className="text-muted fs-14">
                Create a full database backup including all users, rooms, gifts, transactions, and settings.
                The backup will be stored on the server and can be downloaded.
              </p>
              <div>
                <button
                  className="btn btn-primary w-100"
                  disabled={creatingBackup}
                  onClick={createBackup}
                >
                  {creatingBackup ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Creating Backup…</>
                  ) : (
                    <><i className="ri-database-2-line me-1"></i>Create Manual Backup</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Backup Settings */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title mb-0">
                <i className="ri-time-line me-2 text-primary"></i>Automatic Backup
              </h4>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={autoBackup}
                  onChange={(e) => setAutoBackup(e.target.checked)}
                />
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label fs-13">Daily Backup Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={autoTime}
                    onChange={(e) => setAutoTime(e.target.value)}
                    disabled={!autoBackup}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fs-13">Keep Last (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    min="1"
                    max="90"
                    disabled={!autoBackup}
                  />
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-outline-primary btn-sm">
                  <i className="ri-save-line me-1"></i>Save Auto Backup Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backup List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-archive-line me-2 text-primary"></i>
            Backup History
            <span className="badge bg-secondary ms-1">{backups.length}</span>
          </h4>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-centered mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-3">Backup Name</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Created At</th>
                  <th className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="ps-3">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-file-zip-line text-warning fs-18"></i>
                        <span className="fs-13 font-monospace">{backup.name}</span>
                      </div>
                    </td>
                    <td className="text-muted fs-13">{backup.size}</td>
                    <td>
                      <span className={`badge ${backup.type === "manual" ? "bg-primary-subtle text-primary" : "bg-secondary-subtle text-secondary"}`}>
                        {backup.type === "manual" ? "Manual" : "Auto"}
                      </span>
                    </td>
                    <td className="text-muted fs-13">{backup.createdAt}</td>
                    <td className="text-end pe-3">
                      <div className="d-flex gap-1 justify-content-end">
                        <button
                          className="btn btn-sm btn-soft-primary"
                          title="Download"
                          disabled={downloading === backup.id}
                          onClick={() => downloadBackup(backup.id)}
                        >
                          {downloading === backup.id
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="ri-download-line"></i>
                          }
                        </button>
                        <button
                          className="btn btn-sm btn-soft-success"
                          title="Restore"
                          disabled={restoring === backup.id}
                          onClick={() => restoreBackup(backup.id)}
                        >
                          {restoring === backup.id
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="ri-history-line"></i>
                          }
                        </button>
                        <button
                          className="btn btn-sm btn-soft-danger"
                          title="Delete"
                          disabled={deleting === backup.id}
                          onClick={() => deleteBackup(backup.id)}
                        >
                          {deleting === backup.id
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="ri-delete-bin-line"></i>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
