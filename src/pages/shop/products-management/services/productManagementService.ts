import type { CreateProductDto, Product } from "@/api/products";

export interface ProductsResponse {
    data: Product[];
    pagination?: {
        total: number;
        totalPages: number;
    };
}

export interface ProductStats {
    lowStock: number;
    potentialProfit: number;
    projectedRevenue: number;
    totalProducts: number;
    totalValue: number;
}

export interface TenantSummary {
    subscriptionPlan?: "BASIC" | "PRO" | "ENTERPRISE";
}

export const PRODUCT_PAGE_LIMIT = 50;
export const PRODUCT_SEARCH_KEY = "product-search";
export const PRODUCT_FILTERS_KEY = "product-filters";

export const createEmptyProductForm = (barcode = ""): CreateProductDto => ({
    name: "",
    category: "",
    costPrice: 0,
    costCurrency: "LAK",
    sellPrice: 0,
    wholesalePrice: 0,
    stock: 0,
    minStock: 0,
    unit: "",
    barcode,
    brand: "",
    modelName: "",
    status: "active",
    description: "",
    supplier: "",
    sku: "",
    images: [],
    imageVariants: [],
    catalog: {
        No: "",
        code: "",
        page: "",
        number: "",
    },
});

export const createProductFormFromProduct = (product: Product): CreateProductDto => ({
    name: product.name,
    category: product.category || "",
    costPrice: product.costPrice,
    costCurrency: product.costCurrency || "LAK",
    sellPrice: product.sellPrice,
    wholesalePrice: product.wholesalePrice || 0,
    stock: product.stock,
    unit: product.unit,
    barcode: product.barcode || "",
    brand: product.brand || "",
    modelName: product.modelName || "",
    status: product.status || "active",
    description: product.description || "",
    supplier: product.supplier || "",
    sku: product.sku || "",
    minStock: product.minStock || 0,
    images: product.images || [],
    imageVariants: product.imageVariants || [],
    catalog: {
        No: product.catalog?.No || "",
        code: product.catalog?.code || "",
        page: product.catalog?.page || "",
        number: product.catalog?.number || "",
    },
});

export const getProductStats = (productsData?: ProductsResponse): ProductStats => {
    const products = productsData?.data || [];
    const totalProducts = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStock = products.filter((product) => {
        return product.stock <= (product.minStock || 0);
    }).length;
    const totalValue = products.reduce((sum, product) => {
        return sum + product.costPrice * product.stock;
    }, 0);
    const potentialProfit = products.reduce((sum, product) => {
        return sum + (product.sellPrice - product.costPrice) * product.stock;
    }, 0);
    const projectedRevenue = products.reduce((sum, p) => {
        return sum + (p.wholesalePrice && p.wholesalePrice > 0 ? p.wholesalePrice : p.sellPrice) * p.stock;
    }, 0);

    return { lowStock, potentialProfit, projectedRevenue, totalProducts, totalValue };
};

export const formatCurrency = (value: number) => {
    return `₭${value?.toLocaleString() || 0}`;
};

export const isBasicPlan = (tenant?: TenantSummary) => {
    return tenant?.subscriptionPlan === "BASIC";
};
