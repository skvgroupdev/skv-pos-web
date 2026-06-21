import {
    Activity,
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    DollarSign,
    Package,
    TrendingUp,
    UserX,
    Users,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TopSpendersChart } from "./charts/TopSpendersChart";
import { RFMDonutChart } from "./charts/RFMDonutChart";

interface CustomersTabProps {
    customerAnalytics: any;
    debtSummary: any;
    customerPreferences: any;
    selectedCustomerId: string | null;
    setSelectedCustomerId: (id: string | null) => void;
    formatCurrency: (val?: number) => string;
}

// ─── KPI card (same design system as ProductsTab) ─────────────────────────────
function KpiCard({
    label,
    value,
    sub,
    icon: Icon,
    accent = "indigo",
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    accent?: "indigo" | "emerald" | "rose" | "slate";
}) {
    const bar: Record<string, string> = {
        indigo:  "bg-indigo-500",
        emerald: "bg-emerald-500",
        rose:    "bg-rose-500",
        slate:   "bg-slate-400",
    };
    const iconColor: Record<string, string> = {
        indigo:  "text-indigo-400",
        emerald: "text-emerald-400",
        rose:    "text-rose-400",
        slate:   "text-slate-400",
    };
    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex overflow-hidden">
            <div className={`w-[3px] shrink-0 ${bar[accent]}`} />
            <div className="flex items-center justify-between flex-1 px-5 py-4">
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1 leading-none">{value}</p>
                    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
                </div>
                <Icon className={`w-8 h-8 ${iconColor[accent]} opacity-30`} />
            </div>
        </div>
    );
}

// ─── Segment badge ─────────────────────────────────────────────────────────────
function SegmentBadge({ segment }: { segment: string }) {
    const styles: Record<string, string> = {
        VIP:      "bg-indigo-600 text-white border-indigo-600",
        Loyal:    "bg-indigo-100 text-indigo-700 border-indigo-200",
        Regular:  "bg-slate-100 text-slate-600 border-slate-200",
        "At Risk":"bg-amber-50 text-amber-700 border-amber-200",
        Lost:     "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (
        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${styles[segment] ?? styles.Regular}`}>
            {segment}
        </Badge>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export const CustomersTab = ({
    customerAnalytics,
    debtSummary,
    customerPreferences,
    selectedCustomerId,
    setSelectedCustomerId,
    formatCurrency,
}: CustomersTabProps) => {
    // customerAnalytics is CustomerAnalytics[]
    const customers: any[] = Array.isArray(customerAnalytics)
        ? customerAnalytics
        : (customerAnalytics?.customers || customerAnalytics?.topCustomers || []);

    const totalCustomers = customers.length;

    const atRiskCustomers = customers
        .filter((c) => c.rfm?.segment === "At Risk" || c.rfm?.segment === "Lost")
        .sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder);

    const vipCount = customers.filter((c) => c.rfm?.segment === "VIP").length;
    const debt = debtSummary?.summary;

    return (
        <div className="space-y-6">

            {/* ── Section 1: KPI Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                    label="ລູກຄ້າທີ່ມີການຊື້"
                    value={totalCustomers}
                    sub="ຄົນ"
                    icon={Users}
                    accent="indigo"
                />
                <KpiCard
                    label="ລູກຄ້າ VIP"
                    value={vipCount}
                    sub="ຍອດຊື້ສູງສຸດ"
                    icon={TrendingUp}
                    accent="emerald"
                />
                <KpiCard
                    label="ໜີ້ທັງໝົດ"
                    value={formatCurrency(debt?.totalDebt)}
                    sub={`${debt?.totalCustomersWithDebt || 0} ລູກຄ້າ`}
                    icon={AlertCircle}
                    accent={debt?.totalDebt > 0 ? "rose" : "slate"}
                />
                <KpiCard
                    label="ໜີ້ຄ້າງກຳນົດ"
                    value={formatCurrency(debt?.overdueAmount)}
                    sub={`${debt?.overdueCount || 0} ລູກຄ້າ`}
                    icon={AlertTriangle}
                    accent={debt?.overdueAmount > 0 ? "rose" : "slate"}
                />
            </div>

            {/* ── Section 2: Charts ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Spenders Chart */}
                <Card className="shadow-sm border-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                            ລູກຄ້າຊັ້ນນຳ Top 10
                        </CardTitle>
                        <CardDescription>ຍອດຊື້ລວມຕາມຊ່ວງເວລາທີ່ເລືອກ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {customers.length > 0 ? (
                            <>
                                <TopSpendersChart customers={customers} formatCurrency={formatCurrency} />
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-100">
                                    {[
                                        { key: "VIP",      color: "bg-indigo-600" },
                                        { key: "Loyal",    color: "bg-indigo-400" },
                                        { key: "Regular",  color: "bg-indigo-200" },
                                        { key: "At Risk",  color: "bg-amber-400" },
                                        { key: "Lost",     color: "bg-rose-400" },
                                    ].map(({ key, color }) => (
                                        <div key={key} className="flex items-center gap-1.5">
                                            <div className={`h-2 w-2 rounded-full ${color}`} />
                                            <span className="text-[11px] text-slate-500">{key}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-slate-400 py-8 text-sm">ບໍ່ມີຂໍ້ມູນ</p>
                        )}
                    </CardContent>
                </Card>

                {/* RFM Segmentation */}
                <Card className="shadow-sm border-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            RFM Segmentation
                        </CardTitle>
                        <CardDescription>ຈັດກຸ່ມລູກຄ້າຕາມພຶດຕິກຳ Recency · Frequency · Monetary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {customers.length > 0 ? (
                            <>
                                <RFMDonutChart customers={customers} />

                                <div className="mt-4 space-y-2">
                                    {[
                                        { segment: "VIP",     desc: "ຊື້ເລື້ອຍ, ຍອດສູງ — ດູແລພິເສດ",   accent: "bg-indigo-500" },
                                        { segment: "Loyal",   desc: "ຊື້ເລື້ອຍ — ຮັກສາດ້ວຍ loyalty",  accent: "bg-indigo-300" },
                                        { segment: "Regular", desc: "ຊື້ປົກກະຕິ — ສ້າງ engagement",    accent: "bg-indigo-100 border border-indigo-200" },
                                        { segment: "At Risk", desc: "ຫ່າງຫາຍ — ສົ່ງໂປຣໂມ re-activate",  accent: "bg-amber-400" },
                                        { segment: "Lost",    desc: "ໄດ້ຫາຍໄປ — ພິຈາລະນາ win-back",    accent: "bg-rose-400" },
                                    ].map(({ segment, desc, accent }) => {
                                        const count = customers.filter((c) => c.rfm?.segment === segment).length;
                                        return (
                                            <div key={segment} className="flex items-start gap-3">
                                                <div className={`mt-1.5 w-[3px] h-7 rounded-full shrink-0 ${accent}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-semibold text-slate-700">{segment}</p>
                                                        <span className="text-xs font-bold text-slate-500 tabular-nums">{count} ຄົນ</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-slate-400 py-8 text-sm">ບໍ່ມີຂໍ້ມູນ</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Section 3: At-Risk / Lost Customers ─────────────────────── */}
            <Card className="shadow-sm border-slate-100">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <UserX className="w-4 h-4" />
                                ລູກຄ້າທີ່ເສ່ຍງໝົດ (At Risk + Lost)
                            </CardTitle>
                            <CardDescription className="mt-1">
                                ລູກຄ້າທີ່ຫ່າງຫາຍ ຫຼື  ອາດຈະຢຸດຊື້ — ຕ້ອງການ re-engagement
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="shrink-0 border-amber-200 text-amber-700 bg-amber-50 text-xs">
                            {atRiskCustomers.length} ຄົນ
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {atRiskCustomers.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="text-left py-2 pr-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">ລູກຄ້າ</th>
                                            <th className="text-center py-2 pr-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Segment</th>
                                            <th className="text-right py-2 pr-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold hidden md:table-cell">ຍອດຊື້ລວມ</th>
                                            <th className="text-right py-2 pr-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold hidden md:table-cell">ຈຳນວນບິນ</th>
                                            <th className="text-right py-2 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">ຫ່າງຫາຍ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {atRiskCustomers.slice(0, 15).map((c: any) => {
                                            const days = Math.floor(c.daysSinceLastOrder || 0);
                                            return (
                                                <tr
                                                    key={c.customerId}
                                                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedCustomerId(c.customerId)}
                                                >
                                                    <td className="py-2.5 pr-4">
                                                        <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{c.phone}</p>
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-center">
                                                        <SegmentBadge segment={c.rfm?.segment} />
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right font-mono text-sm text-slate-700 hidden md:table-cell">
                                                        {formatCurrency(c.totalSpent)}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right text-sm text-slate-500 hidden md:table-cell">
                                                        {c.totalOrders} ບິນ
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <span className={`text-sm font-semibold ${days > 90 ? "text-rose-600" : days > 30 ? "text-amber-600" : "text-slate-600"}`}>
                                                            {days}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 ml-1">ວັນ</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    <strong>ຄຳແນະນຳ:</strong> ລູກຄ້າ At Risk ຫ່າງຫາຍ &gt;30 ວັນ ຄວນໄດ້ຮັບ
                                    ໂປຣໂມຊັ່ນສ່ວນຕົວ. ລູກຄ້າ Lost &gt;90 ວັນ ພິຈາລະນາ win-back campaign
                                    ຫຼື  ສຳຫຼວດເຫດຜົນທີ່ຢຸດຊື້.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-60" />
                            <p className="text-sm text-slate-500 font-medium">ລູກຄ້າທຸກຄົນຍັງ active ດີ</p>
                            <p className="text-xs text-slate-400 mt-1">ບໍ່ມີລູກຄ້າ At Risk ຫຼື  Lost ໃນຊ່ວງນີ້</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Section 4: Top Spenders Table ───────────────────────────── */}
            <Card className="shadow-sm border-slate-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        ລູກຄ້າຊັ້ນນຳ — ລາຍລະອຽດ
                    </CardTitle>
                    <CardDescription>ກົດເລືອກລູກຄ້າເພື່ອດູຄວາມມັກ & ຄຳແນະນຳ</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
                        {customers.slice(0, 15).map((c: any, i: number) => (
                            <div
                                key={c.customerId}
                                className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${selectedCustomerId === c.customerId ? "bg-indigo-50 ring-1 ring-indigo-200" : ""}`}
                                onClick={() => setSelectedCustomerId(
                                    selectedCustomerId === c.customerId ? null : c.customerId
                                )}
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < 3 ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                    {i + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <SegmentBadge segment={c.rfm?.segment} />
                                        <span className="text-[11px] text-slate-400">{c.phone}</span>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="font-mono text-sm font-bold text-slate-800">
                                        {formatCurrency(c.totalSpent)}
                                    </p>
                                    <p className="text-[11px] text-slate-400">{c.totalOrders} ບິນ</p>
                                </div>

                                {c.totalDebt > 0 && (
                                    <div className="shrink-0 text-right hidden md:block">
                                        <p className="text-xs font-semibold text-rose-600">{formatCurrency(c.totalDebt)}</p>
                                        <p className="text-[10px] text-slate-400">ໜີ້ຄ້າງ</p>
                                    </div>
                                )}
                            </div>
                        ))}
                        {customers.length === 0 && (
                            <p className="text-center text-slate-400 py-8 text-sm">ບໍ່ມີຂໍ້ມູນ</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Section 5: Debt Management ──────────────────────────────── */}
            <Card className="shadow-sm border-slate-100">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                ການຕິດຕາມໜີ້
                            </CardTitle>
                            <CardDescription className="mt-1">
                                ລວມ {formatCurrency(debt?.totalDebt)}
                                {" · "}ຄ້າງກຳນົດ {formatCurrency(debt?.overdueAmount)}
                            </CardDescription>
                        </div>
                        {(debt?.totalCustomersWithDebt || 0) > 0 && (
                            <Badge variant="outline" className="shrink-0 border-rose-200 text-rose-700 bg-rose-50 text-xs">
                                {debt?.totalCustomersWithDebt} ລູກຄ້າ
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                        {debtSummary?.customers?.map((c: any) => {
                            const isOverdue = c.debtStatus === "overdue";
                            return (
                                <div
                                    key={c.customerId}
                                    className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                                        isOverdue
                                            ? "bg-rose-50/60 border-rose-100"
                                            : "bg-amber-50/40 border-amber-100"
                                    }`}
                                >
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                        {isOverdue
                                            ? <XCircle    className="w-4 h-4 text-rose-500   shrink-0 mt-0.5" />
                                            : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                                            <p className="text-[11px] text-slate-400">{c.phone}</p>
                                            <div className="flex items-center gap-3 mt-1 text-[11px]">
                                                <span className={`font-semibold ${isOverdue ? "text-rose-700" : "text-amber-700"}`}>
                                                    ໜີ້ {formatCurrency(c.totalDebt)}
                                                </span>
                                                <span className="text-slate-500">{c.totalOrders} ບິນ</span>
                                                <span className="text-slate-500">
                                                    ເກົ່າສຸດ {Math.floor(c.daysSinceOldest)} ວັນ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`shrink-0 text-[10px] ${
                                            isOverdue
                                                ? "border-rose-200 text-rose-700 bg-rose-50"
                                                : "border-amber-200 text-amber-700 bg-amber-50"
                                        }`}
                                    >
                                        {isOverdue ? "ເກີນກຳນົດ" : "ປົກກະຕິ"}
                                    </Badge>
                                </div>
                            );
                        })}

                        {(!debtSummary?.customers || debtSummary.customers.length === 0) && (
                            <div className="text-center py-8">
                                <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-60" />
                                <p className="text-sm text-slate-500 font-medium">ບໍ່ມີໜີ້ຄ້າງ</p>
                                <p className="text-xs text-slate-400 mt-1">ລູກຄ້າທຸກຄົນຊຳລະຄົບແລ້ວ</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Section 6: Customer Preferences Panel ───────────────────── */}
            {selectedCustomerId && customerPreferences && (
                <Card className="shadow-sm border-indigo-100">
                    <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50/60 to-slate-50 rounded-t-xl">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    ຄວາມມັກ & ຄຳແນະນຳ —{" "}
                                    <span className="text-indigo-600 normal-case tracking-normal">
                                        {customerPreferences.customer?.name}
                                    </span>
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    ສິນຄ້າທີ່ລູກຄ້ານີ້ມັກຊື້ ແລະ ສິນຄ້າທີ່ຄວນແນະນຳ
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-slate-400 hover:text-slate-600"
                                onClick={() => setSelectedCustomerId(null)}
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Summary strip */}
                        <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-indigo-100">
                            <div className="text-center">
                                <p className="text-[11px] text-slate-400 uppercase tracking-widest">ລາຍການທີ່ເຄີຍຊື້</p>
                                <p className="text-xl font-bold text-indigo-700 mt-0.5">
                                    {customerPreferences.summary.totalProductsPurchased}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] text-slate-400 uppercase tracking-widest">ໝວດທີ່ມັກ</p>
                                <p className="text-sm font-bold text-indigo-700 mt-0.5 truncate">
                                    {customerPreferences.summary.favoriteCategory}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] text-slate-400 uppercase tracking-widest">ຊື້ຫຼາຍທີ່ສຸດ</p>
                                <p className="text-sm font-bold text-indigo-700 mt-0.5 truncate">
                                    {customerPreferences.summary.mostBoughtProduct}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Favourite products */}
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5" /> ສິນຄ້າທີ່ມັກຊື້
                                </p>
                                <div className="space-y-1.5">
                                    {customerPreferences.favoriteProducts.slice(0, 5).map((p: any, i: number) => (
                                        <div key={p.productId} className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < 3 ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-700 truncate">
                                                    {p.productName}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {p.timesBought} ຄັ້ງ · {p.totalQuantity} ຊິ້ນ · {formatCurrency(p.totalSpent)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Category preferences */}
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" /> ໝວດໝູ່ທີ່ມັກ
                                </p>
                                <div className="space-y-2.5">
                                    {customerPreferences.categoryPreferences.slice(0, 5).map((cat: any, i: number) => {
                                        const maxSpent = customerPreferences.categoryPreferences[0]?.totalSpent || 1;
                                        const pct = (cat.totalSpent / maxSpent) * 100;
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-700 font-medium truncate mr-2">
                                                        {cat.category || "ທົ່ວໄປ"}
                                                    </span>
                                                    <span className="text-slate-400 tabular-nums shrink-0">
                                                        {formatCurrency(cat.totalSpent)}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-indigo-400 h-full rounded-full"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" /> ສິນຄ້າທີ່ຄວນແນະນຳ
                                </p>
                                <div className="space-y-1.5">
                                    {customerPreferences.recommendations.slice(0, 5).map((rec: any) => (
                                        <div key={rec._id} className="p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/40">
                                            <p className="text-xs font-medium text-slate-800 truncate">{rec.name}</p>
                                            <p className="text-[10px] text-indigo-600 mt-0.5">{rec.reason}</p>
                                            <div className="flex items-center justify-between mt-1.5">
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
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
