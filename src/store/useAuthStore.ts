import { create } from "zustand";

interface User {
  id: string;
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

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  loginAt: parseInt(localStorage.getItem("loginAt") || "0") || null,
  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
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
