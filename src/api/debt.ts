import api from "@/lib/api";

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
    createdAt: string;
    updatedAt: string;
}

export interface PayDebtRequest {
    customerId: string;
    amount: number;
    orderId?: string;
    paymentMethod: "CASH" | "TRANSFER" | "MIXED";
    reference?: string;
    note?: string;
}

export interface PayDebtResponse {
    success: boolean;
    newDebt: number;
    receiptNumber: string;
    processedBy: string;
}

export interface DebtTransactionsResponse {
    transactions: DebtTransaction[];
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
    const res = await api.post('/debt/repay', data);
    return res.data;
};

/**
 * Get debt transaction history for a specific customer
 */
export const getDebtHistory = async (customerId: string): Promise<DebtTransaction[]> => {
    const res = await api.get(`/debt/history/${customerId}`);
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
}): Promise<DebtTransactionsResponse> => {
    const res = await api.get('/debt/transactions', { params });
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
