import api from "@/lib/api";

export interface QuotationItem {
    name: string;
    description?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    discountAmount: number;
    subtotal: number;
}

export interface Quotation {
    _id: string;
    quoteNumber: string;
    tenantSnapshot: {
        shopName?: string;
        logo?: string;
        address?: string;
        phone?: string;
        bankName?: string;
        bankAccount?: string;
    };
    customer: {
        name: string;
        company?: string;
        phone?: string;
        address?: string;
        email?: string;
    };
    items: QuotationItem[];
    subtotal: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    note?: string;
    terms?: string;
    validUntil?: string;
    status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface QuotationListResponse {
    items: Quotation[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateQuotationInput {
    customer: {
        name: string;
        company?: string;
        phone?: string;
        address?: string;
        email?: string;
    };
    items: Omit<QuotationItem, "subtotal">[];
    discountAmount?: number;
    taxRate?: number;
    note?: string;
    terms?: string;
    validUntil?: string;
    status?: "DRAFT" | "SENT";
}

export const getQuotations = async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<QuotationListResponse> => {
    const res = await api.get("/quotations", { params });
    return res.data;
};

export const getQuotation = async (id: string): Promise<Quotation> => {
    const res = await api.get(`/quotations/${id}`);
    return res.data;
};

export const createQuotation = async (data: CreateQuotationInput): Promise<Quotation> => {
    const res = await api.post("/quotations", data);
    return res.data;
};

export const updateQuotation = async (
    id: string,
    data: Partial<CreateQuotationInput> & { status?: Quotation["status"] }
): Promise<Quotation> => {
    const res = await api.put(`/quotations/${id}`, data);
    return res.data;
};

export const updateQuotationStatus = async (
    id: string,
    status: Quotation["status"]
): Promise<Quotation> => {
    const res = await api.patch(`/quotations/${id}/status`, { status });
    return res.data;
};

export const deleteQuotation = async (id: string): Promise<void> => {
    await api.delete(`/quotations/${id}`);
};
