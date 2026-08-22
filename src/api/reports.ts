import api from "@/lib/api";

// Types
export interface DateRangeParams {
    startDate?: Date; // or string
    endDate?: Date;
    interval?: 'hourly' | 'daily' | 'monthly';
    limit?: number;
    cashierId?: string;
    saleMode?: 'retail' | 'wholesale';
}

export interface SummaryStats {
    grossSales?: number;
    grossBillSales?: number;
    totalSales: number;
    netSales?: number;
    netBillSales?: number;
    netSalesAfterAdjustments?: number;
    totalOrders: number;
    totalDebt?: number;
    totalDiscount: number;
    discountAmount?: number;
    totalCost?: number;
    avgOrderValue: number;
    billProfit?: number;
    netProfit?: number;
    cashRecognizedProfit?: number;
    reversalProfitImpact?: number;
    returnProfitImpact?: number;
    adjustmentProfitImpact?: number;
    netCashProfit?: number;
    netProfitAfterAdjustments?: number;
    /** Compatibility alias of netProfit. */
    totalProfit?: number;
    actualReceivedFromOrders?: number;
    cashInFromNewBills?: number;
    debtRepaymentIncome?: number;
    debtRepaymentCount?: number;
    totalIncomeToday?: number;
    moneyOut?: number;
    refundAmount?: number;
    reversalAmount?: number;
    netCashReceived?: number;
    netCashFlow?: number;
    cancelledOrders?: { count: number; amount?: number };
    returns?: { count: number; units: number; value?: number; damagedCost?: number };
    receivedBreakdown?: {
        currency: string;
        amount: number;
        amountInLAK: number;
    }[];
    receivedByMethod?: {
        method: "CASH" | "TRANSFER";
        totalReceived: number;
        transactionCount: number;
    }[];
    cashMovementByMethod?: {
        method: "CASH" | "TRANSFER";
        totalReceived: number;
        transactionCount: number;
    }[];
    paymentMethods?: {
        cash?: {
            received: number;
            sales: number;
            discount: number;
        };
        transfer?: {
            received: number;
            sales: number;
            discount: number;
        };
        debt?: {
            received: number;
            sales: number;
            discount: number;
        };
    };
    profitByCategory?: {
        category: string;
        revenue: number;
        cost: number;
        profit: number;
    }[];
    breakdownByMethod?: {
        method: string;
        totalSales: number;
        totalPaid: number;
        totalOrders: number;
        totalDebt: number;
        totalChange: number;
        totalDiscount: number;
        netRevenue: number;
    }[];
    breakdownBySaleMode: {
        mode: string;
        grossSales?: number;
        totalSales: number;
        netSales?: number;
        totalOrders: number;
        totalDiscount: number;
        totalCost?: number;
        netProfit?: number;
        /** Compatibility alias of netProfit. */
        totalProfit?: number;
        avgOrderValue: number;
    }[];
    hourlyBreakdown: {
        hour: number;
        orders: number;
        sales: number;
    }[];
}

export interface SalesTrend {
    date: string; // YYYY-MM-DD
    sales: number;
    orders: number;
    profit: number;
}

export interface TopProduct {
    _id: string; // Product ID
    name: string;
    sold: number;
    revenue: number;
}

export interface TopCustomer {
    name: string;
    phone: string;
    totalSpent: number;
    ordersCount: number;
    lastOrderDate: string;
}

export interface InventoryValuation {
    totalStock: number;
    totalItems: number;
    totalRetailValue: number;
    totalCostValue: number;
    lowStockCount: number;
    costBreakdown: {
        currency: string;
        value: number;
        count: number;
    }[];
    categoryBreakdown: {
        category: string;
        stockCount: number;
        productCount: number;
    }[];
}

// API Functions
export const getShopSummary = async (params: DateRangeParams): Promise<SummaryStats> => {
    const res = await api.get('/reports/summary', { params });
    return res.data;
};

export const getSalesTrends = async (params: DateRangeParams): Promise<SalesTrend[]> => {
    const res = await api.get('/reports/sales-trends', { params });
    return res.data;
};

export const getTopProducts = async (params: DateRangeParams): Promise<TopProduct[]> => {
    const res = await api.get('/reports/top-products', { params });
    return res.data;
};

export const getTopCustomers = async (params: DateRangeParams): Promise<TopCustomer[]> => {
    const res = await api.get('/reports/top-customers', { params });
    return res.data;
};

export const getInventoryValuation = async (): Promise<InventoryValuation> => {
    const res = await api.get('/reports/inventory-valuation');
    return res.data;
};

export interface ProductPerformance {
    productId: string;
    name: string;
    category?: string;
    currentStock: number;
    minStock: number;
    totalSold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
    ordersCount: number;
    avgPrice: number;
    stockStatus: 'low' | 'normal';
    abcClass: 'A' | 'B' | 'C';
    cumulativePercent: number;
}

export interface ProductPerformanceResponse {
    products: ProductPerformance[];
    categoryPerformance: {
        category: string;
        totalRevenue: number;
        totalProfit: number;
        totalSold: number;
        productCount: number;
    }[];
    summary: {
        totalProducts: number;
        totalRevenue: number;
        totalProfit: number;
        totalUnitsSold: number;
        avgProfitMargin: number;
    };
}

export interface StockMovement {
    date: string;
    unitsSold: number;
    ordersCount: number;
}

export interface LowStockProduct {
    _id: string;
    name: string;
    category?: string;
    stock: number;
    minStock: number;
    costPrice: number;
    sellPrice: number;
    supplier?: string;
    brand?: string;
    reorderQuantity: number;
    daysUntilStockout: number;
    status: 'out-of-stock' | 'critical' | 'low';
}

export const getProductPerformance = async (params: DateRangeParams): Promise<ProductPerformanceResponse> => {
    const res = await api.get('/reports/product-performance', { params });
    return res.data;
};

export const getStockMovement = async (params: DateRangeParams): Promise<StockMovement[]> => {
    const res = await api.get('/reports/stock-movement', { params });
    return res.data;
};

export const getLowStockProducts = async (): Promise<{ data: LowStockProduct[] }> => {
    const res = await api.get('/reports/low-stock-products');
    return res.data;
};

// Customer Analytics Types & Functions
export interface CustomerRFM {
    recency: number;
    frequency: number;
    monetary: number;
    score: number;
    segment: 'VIP' | 'Loyal' | 'Regular' | 'At Risk' | 'Lost';
}

export interface CustomerAnalytics {
    customerId: string;
    name: string;
    phone: string;
    email?: string;
    totalSpent: number;
    totalOrders: number;
    totalDebt: number;
    paidAmount: number;
    lastOrderDate: string;
    firstOrderDate: string;
    avgOrderValue: number;
    totalDiscount: number;
    daysSinceLastOrder: number;
    customerLifetimeDays: number;
    rfm: CustomerRFM;
    debtStatus: 'has-debt' | 'clear';
    lifetimeValue: number;
}

export interface FavoriteProduct {
    productId: string;
    productName: string;
    category?: string;
    brand?: string;
    currentStock: number;
    currentPrice: number;
    timesBought: number;
    totalQuantity: number;
    totalSpent: number;
    avgPrice: number;
    lastPurchased: string;
    daysSinceLastPurchase: number;
}

export interface CategoryPreference {
    category: string;
    orderCount: number;
    totalSpent: number;
    itemsCount: number;
}

export interface ProductRecommendation {
    _id: string;
    name: string;
    category?: string;
    brand?: string;
    sellPrice: number;
    stock: number;
    reason: string;
}

export interface CustomerPreferences {
    customer?: {
        name: string;
        phone: string;
    };
    favoriteProducts: FavoriteProduct[];
    categoryPreferences: CategoryPreference[];
    recommendations: ProductRecommendation[];
    totalOrders?: number;
    totalSpent?: number;
    avgOrderValue?: number;
    summary: {
        totalProductsPurchased: number;
        favoriteCategory: string;
        mostBoughtProduct: string;
    };
}

export interface CustomerDebt {
    customerId: string;
    name: string;
    phone: string;
    totalDebt: number;
    totalOrders: number;
    oldestDebt: string;
    newestDebt: string;
    daysSinceOldest: number;
    debtStatus: 'overdue' | 'current';
}

export interface DebtSummary {
    customers: CustomerDebt[];
    totalDebt?: number;
    customersWithDebt?: number;
    overdueDebt?: number;
    overdueCount?: number;
    debtDetails?: Array<{
        customerId: string;
        customerName: string;
        customerPhone: string;
        totalDebt: number;
        debtCount: number;
        oldestDebt?: string;
    }>;
    summary: {
        totalDebt: number;
        totalCustomersWithDebt: number;
        overdueCount: number;
        overdueAmount: number;
        currentDebt: number;
    };
}

export interface CustomerAnalyticsResponse {
    customers?: CustomerAnalytics[];
    topCustomers?: CustomerAnalytics[];
    totalCustomers?: number;
    avgOrderValue?: number;
}

export const getCustomerAnalytics = async (params: DateRangeParams): Promise<CustomerAnalytics[]> => {
    const res = await api.get('/reports/customer-analytics', { params });
    return res.data;
};

export const getCustomerPreferences = async (customerId: string): Promise<CustomerPreferences> => {
    const res = await api.get(`/reports/customer-preferences/${customerId}`);
    return res.data;
};

export const getCustomerDebtSummary = async (params?: { startDate?: Date; endDate?: Date }): Promise<DebtSummary> => {
    const res = await api.get('/reports/customer-debt-summary', { params });
    return res.data;
};
