"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  AuthUser,
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  loginAdmin,
  loginPortalUser,
  getAdminProfile,
  getPortalUserProfile,
} from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (
    username: string,
    password: string,
    mode?: "admin" | "portal" | "auto"
  ) => Promise<void>;
  logout: () => void;
  /** Re-fetch the current profile from the backend and sync localStorage. */
  refreshUser: () => Promise<void>;
  /** Directly update user state + localStorage (after a successful profile update). */
  updateUser: (updated: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount, then silently refresh from backend
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser();
    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUser(storedUser);
      // Refresh in background so coins / profile stay fresh. Pass
      // `silent` so a transient failure here does NOT force-logout —
      // the stored session stays valid and the user isn't bounced to
      // login on every reload.
      const role = storedUser.userRole;
      const fetchFresh = role?.toLowerCase() === "admin" ? getAdminProfile : getPortalUserProfile;
      fetchFresh(true).then((fresh) => {
        setStoredUser(fresh);
        setUser(fresh);
      }).catch(() => { /* keep stale data on error */ });
    }
    setLoading(false);
  }, []);

  /**
   * Login strategy:
   *  - admin  => only /api/admin/login attempts
   *  - portal => only /api/power-shared/auth attempts
   *  - auto   => try admin first, then portal
   */
  const login = async (
    identifier: string,
    password: string,
    mode: "admin" | "portal" | "auto" = "auto"
  ): Promise<void> => {
    const localPart = identifier.includes("@") ? identifier.split("@")[0] : null;

    const adminAttempts: Array<() => Promise<{ user: AuthUser; token: string }>> = [
      () => loginAdmin(identifier, password),
      ...(localPart ? [() => loginAdmin(localPart, password)] : []),
    ];

    const portalAttempts: Array<() => Promise<{ user: AuthUser; token: string }>> = [
      () => loginPortalUser(identifier, password),
      ...(localPart ? [() => loginPortalUser(localPart, password)] : []),
    ];

    const attempts: Array<() => Promise<{ user: AuthUser; token: string }>> =
      mode === "admin"
        ? adminAttempts
        : mode === "portal"
          ? portalAttempts
          : [...adminAttempts, ...portalAttempts];

    let lastError: Error = new Error("Login failed");
    for (const attempt of attempts) {
      try {
        const result = await attempt();
        setToken(result.token);
        setStoredUser(result.user);
        setTokenState(result.token);
        setUser(result.user);
        return;
      } catch (e: unknown) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }
    throw lastError;
  };

  const logout = () => {
    removeToken();
    removeStoredUser();
    setTokenState(null);
    setUser(null);
  };

  /** Pull fresh profile from backend and update state + localStorage. */
  const refreshUser = async (): Promise<void> => {
    const currentUser = getStoredUser();
    if (!currentUser) return;
    try {
      const fresh = currentUser.userRole?.toLowerCase() === "admin"
        ? await getAdminProfile()
        : await getPortalUserProfile();
      setStoredUser(fresh);
      setUser(fresh);
    } catch {
      // ignore refresh errors — stale data is fine
    }
  };

  const updateUser = (updated: AuthUser) => {
    setStoredUser(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isLoggedIn: !!token, login, logout, refreshUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
