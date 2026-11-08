import api from "./axios";

export type PlatformDashboard = {
  totalTenants: number;
  groceryTenants: number;
  restaurantTenants: number;
  activeTenants: number;
};

export const getPlatformDashboard = async () => {
  const { data } = await api.get<PlatformDashboard>("/platform/dashboard");
  return data;
};
