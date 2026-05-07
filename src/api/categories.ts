import api from "./axios";

export interface Category {
    _id: string;
    name: string;
    description?: string;
}

export const getCategories = async () => {
    const response = await api.get("/categories");
    return response.data;
};

// Create new category
export const createCategory = async (name: string) => {
    const response = await api.post("/categories", { name });
    return response.data;
};

// Touch category
export const touchCategory = async (name: string) => {
    const response = await api.post("/categories/touch", { name });
    return response.data;
};

// Update category
export const updateCategory = async (id: string, name: string) => {
    const response = await api.put(`/categories/${id}`, { name });
    return response.data;
};

// Delete category
export const deleteCategory = async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
};

