import { create } from "zustand";

interface User {
  id: string;
  _id?: string;
  username: string;
  roles: string[];
  tenantId: string;
  subscriptionPlan?: 'BASIC' | 'PRO' | 'ENTERPRISE';
}

interface AuthState {
  user: User | null;
  token: string | null;
  loginAt: number | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const normalizeUser = (user: User | null): User | null => {
  if (!user) return null;
  return {
    ...user,
    id: user.id || user._id || "",
  };
};

const getStoredUser = (): User | null => {
  try {
    return normalizeUser(JSON.parse(localStorage.getItem("user") || "null"));
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem("token"),
  loginAt: parseInt(localStorage.getItem("loginAt") || "0") || null,
  setUser: (user) => {
    const normalizedUser = normalizeUser(user);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    set({ user: normalizedUser });
  },
  setToken: (token) => {
    if (token) {
      const now = Date.now();
      localStorage.setItem("token", token);
      localStorage.setItem("loginAt", String(now));
      set({ token, loginAt: now });
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("loginAt");
      set({ token: null, loginAt: null });
    }
  },
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("loginAt");
    set({ user: null, token: null, loginAt: null });
  },
}));
