import api from "./axios";

export interface Unit {
    _id: string;
    name: string;
    symbol?: string;
}

export const getUnits = async () => {
  const response = await api.get("/units");
  return response.data; // Assuming it returns a list or { data: [...] }
}
export const createUnit = async (name: string) => {
  const response = await api.post("/units", { name });
  return response.data;
};

// Touch unit
export const touchUnit = async (name: string) => {
    const response = await api.post("/units/touch", { name });
    return response.data;
};

// Update unit
export const updateUnit = async (id: string, name: string) => {
    const response = await api.put(`/units/${id}`, { name });
    return response.data;
};

// Delete unit
export const deleteUnit = async (id: string) => {
    const response = await api.delete(`/units/${id}`);
    return response.data;
};

