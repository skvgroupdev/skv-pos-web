import { API_BASE_URL } from "@/lib/constant";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function forceLogout() {
  useAuthStore.getState().logout();
  // Replace instead of push so the user can't go back
  window.location.replace("/login");
}

const api = axios.create({
  baseURL: API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request: attach token + enforce daily session limit
api.interceptors.request.use(
  (config) => {
    const token   = localStorage.getItem("token");
    const loginAt = parseInt(localStorage.getItem("loginAt") || "0");

    if (token) {
      // Force re-login after 24 hours
      if (loginAt && Date.now() - loginAt > ONE_DAY_MS) {
        forceLogout();
        return Promise.reject(new Error("session_expired"));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: catch 401 from backend (token invalid / expired on server side)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export default api;
