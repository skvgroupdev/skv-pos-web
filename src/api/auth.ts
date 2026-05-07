import api from "./axios";

export const login = async (credentials: { username: string; password: string }) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};
