import api from "./axios";

export const getTenant = async () => {
    const response = await api.get('/tenants/me');
    return response.data;
};

export const updateTenant = async (data: any) => {
    const response = await api.put('/tenants/me', data);
    return response.data;
};
