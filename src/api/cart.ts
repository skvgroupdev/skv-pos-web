import api from "./axios";
import type { Customer } from "./pos";
import type { Product } from "./products";
import type { POSSaleMode } from "@/pages/pos/posSaleMode";

export interface CartItem {
    _id: string; 
    product: Product;
    quantity: number;
    price: number;
    costPrice?: number;
}

export interface Cart {
    _id: string;
    items: CartItem[];
    tenantId: string;
    userId: string;
    name: string;
    updatedAt: string;
    total: number;
    customer?: Customer;
}

export const getCarts = async (): Promise<Cart[]> => {
    const response = await api.get("/cart");
    return response.data;
};

export const createCart = async (): Promise<Cart[]> => {
    const response = await api.post("/cart");
    return response.data;
};

export const addToCart = async (cartId: string, productId: string, quantity: number, price: number): Promise<Cart[]> => {
    const response = await api.post("/cart/add", { cartId, productId, quantity, price });
    return response.data;
};

export const updateCartPrices = async (cartId: string, saleMode: POSSaleMode): Promise<Cart[]> => {
    const response = await api.post("/cart/prices", { cartId, saleMode });
    return response.data;
};

export const removeFromCart = async (cartId: string, productId: string): Promise<Cart[]> => {
    const response = await api.post("/cart/remove", { cartId, productId });
    return response.data;
};

export const removeCart = async (cartId: string): Promise<Cart[]> => {
    const response = await api.delete(`/cart/${cartId}`);
    return response.data;
};

export const updateCartCustomer = async (cartId: string, customerId: string | null): Promise<Cart[]> => {
    const response = await api.post("/cart/customer", { cartId, customerId });
    return response.data;
};
