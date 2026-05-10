import api from "./axios";

export interface Catalog {
    No?: string;
    code?: string;
    page?: string;
    number?: string;
}

export interface ProductImageVariants {
    small: string;
    medium: string;
    original: string;
}

export interface Product {
    _id: string;
    name: string;
    description?: string;
    costPrice: number;
    costCurrency?: string;
    sellPrice: number;
    wholesalePrice?: number;
    stock: number;
    soldCount?: number;
    minStock?: number;
    unit: string;
    sku?: string;
    barcode?: string;
    supplier?: string;
    brand?: string;
    modelName?: string;
    category?: string;

    images?: string[];
    imageVariants?: ProductImageVariants[];
    status: "active" | "inactive";
    catalog?: Catalog;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductDto {
    name: string;
    description?: string;
    costPrice: number;
    costCurrency?: string;
    sellPrice: number;
    wholesalePrice?: number;
    stock: number;
    minStock?: number;
    unit: string;
    sku?: string;
    barcode?: string;
    supplier?: string;
    brand?: string;
    modelName?: string;
    category?: string;
    images?: string[];
    imageVariants?: ProductImageVariants[];
    status?: "active" | "inactive";
    catalog?: Catalog;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductFilters {
    category?: string;
    unit?: string;
    status?: string;
    stockLevel?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    catalogNo?: string;
    catalogCode?: string;
    catalogPage?: string;
    catalogNumber?: string;
}

export const getProducts = async (page = 1, limit = 10, search?: string, filters?: ProductFilters) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);

    if (filters) {
        if (filters.category && filters.category !== "all") params.append("category", filters.category);
        if (filters.unit && filters.unit !== "all") params.append("unit", filters.unit);
        if (filters.status && filters.status !== "all") params.append("status", filters.status);
        if (filters.stockLevel && filters.stockLevel !== "all") params.append("stockLevel", filters.stockLevel);
        if (filters.sort) params.append("sort", filters.sort);
        if (filters.minPrice) params.append("minPrice", filters.minPrice.toString());
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
        if (filters.catalogNo) params.append("catalogNo", filters.catalogNo);
        if (filters.catalogCode) params.append("catalogCode", filters.catalogCode);
        if (filters.catalogPage) params.append("catalogPage", filters.catalogPage);
        if (filters.catalogNumber) params.append("catalogNumber", filters.catalogNumber);
    }

    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
};

export const searchProducts = async (query: string) => {
    const response = await api.get(`/products/search?query=${query}`);
    return response.data;
};

export const createProduct = async (data: CreateProductDto) => {
    const response = await api.post("/products", data);
    return response.data;
};

export const updateProduct = async (id: string, data: UpdateProductDto) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
};

export const deleteProduct = async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

export const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ url: string }>("/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data.url;
};

export const uploadProductImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{
        url: string;
        images: ProductImageVariants;
    }>("/upload/products", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export interface InventoryTransaction {
    _id: string;
    type: "IN_PURCHASE" | "IN_RETURN" | "OUT_SALE" | "OUT_DAMAGE" | "ADJUST";
    quantity: number;
    cost: number;
    note?: string;
    date: string;
}

export const getProductTransactions = async (id: string): Promise<InventoryTransaction[]> => {
    const response = await api.get(`/products/${id}/transactions`);
    return response.data;
};

export const getGlobalTransactions = async (filters: { startDate?: string; endDate?: string; type?: string }): Promise<InventoryTransaction[]> => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.type && filters.type !== "ALL") params.append("type", filters.type);

    const response = await api.get(`/products/transactions/all?${params.toString()}`);
    return response.data;
};

export const adjustProductStock = async (id: string, data: { adjustment: number; type: string; note?: string; cost?: number }) => {
    const response = await api.post(`/products/${id}/stock`, data);
    return response.data;
};
