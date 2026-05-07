import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    DollarSign,
    Package,
    TrendingUp,
    XCircle
} from "lucide-react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format } from "date-fns";

import { LockOverlay } from "@/components/ui/lock-overlay";

interface ProductsTabProps {
    productPerformance: any;
    stockMovement: any[];
    lowStockProducts: any;
    inventory: any;
    formatCurrency: (val?: number) => string;
    subscriptionPlan?: string;
}

export const ProductsTab = ({
    productPerformance,
    stockMovement,
    lowStockProducts,
    inventory,
    formatCurrency,
    subscriptionPlan
}: ProductsTabProps) => {
    const isBasic = subscriptionPlan === 'BASIC';

    return (
        <div className="space-y-6">
            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ຈຳນວນສິນຄ້າທັງໝົດ</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    {productPerformance?.summary.totalProducts || 0}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">ສິນຄ້າທີ່ມີການຂາຍ</p>
                            </div>
                            <Package className="w-10 h-10 text-blue-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ຍອດຂາຍລວມ</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">
                                    {formatCurrency(productPerformance?.summary.totalRevenue)}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">{productPerformance?.summary.totalUnitsSold.toLocaleString()} ຊິ້ນ</p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-emerald-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative border-l-4 border-l-violet-500 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ກຳໄລລວມ</p>
                                <p className="text-2xl font-bold text-violet-600 mt-1">
                                    {formatCurrency(productPerformance?.summary.totalProfit)}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Margin: {productPerformance?.summary.avgProfitMargin.toFixed(1)}%
                                </p>
                            </div>
                            <DollarSign className="w-10 h-10 text-violet-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ສິນຄ້າໃກ້ໝົດ</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">
                                    {lowStockProducts?.data?.length || 0}
                                </p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-amber-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ABC Analysis & Category Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ABC Classification */}
                {/* <Card className="relative shadow-sm border-slate-100 overflow-hidden">
                    {isBasic && (
                        <LockOverlay
                            title="ABC Analysis Locked"
                            description="Upgrade to PRO to optimize your inventory with Pareto analysis."
                            showUpgradeBadge
                        />
                    )}
                    <div className={isBasic ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-500" />
                                ABC Analysis (Pareto)
                            </CardTitle>
                            <CardDescription>ການຈັດອັນດັບສິນຄ້າຕາມຍອດຂາຍ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(() => {
                                    const aCount = productPerformance?.products.filter((p: any) => p.abcClass === 'A').length || 0;
                                    const bCount = productPerformance?.products.filter((p: any) => p.abcClass === 'B').length || 0;
                                    const cCount = productPerformance?.products.filter((p: any) => p.abcClass === 'C').length || 0;
                                    const total = productPerformance?.products.length || 1;

                                    return (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-emerald-500 text-white px-3 py-1">A</Badge>
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm font-medium">ສິນຄ້າຊັ້ນນຳ (Top 80%)</span>
                                                        <span className="text-sm font-bold text-emerald-600">{aCount} ລາຍການ</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full">
                                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(aCount / total) * 100}%` }} />
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">ມີຍອດຂາຍສູງທີ່ສຸດ - ສຳຄັນທີ່ສຸດ</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-blue-500 text-white px-3 py-1">B</Badge>
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm font-medium">ສິນຄ້າປານກາງ (80-95%)</span>
                                                        <span className="text-sm font-bold text-blue-600">{bCount} ລາຍການ</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full">
                                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(bCount / total) * 100}%` }} />
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">ຍອດຂາຍປານກາງ - ສຳຄັນປານກາງ</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-slate-400 text-white px-3 py-1">C</Badge>
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm font-medium">ສິນຄ້າຊ້າ (95-100%)</span>
                                                        <span className="text-sm font-bold text-slate-600">{cCount} ລາຍການ</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full">
                                                        <div className="bg-slate-400 h-full rounded-full" style={{ width: `${(cCount / total) * 100}%` }} />
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">ຍອດຂາຍຕ່ຳ - ພິຈາລະນາຢຸດຂາຍ</p>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-800">
                                    <strong>ຄຳແນະນຳ:</strong> ສິນຄ້າ Class A ຕ້ອງໄດ້ຮັບການດູແລຢ່າງໃກ້ຊິດ,
                                    Class B ຕິດຕາມປົກກະຕິ, Class C ພິຈາລະນາຫຼຸດລາຄາ ຫຼື ຢຸດສັ່ງເຂົ້າ.
                                </p>
                            </div>
                        </CardContent>
                    </div>
                </Card> */}

                {/* Category Performance */}
                {/* <Card className="relative shadow-sm border-slate-100 overflow-hidden">
                    {isBasic && (
                        <LockOverlay
                            title="Category Analytics Locked"
                            description="Upgrade to PRO to see detailed category performance."
                            showUpgradeBadge
                        />
                    )}
                    <div className={isBasic ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
                        <CardHeader>
                            <CardTitle>ຍອດຂາຍແຍກຕາມໝວດໝູ່</CardTitle>
                            <CardDescription>ປະສິດທິພາບການຂາຍແຕ່ລະປະເພດ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productPerformance?.categoryPerformance || []} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="category"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            width={100}
                                            tick={{ fill: '#64748b', fontSize: 11 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val: any) => formatCurrency(val)}
                                        />
                                        <Bar dataKey="totalRevenue" fill="#6366f1" radius={[0, 8, 8, 0]} name="ຍອດຂາຍ" />
                                        <Bar dataKey="totalProfit" fill="#10b981" radius={[0, 8, 8, 0]} name="ກຳໄລ" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </div>
                </Card> */}
            </div>

            {/* Stock Movement Chart */}
            {/* <Card className="relative shadow-sm border-slate-100 overflow-hidden">
                {isBasic && (
                    <LockOverlay
                        title="Stock Movement Analytics Locked"
                        description="Upgrade to PRO to view historical stock trends."
                        showUpgradeBadge
                    />
                )}
                <div className={isBasic ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            ການເຄື່ອນໄຫວຂອງສິນຄ້າ
                        </CardTitle>
                        <CardDescription>ຈຳນວນສິນຄ້າທີ່ຂາຍອອກແຕ່ລະວັນ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stockMovement || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="unitsSold"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        name="ສິນຄ້າຂາຍອອກ (ຊິ້ນ)"
                                        dot={{ fill: '#6366f1', r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ordersCount"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="ຈຳນວນບິນ"
                                        dot={{ fill: '#10b981', r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </div>
            </Card> */}

            {/* Top Products & Low Stock Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Products */}
                <Card className="shadow-sm border-slate-100">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    ສິນຄ້າຂາຍດີທີ່ສຸດ (Top 10)
                                </CardTitle>
                                <CardDescription>ອີງຕາມຍອດຂາຍລວມ</CardDescription>
                            </div>

                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {productPerformance?.products.slice(0, 10).map((product: any, i: number) => (
                                <div key={product.productId} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i < 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-slate-800 truncate" title={product.name}>
                                                        {product.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">{product.abcClass}</Badge>
                                                        {product.category && (
                                                            <span className="text-xs text-slate-400">{product.category}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-mono font-bold text-sm text-emerald-600">
                                                        {formatCurrency(product.totalRevenue)}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{product.totalSold} ຊິ້ນ</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs">
                                                <span className="text-slate-500">
                                                    ກຳໄລ: <span className={`font-bold text-emerald-600 ${isBasic ? 'blur-sm bg-slate-200 text-transparent rounded px-1' : ''}`}>
                                                        {isBasic ? '000,000' : formatCurrency(product.totalProfit)}
                                                    </span>
                                                </span>
                                                <span className="text-slate-500">
                                                    Margin: <span className={`font-bold ${isBasic ? 'blur-sm bg-slate-200 text-transparent rounded px-1' : ''}`}>
                                                        {isBasic ? '00.0' : product.profitMargin.toFixed(1)}%
                                                    </span>
                                                </span>
                                                <span className={`font-medium ${product.stockStatus === 'low' ? 'text-amber-600' : 'text-slate-500'}`}>
                                                    Stock: {product.currentStock}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!productPerformance?.products || productPerformance.products.length === 0) && (
                                <p className="text-center text-slate-400 py-8">ບໍ່ມີຂໍ້ມູນ</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alert - Critical */}
                <Card className="shadow-sm border-amber-200 bg-amber-50/30">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    ສິນຄ້າໃກ້ໝົດ/ໝົດສະຕ໋ອກ
                                </CardTitle>
                                <CardDescription>ຕ້ອງສັ່ງເຂົ້າດ່ວນ!</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {lowStockProducts?.data?.map((product: any) => (
                                <div key={product._id} className={`p-3 rounded-lg border ${product.status === 'out-of-stock'
                                    ? 'bg-red-50 border-red-200'
                                    : product.status === 'critical'
                                        ? 'bg-orange-50 border-orange-200'
                                        : 'bg-amber-50 border-amber-200'
                                    }`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {product.status === 'out-of-stock' && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                                                {product.status === 'critical' && <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />}
                                                {product.status === 'low' && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                                                <p className="font-medium text-sm text-slate-800 truncate" title={product.name}>
                                                    {product.name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs">
                                                {product.category && (
                                                    <span className="text-slate-500">{product.category}</span>
                                                )}
                                                {product.brand && (
                                                    <span className="text-slate-500">• {product.brand}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className={`text-xs font-bold ${product.status === 'out-of-stock' ? 'text-red-700' :
                                                    product.status === 'critical' ? 'text-orange-700' : 'text-amber-700'
                                                    }`}>
                                                    ເຫຼືອ: {product.stock} / {product.minStock}
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    ແນະນຳສັ່ງ: <span className="font-bold text-blue-600">{product.reorderQuantity} ຊິ້ນ</span>
                                                </div>
                                            </div>
                                            {product.supplier && (
                                                <div className="mt-1 text-xs text-slate-500">
                                                    ຜູ້ສະໜອງ: {product.supplier}
                                                </div>
                                            )}
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={
                                                product.status === 'out-of-stock'
                                                    ? 'border-red-300 text-red-700 bg-red-100'
                                                    : product.status === 'critical'
                                                        ? 'border-orange-300 text-orange-700 bg-orange-100'
                                                        : 'border-amber-300 text-amber-700 bg-amber-100'
                                            }
                                        >
                                            {product.status === 'out-of-stock' ? 'ໝົດສະຕ໋ອກ' :
                                                product.status === 'critical' ? 'ດ່ວນ' : 'ໃກ້ໝົດ'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {(!lowStockProducts?.data || lowStockProducts.data.length === 0) && (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                                    <p className="text-emerald-600 font-medium">ບໍ່ມີສິນຄ້າໃກ້ໝົດ</p>
                                    <p className="text-xs text-slate-400 mt-1">ສະຖານະສະຕ໋ອກທຸກລາຍການປົກກະຕິດີ</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Overview */}
            <Card className="relative shadow-sm border-slate-100 overflow-hidden">
                {isBasic && (
                    <LockOverlay
                        title="Inventory Valuation Locked"
                        description="Upgrade to PRO to see total inventory value."
                        showUpgradeBadge
                    />
                )}
                <div className={isBasic ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
                    <CardHeader>
                        <CardTitle>ພາບລວມຄັງສິນຄ້າ</CardTitle>
                        <CardDescription>ຂໍ້ມູນສະຕ໋ອກແລະມູນຄ່າທັງໝົດ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">ມູນຄ່າຕົ້ນທຶນລວມ (Total Cost Value)</p>
                                        <p className="text-xs text-slate-400 mt-0.5">ຄຳນວນຈາກຕົ້ນທຶນສະເລ່ຍ</p>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-800">
                                        {formatCurrency(inventory?.totalCostValue)}
                                    </p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">ຈຳນວນລາຍການ</p>
                                        <p className="text-lg font-bold text-slate-700">{inventory?.totalItems || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">ຈຳນວນຊິ້ນໃນຄັງ</p>
                                        <p className="text-lg font-bold text-slate-700">{inventory?.totalStock || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-3">ສັດສ່ວນມູນຄ່າຕາມໝວດໝູ່</h4>
                                    <div className="space-y-3">
                                        {inventory?.categoryBreakdown?.slice(0, 3).map((cat: any) => (
                                            <div key={cat.category}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-700 font-medium">{cat.category}</span>
                                                    <span className="text-slate-500">{cat.stockCount} ຊິ້ນ</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-indigo-500 h-full rounded-full transition-all"
                                                        style={{ width: `${(cat.stockCount / (inventory?.totalStock || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-indigo-900">ມູນຄ່າຂາຍທັງໝົດ (Total Retail Value)</p>
                                        <p className="text-xs text-indigo-600 mt-0.5">ຄາດຄະເນຍອດຂາຍຖ້າຂາຍສິນຄ້າໝົດ</p>
                                    </div>
                                    <p className="text-3xl font-bold text-indigo-700">
                                        {formatCurrency(inventory?.totalRetailValue)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
};
