import type { ReactNode } from "react";

export interface BillConfig {
    paperSize?: "58mm" | "80mm" | "A5" | "A4";
    showLogo: boolean;
    showQR: boolean;
    showNotes: boolean;
    fontSize: "small" | "medium" | "large";
}

export interface BillTenantInfo {
    shopName?: string;
    logo?: string | null;
    address?: string;
    phone?: string;
    bankName?: string;
    bankAccount?: string;
    bankQr?: string | null;
}

export interface BillCustomerInfo {
    name?: string;
    phone?: string;
    address?: string;
}

export interface BillCashierInfo {
    name?: string;
    username?: string;
}

export interface BillItem {
    name: string;
    quantity: number;
    price: number;
}

export interface BillNote {
    text?: string;
}

export interface BillPrintData {
    orderId: string;
    createdAt: string | Date;
    tenantId?: BillTenantInfo;
    tenantSnapshot?: BillTenantInfo;
    customerId?: BillCustomerInfo;
    cashierId?: BillCashierInfo;
    items?: BillItem[];
    total: number;
    discount?: number;
    paidAmount: number;
    change: number;
    paymentMethod: string;
    remainingAmount?: number;
    notes?: Array<BillNote | string>;
}

export const getBillTenant = (data: BillPrintData): BillTenantInfo => {
    return data.tenantSnapshot || data.tenantId || {};
};

export const formatBillNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

export const getPaymentMethodText = (method: string) => {
    if (method === "DEBT") return "ບໍ່ທັນຊຳລະ";
    if (method === "TRANSFER" || method === "QR") return "ເງິນໂອນ";
    return "ເງິນສົດ";
};

export const billPalette = {
    ink: "#0f172a",
    muted: "#64748b",
    border: "#dbeafe",
    surface: "#f8fbff",
    soft: "#eff6ff",
    accent: "#2563eb",
    accentDark: "#1d4ed8",
    danger: "#dc2626",
    success: "#047857",
};

export const sanitizeSvgForDisplay = (value: string) => {
    return value
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
        .replace(/\son\w+="[^"]*"/gi, "")
        .replace(/\son\w+='[^']*'/gi, "")
        .replace(/javascript:/gi, "");
};

export const renderBillMedia = (
    value: string | null | undefined,
    alt: string,
    fallback: string,
    className = "w-full h-full [&>svg]:w-full [&>svg]:h-full"
): ReactNode => {
    if (!value) return <span style={{ fontSize: "8px", color: "#cbd5e1" }}>{fallback}</span>;

    if (value.includes("<svg")) {
        return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeSvgForDisplay(value) }} />;
    }

    return <img src={value} alt={alt} className="object-contain w-full h-full" crossOrigin="anonymous" />;
};

export const getNoteText = (note: BillNote | string) => {
    return typeof note === "string" ? note : note.text || "";
};
