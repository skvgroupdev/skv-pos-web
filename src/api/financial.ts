import api from "@/lib/api";

export interface PaymentLine {
    method: "CASH" | "TRANSFER";
    currency: string;
    amount: number;
    rate: number;
    amountInLAK: number;
    reference?: string;
}

export interface FinancialOrderItem {
    product: string;
    name: string;
    quantity: number;
    price: number;
    cost?: number;
}

export interface FinancialOrder {
    _id: string;
    orderId: string;
    total: number;
    paidAmount: number;
    change: number;
    remainingAmount: number;
    status: "COMPLETED" | "CANCELLED";
    paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
    saleMode?: "retail" | "wholesale";
    cancelReason?: string;
    items: FinancialOrderItem[];
}

export interface FinancialActivity {
    _id: string;
    transactionId: string;
    sourceType: "SALE" | "DEBT_REPAYMENT" | "REFUND" | "REVERSAL";
    direction: "IN" | "OUT";
    order?: FinancialOrder;
    customer?: { _id: string; name: string; phone?: string };
    processedBy?: { _id: string; username: string; employeeCode?: string };
    approvedBy?: { _id: string; username: string };
    paymentMethod: "CASH" | "TRANSFER" | "MIXED";
    payments: PaymentLine[];
    grossReceivedInLAK: number;
    appliedAmountInLAK: number;
    changeInLAK: number;
    note?: string;
    reasonCode?: string;
    status: "POSTED" | "REVERSED";
    migrationStatus: "COMPLETE" | "INCOMPLETE";
    createdAt: string;
}

export interface FinancialResponse {
    data: FinancialActivity[];
    total: number;
    page: number;
    totalPages: number;
    summary: { moneyIn: number; moneyOut: number; change: number; count: number; net: number };
}

export interface OrderReturnItem {
    product: string;
    name: string;
    quantity: number;
    price: number;
    condition: "SELLABLE" | "DAMAGED" | "DEFECTIVE" | "INCOMPLETE";
    disposition: "NO_RESTOCK" | "RESTOCK_APPROVED" | "WRITE_OFF";
}

export interface OrderReturnRecord {
    _id: string;
    returnId: string;
    order?: { _id: string; orderId: string; total: number };
    items: OrderReturnItem[];
    refundAmount: number;
    reasonCode: string;
    note?: string;
    createdAt: string;
}

export const getFinancialActivities = async (params: Record<string, string | number | undefined>) => {
    const response = await api.get<FinancialResponse>("/financial-transactions", { params });
    return response.data;
};

export const createOrderReturn = async (data: {
    orderId: string;
    items: Array<{ productId: string; quantity: number; condition: string }>;
    reasonCode: string;
    note?: string;
    refundAmount: number;
    refundPaymentMethod: "CASH" | "TRANSFER";
    refundPayments?: PaymentLine[];
}) => {
    const response = await api.post("/returns", data, {
        headers: { "Idempotency-Key": crypto.randomUUID() },
    });
    return response.data;
};

export const getOrderReturns = async (params: { page?: number; limit?: number; orderId?: string } = {}) => {
    const response = await api.get("/returns", { params });
    return response.data as { data: OrderReturnRecord[]; total: number; page: number; totalPages: number };
};

export const restockReturnItem = async (returnId: string, productId: string, note: string) => {
    const response = await api.post(`/returns/${returnId}/items/${productId}/restock`, { note });
    return response.data;
};
