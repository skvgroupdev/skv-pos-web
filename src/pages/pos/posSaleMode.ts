export type POSSaleMode = "retail" | "wholesale";

export const saleModeConfig = {
    retail: {
        label: "ຂາຍຍ່ອຍ",
        shortLabel: "Retail",
        accentText: "text-sky-700",
        activeBg: "bg-sky-600",
        softBg: "bg-sky-50",
        softBorder: "border-sky-200",
        hoverBorder: "hover:border-sky-300",
        buttonSoft: "bg-sky-50 text-sky-700 hover:bg-sky-100",
        buttonSolid: "bg-sky-600 hover:bg-sky-700",
        sidebarActive: "bg-sky-600 text-white shadow-lg shadow-sky-950/20",
        sidebarIdle: "text-slate-400 hover:bg-sky-500/10 hover:text-sky-100",
    },
    wholesale: {
        label: "ຂາຍສົ່ງ",
        shortLabel: "Wholesale",
        accentText: "text-emerald-700",
        activeBg: "bg-emerald-600",
        softBg: "bg-emerald-50",
        softBorder: "border-emerald-200",
        hoverBorder: "hover:border-emerald-300",
        buttonSoft: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        buttonSolid: "bg-emerald-600 hover:bg-emerald-700",
        sidebarActive: "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20",
        sidebarIdle: "text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-100",
    },
} as const satisfies Record<POSSaleMode, Record<string, string>>;

export const getProductSalePrice = (product: { sellPrice: number; wholesalePrice?: number }, saleMode: POSSaleMode) => {
    if (saleMode === "wholesale" && product.wholesalePrice && product.wholesalePrice > 0) {
        return product.wholesalePrice;
    }

    return product.sellPrice;
};

export const isWholesalePriceFallback = (product: { wholesalePrice?: number }, saleMode: POSSaleMode) => {
    return saleMode === "wholesale" && (!product.wholesalePrice || product.wholesalePrice <= 0);
};
