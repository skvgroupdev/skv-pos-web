import axios from "@/api/axios";

// Orders
export interface OrderItem {
    product: string;
    quantity: number;
    price: number;
    cost: number;
    name: string;
}

export interface CreateOrderDto {
    items: OrderItem[];
    total: number;
    paymentMethod: "CASH" | "TRANSFER" | "DEBT";
    paidAmount: number;
    customerId?: string;
}

export const createOrder = async (order: any) => {
    const response = await axios.post("/orders", order);
    return response.data;
};

// Customers
export interface Customer {
    _id: string;
    name: string;
    phone: string;
    address?: string;
    totalDebt: number;
    lastPaymentDate?: string;
}

export const getCustomers = async (search?: string) => {
    const response = await axios.get(`/customers${search ? `?search=${search}` : ''}`);
    return response.data;
};

export const createCustomer = async (data: { name: string, phone: string, address?: string }) => {
    const response = await axios.post("/customers", data);
    return response.data;
};

export const updateCustomer = async (id: string, data: { name: string, phone: string, address?: string }) => {
    const response = await axios.put(`/customers/${id}`, data);
    return response.data;
};

export const deleteCustomer = async (id: string) => {
    const response = await axios.delete(`/customers/${id}`);
    return response.data;
};

export const getCustomerStats = async (customerId: string) => {
    const response = await axios.get(`/customers/${customerId}/stats`);
    return response.data;
};

// Moved to @/api/debt.ts - use payDebt from there instead
// export const payDebt = ...

export const getDebtHistory = async (customerId: string) => {
    const response = await axios.get(`/debt/history/${customerId}`);
    return response.data;
};

export const getUnpaidOrders = async (customerId: string) => {
    const response = await axios.get(`/orders?customerId=${customerId}&paymentStatus=UNPAID_ALL`);
    return response.data;
};

export const getOrders = async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null) {
                if (filters[key] instanceof Date) {
                    params.append(key, filters[key].toISOString());
                } else {
                    params.append(key, filters[key].toString());
                }
            }
        });
    }
    
    const response = await axios.get(`/orders?${params.toString()}`);
    return response.data;
};

export const cancelOrder = async (orderId: string) => {
    const response = await axios.post(`/orders/${orderId}/cancel`);
    return response.data;
};

export const getDashboardStats = async () => {
    const response = await axios.get('/orders/dashboard-stats');
    return response.data;
};

// Bill Manager Professional Features
export const addPaymentToOrder = async (orderId: string, payment: { 
    amount: number; 
    currency?: string; 
    rate?: number; 
    note?: string 
}) => {
    const response = await axios.post(`/orders/${orderId}/add-payment`, payment);
    return response.data;
};

export const getOrderPayments = async (orderId: string) => {
    const response = await axios.get(`/orders/${orderId}/payments`);
    return response.data;
};

export const addOrderNote = async (orderId: string, note: string) => {
    const response = await axios.post(`/orders/${orderId}/note`, { note });
    return response.data;
};
