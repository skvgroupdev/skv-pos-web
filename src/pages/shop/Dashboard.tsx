import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import {
    getShopSummary,
    getInventoryValuation,
    getProductPerformance,
    getStockMovement,
    getLowStockProducts,
    getCustomerAnalytics,
    getCustomerPreferences,
    getCustomerDebtSummary
} from "@/api/reports";
import { getTenant } from "@/api/tenants";

import {
    LayoutDashboard,
    Users,
    Package
} from "lucide-react";
import { format } from "date-fns";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { OverviewTab } from "./components/OverviewTab";
import { ProductsTab } from "./components/ProductsTab";
import { CustomersTab } from "./components/CustomersTab";
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// --- Components ---



export default function ShopDashboard() {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('dashboard-activeTab') || 'overview';
    });

    const [customDates, setCustomDates] = useState(() => {
        const saved = localStorage.getItem('dashboard-customDates');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return {
                    start: format(new Date(), 'yyyy-MM-dd'),
                    end: format(new Date(), 'yyyy-MM-dd')
                };
            }
        }
        return {
            start: format(new Date(), 'yyyy-MM-dd'),
            end: format(new Date(), 'yyyy-MM-dd')
        };
    });
    const [saleMode, setSaleMode] = useState<"ALL" | "retail" | "wholesale">(() => {
        const saved = localStorage.getItem("dashboard-saleMode");
        return saved === "retail" || saved === "wholesale" ? saved : "ALL";
    });

    useEffect(() => {
        localStorage.setItem('dashboard-customDates', JSON.stringify(customDates));
    }, [customDates]);

    useEffect(() => {
        localStorage.setItem("dashboard-saleMode", saleMode);
    }, [saleMode]);

    // Fetch tenant info for plan check
    const { data: tenant } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });

    const getDates = () => {
        if (customDates.start && customDates.end) {
            const s = new Date(`${customDates.start}T00:00:00.000`);
            const e = new Date(`${customDates.end}T23:59:59.999`);
            if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                return { startDate: s, endDate: e };
            }
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { startDate: today, endDate: new Date() };
    };

    const { startDate, endDate } = getDates();
    const queryParams = {
        startDate,
        endDate,
        saleMode: saleMode === "ALL" ? undefined : saleMode,
    };

    // Queries
    const { data: summary } = useQuery({
        queryKey: ['shop-summary', customDates, saleMode],
        queryFn: () => getShopSummary(queryParams)
    });



    const { data: inventory } = useQuery({
        queryKey: ['inventory-valuation'],
        queryFn: getInventoryValuation
    });

    const { data: productPerformance } = useQuery({
        queryKey: ['product-performance', customDates, saleMode],
        queryFn: () => getProductPerformance(queryParams)
    });

    const { data: stockMovement } = useQuery({
        queryKey: ['stock-movement', customDates, saleMode],
        queryFn: () => getStockMovement(queryParams)
    });

    const { data: lowStockProducts } = useQuery({
        queryKey: ['low-stock-products'],
        queryFn: getLowStockProducts
    });

    const { data: customerAnalytics } = useQuery({
        queryKey: ['customer-analytics', customDates, saleMode],
        queryFn: () => getCustomerAnalytics(queryParams)
    });

    const { data: debtSummary } = useQuery({
        queryKey: ['customer-debt-summary', customDates, saleMode],
        queryFn: () => getCustomerDebtSummary(queryParams)
    });

    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const { data: customerPreferences } = useQuery({
        queryKey: ['customer-preferences', selectedCustomerId],
        queryFn: () => selectedCustomerId ? getCustomerPreferences(selectedCustomerId) : null,
        enabled: !!selectedCustomerId
    });

    // Formatting Helpers
    const formatCurrency = (val?: number) => `₭${(val || 0).toLocaleString()}`;


    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen font-lao">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">ພາບລວມຮ້ານຄ້າ</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        ຂໍ້ມູນສະຫຼຸບຍອດຂາຍແລະການເຄື່ອນໄຫວພາຍໃນຮ້ານ
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                    <Select value={saleMode} onValueChange={(value: "ALL" | "retail" | "wholesale") => setSaleMode(value)}>
                        <SelectTrigger className="w-full bg-white md:w-[170px]" aria-label="ປະເພດການຂາຍ"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="ALL">ທຸກປະເພດການຂາຍ</SelectItem><SelectItem value="retail">ຂາຍຍ່ອຍ</SelectItem><SelectItem value="wholesale">ຂາຍສົ່ງ</SelectItem></SelectContent>
                    </Select>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                        <div className="bg-white rounded-lg shadow-sm">
                            <DateRangePicker
                                date={{
                                    from: new Date(customDates.start),
                                    to: new Date(customDates.end)
                                }}
                                onSelect={(range) => {
                                    if (range?.from) {
                                        setCustomDates({
                                            start: format(range.from, 'yyyy-MM-dd'),
                                            end: range.to ? format(range.to, 'yyyy-MM-dd') : format(range.from, 'yyyy-MM-dd')
                                        });
                                    }
                                }}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-slate-50 text-indigo-600 border-slate-200"
                            onClick={() => {
                                const today = format(new Date(), 'yyyy-MM-dd');
                                setCustomDates({ start: today, end: today });
                            }}
                        >
                            ມື້ນີ້
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(v) => {
                    setActiveTab(v);
                    localStorage.setItem('dashboard-activeTab', v);
                }}
                className="space-y-6"
            >
                <TabsList className="bg-white border p-1 h-12 w-full md:w-auto grid grid-cols-3 md:inline-flex md:gap-2">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> ພາບລວມ
                    </TabsTrigger>
                    <TabsTrigger value="products" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
                        <Package className="w-4 h-4 mr-2" /> ສິນຄ້າ & ຄັງ
                    </TabsTrigger>
                    {(tenant?.subscriptionPlan === 'PRO' || tenant?.subscriptionPlan === 'ENTERPRISE') && (
                        <TabsTrigger value="customers" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
                            <Users className="w-4 h-4 mr-2" /> ລູກຄ້າ
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview">
                    <OverviewTab
                        summary={summary}
                        formatCurrency={formatCurrency}
                        subscriptionPlan={tenant?.subscriptionPlan}
                    />
                </TabsContent>

                {/* PRODUCTS TAB */}
                <TabsContent value="products">
                    <ProductsTab
                        productPerformance={productPerformance}
                        stockMovement={stockMovement || []}
                        lowStockProducts={lowStockProducts}
                        inventory={inventory}
                        formatCurrency={formatCurrency}
                        subscriptionPlan={tenant?.subscriptionPlan}
                    />
                </TabsContent>


                {/* CUSTOMERS TAB */}
                {(tenant?.subscriptionPlan === 'PRO' || tenant?.subscriptionPlan === 'ENTERPRISE') && (
                    <TabsContent value="customers">
                        <CustomersTab
                            customerAnalytics={customerAnalytics}
                            debtSummary={debtSummary}
                            customerPreferences={customerPreferences}
                            selectedCustomerId={selectedCustomerId}
                            setSelectedCustomerId={setSelectedCustomerId}
                            formatCurrency={formatCurrency}
                        />
                    </TabsContent>
                )}
            </Tabs>
        </div >
    );
}
