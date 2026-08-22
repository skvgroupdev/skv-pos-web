import api from "@/lib/api";
import type { FinancialOrder } from "@/api/financial";

// Types
export interface DebtTransaction {
    _id: string;
    customer: {
        _id: string;
        name: string;
        phone: string;
    };
    order?: {
        _id: string;
        orderId: string;
        total: number;
        saleMode?: "retail" | "wholesale";
        paymentMethod?: string;
    };
    type: "CREDIT" | "DEBIT";
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    note?: string;
    processedBy?: {
        _id: string;
        username: string;
        role: string;
    };
    paymentMethod?: "CASH" | "TRANSFER" | "MIXED" | "ADJUSTMENT";
    receiptNumber?: string;
    reference?: string;
    paymentBreakdown?: Array<{
        method: "CASH" | "TRANSFER";
        currency: string;
        amount: number;
        rate: number;
        amountInLAK: number;
        reference?: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface PayDebtRequest {
    customerId: string;
    amount: number;
    orderId?: string;
    paymentMethod: "CASH" | "TRANSFER" | "MIXED";
    cashierId?: string;
    reference?: string;
    note?: string;
    payments?: Array<{
        method: "CASH" | "TRANSFER";
        currency: string;
        amount: number;
        rate: number;
        amountInLAK: number;
        reference?: string;
    }>;
}

export interface PayDebtResponse {
    success: boolean;
    newDebt: number;
    receiptNumber: string;
    processedBy: string;
    transactionId?: string;
}

export interface DebtTransactionsResponse {
    transactions: DebtTransaction[];
    total: number;
    page: number;
    totalPages: number;
    analytics: {
        total: {
            totalAmount: number;
            count: number;
        };
        byMethod: Array<{
            _id: string;
            total: number;
            count: number;
        }>;
        byCashier: Array<{
            _id: string;
            total: number;
            count: number;
            cashier?: {
                _id: string;
                username: string;
                role: string;
            };
        }>;
    };
}

export interface CashierDebtSummary {
    summary: Array<{
        _id: string;
        total: number;
        count: number;
    }>;
    recentTransactions: DebtTransaction[];
}

// API Functions

/**
 * Pay/Repay customer debt
 */
export const payDebt = async (data: PayDebtRequest): Promise<PayDebtResponse> => {
    const res = await api.post('/debt/repay', data, {
        headers: { "Idempotency-Key": crypto.randomUUID() },
    });
    return res.data;
};

/**
 * Get debt transaction history for a specific customer
 */
export const getDebtHistory = async (customerId: string, params?: { cashierId?: string }): Promise<DebtTransaction[]> => {
    const res = await api.get(`/debt/history/${customerId}`, { params });
    return res.data;
};

/**
 * Get all debt transactions with filters (Shop Owner)
 */
export const getDebtTransactions = async (params?: {
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    paymentMethod?: string;
    saleMode?: "retail" | "wholesale";
    page?: number;
    limit?: number;
}): Promise<DebtTransactionsResponse> => {
    const res = await api.get('/debt/transactions', { params });
    return res.data;
};

export const getDebtOrderDetails = async (orderId: string): Promise<FinancialOrder> => {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
};

export interface DebtorRow {
    _id: string;
    name: string;
    phone: string;
    totalDebt: number;
    lastPaymentDate?: string;
    unpaidOrders: number;
    oldestDebt?: string;
    orderDebt: number;
}

export const getDebtors = async (params: { search?: string; page?: number; limit?: number; cashierId?: string }) => {
    const res = await api.get<{
        data: DebtorRow[];
        total: number;
        page: number;
        totalPages: number;
        summary: { totalDebt: number; customers: number };
    }>("/debt/customers", { params });
    return res.data;
};

/**
 * Get cashier's debt collection summary
 */
export const getCashierDebtSummary = async (params?: {
    startDate?: string;
    endDate?: string;
}): Promise<CashierDebtSummary> => {
    const res = await api.get('/debt/cashier-summary', { params });
    return res.data;
};

/**
 * Get DebtTransactions for a specific order (by 10-digit orderId)
 */
export const getOrderDebtHistory = async (orderId: string): Promise<DebtTransaction[]> => {
    const res = await api.get(`/debt/order-history/${orderId}`);
    return res.data;
};
