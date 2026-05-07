import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    Download,
    Package,
    TrendingUp,
    Users,
    XCircle
} from "lucide-react";

interface CustomersTabProps {
    customerAnalytics: any;
    debtSummary: any;
    customerPreferences: any;
    selectedCustomerId: string | null;
    setSelectedCustomerId: (id: string | null) => void;
    formatCurrency: (val?: number) => string;
}

export const CustomersTab = ({
    customerAnalytics,
    debtSummary,
    customerPreferences,
    selectedCustomerId,
    setSelectedCustomerId,
    formatCurrency
}: CustomersTabProps) => {
    return (
        <div className="space-y-6">
            {/* Customer KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ລູກຄ້າທັງໝົດ</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    {customerAnalytics?.totalCustomers || customerAnalytics?.customers?.length || 0}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">ລູກຄ້າທີ່ມີການຊື້</p>
                            </div>
                            <Users className="w-10 h-10 text-purple-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                {/* <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ລູກຄ້າ VIP</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">
                                    {customerAnalytics?.customers?.filter((c: any) => c.rfm.segment === 'VIP').length || 0}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">ລູກຄ້າມູນຄ່າສູງ</p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-emerald-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card> */}

                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ໜີ້ທັງໝົດ</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {formatCurrency(debtSummary?.summary.totalDebt)}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {debtSummary?.summary.totalCustomersWithDebt || 0} ລູກຄ້າ
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
                                <p className="text-sm text-slate-500 font-medium">ໜີ້ຄ້າງດົນ</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">
                                    {formatCurrency(debtSummary?.summary.overdueAmount)}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {debtSummary?.summary.overdueCount || 0} ລູກຄ້າ
                                </p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-amber-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Customer Segmentation & Top Spenders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* RFM Segmentation */}
                {/* <Card className="shadow-sm border-slate-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            ການຈັດກຸ່ມລູກຄ້າ (RFM Segmentation)
                        </CardTitle>
                        <CardDescription>ແບ່ງກຸ່ມຕາມພຶດຕິກຳການຊື້</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {['VIP', 'Loyal', 'Regular', 'At Risk', 'Lost'].map(segment => {
                                const count = customerAnalytics?.customers?.filter((c: any) => c.rfm.segment === segment).length || 0;
                                const total = customerAnalytics?.totalCustomers || customerAnalytics?.customers?.length || 1;
                                const percentage = (count / total) * 100;

                                const colors = {
                                    'VIP': { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-300' },
                                    'Loyal': { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-300' },
                                    'Regular': { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-300' },
                                    'At Risk': { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-300' },
                                    'Lost': { bg: 'bg-slate-400', text: 'text-slate-600', border: 'border-slate-300' }
                                }[segment] || { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-300' };

                                return (
                                    <div key={segment} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <Badge className={`${colors.bg} text-white px-3 py-1`}>
                                                {segment}
                                            </Badge>
                                            <span className={`text-sm font-bold ${colors.text}`}>
                                                {count} ({percentage.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full">
                                            <div className={`${colors.bg} h-full rounded-full`} style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-800">
                                <strong>ຄຳອະທິບາຍ:</strong> VIP = ລູກຄ້າດີທີ່ສຸດ, Loyal = ຊື້ເລື້ອຍໆ, At Risk = ອາດຈະເຊົາຊື້
                            </p>
                        </div>
                    </CardContent>
                </Card> */}

                {/* Top Spenders */}
                {/* <Card className="lg:col-span-2 shadow-sm border-slate-100">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>ລູກຄ້າຊັ້ນນຳ (Top 10 Spenders)</CardTitle>
                                <CardDescription>ລູກຄ້າທີ່ມີຍອດຊື້ສູງສຸດ</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {(customerAnalytics?.topCustomers || customerAnalytics?.customers)?.slice(0, 10).map((customer: any, i: number) => (
                                <div
                                    key={customer.customerId}
                                    className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedCustomerId(customer.customerId)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i < 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-slate-800">{customer.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                customer.rfm.segment === 'VIP' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' :
                                                                    customer.rfm.segment === 'Loyal' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                                                                        customer.rfm.segment === 'Regular' ? 'border-indigo-300 text-indigo-700 bg-indigo-50' :
                                                                            customer.rfm.segment === 'At Risk' ? 'border-amber-300 text-amber-700 bg-amber-50' :
                                                                                'border-slate-300 text-slate-700 bg-slate-50'
                                                            }
                                                        >
                                                            {customer.rfm.segment}
                                                        </Badge>
                                                        <span className="text-xs text-slate-400">{customer.phone}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-mono font-bold text-sm text-emerald-600">
                                                        {formatCurrency(customer.totalSpent)}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{customer.totalOrders} ບິນ</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs">
                                                <span className="text-slate-500">
                                                    AVG: <span className="font-bold">{formatCurrency(customer.avgOrderValue)}</span>
                                                </span>
                                                <span className="text-slate-500">
                                                    ຊື້ລ່າສຸດ: <span className="font-medium">{Math.floor(customer.daysSinceLastOrder)} ວັນກ່ອນ</span>
                                                </span>
                                                {customer.totalDebt > 0 && (
                                                    <span className="text-red-600 font-medium">
                                                        ໜີ້: {formatCurrency(customer.totalDebt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!customerAnalytics?.customers || customerAnalytics.customers.length === 0) && (
                                <p className="text-center text-slate-400 py-8">ບໍ່ມີຂໍ້ມູນລູກຄ້າ</p>
                            )}
                        </div>
                    </CardContent>
                </Card> */}
            </div>

            {/* Debt Management */}
            <Card className="shadow-sm border-red-200 bg-red-50/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                ການຕິດຕາມໜີ້ (Debt Management)
                            </CardTitle>
                            <CardDescription>
                                ລວມ: {formatCurrency(debtSummary?.summary.totalDebt)}
                                {' • '}
                                ຄ້າງ: {formatCurrency(debtSummary?.summary.overdueAmount)}
                            </CardDescription>
                        </div>
                        {/* <Button variant="outline" size="sm" className="gap-2 bg-white">
                            <Download className="w-4 h-4" />
                            Export
                        </Button> */}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {debtSummary?.customers.map((customer: any) => (
                            <div key={customer.customerId} className={`p-3 rounded-lg border ${customer.debtStatus === 'overdue'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-amber-50 border-amber-200'
                                }`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {customer.debtStatus === 'overdue' && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                                            {customer.debtStatus === 'current' && <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                                            <p className="font-medium text-sm text-slate-800">{customer.name}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{customer.phone}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs">
                                            <span className={`font-bold ${customer.debtStatus === 'overdue' ? 'text-red-700' : 'text-amber-700'
                                                }`}>
                                                ໜີ້: {formatCurrency(customer.totalDebt)}
                                            </span>
                                            <span className="text-slate-600">
                                                {customer.totalOrders} ບິນ
                                            </span>
                                            <span className="text-slate-600">
                                                ເກົ່າສຸດ: {Math.floor(customer.daysSinceOldest)} ວັນ
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={
                                            customer.debtStatus === 'overdue'
                                                ? 'border-red-300 text-red-700 bg-red-100'
                                                : 'border-amber-300 text-amber-700 bg-amber-100'
                                        }
                                    >
                                        {customer.debtStatus === 'overdue' ? 'ເກີນກຳນົດ' : 'ປົກກະຕິ'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {(!debtSummary?.customers || debtSummary.customers.length === 0) && (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                                <p className="text-emerald-600 font-medium">ບໍ່ມີໜີ້ຄ້າງ</p>
                                <p className="text-xs text-slate-400 mt-1">ລູກຄ້າທຸກຄົນຊຳລະເງິນຄົບແລ້ວ</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Customer Preferences Dialog/Panel */}
            {selectedCustomerId && customerPreferences && (
                <Card className="shadow-lg border-indigo-200">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>ຄວາມມັກຂອງລູກຄ້າ & ຄຳແນະນຳ</CardTitle>
                                <CardDescription>
                                    ສິນຄ້າທີ່ລູກຄ້າມັກຊື້ແລະຄຳແນະນຳສິນຄ້າທີ່ເໝາະສົມ
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCustomerId(null)}
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Favorite Products */}
                            <div className="lg:col-span-1">
                                <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-indigo-500" />
                                    ສິນຄ້າທີ່ມັກຊື້
                                </h4>
                                <div className="space-y-2">
                                    {customerPreferences.favoriteProducts.slice(0, 5).map((product: any, i: number) => (
                                        <div key={product.productId} className="p-2 rounded-lg border border-slate-100 bg-white">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-700 truncate">
                                                        {product.productName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        ຊື້ {product.timesBought} ຄັ້ງ • {product.totalQuantity} ຊິ້ນ
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Category Preferences */}
                            <div className="lg:col-span-1">
                                <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    ໝວດໝູ່ທີ່ມັກ
                                </h4>
                                <div className="space-y-2">
                                    {customerPreferences.categoryPreferences.slice(0, 5).map((cat: any, i: number) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-700 font-medium">{cat.category || 'Uncategorized'}</span>
                                                <span className="text-slate-500">{formatCurrency(cat.totalSpent)}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full"
                                                    style={{
                                                        width: `${(cat.totalSpent / (customerPreferences.categoryPreferences[0]?.totalSpent || 1)) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="lg:col-span-1">
                                <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    ແນະນຳສິນຄ້າ
                                </h4>
                                <div className="space-y-2">
                                    {customerPreferences.recommendations.slice(0, 5).map((rec: any) => (
                                        <div key={rec._id} className="p-2 rounded-lg border border-emerald-100 bg-emerald-50/50">
                                            <p className="text-xs font-medium text-slate-700">{rec.name}</p>
                                            <p className="text-[10px] text-emerald-600 mt-0.5">{rec.reason}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs font-bold text-slate-700">
                                                    {formatCurrency(rec.sellPrice)}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    Stock: {rec.stock}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-slate-500">ສິນຄ້າທີ່ເຄີຍຊື້</p>
                                    <p className="text-lg font-bold text-indigo-700">
                                        {customerPreferences.summary.totalProductsPurchased}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">ໝວດໝູ່ທີ່ມັກ</p>
                                    <p className="text-sm font-bold text-indigo-700">
                                        {customerPreferences.summary.favoriteCategory}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">ຊື້ເລື້ອຍທີ່ສຸດ</p>
                                    <p className="text-sm font-bold text-indigo-700 truncate">
                                        {customerPreferences.summary.mostBoughtProduct}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
