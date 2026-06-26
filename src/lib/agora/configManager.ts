import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "agora-data");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");
const STATS_PATH = path.join(DATA_DIR, "stats.json");

export type AgoraRole = "publisher" | "subscriber";

export interface AgoraConfig {
  agoraAppId: string;
  agoraAppCertificate: string;
  defaultChannelName: string;
  defaultUid: string;
  defaultRole: AgoraRole;
  defaultExpireTime: number;
}

export interface RequestHistoryItem {
  type: "rtc" | "rtm" | "admin";
  timestamp: string;
}

export interface AgoraStats {
  totalRequests: number;
  rtcRequests: number;
  rtmRequests: number;
  adminRequests: number;
  lastReset: string;
  requestHistory: RequestHistoryItem[];
}

const DEFAULT_CONFIG: AgoraConfig = {
  agoraAppId: "",
  agoraAppCertificate: "",
  defaultChannelName: "test-channel",
  defaultUid: "0",
  defaultRole: "publisher",
  defaultExpireTime: 3600,
};

function defaultStats(): AgoraStats {
  return {
    totalRequests: 0,
    rtcRequests: 0,
    rtmRequests: 0,
    adminRequests: 0,
    lastReset: new Date().toISOString(),
    requestHistory: [],
  };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadConfig(): AgoraConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<AgoraConfig>;
    const merged: AgoraConfig = { ...DEFAULT_CONFIG, ...parsed };

    if (process.env.AGORA_APP_ID) merged.agoraAppId = process.env.AGORA_APP_ID;
    if (process.env.AGORA_APP_CERTIFICATE)
      merged.agoraAppCertificate = process.env.AGORA_APP_CERTIFICATE;

    return merged;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function loadStats(): AgoraStats {
  try {
    const raw = fs.readFileSync(STATS_PATH, "utf8");
    return JSON.parse(raw) as AgoraStats;
  } catch {
    const fresh = defaultStats();
    saveStats(fresh);
    return fresh;
  }
}

function saveConfig(config: AgoraConfig): boolean {
  try {
    ensureDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving Agora config:", err);
    return false;
  }
}

function saveStats(stats: AgoraStats): boolean {
  try {
    ensureDir();
    fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving Agora stats:", err);
    return false;
  }
}

// Module-level cache so repeated calls within a request avoid disk reads.
// Mutations always go through update*() which writes to disk and updates the cache.
let cachedConfig: AgoraConfig | null = null;
let cachedStats: AgoraStats | null = null;

export function getConfig(): AgoraConfig {
  if (!cachedConfig) cachedConfig = loadConfig();
  return cachedConfig;
}

export function getPublicConfig(): AgoraConfig {
  return getConfig();
}

export function updateConfig(updates: Partial<AgoraConfig>): boolean {
  const next: AgoraConfig = { ...getConfig(), ...updates };
  const ok = saveConfig(next);
  if (ok) cachedConfig = next;
  return ok;
}

export function getAppId(): string {
  return getConfig().agoraAppId;
}

export function getAppCertificate(): string {
  return getConfig().agoraAppCertificate;
}

export function validateCredentials(): boolean {
  const cfg = getConfig();
  return Boolean(cfg.agoraAppId && cfg.agoraAppCertificate);
}

export function getStats(): AgoraStats {
  if (!cachedStats) cachedStats = loadStats();
  return cachedStats;
}

export function incrementStat(type: RequestHistoryItem["type"]): void {
  const stats = getStats();
  stats.totalRequests += 1;
  if (type === "rtc") stats.rtcRequests += 1;
  else if (type === "rtm") stats.rtmRequests += 1;
  else if (type === "admin") stats.adminRequests += 1;

  stats.requestHistory.unshift({ type, timestamp: new Date().toISOString() });
  if (stats.requestHistory.length > 100) {
    stats.requestHistory = stats.requestHistory.slice(0, 100);
  }

  saveStats(stats);
  cachedStats = stats;
}

export function resetStats(): AgoraStats {
  const fresh = defaultStats();
  saveStats(fresh);
  cachedStats = fresh;
  return fresh;
}
