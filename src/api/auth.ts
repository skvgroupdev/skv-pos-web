import api from "./axios";

export const login = async (credentials: { username: string; password: string }) => {
  try {
    const { data } = await api.post("/auth/login", credentials);
    return data;
  } catch (tenantError) {
    const { data } = await api.post("/platform/auth/login", credentials);
    return data;
  }
};
