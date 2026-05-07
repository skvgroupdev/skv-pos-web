import { useQuery } from "@tanstack/react-query";
import {
    getShopSummary,
    getProductPerformance,
    getLowStockProducts,
    getCustomerAnalytics,
    getCustomerDebtSummary,
    getCustomerPreferences
} from "@/api/reports";
import { getTenant } from "@/api/tenants";
import {
    LayoutDashboard,
    TrendingUp,
    Clock,
    DollarSign,
    ArrowDownRight,
    ArrowUpRight,
    ShoppingBag,
    Wallet,
    Smartphone,
    AlertCircle,
    Package,
    AlertTriangle,
    Users,
    Target,
    FileText,
    Crown,
    Lock
} from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker";

const StatCard = ({ title, value, icon: Icon, trend, subtext, colorClass }: any) => (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
            </div>
            {(trend || subtext) && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                    {trend && (
                        <span className={`flex items-center font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {Math.abs(trend)}%
                        </span>
                    )}
                    <span className="text-slate-400">{subtext}</span>
                </div>
            )}
        </CardContent>
    </Card>
);

export default function POSDashboard() {
    const { user } = useAuthStore();

    // Fetch tenant info for plan check
    const { data: tenant } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });

    const isBasic = (!user?.subscriptionPlan || user.subscriptionPlan === 'BASIC') && (!tenant?.subscriptionPlan || tenant.subscriptionPlan === 'BASIC');

    // Load saved filter state from localStorage
    const [dateRange, _] = useState(() => {
        return 'custom';
    });
    const [customDates, setCustomDates] = useState(() => {
        const saved = localStorage.getItem('pos-dashboard-customDates');
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

    // Save filter state to localStorage
    useEffect(() => {
        localStorage.setItem('pos-dashboard-customDates', JSON.stringify(customDates));
    }, [customDates]);

    // Date Logic
    const getDates = () => {
        const end = new Date();
        let start = new Date();

        if (dateRange === 'custom') {
            // Check if valid dates are provided
            if (customDates.start && customDates.end) {
                const s = new Date(customDates.start);
                const e = new Date(customDates.end + 'T23:59:59');
                // Check if dates are valid
                if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                    return {
                        startDate: s,
                        endDate: e
                    };
                }
            }
            // Fallback to Today if invalid or missing
            start.setHours(0, 0, 0, 0);
            return { startDate: start, endDate: end };
        }

        return { startDate: start, endDate: end };
    };

    const { startDate, endDate } = getDates();
    const queryParams = { startDate, endDate, cashierId: user?.id };

    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    // Queries
    const { data: summary } = useQuery({
        queryKey: ['pos-summary', queryParams],
        queryFn: () => getShopSummary(queryParams),
        enabled: !!user?.id
    });

    const { data: productPerformance } = useQuery({
        queryKey: ['pos-product-performance', queryParams],
        queryFn: () => getProductPerformance(queryParams),
        enabled: !!user?.id
    });

    const { data: customerAnalytics } = useQuery({
        queryKey: ['pos-customer-analytics', queryParams],
        queryFn: () => getCustomerAnalytics(queryParams),
        enabled: !!user?.id && !isBasic
    });

    // Only basic stats needed if basic plan
    const { data: debtSummary } = useQuery({
        queryKey: ['pos-debt-summary', queryParams],
        queryFn: () => getCustomerDebtSummary(queryParams),
        enabled: !!user?.id && !isBasic
    });

    const { data: lowStockProducts } = useQuery({
        queryKey: ['pos-low-stock'],
        queryFn: getLowStockProducts,
        enabled: !!user?.id
    });

    const { data: customerPreferences } = useQuery({
        queryKey: ['pos-customer-preferences', selectedCustomerId],
        queryFn: () => getCustomerPreferences(selectedCustomerId!),
        enabled: !!selectedCustomerId && !isBasic
    });

    // Derived values
    const avgPrice = (productPerformance?.summary?.totalProducts && productPerformance.summary.totalProducts > 0)
        ? productPerformance.summary.totalRevenue / productPerformance.summary.totalProducts
        : 0;

    const totalCustomers = customerAnalytics?.length || 0;
    const avgOrderValue = customerAnalytics && customerAnalytics.length > 0
        ? customerAnalytics.reduce((acc, curr) => acc + (curr.avgOrderValue || 0), 0) / customerAnalytics.length
        : 0;
    const topCustomers = customerAnalytics || [];

    const formatCurrency = (amount?: number) => {
        return new Intl.NumberFormat('lo-LA', {
            style: 'currency',
            currency: 'LAK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleCustomerTabClick = (e: React.MouseEvent) => {
        if (isBasic) {
            e.preventDefault();
            // Optional: Show upgrade modal or toast here
        }
    };

    // ... rendering ...

    return (
        <div className="w-full h-full overflow-y-auto">
            <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen font-lao">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">ສະບາຍດີ, {user?.username || 'Cashier'} 👋</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            ພາບລວມການຂາຍຂອງທ່ານ - ຂໍ້ມູນສະເພາະແຄດຊຽນ
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
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

                {/* Handle Tab Click (defined inline above or moved to function) */}
                {/* Fixed: Moved handleCustomerTabClick to component body */}

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-white border p-1 h-12 w-full md:w-auto grid grid-cols-3 md:inline-flex md:gap-2">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
                            <LayoutDashboard className="w-4 h-4 mr-2" /> ພາບລວມ
                        </TabsTrigger>
                        <TabsTrigger value="products" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
                            <Package className="w-4 h-4 mr-2" /> ສິນຄ້າ
                        </TabsTrigger>

                        <TabsTrigger
                            value="customers"
                            className={`data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 ${isBasic ? 'opacity-70' : ''}`}
                            onClick={handleCustomerTabClick}
                        >
                            <Users className="w-4 h-4 mr-2" /> ລູກຄ້າ
                            {isBasic && <Crown className="w-3 h-3 text-yellow-500 ml-1" />}
                        </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard
                                title="ຍອດຂາຍລວມ"
                                value={formatCurrency(summary?.totalSales)}
                                icon={DollarSign}
                                colorClass="bg-indigo-500"
                                subtext="ລວມຍອດບິນທັງໝົດ"
                            />
                            <StatCard
                                title="ສ່ວນຫຼຸດ"
                                value={formatCurrency(summary?.totalDiscount)}
                                icon={ArrowDownRight}
                                colorClass="bg-rose-500"
                                subtext="ລວມສ່ວນຫຼຸດທີ່ໃຫ້"
                            />
                            <StatCard
                                title="ຈຳນວນໃບບິນ"
                                value={(summary?.totalOrders || 0).toLocaleString()}
                                icon={ShoppingBag}
                                colorClass="bg-blue-500"
                                subtext={`ສະເລ່ຍ ${formatCurrency(summary?.avgOrderValue)}/ບິນ`}
                            />
                        </div>

                        {/* Payment Method Reports */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Cash Report */}
                            <Card className="border-slate-100 shadow-sm overflow-hidden group hover:border-indigo-200 transition-colors">
                                <div className="bg-indigo-600 p-4 text-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium opacity-90">ເງິນສົດ (Cash)</span>
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-2xl font-black font-mono">
                                        {formatCurrency(summary?.paymentMethods?.cash?.received)}
                                    </h3>
                                </div>
                                <CardContent className="p-4 bg-white">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>ຍອດຂາຍ:</span>
                                        <span className="font-mono font-semibold">
                                            {formatCurrency(summary?.paymentMethods?.cash?.sales)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-rose-500">
                                        <span>ສ່ວນຫຼຸດ:</span>
                                        <span className="font-mono font-semibold">
                                            -{formatCurrency(summary?.paymentMethods?.cash?.discount)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Transfer Report */}
                            <Card className="border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
                                <div className="bg-blue-600 p-4 text-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium opacity-90">ເງິນໂອນ (Transfer)</span>
                                        <Smartphone className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-2xl font-black font-mono">
                                        {formatCurrency(summary?.paymentMethods?.transfer?.received)}
                                    </h3>
                                </div>
                                <CardContent className="p-4 bg-white">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>ຍອດຂາຍ:</span>
                                        <span className="font-mono font-semibold">
                                            {formatCurrency(summary?.paymentMethods?.transfer?.sales)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-rose-500">
                                        <span>ສ່ວນຫຼຸດ:</span>
                                        <span className="font-mono font-semibold">
                                            -{formatCurrency(summary?.paymentMethods?.transfer?.discount)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Debt Report */}
                            <Card className="border-slate-100 shadow-sm overflow-hidden group hover:border-red-200 transition-colors">
                                <div className="bg-red-600 p-4 text-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium opacity-90">ຕິດໜີ້ (Debt)</span>
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-2xl font-black font-mono">
                                        {formatCurrency(summary?.paymentMethods?.debt?.received)}
                                    </h3>
                                </div>
                                <CardContent className="p-4 bg-white">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>ຍອດຂາຍ:</span>
                                        <span className="font-mono font-semibold">
                                            {formatCurrency(summary?.paymentMethods?.debt?.sales)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-rose-500">
                                        <span>ສ່ວນຫຼຸດ:</span>
                                        <span className="font-mono font-semibold">
                                            -{formatCurrency(summary?.paymentMethods?.debt?.discount)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Multi-Currency Received Breakdown */}
                        <Card className="border-slate-100 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-indigo-500" />
                                        ສະກຸນເງິນທີ່ຮັບມາ
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-slate-100">
                                    {summary?.receivedBreakdown?.map((b: any) => (
                                        <div key={b.currency} className="bg-white p-4 text-center">
                                            <div className="text-xs text-slate-500 mb-1">{b.currency}</div>
                                            <div className="text-lg font-black font-mono text-slate-800">
                                                {b.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                    {(!summary?.receivedBreakdown || summary.receivedBreakdown.length === 0) && (
                                        <div className="bg-white p-4 text-center col-span-4 text-slate-400 text-sm">
                                            ຍັງບໍ່ມີຂໍ້ມູນ
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PRODUCTS TAB */}
                    <TabsContent value="products" className="space-y-6">
                        {/* Performance Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">ຈຳນວນລາຍການ</p>
                                            <h3 className="text-2xl font-bold text-slate-900">
                                                {productPerformance?.summary?.totalProducts || 0}
                                            </h3>
                                        </div>
                                        <Package className="w-10 h-10 text-blue-500 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">ຍອດຂາຍລວມ</p>
                                            <h3 className="text-xl font-bold text-slate-900">
                                                {formatCurrency(productPerformance?.summary?.totalRevenue)}
                                            </h3>
                                        </div>
                                        <TrendingUp className="w-10 h-10 text-emerald-500 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-violet-500 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">ລາຄາສະເລ່ຍ</p>
                                            <h3 className="text-xl font-bold text-slate-900">
                                                {formatCurrency(avgPrice)}
                                            </h3>
                                        </div>
                                        <DollarSign className="w-10 h-10 text-violet-500 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-amber-500 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">ສະຕ໋ອກຕ່ຳ</p>
                                            <h3 className="text-2xl font-bold text-amber-600">
                                                {lowStockProducts?.data?.length || 0}
                                            </h3>
                                        </div>
                                        <AlertTriangle className="w-10 h-10 text-amber-500 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Products */}
                        <Card className="shadow-sm border-slate-100">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-indigo-500" />
                                    ສິນຄ້າຂາຍດີທີ່ສຸດ
                                </CardTitle>
                                <CardDescription>ສິນຄ້າທີ່ຂາຍໄດ້ດີທີ່ສຸດໃນໄລຍະທີ່ເລືອກ</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {productPerformance?.products?.slice(0, 10).map((product: any, idx: number) => (
                                        <div key={product.productId} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-800">{product.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    ຂາຍ: {product.totalSold} {product.unit || 'ໜ່ວຍ'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900 font-mono">{formatCurrency(product.totalRevenue)}</p>
                                                <p className="text-xs text-slate-500">
                                                    ຍອດຂາຍ
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!productPerformance?.products || productPerformance.products.length === 0) && (
                                        <div className="text-center py-8 text-slate-400">
                                            ຍັງບໍ່ມີຂໍ້ມູນສິນຄ້າ
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CUSTOMERS TAB */}
                    <TabsContent value="customers" className="space-y-6">
                        {isBasic ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                                    <Crown className="w-6 h-6 text-yellow-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">Upgrade to PRO/ENTERPRISE</h3>
                                <p className="text-slate-500 text-center max-w-sm mb-6">
                                    Customer analytics and debt management are advanced features available on higher tier plans.
                                </p>
                                <Button variant="outline" className="gap-2">
                                    <Lock className="w-4 h-4" /> View Plans
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Customer KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card className="border-l-4 border-l-purple-500 shadow-sm">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">ລູກຄ້າທັງໝົດ</p>
                                                    <h3 className="text-2xl font-bold text-slate-900">
                                                        {totalCustomers}
                                                    </h3>
                                                </div>
                                                <Users className="w-10 h-10 text-purple-500 opacity-20" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">ຍອດຊື້ສະເລ່ຍ</p>
                                                    <h3 className="text-lg font-bold text-slate-900">
                                                        {formatCurrency(avgOrderValue)}
                                                    </h3>
                                                </div>
                                                <DollarSign className="w-10 h-10 text-emerald-500 opacity-20" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-l-4 border-l-red-500 shadow-sm">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">ໜີ້ທັງໝົດ</p>
                                                    <h3 className="text-lg font-bold text-red-600">
                                                        {formatCurrency(debtSummary?.totalDebt)}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {debtSummary?.customersWithDebt || 0} ຄົນ
                                                    </p>
                                                </div>
                                                <AlertCircle className="w-10 h-10 text-red-500 opacity-20" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-l-4 border-l-amber-500 shadow-sm">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">ໜີ້ເກີນກຳນົດ</p>
                                                    <h3 className="text-lg font-bold text-amber-600">
                                                        {formatCurrency(debtSummary?.overdueDebt)}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {debtSummary?.overdueCount || 0} ລາຍການ
                                                    </p>
                                                </div>
                                                <Clock className="w-10 h-10 text-amber-500 opacity-20" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Top Customers */}
                                <Card className="shadow-sm border-slate-100">
                                    <CardHeader>
                                        <CardTitle>ລູກຄ້າໃຫຍ່ທີ່ສຸດ (Top Spenders)</CardTitle>
                                        <CardDescription>ລູກຄ້າທີ່ຊື້ເຍອະທີ່ສຸດໃນໄລຍະທີ່ເລືອກ</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {topCustomers.map((customer: any, idx: number) => (
                                                <div
                                                    key={customer.customerId}
                                                    className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedCustomerId(customer.customerId)}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${idx < 3 ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-800">{customer.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {customer.phone} • {customer.totalOrders} ບິນ
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-900 font-mono">{formatCurrency(customer.totalSpent)}</p>
                                                        <p className="text-xs text-slate-500">
                                                            ສະເລ່ຍ {formatCurrency(customer.avgOrderValue)}/ບິນ
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!topCustomers || topCustomers.length === 0) && (
                                                <div className="text-center py-8 text-slate-400">
                                                    ຍັງບໍ່ມີຂໍ້ມູນລູກຄ້າ
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Debt Management */}
                                <Card className="shadow-sm border-red-200 bg-red-50/30">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-red-700">
                                                    <AlertCircle className="w-5 h-5" />
                                                    ລູກຄ້າທີ່ມີໜີ້ຄ້າງຊຳລະ
                                                </CardTitle>
                                                <CardDescription>ລາຍການລູກຄ້າທີ່ຕິດໜີ້ (ຈັດລຽງຕາມຈຳນວນໜີ້)</CardDescription>
                                            </div>
                                            <Badge variant="destructive" className="text-lg px-3 py-1">
                                                {debtSummary?.customersWithDebt || 0} ຄົນ
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                            {debtSummary?.debtDetails?.map((debt: any) => (
                                                <div key={debt.customerId} className="bg-white p-4 rounded-lg border border-red-100 hover:border-red-200 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{debt.customerName}</p>
                                                            <p className="text-xs text-slate-500">{debt.customerPhone}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-red-600 font-mono">
                                                                {formatCurrency(debt.totalDebt)}
                                                            </p>
                                                            <Badge variant="outline" className="text-[10px] mt-1">
                                                                {debt.debtCount} ບິນ
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {debt.oldestDebt && (
                                                        <div className="text-xs text-amber-600 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            ໜີ້ເກົ່າສຸດ: {format(new Date(debt.oldestDebt), "dd/MM/yyyy")}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {(!debtSummary?.debtDetails || debtSummary?.debtDetails.length === 0) && (
                                                <div className="bg-white p-8 rounded-lg text-center">
                                                    <p className="text-emerald-600 font-medium">✓ ບໍ່ມີລູກຄ້າທີ່ຕິດໜີ້</p>
                                                    <p className="text-xs text-slate-400 mt-1">ລູກຄ້າທຸກຄົນຊຳລະຄົບແລ້ວ</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Customer Preferences Dialog */}
                                {selectedCustomerId && customerPreferences && (
                                    <Card className="shadow-lg border-indigo-200">
                                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-indigo-900">ຂໍ້ມູນລູກຄ້າລະອຽດ</CardTitle>
                                                    <CardDescription>{customerPreferences.customer?.name}</CardDescription>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedCustomerId(null)}
                                                >
                                                    ປິດ
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                        <Package className="w-4 h-4 text-indigo-500" />
                                                        ສິນຄ້າທີ່ຊື້ເລື້ອຍທີ່ສຸດ
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {customerPreferences.favoriteProducts?.slice(0, 5).map((prod: any) => (
                                                            <div key={prod._id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                                                <span className="text-sm text-slate-700">{prod.name}</span>
                                                                <Badge variant="secondary">{prod.purchaseCount}x</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-indigo-500" />
                                                        ສະຖິຕິການຊື້
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                                                            <span className="text-slate-600">ຈຳນວນບິນທັງໝົດ:</span>
                                                            <span className="font-semibold">{customerPreferences.totalOrders}</span>
                                                        </div>
                                                        <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                                                            <span className="text-slate-600">ຍອດຊື້ລວມ:</span>
                                                            <span className="font-semibold font-mono">{formatCurrency(customerPreferences.totalSpent)}</span>
                                                        </div>
                                                        <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                                                            <span className="text-slate-600">ຍອດສະເລ່ຍ/ບິນ:</span>
                                                            <span className="font-semibold font-mono">{formatCurrency(customerPreferences.avgOrderValue)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div >
    );
}
