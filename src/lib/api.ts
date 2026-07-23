// Empty string = relative URLs → proxied by Next.js rewrites to the backend.
// The backend URL is configured via NEXT_PUBLIC_API_URL in .env.local
// Never call the backend port directly from the browser (CORS).
export const API_BASE = "";

import { BACKEND_URL } from "@/lib/config";

// ─── Stored User Type ──────────────────────────────────────────────────────────
export interface AuthUser {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
  userId?: string;
  userRole: string;
  coins?: number;
  userPermissions?: string[];
  designation?: string;
  avatar?: string;
}

// ─── Token / User  helpers ─────────────────────────────────────────────────────
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("al_token");
  // Defensive: if a previous bug stored the literal string "undefined"
  // / "null" we treat it as no token so the app forces a fresh login
  // instead of sending `Authorization: Bearer undefined`.
  if (!raw || raw === "undefined" || raw === "null") return null;
  return raw;
};
export const setToken = (t: string) => {
  if (typeof window === "undefined") return;
  if (!t || t === "undefined" || t === "null") {
    // Refuse to persist an empty token — would silently lock the user
    // out on next reload (rehydrate finds a falsy value, AuthGuard
    // still passes, every API call 401s).
    localStorage.removeItem("al_token");
    return;
  }
  localStorage.setItem("al_token", t);
};
export const removeToken = () => localStorage.removeItem("al_token");

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("al_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};
export const setStoredUser = (u: AuthUser) =>
  localStorage.setItem("al_user", JSON.stringify(u));
export const removeStoredUser = () => localStorage.removeItem("al_user");

/**
 * Clears the stored session and bounces the user to /login. Called
 * automatically by `authFetch` when the backend returns 401, so an
 * expired token doesn't leave the panel in a half-broken "logged in
 * but every API call fails" state.
 */
function _forceLogout() {
  if (typeof window === "undefined") return;
  removeToken();
  removeStoredUser();
  // Avoid a redirect loop if we're already on the login screen.
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

// ─── Login helpers ─────────────────────────────────────────────────────────────

/** Admin login  –  POST /api/admin/login  { username, password } */
export async function loginAdmin(
  username: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Admin login failed");
  const user: AuthUser =
    Array.isArray(data.result) ? data.result[0] : data.result;
  return { user, token: data.access_token };
}

/** Admin register  –  POST /api/admin/auth  { username, email, password } */
export async function registerAdmin(
  username: string,
  email: string,
  password: string
): Promise<{ user: AuthUser; token?: string }> {
  const res = await fetch(`${API_BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Admin registration failed");
  const user: AuthUser = data.result;
  return { user, token: data.access_token };
}

/** Portal-user login  –  POST /api/power-shared/auth  { userId, password } */
export async function loginPortalUser(
  userId: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${API_BASE}/api/power-shared/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Portal-user login failed");
  const user: AuthUser =
    Array.isArray(data.result) ? data.result[0] : data.result;
  return { user, token: data.access_token };
}

// ─── Authenticated fetch wrapper ───────────────────────────────────────────────
export async function authFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  opts: { silent?: boolean } = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  // Token expired / revoked — clear local session and bounce to login
  // so the user gets a clean re-auth instead of a screen full of
  // failed requests. `silent` callers (e.g. the background session
  // refresh) skip the force-logout so a transient hiccup never kicks a
  // user out of an otherwise-valid stored session.
  if (res.status === 401) {
    if (!opts.silent) _forceLogout();
    throw new Error("Session expired — please sign in again");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data as T;
}

// ─── Role / Permission API calls ───────────────────────────────────────────────

export interface PortalUser {
  _id: string;
  name: string;
  userId: string;
  password?: string;
  designation: string;
  userRole: string;
  coins: number;
  diamonds: number;
  userPermissions: string[];
  activityZone?: { zone: string; expire?: string };
  createdAt?: string;
  avatar?: string;
  parentCreator?: string;
}

function extractPortalUsers(result: unknown): PortalUser[] {
  if (Array.isArray(result)) return result as PortalUser[];
  if (!result || typeof result !== "object") return [];

  const obj = result as { data?: unknown; users?: unknown };
  if (Array.isArray(obj.data)) return obj.data as PortalUser[];
  if (Array.isArray(obj.users)) return obj.users as PortalUser[];
  return [];
}

/** GET /api/power-shared/portal/:userRole  – list upper-tier portal users by role (Admin only) */
export async function getPortalUsersByRole(
  role: string,
  query?: Record<string, string>
): Promise<PortalUser[]> {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
  const data = await authFetch<{ result: unknown }>(
    `/api/power-shared/portal/${role}${qs}`
  );
  return extractPortalUsers(data.result);
}

/** GET /api/power-shared/portal/mid/:userRole/:parentId  – list mid-tier portal users (re-seller, agency, country-sub-admin) under a parent */
export async function getPortalMidUsers(
  role: string,
  parentId: string,
  query?: Record<string, string>
): Promise<PortalUser[]> {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
  const data = await authFetch<{ result: unknown }>(
    `/api/power-shared/portal/mid/${role}/${parentId}${qs}`
  );
  return extractPortalUsers(data.result);
}

/** GET /api/power-shared/portal/lower/:parentId  – list hosts under a parent agency/reseller */
export async function getPortalHosts(
  parentId: string,
  query?: Record<string, string>
): Promise<PortalUser[]> {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
  const data = await authFetch<{ result: unknown }>(
    `/api/power-shared/portal/lower/${parentId}${qs}`
  );
  return extractPortalUsers(data.result);
}

/** POST /api/admin/create-role  – create a new portal user */
export async function createPortalUser(payload: {
  name: string;
  userId: string;
  password: string;
  designation: string;
  userRole: string;
  userPermissions: string[];
  parentCreator?: string;
}): Promise<PortalUser> {
  const data = await authFetch<{ result: PortalUser }>(`/api/admin/create-role`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.result;
}

/** PUT /api/admin/role/permissions/add/:roleId */
export async function addPermissions(
  roleId: string,
  permissions: string[]
): Promise<PortalUser> {
  const data = await authFetch<{ result: PortalUser }>(
    `/api/admin/role/permissions/add/${roleId}`,
    { method: "PUT", body: JSON.stringify({ permissions }) }
  );
  return data.result;
}

/** PUT /api/admin/role/permissions/remove/:roleId */
export async function removePermissions(
  roleId: string,
  permissions: string[]
): Promise<PortalUser> {
  const data = await authFetch<{ result: PortalUser }>(
    `/api/admin/role/permissions/remove/${roleId}`,
    { method: "PUT", body: JSON.stringify({ permissions }) }
  );
  return data.result;
}

/** DELETE /api/admin/role/:roleId */
export async function deleteRole(roleId: string): Promise<void> {
  await authFetch(`/api/admin/role/${roleId}`, { method: "DELETE" });
}

/**
 * GET /api/admin/portal-users – all staff (portal users) created via
 * "Create Role". Response: { result: { pagination, data } }. These are
 * the entities the role permission / delete endpoints operate on.
 */
export async function getAllPortalUsers(
  query?: Record<string, string>
): Promise<{ users: PortalUser[]; pagination?: PaginationMeta }> {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
  const data = await authFetch<{
    result:
      | { data?: PortalUser[]; users?: PortalUser[]; pagination?: PaginationMeta }
      | PortalUser[];
  }>(`/api/admin/portal-users${qs}`);
  if (Array.isArray(data.result)) return { users: data.result };
  const r = data.result ?? {};
  return { users: r.data ?? r.users ?? [], pagination: r.pagination };
}

export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  totalPage: number;
}

export interface ModeratorUser {
  _id: string;
  name?: string;
  email?: string;
  uid?: string;
  userId?: string;
  avatar?: string;
  userRole?: string;
  userPermissions: string[];
  activity_zone?: { zone?: string };
  activityZone?: { zone?: string };
  createdAt?: string;
  updatedAt?: string;
}

/** GET /api/admin/users/moderators?limit=10&page=1 */
export async function getModerators(params?: {
  page?: number;
  limit?: number;
  searchTerm?: string;
}): Promise<{ users: ModeratorUser[]; pagination: PaginationMeta }> {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 10),
  });
  if (params?.searchTerm?.trim()) query.set("searchTerm", params.searchTerm.trim());

  const data = await authFetch<{
    result?: {
      users?: ModeratorUser[];
      pagination?: PaginationMeta;
    };
  }>(`/api/admin/users/moderators?${query.toString()}`);

  return {
    users: data.result?.users ?? [],
    pagination: data.result?.pagination ?? {
      total: 0,
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      totalPage: 0,
    },
  };
}

/** PUT /api/admin/users/moderator-permissions */
export async function addModeratorPermissions(
  moderatorId: string,
  permissions: string[]
): Promise<ModeratorUser> {
  const data = await authFetch<{ result?: ModeratorUser; user?: ModeratorUser }>(
    `/api/admin/users/moderator-permissions`,
    {
      method: "PUT",
      body: JSON.stringify({ id: moderatorId, userId: moderatorId, permissions }),
    }
  );
  return (data.result ?? data.user ?? { _id: moderatorId, userPermissions: permissions }) as ModeratorUser;
}

/** PUT /api/admin/users/remove-permissions */
export async function removeModeratorPermissions(
  moderatorId: string,
  permissions: string[]
): Promise<ModeratorUser> {
  const data = await authFetch<{ result?: ModeratorUser; user?: ModeratorUser }>(
    `/api/admin/users/remove-permissions`,
    {
      method: "PUT",
      body: JSON.stringify({ id: moderatorId, userId: moderatorId, permissions }),
    }
  );
  return (data.result ?? data.user ?? { _id: moderatorId, userPermissions: [] }) as ModeratorUser;
}

// ─── User listing ──────────────────────────────────────────────────────────────

export interface AppUser {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
  userRole: string;
  shortId?: string;
  isVerified?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

/** GET /api/power-shared/users  – all app users (paginated) */
export async function getAllUsers(params?: Record<string, string>): Promise<{ result: AppUser[]; total?: number }> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return authFetch<{ result: AppUser[]; total?: number }>(`/api/power-shared/users${qs}`);
}

// ─── User Role / Activity Constants ───────────────────────────────────────────

export const USER_ROLES = [
  { value: "admin",              label: "Admin",              color: "bg-danger"   },
  { value: "sub-admin",          label: "Sub Admin",          color: "bg-warning"  },
  { value: "merchant",           label: "Merchant",           color: "bg-success"  },
  { value: "re-seller",          label: "Reseller",           color: "bg-info"     },
  { value: "agency",             label: "Agency",             color: "bg-primary"  },
  { value: "host",               label: "Host",               color: "bg-purple"   },
  { value: "user",               label: "User",               color: "bg-secondary"},
  { value: "country-admin",      label: "Country Admin",      color: "bg-teal"     },
  { value: "country-sub-admin",  label: "Country Sub Admin",  color: "bg-cyan"     },
] as const;

export const ACTIVITY_ZONES = [
  { value: "safe",              label: "Active",              badgeCls: "bg-success"  },
  { value: "temp_block",        label: "Temp Blocked",        badgeCls: "bg-warning"  },
  { value: "permanent_block",   label: "Permanently Banned",  badgeCls: "bg-danger"   },
] as const;

export type ActivityZoneValue = "safe" | "temp_block" | "permanent_block";

export interface UserStats {
  _id?: string;
  userId?: string;
  coins?: number;
  diamonds?: number;
  stars?: number;
}

export interface FullAppUser {
  _id: string;
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  userId?: number;
  avatar?: string;
  profileImage?: string;
  userRole?: string;
  role?: string;
  activityZone?: { zone?: string; expire?: string };
  stats?: UserStats;
  totalBoughtCoins?: number;
  stars?: number;
  diamonds?: number;
  coins?: number;
  level?: number;
  createdAt?: string;
}

// ─── User Management API  ──────────────────────────────────────────────────────

/**
 * GET /api/power-shared/users?userRole=...&page=...&limit=...
 * Returns { users: FullAppUser[] } or FullAppUser[]
 */
export async function getUsersByRole(
  role: string,
  query?: Record<string, string>
): Promise<{ users: FullAppUser[]; total?: number }> {
  const params = new URLSearchParams(query ?? {});
  if (role !== "all") params.append("userRole", role);
  const data = await authFetch<{
    result:
      | FullAppUser[]
      | { users: FullAppUser[]; pagination?: { total?: number } };
  }>(`/api/power-shared/users?${params.toString()}`);
  if (Array.isArray(data.result)) return { users: data.result };
  const r = data.result as {
    users?: FullAppUser[];
    pagination?: { total?: number };
  };
  return { users: r?.users ?? [], total: r?.pagination?.total };
}

/** PUT /api/admin/user/asign-role/:role  – change a user's role */
export async function assignUserRole(
  role: string,
  userId: string
): Promise<FullAppUser> {
  const data = await authFetch<{ result: FullAppUser }>(
    `/api/admin/user/asign-role/${role}`,
    { method: "PUT", body: JSON.stringify({ userId }) }
  );
  return data.result;
}

/** PUT /api/admin/users/activity-zone  – block/unblock a user */
export async function updateUserActivityZone(payload: {
  id: string;
  zone: ActivityZoneValue;
  dateTill?: string;
}): Promise<FullAppUser> {
  const data = await authFetch<{ result: FullAppUser }>(
    `/api/admin/users/activity-zone`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  return data.result;
}

/** POST /api/admin/users/stats/update/:userId  – adjust stars/diamonds */
export async function updateUserStats(
  userId: string,
  payload: { stars?: number; diamonds?: number }
): Promise<UserStats> {
  const data = await authFetch<{ result: UserStats }>(
    `/api/admin/users/stats/update/${userId}`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return data.result;
}

/** PUT /api/power-shared/users/assign-coin  – transfer coins to user */
export async function assignCoinsToUser(payload: {
  userId: string;
  coins: number;
  userRole: string;
}): Promise<UserStats> {
  const data = await authFetch<{ result: UserStats }>(
    `/api/power-shared/users/assign-coin`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  return data.result;
}

/** GET /api/power-shared/users/search?email=... */
export async function searchUsers(
  email: string,
  query?: Record<string, string>
): Promise<{ users: FullAppUser[] }> {
  const params = new URLSearchParams({ email, ...(query ?? {}) });
  const data = await authFetch<{ result: { users?: FullAppUser[] } | FullAppUser[] }>(
    `/api/power-shared/users/search?${params.toString()}`
  );
  if (Array.isArray(data.result)) return { users: data.result };
  const r = data.result as { users?: FullAppUser[] };
  return { users: r?.users ?? [] };
}

/**
 * GET /api/auth/user/:id – full user details (the same payload the app's
 * "view profile" page consumes). Includes `stats`, `equippedStoreItems`,
 * `myBucketItems`, `recievedGifts`, and the rest of the rich profile.
 */
export async function getUserDetailsById(id: string): Promise<FullAppUser & Record<string, unknown>> {
  const data = await authFetch<{ result: FullAppUser & Record<string, unknown> }>(
    `/api/auth/user/${id}`
  );
  return data.result;
}

/**
 * Looks up a single user by their numeric short userId (e.g. 100245).
 *
 * The backend's `GET /api/power-shared/users/exact-search` reads `shortId`
 * from the request *body*, but browsers can't attach a body to a GET. So we
 * call a local server-side route (`/api/reseller-search`) that forwards the
 * request to the backend with the body intact (Node allows a GET body).
 * Returns null when no user matches.
 */
export async function searchUserByShortId(
  shortId: number | string
): Promise<FullAppUser | null> {
  const data = await authFetch<{ result: FullAppUser | FullAppUser[] | null }>(
    `/api/reseller-search?shortId=${encodeURIComponent(String(shortId))}`
  );
  const r = data.result;
  if (!r) return null;
  return Array.isArray(r) ? (r[0] ?? null) : r;
}

// ─── App Reseller (Admin / SubAdmin) ──────────────────────────────────────────
// Base: /api/app-reseller. Toggles a user's role between "user" and
// "re-seller" and lists all resellers (paginated).

export interface ResellerUser {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
  userId?: number;
  uid?: string;
  userRole?: string;
  phone?: string;
  avatar?: string;
  verified?: boolean;
  createdAt?: string;
}

/** GET /api/app-reseller – paginated list of re-seller users. */
export async function getResellers(
  page = 1,
  limit = 20
): Promise<{ resellers: ResellerUser[]; total: number }> {
  const data = await authFetch<{
    result: ResellerUser[];
    meta?: { total?: number; totalPage?: number; page?: number; limit?: number };
  }>(`/api/app-reseller?page=${page}&limit=${limit}`);
  return {
    resellers: Array.isArray(data.result) ? data.result : [],
    total: data.meta?.total ?? (Array.isArray(data.result) ? data.result.length : 0),
  };
}

/**
 * PUT /api/app-reseller/change-role – toggle a user's role.
 * `role` must be "user" or "re-seller".
 */
export async function changeResellerRole(
  userId: string,
  role: "user" | "re-seller"
): Promise<void> {
  await authFetch(`/api/app-reseller/change-role`, {
    method: "PUT",
    body: JSON.stringify({ userId, role }),
  });
}

/**
 * PUT /api/app-reseller/give-coins-to-reseller – Admin/SubAdmin tops up a
 * reseller's dedicated `resellerCoin` pool (separate from regular coins).
 * Returns the reseller's new resellerCoin balance.
 */
export async function giveCoinsToReseller(
  userId: string,
  coins: number
): Promise<{ sender: { id: string; coins: number }; receiver: { id: string; coins: number } }> {
  const data = await authFetch<{
    result: { sender: { id: string; coins: number }; receiver: { id: string; coins: number } };
  }>(`/api/app-reseller/give-coins-to-reseller`, {
    method: "PUT",
    body: JSON.stringify({ userId, coins }),
  });
  return data.result;
}

// ─── Store API  ───────────────────────────────────────────────────────────────

export interface StoreCategory {
  _id: string;
  title: string;
  isPremium?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreItemBundle {
  categoryName: string;
  svgaFile: string;
  previewFile?: string;
  fileType: string;
}

export interface StoreItemPrice {
  validity: number;
  price: number;
}

export interface StoreItem {
  _id: string;
  name: string;
  logo?: string;
  background?: string;
  categoryId: string;
  isPremium?: boolean;
  prices: StoreItemPrice[];
  svgaFile?: string;
  previewFile?: string;
  bundleFiles?: StoreItemBundle[];
  privilege?: string[];
  deleteStatus?: boolean;
  totalSold?: number;
  /**
   * Visibility flag for the store list. When `true` (default), the item is
   * shown to users and can be purchased. When `false`, the item is hidden
   * from the public store and can only be reached via the admin Grant API
   * (POST /api/store/items/grant).
   */
  canUserBuyThis?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreItemPagination {
  total: number;
  limit: number;
  page: number;
  totalPage: number;
}

export async function getStoreCategories(): Promise<StoreCategory[]> {
  const data = await authFetch<{ result: StoreCategory[] }>("/api/store/categories");
  return Array.isArray(data.result) ? data.result : [];
}

export async function createStoreCategory(payload: {
  title: string;
  isPremium?: boolean;
}): Promise<unknown> {
  const data = await authFetch<{ result: unknown }>("/api/store/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.result;
}

export async function getStoreItemsByCategory(
  categoryId: string,
  query?: { page?: number; limit?: number; searchTerm?: string }
): Promise<{ items: StoreItem[]; pagination: StoreItemPagination | null }> {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.searchTerm?.trim()) params.set("searchTerm", query.searchTerm.trim());
  const qs = params.toString() ? `?${params.toString()}` : "";

  const data = await authFetch<{
    result?: {
      items?: StoreItem[];
      pagination?: StoreItemPagination;
    };
  }>(`/api/store/items/category/${categoryId}${qs}`);

  return {
    items: data.result?.items ?? [],
    pagination: data.result?.pagination ?? null,
  };
}

export async function createStoreItemSingle(payload: {
  name: string;
  validity: number;
  categoryId: string;
  price: number;
  privilege?: string[];
  /** SVGA animation. Optional — backend accepts items without one. */
  svgaFile?: File | null;
  previewFile?: File;
  /** Optional logo image — backend field name is `logo` (multipart). */
  logoFile?: File;
  /**
   * `false` makes this an exclusive item: hidden from the public store list,
   * only reachable via admin Grant. Defaults to `true` on the backend.
   */
  canUserBuyThis?: boolean;
}): Promise<StoreItem> {
  const token = getToken();
  const form = new FormData();
  form.append("name", payload.name);
  form.append("validity", String(payload.validity));
  form.append("categoryId", payload.categoryId);
  form.append("price", String(payload.price));
  if (payload.privilege && payload.privilege.length > 0) {
    form.append("privilege", JSON.stringify(payload.privilege));
  }
  if (payload.svgaFile) {
    form.append("svgaFile", payload.svgaFile);
  }
  if (payload.previewFile) {
    form.append("previewFile", payload.previewFile);
  }
  if (payload.logoFile) {
    form.append("logo", payload.logoFile);
  }
  if (payload.canUserBuyThis !== undefined) {
    form.append("canUserBuyThis", String(payload.canUserBuyThis));
  }

  const res = await fetch(`${API_BASE}/api/store/items/single`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create store item");
  return data.result as StoreItem;
}

export async function createStoreItemBatch(payload: {
  name: string;
  categoryId: string;
  prices: Array<{ validity: number; price: number }>;
  privilege?: string[];
  /** svgaFile is optional — when omitted, a backend-side migration must
   *  also be deployed so the bundleSchema/validator accept its absence. */
  bundles: Array<{ categoryName: string; svgaFile?: File; previewFile?: File }>;
  /** Optional logo image for the whole bundle — single file, multer maxCount:1. */
  logoFile?: File;
}): Promise<StoreItem> {
  const token = getToken();
  const form = new FormData();
  form.append("name", payload.name);
  form.append("categoryId", payload.categoryId);
  form.append("prices", JSON.stringify(payload.prices));
  if (payload.privilege && payload.privilege.length > 0) {
    form.append("privilege", JSON.stringify(payload.privilege));
  }
  form.append("categoryNames", payload.bundles.map((b) => b.categoryName).join(","));
  // Per-row presence masks ("1,0,1") tell the backend which categories have
  // an svgaFile / previewFile attached. Multer flattens uploads into two
  // arrays, so without these masks the backend can't know which row a lone
  // file came from when some rows skipped the slot.
  form.append(
    "svgaFlags",
    payload.bundles
      .map((b) => (b.svgaFile && b.svgaFile !== b.previewFile ? "1" : "0"))
      .join(","),
  );
  form.append(
    "previewFlags",
    payload.bundles.map((b) => (b.previewFile ? "1" : "0")).join(","),
  );
  payload.bundles.forEach((bundle) => {
    if (bundle.svgaFile && bundle.svgaFile !== bundle.previewFile) {
      form.append("svgaFile", bundle.svgaFile);
    }
  });
  payload.bundles.forEach((bundle) => {
    if (bundle.previewFile) {
      form.append("previewFile", bundle.previewFile);
    }
  });
  if (payload.logoFile) {
    form.append("logo", payload.logoFile);
  }

  const res = await fetch(`${API_BASE}/api/store/items/batch`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create SVIP item");
  return data.result as StoreItem;
}

export interface EffectedBucketSummary {
  itemName: string;
  userCount: number;
}

export async function getEffectedBucketSummary(
  itemId: string
): Promise<EffectedBucketSummary> {
  const data = await authFetch<{ result: EffectedBucketSummary }>(
    `/api/store/items/effected-buckets/${itemId}`
  );
  return data.result;
}

export async function deleteStoreItem(itemId: string): Promise<StoreItem> {
  const data = await authFetch<{ result: StoreItem }>(
    `/api/store/items/${itemId}`,
    { method: "DELETE" }
  );
  return data.result;
}

/**
 * PUT /api/store/items/single/:id — update a non-premium store item.
 * All fields are optional except the item id. Files (svgaFile, previewFile,
 * logo) are optional; send them only when the admin is replacing them.
 */
export async function updateStoreItemSingle(
  itemId: string,
  payload: {
    name?: string;
    categoryId?: string;
    prices?: Array<{ validity: number; price: number }>;
    privilege?: string[];
    svgaFile?: File;
    previewFile?: File;
    logoFile?: File;
    canUserBuyThis?: boolean;
  }
): Promise<StoreItem> {
  const token = getToken();
  const form = new FormData();
  if (payload.name !== undefined) form.append("name", payload.name);
  if (payload.categoryId !== undefined) form.append("categoryId", payload.categoryId);
  if (payload.prices !== undefined) form.append("prices", JSON.stringify(payload.prices));
  if (payload.privilege !== undefined) {
    form.append("privilege", JSON.stringify(payload.privilege));
  }
  if (payload.svgaFile) form.append("svgaFile", payload.svgaFile);
  if (payload.previewFile) form.append("previewFile", payload.previewFile);
  if (payload.logoFile) form.append("logo", payload.logoFile);
  if (payload.canUserBuyThis !== undefined) {
    form.append("canUserBuyThis", String(payload.canUserBuyThis));
  }

  const res = await fetch(`${API_BASE}/api/store/items/single/${itemId}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update store item");
  return data.result as StoreItem;
}

/**
 * PUT /api/store/items/batch/:id — update a premium/SVIP bundle item.
 * Bundle files, if included, replace the existing bundle set.
 */
export async function updateStoreItemBatch(
  itemId: string,
  payload: {
    name?: string;
    categoryId?: string;
    prices?: Array<{ validity: number; price: number }>;
    privilege?: string[];
    bundles?: Array<{ categoryName: string; svgaFile: File; previewFile?: File }>;
    logoFile?: File;
  }
): Promise<StoreItem> {
  const token = getToken();
  const form = new FormData();
  if (payload.name !== undefined) form.append("name", payload.name);
  if (payload.categoryId !== undefined) form.append("categoryId", payload.categoryId);
  if (payload.prices !== undefined) form.append("prices", JSON.stringify(payload.prices));
  if (payload.privilege !== undefined) {
    form.append("privilege", JSON.stringify(payload.privilege));
  }
  if (payload.bundles && payload.bundles.length > 0) {
    form.append("categoryNames", payload.bundles.map((b) => b.categoryName).join(","));
    payload.bundles.forEach((b) => form.append("svgaFile", b.svgaFile));
    payload.bundles.forEach((b) => {
      if (b.previewFile) form.append("previewFile", b.previewFile);
    });
  }
  if (payload.logoFile) form.append("logo", payload.logoFile);

  const res = await fetch(`${API_BASE}/api/store/items/batch/${itemId}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update SVIP item");
  return data.result as StoreItem;
}

/**
 * POST /api/store/items/grant — admin grants a store item directly to a user
 * (no purchase). Backend restrictions:
 *   • The item must be non-premium.
 *   • The item must have `canUserBuyThis: false` (an "exclusive" item).
 *   • `userId` is the user's NUMERIC short id (e.g. 100018), not the _id.
 *   • The user can't already own the item.
 * `validity` is the lifetime of the granted bucket in days.
 */
export async function grantStoreItem(payload: {
  itemId: string;
  userId: number;
  validity: number;
}): Promise<unknown> {
  const data = await authFetch<{ result: unknown }>(
    `/api/store/items/grant`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return data.result;
}

/**
 * GET /api/store/categories/effected-items/:id — items that would be orphaned
 * if this category were deleted. Used to warn before confirming delete.
 */
export async function getCategoryDeleteEffectedItems(
  categoryId: string
): Promise<EffectedBucketSummary> {
  const data = await authFetch<{ result: EffectedBucketSummary }>(
    `/api/store/categories/effected-items/${categoryId}`
  );
  return data.result;
}

/** PUT /api/store/categories/:id — rename a category or toggle premium. */
export async function updateStoreCategory(
  categoryId: string,
  payload: { title?: string; isPremium?: boolean }
): Promise<StoreCategory> {
  const data = await authFetch<{ result: StoreCategory }>(
    `/api/store/categories/${categoryId}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  return data.result;
}

/** DELETE /api/store/categories/:id */
export async function deleteStoreCategory(categoryId: string): Promise<StoreCategory> {
  const data = await authFetch<{ result: StoreCategory }>(
    `/api/store/categories/${categoryId}`,
    { method: "DELETE" }
  );
  return data.result;
}

export async function getSvipItems(): Promise<StoreItem[]> {
  const data = await authFetch<{ result: StoreItem[] }>("/api/store/items/svip");
  return Array.isArray(data.result) ? data.result : [];
}

export async function getVipItems(): Promise<StoreItem[]> {
  const data = await authFetch<{ result: StoreItem[] }>("/api/store/items/vip");
  return Array.isArray(data.result) ? data.result : [];
}

// ─── Gift API  ────────────────────────────────────────────────────────────────

export interface Gift {
  _id: string;
  name: string;
  category: string;
  sendCount?: number;
  diamonds: number;
  coinPrice: number;
  previewImage: string;
  svgaImage: string;
  createdAt?: string;
}

/** GET /api/admin/gift */
export async function getGifts(): Promise<Gift[]> {
  const data = await authFetch<{ result: Gift[] }>("/api/admin/gift");
  return Array.isArray(data.result) ? data.result : [];
}

/** GET /api/admin/gift-category */
export async function getGiftCategories(): Promise<string[]> {
  const data = await authFetch<{ result: string[] }>("/api/admin/gift-category");
  return Array.isArray(data.result) ? data.result : [];
}

/** POST /api/admin/gift (multipart). Backend expects `giftName`, not `name`. */
export async function createGift(payload: {
  name: string;
  category: string;
  diamonds: number;
  coinPrice: number;
  previewImage: File;
  svgaImage: File;
}): Promise<Gift> {
  const token = getToken();
  const form = new FormData();
  form.append("giftName", payload.name);
  form.append("category", payload.category);
  form.append("diamonds", payload.diamonds.toString());
  form.append("coinPrice", payload.coinPrice.toString());
  form.append("previewImage", payload.previewImage);
  form.append("svgaImage", payload.svgaImage);

  const res = await fetch(`${API_BASE}/api/admin/gift`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create gift");
  return data.result;
}

/** PUT /api/admin/gift/:id (multipart). Backend expects `giftName`, not `name`. */
export async function updateGift(
  id: string,
  payload: {
    name?: string;
    category?: string;
    diamonds?: number;
    coinPrice?: number;
    previewImage?: File;
    svgaImage?: File;
  }
): Promise<Gift> {
  const token = getToken();
  const form = new FormData();
  if (payload.name) form.append("giftName", payload.name);
  if (payload.category) form.append("category", payload.category);
  if (payload.diamonds !== undefined) form.append("diamonds", payload.diamonds.toString());
  if (payload.coinPrice !== undefined) form.append("coinPrice", payload.coinPrice.toString());
  if (payload.previewImage) form.append("previewImage", payload.previewImage);
  if (payload.svgaImage) form.append("svgaImage", payload.svgaImage);

  const res = await fetch(`${API_BASE}/api/admin/gift/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update gift");
  return data.result;
}

/** DELETE /api/admin/gift/:id */
export async function deleteGift(id: string): Promise<void> {
  await authFetch(`/api/admin/gift/${id}`, { method: "DELETE" });
}

// ─── Banners API  ─────────────────────────────────────────────────────────────

export interface BannerDoc {
  _id: string;
  url: string;
  alt: string;
}

/** GET /api/admin/banners  → string[] (URL list) */
export async function getBanners(): Promise<string[]> {
  const data = await authFetch<{ result: string[] }>("/api/admin/banners");
  return Array.isArray(data.result) ? data.result : [];
}

/** GET /api/admin/banners/docs  → full banner documents with _id */
export async function getBannerDocs(): Promise<BannerDoc[]> {
  const data = await authFetch<{ result: BannerDoc[] }>("/api/admin/banners/docs");
  return Array.isArray(data.result) ? data.result : [];
}

/** POST /api/admin/banners (multipart) */
export async function createBanner(payload: {
  alt: string;
  image: File;
}): Promise<unknown> {
  const token = getToken();
  const form = new FormData();
  form.append("alt", payload.alt);
  form.append("image", payload.image);

  const res = await fetch(`${API_BASE}/api/admin/banners`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create banner");
  return data.result ?? data;
}

/** DELETE /api/admin/banners/:id */
export async function deleteBanner(id: string): Promise<void> {
  await authFetch(`/api/admin/banners/${id}`, { method: "DELETE" });
}

// ─── Posters API  ─────────────────────────────────────────────────────────────

export interface PosterDoc {
  _id: string;
  url: string;
  alt: string;
}

/** GET /api/admin/posters  → string[] (URL list) */
export async function getPosters(): Promise<string[]> {
  const data = await authFetch<{ result: string[] }>("/api/admin/posters");
  return Array.isArray(data.result) ? data.result : [];
}

/** GET /api/admin/posters/docs  → full poster documents with _id */
export async function getPosterDocs(): Promise<PosterDoc[]> {
  const data = await authFetch<{ result: PosterDoc[] }>("/api/admin/posters/docs");
  return Array.isArray(data.result) ? data.result : [];
}

/** POST /api/admin/posters (multipart) */
export async function createPoster(payload: {
  alt: string;
  image: File;
}): Promise<unknown> {
  const token = getToken();
  const form = new FormData();
  form.append("alt", payload.alt);
  form.append("image", payload.image);

  const res = await fetch(`${API_BASE}/api/admin/posters`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create poster");
  return data.result ?? data;
}

/** DELETE /api/admin/posters/:id */
export async function deletePoster(id: string): Promise<void> {
  await authFetch(`/api/admin/posters/${id}`, { method: "DELETE" });
}

// ─── Profile API calls ─────────────────────────────────────────────────────────

/** PUT /api/admin/auth/assign-coin  – add coins to own admin wallet */
export async function assignCoinToAdmin(coins: number): Promise<AuthUser> {
  const data = await authFetch<{ result: AuthUser | AuthUser[] }>(`/api/admin/auth/assign-coin`, {
    method: "PUT",
    body: JSON.stringify({ coins }),
  });
  return Array.isArray(data.result) ? data.result[0] : data.result;
}

/** GET /api/admin/auth  – fetch current admin profile */
export async function getAdminProfile(silent = false): Promise<AuthUser> {
  const data = await authFetch<{ result: AuthUser | AuthUser[] }>(
    `/api/admin/auth`,
    {},
    { silent }
  );
  return Array.isArray(data.result) ? data.result[0] : data.result;
}

/** PUT /api/admin/auth  – update admin profile (username, email, password, avatar) */
export async function updateAdminProfile(payload: {
  username?: string;
  email?: string;
  password?: string;
  avatar?: File;
}): Promise<AuthUser> {
  const token = getToken();
  const form = new FormData();
  if (payload.username) form.append("username", payload.username);
  if (payload.email) form.append("email", payload.email);
  if (payload.password) form.append("password", payload.password);
  if (payload.avatar) form.append("avatar", payload.avatar);

  const res = await fetch(`${API_BASE}/api/admin/auth`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Admin profile update failed");
  const result = Array.isArray(data.result) ? data.result[0] : data.result;
  return result as AuthUser;
}

/** GET /api/power-shared/auth  – fetch current portal user profile */
export async function getPortalUserProfile(silent = false): Promise<AuthUser> {
  const data = await authFetch<{ result: AuthUser | AuthUser[] }>(
    `/api/power-shared/auth`,
    {},
    { silent }
  );
  return Array.isArray(data.result) ? data.result[0] : data.result;
}

/** PUT /api/power-shared/auth  – update portal user profile (name, password, avatar file) */
export async function updatePortalUserProfile(payload: {
  name?: string;
  password?: string;
  avatar?: File;
}): Promise<AuthUser> {
  const token = getToken();
  const form = new FormData();
  if (payload.name) form.append("name", payload.name);
  if (payload.password) form.append("password", payload.password);
  if (payload.avatar) form.append("avatar", payload.avatar);

  const res = await fetch(`${API_BASE}/api/power-shared/auth`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Profile update failed");
  const result = Array.isArray(data.result) ? data.result[0] : data.result;
  return result as AuthUser;
}

// ─── Banned Users API ─────────────────────────────────────────────────────────

export interface BannedUser extends FullAppUser {
  bannedTill?: string;
  banReason?: string;
}

/** A currently-connected user, as reported by the socket server. */
export interface OnlineUser {
  _id: string;
  userId?: number;
  name?: string;
  email?: string;
  avatar?: string;
}

/**
 * GET /api/auth/online-users – live list of users with an active socket
 * connection. Backed by the socket server's in-memory online map, so it
 * reflects real-time presence rather than DB activity-zone.
 */
export async function getOnlineUsers(
  query?: Record<string, string>
): Promise<{ users: OnlineUser[]; pagination?: PaginationMeta }> {
  const qs = query ? "?" + new URLSearchParams(query).toString() : "";
  const data = await authFetch<{
    result: { users: OnlineUser[]; pagination?: PaginationMeta } | OnlineUser[];
  }>(`/api/auth/online-users${qs}`);
  if (Array.isArray(data.result)) return { users: data.result };
  return data.result;
}

/** GET /api/admin/users/banned-users – list permanently/temp banned users */
export async function getBannedUsers(
  query?: Record<string, string>
): Promise<{ users: BannedUser[]; pagination?: PaginationMeta }> {
  const qs = query ? "?" + new URLSearchParams(query).toString() : "";
  const data = await authFetch<{
    result: { users: BannedUser[]; pagination?: PaginationMeta } | BannedUser[];
  }>(`/api/admin/users/banned-users${qs}`);
  if (Array.isArray(data.result)) return { users: data.result };
  return data.result;
}

// ─── Audio Room (Admin View) API ──────────────────────────────────────────────

export interface AudioRoomMember {
  name?: string;
  avatar?: string;
  uid?: string;
  userId?: number;
  _id?: string;
  currentLevel?: number;
}

export interface AudioRoom {
  _id: string;
  title: string;
  roomId: string;
  numberOfSeats?: number;
  announcement?: string;
  roomPhoto?: string;
  isLocked?: boolean;
  isHostPresent?: boolean;
  password?: string;
  membersCount?: number;
  hostSeat?: { member?: AudioRoomMember; available?: boolean };
  hostId?: string;
  membersArray?: string[];
  bannedUsers?: { user?: AudioRoomMember; banType?: string; bannedTill?: string }[];
  chatPrivacy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /api/audio-room – list every audio room (no auth required server-side) */
export async function getAudioRooms(): Promise<AudioRoom[]> {
  const data = await authFetch<{ result: AudioRoom[] }>(`/api/audio-room`);
  return Array.isArray(data.result) ? data.result : [];
}

/**
 * Admin room lists (admin auth required):
 *   GET /api/audio-room/admin/all     – every room
 *   GET /api/audio-room/admin/active  – rooms with the host present
 *   GET /api/audio-room/admin/locked  – password-locked rooms
 * Response: { result: { count, rooms } }
 */
export async function getAdminRooms(
  scope: "all" | "active" | "locked",
  signal?: AbortSignal
): Promise<{ rooms: AudioRoom[]; count: number }> {
  const data = await authFetch<{
    result: { count?: number; rooms?: AudioRoom[] } | AudioRoom[];
  }>(`/api/audio-room/admin/${scope}`, { signal });
  if (Array.isArray(data.result)) {
    return { rooms: data.result, count: data.result.length };
  }
  const rooms = data.result?.rooms ?? [];
  return { rooms, count: data.result?.count ?? rooms.length };
}

// ─── Rocket Configuration (Admin) ─────────────────────────────────────────────

export interface RocketConfig {
  milestones: number[];
  rewardNumbers: number[];
  coinMin: number;
  coinMax: number;
  xpMin: number;
  xpMax: number;
}

/**
 * GET /api/admin/rocket-config – current rocket configuration.
 * NOTE: this controller responds with `{ status, data }` (not the usual
 * `{ result }` envelope), so we read `data` here. Returns null if unset.
 */
export async function getRocketConfig(): Promise<RocketConfig | null> {
  const data = await authFetch<{ data: RocketConfig | null }>(
    `/api/admin/rocket-config`
  );
  return data.data ?? null;
}

/** POST /api/admin/rocket-config – persist + hot-sync the rocket config. */
export async function updateRocketConfig(
  payload: RocketConfig
): Promise<void> {
  await authFetch(`/api/admin/rocket-config`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Room Support: Level Criteria (Admin) ─────────────────────────────────────

export interface RoomLevelCriteria {
  level: number;
  roomVisitor: number;
  roomTransactions: number;
  totalRewardCoin: number;
  ownerCoin: number;
  partnerCoin: number;
  numberOfPartners: number;
}

/**
 * Room support level/bonus setup (admin). Backend router is mounted at
 * /api/admin/room-level-criteria. NOTE: these endpoints respond with the
 * `{ status, data }` envelope (not `{ result }`).
 *   GET    /            – all configured levels
 *   POST   /            – create/update one level (body includes `level`)
 *   DELETE /:level      – remove a level
 */
export async function getRoomLevelCriteria(): Promise<RoomLevelCriteria[]> {
  const data = await authFetch<{ data: RoomLevelCriteria[] | null }>(
    `/api/admin/room-level-criteria`
  );
  return Array.isArray(data.data) ? data.data : [];
}

export async function upsertRoomLevelCriteria(
  payload: RoomLevelCriteria
): Promise<void> {
  await authFetch(`/api/admin/room-level-criteria`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteRoomLevelCriteria(level: number): Promise<void> {
  await authFetch(`/api/admin/room-level-criteria/${level}`, {
    method: "DELETE",
  });
}

/** GET /api/audio-room/:roomId – room details with seats etc. */
export async function getAudioRoomById(roomId: string): Promise<AudioRoom | null> {
  const data = await authFetch<{ result: AudioRoom }>(`/api/audio-room/${roomId}`);
  return data.result ?? null;
}

/** GET /api/audio-room/:roomId/visitors */
export async function getRoomVisitors(roomId: string): Promise<AudioRoomMember[]> {
  const data = await authFetch<{ result: AudioRoomMember[] }>(
    `/api/audio-room/${roomId}/visitors`
  );
  return Array.isArray(data.result) ? data.result : [];
}

// ─── Coin / Transaction History API ───────────────────────────────────────────

export interface CoinHistoryEntry {
  _id: string;
  senderRole: string;
  senderId?: string | null;
  receiverRole: string;
  receiverId: string;
  amount: number;
  expireAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // Server may populate these via aggregation; keep optional.
  senderName?: string;
  receiverName?: string;
  senderUserId?: string | number;
  receiverUserId?: string | number;
}

export interface CoinHistoryResponse {
  data: CoinHistoryEntry[];
  pagination?: PaginationMeta;
}

/** GET /api/admin/transaction-admin – coin transaction history visible to admin */
export async function getAdminCoinHistory(
  query?: Record<string, string>
): Promise<CoinHistoryResponse> {
  const qs = query ? "?" + new URLSearchParams(query).toString() : "";
  const data = await authFetch<{ result: CoinHistoryResponse | CoinHistoryEntry[] }>(
    `/api/admin/transaction-admin${qs}`
  );
  if (Array.isArray(data.result)) return { data: data.result };
  return data.result;
}

/** GET /api/admin/transaction-portal-user/:userId – per-portal-user history */
export async function getPortalUserCoinHistory(
  userId: string,
  query?: Record<string, string>
): Promise<CoinHistoryResponse> {
  const qs = query ? "?" + new URLSearchParams(query).toString() : "";
  const data = await authFetch<{ result: CoinHistoryResponse | CoinHistoryEntry[] }>(
    `/api/admin/transaction-portal-user/${userId}${qs}`
  );
  if (Array.isArray(data.result)) return { data: data.result };
  return data.result;
}

// ─── Coin Exchange (Coins → Diamonds) ─────────────────────────────────────────
// Base: /api/coin-exchange. Admin manages the exchange packages and views
// the global transaction history; the actual exchange + my-history are
// app-facing.

export interface ExchangeOption {
  _id: string;
  // User SPENDS diamondsRequired, RECEIVES coinsAwarded (+ bonusCoins).
  diamondsRequired: number;
  coinsAwarded: number;
  bonusCoins: number;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExchangeTransaction {
  _id: string;
  userId: string;
  exchangeOptionId: string;
  diamondsDeducted: number;
  coinsAwarded: number;
  bonusCoins: number;
  idempotencyKey?: string;
  createdAt?: string;
}

/** GET /api/coin-exchange – all exchange packages (sorted by displayOrder). */
export async function getExchangeOptions(): Promise<ExchangeOption[]> {
  const data = await authFetch<{ result: ExchangeOption[] }>(`/api/coin-exchange`);
  return Array.isArray(data.result) ? data.result : [];
}

/** POST /api/coin-exchange – create a package (admin). */
export async function createExchangeOption(payload: {
  diamondsRequired: number;
  coinsAwarded: number;
  bonusCoins?: number;
  isActive?: boolean;
  displayOrder: number;
}): Promise<ExchangeOption> {
  const data = await authFetch<{ result: ExchangeOption }>(`/api/coin-exchange`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.result;
}

/** PUT /api/coin-exchange/:id – partial update (admin). */
export async function updateExchangeOption(
  id: string,
  payload: Partial<{
    diamondsRequired: number;
    coinsAwarded: number;
    bonusCoins: number;
    isActive: boolean;
    displayOrder: number;
  }>
): Promise<ExchangeOption> {
  const data = await authFetch<{ result: ExchangeOption }>(
    `/api/coin-exchange/${id}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  return data.result;
}

/** DELETE /api/coin-exchange/:id – remove a package (admin). */
export async function deleteExchangeOption(id: string): Promise<void> {
  await authFetch(`/api/coin-exchange/${id}`, { method: "DELETE" });
}

/** GET /api/coin-exchange/history – global exchange transactions (admin). */
export async function getExchangeHistory(): Promise<ExchangeTransaction[]> {
  const data = await authFetch<{ result: ExchangeTransaction[] }>(
    `/api/coin-exchange/history`
  );
  return Array.isArray(data.result) ? data.result : [];
}

// ─── Coin Purchase Options (in-app coin packages) ─────────────────────────────
// Base: /api/coin-purchase. Admin manages the coin packages shown in the app's
// shop UI; actual purchasing via Google Play Billing is not yet implemented.

export interface CoinPurchaseOption {
  _id: string;
  productId: string;
  coinAmount: number;
  bonusCoins: number;
  price: number;
  currency: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /api/coin-purchase – all coin packages (sorted by displayOrder). */
export async function getCoinPurchaseOptions(): Promise<CoinPurchaseOption[]> {
  const data = await authFetch<{ result: CoinPurchaseOption[] }>(`/api/coin-purchase`);
  return Array.isArray(data.result) ? data.result : [];
}

/** POST /api/coin-purchase – create a coin package (admin). */
export async function createCoinPurchaseOption(payload: {
  productId: string;
  coinAmount: number;
  bonusCoins?: number;
  price: number;
  currency?: string;
  isActive?: boolean;
  displayOrder: number;
}): Promise<CoinPurchaseOption> {
  const data = await authFetch<{ result: CoinPurchaseOption }>(`/api/coin-purchase`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.result;
}

/** PUT /api/coin-purchase/:id – partial update (admin). */
export async function updateCoinPurchaseOption(
  id: string,
  payload: Partial<{
    productId: string;
    coinAmount: number;
    bonusCoins: number;
    price: number;
    currency: string;
    isActive: boolean;
    displayOrder: number;
  }>
): Promise<CoinPurchaseOption> {
  const data = await authFetch<{ result: CoinPurchaseOption }>(
    `/api/coin-purchase/${id}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  return data.result;
}

/** DELETE /api/coin-purchase/:id – remove a coin package (admin). */
export async function deleteCoinPurchaseOption(id: string): Promise<void> {
  await authFetch(`/api/coin-purchase/${id}`, { method: "DELETE" });
}

// ─── XP System (Admin) ────────────────────────────────────────────────────────
// XP config (level thresholds, coin→XP divisor, SVIP multipliers) plus the
// per-user XP grant. NOTE: the xp-config endpoints use a `{ status, data }`
// envelope (like rocket-config), while the user XP update uses `{ result }`.

export interface SvipMultiplier {
  minLevel: number;
  multiplier: number;
}

export interface XpConfig {
  _id?: string;
  xpLevels: number[];
  giftSendXp: number;
  svipMultipliers: SvipMultiplier[];
  createdAt?: string;
  updatedAt?: string;
}

/** GET /api/admin/xp-config – current XP configuration (cached server-side). */
export async function getXpConfig(): Promise<XpConfig | null> {
  const data = await authFetch<{ data: XpConfig | null }>(`/api/admin/xp-config`);
  return data.data ?? null;
}

/** POST /api/admin/xp-config – partial update; server refreshes its cache. */
export async function updateXpConfig(
  payload: Partial<Pick<XpConfig, "xpLevels" | "giftSendXp" | "svipMultipliers">>
): Promise<XpConfig> {
  const data = await authFetch<{ data: XpConfig }>(`/api/admin/xp-config`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.data;
}

/**
 * PUT /api/admin/users/xp/:userId – increase a user's XP and recalculate their
 * level. Returns the new total and level.
 */
export async function updateUserXp(
  userId: string,
  xpAmount: number
): Promise<{ totalEarnedXp: number; level: number }> {
  const data = await authFetch<{ result: { totalEarnedXp: number; level: number } }>(
    `/api/admin/users/xp/${userId}`,
    { method: "PUT", body: JSON.stringify({ xpAmount }) }
  );
  return data.result;
}

// ─── Medals (Admin) ───────────────────────────────────────────────────────────
// Achievement badges tied to a level (one medal per level). Create/update use
// multipart/form-data for the icon upload; list/delete use JSON.

export interface Medal {
  _id: string;
  name: string;
  level: number;
  icon: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RetroactiveAwardResult {
  totalAwarded: number;
  medalsAwarded: Array<{ medalName: string; level: number; count: number }>;
}

/** GET /api/medals – all medals, sorted by level ascending. */
export async function getMedals(): Promise<Medal[]> {
  const data = await authFetch<{ result: Medal[] }>(`/api/medals`);
  return Array.isArray(data.result) ? data.result : [];
}

/** POST /api/medals – create a medal (icon required). */
export async function createMedal(payload: {
  name: string;
  level: number;
  iconFile: File;
  description?: string;
}): Promise<Medal> {
  const token = getToken();
  const form = new FormData();
  form.append("name", payload.name);
  form.append("level", String(payload.level));
  form.append("icon", payload.iconFile);
  if (payload.description) form.append("description", payload.description);

  const res = await fetch(`${API_BASE}/api/medals`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create medal");
  return data.result as Medal;
}

/** PUT /api/medals/:id – partial update; icon optional (safe swap server-side). */
export async function updateMedal(
  id: string,
  payload: {
    name?: string;
    level?: number;
    description?: string;
    iconFile?: File | null;
  }
): Promise<Medal> {
  const token = getToken();
  const form = new FormData();
  if (payload.name !== undefined) form.append("name", payload.name);
  if (payload.level !== undefined) form.append("level", String(payload.level));
  if (payload.description !== undefined) form.append("description", payload.description);
  if (payload.iconFile) form.append("icon", payload.iconFile);

  const res = await fetch(`${API_BASE}/api/medals/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update medal");
  return data.result as Medal;
}

/** DELETE /api/medals/:id – removes the medal + cleans up user references. */
export async function deleteMedal(id: string): Promise<void> {
  await authFetch(`/api/medals/${id}`, { method: "DELETE" });
}

/** POST /api/medals/retroactive – bulk-award medals to existing qualifying users. */
export async function runRetroactiveMedalAward(): Promise<RetroactiveAwardResult> {
  const data = await authFetch<{ result: RetroactiveAwardResult }>(
    `/api/medals/retroactive`,
    { method: "POST" }
  );
  return data.result;
}

// ─── Family Rewards ──────────────────────────────────────────────────────────

export interface FamilyRewardItem {
  itemId: string;
  duration: number;
  isExclusive: boolean;
}

export interface FamilyRewardConfig {
  _id: string;
  rank?: number;
  startRank?: number;
  endRank?: number;
  items: (FamilyRewardItem & { itemName?: string; itemImage?: string })[];
  starRating: number;
  label: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/family-rewards/admin – list all reward configs. */
export async function getFamilyRewardConfigs(): Promise<FamilyRewardConfig[]> {
  const data = await authFetch<{ result: FamilyRewardConfig[] }>("/api/family-rewards/admin");
  return Array.isArray(data.result) ? data.result : [];
}

/** POST /api/family-rewards/admin – create a reward config. */
export async function createFamilyRewardConfig(payload: {
  rank?: number;
  startRank?: number;
  endRank?: number;
  items: { itemId: string; duration: number; isExclusive: boolean }[];
  starRating: number;
  label: string;
}): Promise<FamilyRewardConfig> {
  const data = await authFetch<{ result: FamilyRewardConfig }>("/api/family-rewards/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.result;
}

/** PUT /api/family-rewards/admin/:id – update a reward config. */
export async function updateFamilyRewardConfig(
  id: string,
  payload: Partial<{
    rank: number;
    startRank: number;
    endRank: number;
    items: { itemId: string; duration: number; isExclusive: boolean }[];
    starRating: number;
    label: string;
  }>
): Promise<FamilyRewardConfig> {
  const data = await authFetch<{ result: FamilyRewardConfig }>(`/api/family-rewards/admin/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.result;
}

/** DELETE /api/family-rewards/admin/:id – delete a reward config. */
export async function deleteFamilyRewardConfig(id: string): Promise<void> {
  await authFetch(`/api/family-rewards/admin/${id}`, { method: "DELETE" });
}

// ─── Family Support Rewards ──────────────────────────────────────────────────

export interface FamilySupportReward {
  level: number;
  targetPoints: number;
  totalBonus: number;
  leaderCut: number;
  top1Cut: number;
  top2Cut: number;
  top3Cut: number;
  top4To10Cut: number;
  top11To15Cut: number;
  top16To20Cut: number;
  minContributionRequired: number;
}

/** GET /api/admin/family-support-rewards – list all levels. */
export async function getFamilySupportRewards(): Promise<FamilySupportReward[]> {
  const data = await authFetch<{ result: FamilySupportReward[] }>("/api/admin/family-support-rewards");
  return Array.isArray(data.result) ? data.result : [];
}

/** GET /api/admin/family-support-rewards/:level – get a single level. */
export async function getFamilySupportRewardByLevel(level: number): Promise<FamilySupportReward> {
  const data = await authFetch<{ result: FamilySupportReward }>(`/api/admin/family-support-rewards/${level}`);
  return data.result;
}

/** PUT /api/admin/family-support-rewards/:level – update a level. */
export async function updateFamilySupportReward(
  level: number,
  payload: Partial<Omit<FamilySupportReward, "level">>
): Promise<FamilySupportReward> {
  const data = await authFetch<{ result: FamilySupportReward }>(`/api/admin/family-support-rewards/${level}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.result;
}

// ─── Store Items (browse API) ────────────────────────────────────────────────

/** GET /api/store/items/browse?canUserBuyThis=bool – items grouped by category. */
export async function browseStoreItems(
  canUserBuyThis: boolean
): Promise<Record<string, StoreItem[]>> {
  const token = getToken();
  const res = await fetch(
    `${API_BASE}/api/store/items/browse?canUserBuyThis=${canUserBuyThis}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (res.status === 401) {
    _forceLogout();
    throw new Error("Session expired — please sign in again");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch store items");
  return data.result ?? {};
}

// ─── SVIP Users by Tier ─────────────────────────────────────────────────────

export interface SvipUser {
  _id: string;
  userId: { _id: string; name: string; avatar: string };
  currentTier: number;
  monthlyRechargeCoins: number;
  tierStartOfMonth: number;
  month: number;
  year: number;
}

/** GET /api/svip/users?tier=N&page=N&limit=N – paginated users for a given SVIP tier. */
export async function getSvipUsers(params: {
  tier: number;
  page?: number;
  limit?: number;
}): Promise<{ users: SvipUser[]; pagination: PaginationMeta }> {
  if (!BACKEND_URL) {
    alert("NEXT_PUBLIC_API_URL is not configured. Cannot fetch SVIP users.");
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  const query = new URLSearchParams({
    tier: String(params.tier),
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
  });
  const token = getToken();
  const res = await fetch(
    `${BACKEND_URL}/api/svip/users?${query.toString()}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (res.status === 401) {
    _forceLogout();
    throw new Error("Session expired — please sign in again");
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch SVIP users");
  const body = json.data ?? {};
  return {
    users: body.users ?? [],
    pagination: body.pagination ?? {
      total: 0, limit: params.limit ?? 10,
      page: params.page ?? 1, totalPage: 0,
    },
  };
}

// ─── SVIP Config ───────────────────────────────────────────────────────────

export interface SvipTierConfig {
  tier: number;
  milestoneCoins: number;
  storeItemId?: string | null;
}

export interface SvipConfig {
  tiers: SvipTierConfig[];
  retentionThreshold: number;
}

/** GET /api/svip/config – fetch SVIP tier configuration. */
export async function getSvipConfig(): Promise<SvipConfig> {
  if (!BACKEND_URL) {
    alert("NEXT_PUBLIC_API_URL is not configured.");
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  const token = getToken();
  const res = await fetch(`${BACKEND_URL}/api/svip/config`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    _forceLogout();
    throw new Error("Session expired — please sign in again");
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch SVIP config");
  const body = json.data ?? {};
  return {
    tiers: body.tiers ?? [],
    retentionThreshold: body.retentionThreshold ?? 0.5,
  };
}

/** PUT /api/svip/config – update SVIP tier configuration (full replace). */
export async function updateSvipConfig(payload: {
  tiers: { tier: number; milestoneCoins: number }[];
  retentionThreshold?: number;
}): Promise<SvipConfig> {
  if (!BACKEND_URL) {
    alert("NEXT_PUBLIC_API_URL is not configured.");
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  const token = getToken();
  const res = await fetch(`${BACKEND_URL}/api/svip/config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    _forceLogout();
    throw new Error("Session expired — please sign in again");
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update SVIP config");
  const body = json.data ?? {};
  return {
    tiers: body.tiers ?? [],
    retentionThreshold: body.retentionThreshold ?? 0.5,
  };
}
