import {
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    DollarSign,
    Package,
    TrendingDown,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LockOverlay } from "@/components/ui/lock-overlay";
import { TopProductsChart } from "./charts/TopProductsChart";
import { ABCDonutChart } from "./charts/ABCDonutChart";

interface ProductsTabProps {
    productPerformance: any;
    stockMovement: any[];
    lowStockProducts: any;
    inventory: any;
    formatCurrency: (val?: number) => string;
    subscriptionPlan?: string;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
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

// ─── Main component ────────────────────────────────────────────────────────────
export const ProductsTab = ({
    productPerformance,
    lowStockProducts,
    inventory,
    formatCurrency,
    subscriptionPlan,
}: ProductsTabProps) => {
    const isBasic = subscriptionPlan === "BASIC";
    const products: any[] = productPerformance?.products || [];
    const summary = productPerformance?.summary;

    const slowMoving = products
        .filter((p) => p.abcClass === "C")
        .sort((a, b) => a.totalSold - b.totalSold);

    const lowStockCount = lowStockProducts?.data?.length || 0;

    return (
        <div className="space-y-6">

            {/* ── Section 1: KPI Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                    label="ສິນຄ້າທີ່ມີການຂາຍ"
                    value={summary?.totalProducts || 0}
                    sub="ລາຍການ"
                    icon={Package}
                    accent="indigo"
                />
                <KpiCard
                    label="ຍອດຂາຍລວມ"
                    value={formatCurrency(summary?.totalRevenue)}
                    sub={`${(summary?.totalUnitsSold || 0).toLocaleString()} ຊິ້ນ`}
                    icon={TrendingUp}
                    accent="emerald"
                />
                <KpiCard
                    label="ກຳໄລລວມ"
                    value={formatCurrency(summary?.totalProfit)}
                    sub={`Margin ${summary?.avgProfitMargin?.toFixed(1) || 0}%`}
                    icon={DollarSign}
                    accent="emerald"
                />
                <KpiCard
                    label="ສິນຄ້າໃກ້ໝົດ / ໝົດ"
                    value={lowStockCount}
                    sub="ລາຍການ"
                    icon={AlertTriangle}
                    accent={lowStockCount > 0 ? "rose" : "slate"}
                />
            </div>

            {/* ── Section 2: Charts ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Products Chart */}
                <Card className="shadow-sm border-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                            ສິນຄ້າຂາຍດີ Top 10
                        </CardTitle>
                        <CardDescription>ຍອດຂາຍລວມຕາມຊ່ວງເວລາທີ່ເລືອກ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {products.length > 0 ? (
                            <>
                                <TopProductsChart products={products} formatCurrency={formatCurrency} />
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                                    {[
                                        { cls: "A", label: "ຊັ້ນນຳ",  color: "bg-indigo-500" },
                                        { cls: "B", label: "ປານກາງ", color: "bg-indigo-300" },
                                        { cls: "C", label: "ຂາຍຊ້າ", color: "bg-indigo-100 border border-indigo-200" },
                                    ].map(({ cls, label, color }) => (
                                        <div key={cls} className="flex items-center gap-1.5">
                                            <div className={`h-2 w-2 rounded-full ${color}`} />
                                            <span className="text-[11px] text-slate-500">Class {cls} · {label}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-slate-400 py-8 text-sm">ບໍ່ມີຂໍ້ມູນ</p>
                        )}
                    </CardContent>
                </Card>

                {/* ABC Analysis */}
                <Card className="relative shadow-sm border-slate-100 overflow-hidden">
                    {isBasic && (
                        <LockOverlay
                            title="ABC Analysis Locked"
                            description="Upgrade to PRO to optimise inventory with Pareto analysis."
                            showUpgradeBadge
                        />
                    )}
                    <div className={isBasic ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                                ABC Analysis (Pareto)
                            </CardTitle>
                            <CardDescription>ຈັດກຸ່ມສິນຄ້າຕາມຍອດຂາຍ — A=80%, B=15%, C=5%</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {products.length > 0 ? (
                                <>
                                    <ABCDonutChart products={products} />

                                    <div className="mt-4 space-y-2.5">
                                        {[
                                            {
                                                cls: "A",
                                                heading: "ຊັ້ນນຳ — ດູແລໃກ້ຊິດ",
                                                desc: "ຍອດຂາຍສູງ, ຕ້ອງຮັກສາ stock ຕະຫຼອດ",
                                                bar: "bg-indigo-500",
                                            },
                                            {
                                                cls: "B",
                                                heading: "ປານກາງ — ຕິດຕາມປົກກະຕິ",
                                                desc: "ທົບທວນທຸກ 2 ອາທິດ",
                                                bar: "bg-indigo-300",
                                            },
                                            {
                                                cls: "C",
                                                heading: "ຂາຍຊ້າ — ພິຈາລະນາ",
                                                desc: "ຫຼຸດລາຄາ ຫຼື  ຢຸດສັ່ງເຂົ້າ",
                                                bar: "bg-slate-200",
                                            },
                                        ].map(({ cls, heading, desc, bar }) => {
                                            const count = products.filter((p) => p.abcClass === cls).length;
                                            const pct = products.length > 0
                                                ? ((count / products.length) * 100).toFixed(0)
                                                : "0";
                                            return (
                                                <div key={cls} className="flex items-start gap-3">
                                                    <div className={`mt-1.5 w-[3px] h-8 rounded-full shrink-0 ${bar}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold text-slate-700">{heading}</p>
                                                            <span className="text-xs font-bold text-slate-500 tabular-nums">{count} ({pct}%)</span>
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
                    </div>
                </Card>
            </div>

            {/* ── Section 3: Slow-Moving Products ─────────────────────────── */}
            <Card className="relative shadow-sm border-slate-100 overflow-hidden">
                {isBasic && (
                    <LockOverlay
                        title="Slow-Moving Report Locked"
                        description="Upgrade to PRO to identify and action slow-moving inventory."
                        showUpgradeBadge
                    />
                )}
                <div className={isBasic ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4" />
                                    ສິນຄ້າຂາຍໄດ້ໜ້ອຍ (Class C)
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    ສິນຄ້າທີ່ມີຍອດຂາຍຕ່ຳທີ່ສຸດ — ຕ້ອງການການຕັດສິນໃຈ
                                </CardDescription>
                            </div>
                            <Badge
                                variant="outline"
                                className="shrink-0 border-rose-200 text-rose-700 bg-rose-50 text-xs"
                            >
                                {slowMoving.length} ລາຍການ
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {slowMoving.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="text-left py-2 pr-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold w-8">#</th>
                                                <th className="text-left py-2 pr-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">ສິນຄ້າ</th>
                                                <th className="text-right py-2 pr-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">ຂາຍໄດ້</th>
                                                <th className="text-right py-2 pr-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">ຍອດຂາຍ</th>
                                                <th className="text-right py-2 pr-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold hidden md:table-cell">Margin</th>
                                                <th className="text-right py-2 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slowMoving.slice(0, 15).map((p: any, i: number) => (
                                                <tr
                                                    key={p.productId}
                                                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                                                >
                                                    <td className="py-2.5 pr-4 text-slate-400 text-xs tabular-nums">{i + 1}</td>
                                                    <td className="py-2.5 pr-4">
                                                        <p className="font-medium text-slate-800 text-sm leading-snug truncate max-w-[180px]" title={p.name}>
                                                            {p.name}
                                                        </p>
                                                        {p.category && (
                                                            <p className="text-[11px] text-slate-400 mt-0.5">{p.category}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right">
                                                        <span className={`font-mono text-sm font-semibold ${p.totalSold === 0 ? "text-rose-500" : "text-slate-600"}`}>
                                                            {p.totalSold}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 ml-1">ຊິ້ນ</span>
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right font-mono text-sm text-slate-700">
                                                        {formatCurrency(p.totalRevenue)}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right hidden md:table-cell">
                                                        <span className="text-sm text-slate-500">{p.profitMargin?.toFixed(1)}%</span>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <span className={`text-sm font-semibold ${
                                                            p.stockStatus === "out-of-stock"
                                                                ? "text-rose-500"
                                                                : p.stockStatus === "critical"
                                                                    ? "text-orange-500"
                                                                    : "text-slate-600"
                                                        }`}>
                                                            {p.currentStock}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        <strong>ຄຳແນະນຳ:</strong> ສິນຄ້າ Class C ທີ່ຂາຍໄດ້ 0 ຊິ້ນໃນຊ່ວງນີ້ ຄວນ
                                        ພິຈາລະນາຫຼຸດລາຄາໂປຣໂມຊັ່ນ, ລ້ຽງສະຕ໋ອກໃຫ້ຕ່ຳ ຫຼື  ຢຸດສັ່ງເຂົ້າໃໝ່
                                        ເພື່ອປ້ອງກັນ dead stock.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-60" />
                                <p className="text-sm text-slate-500 font-medium">ບໍ່ມີສິນຄ້າ Class C ໃນຊ່ວງນີ້</p>
                                <p className="text-xs text-slate-400 mt-1">ສິນຄ້າທຸກລາຍການມີຍອດຂາຍດີ</p>
                            </div>
                        )}
                    </CardContent>
                </div>
            </Card>

            {/* ── Section 4: Top Table & Low Stock ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top 10 Table */}
                <Card className="shadow-sm border-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            ສິນຄ້າຂາຍດີ Top 10
                        </CardTitle>
                        <CardDescription>ລາຍລະອຽດ profit & stock</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                            {products.slice(0, 10).map((p: any, i: number) => (
                                <div
                                    key={p.productId}
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                        i < 3
                                            ? "bg-indigo-500 text-white"
                                            : "bg-slate-100 text-slate-500"
                                    }`}>
                                        {i + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate" title={p.name}>
                                            {p.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                {p.abcClass}
                                            </span>
                                            {p.category && (
                                                <span className="text-[11px] text-slate-400 truncate">{p.category}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="font-mono text-sm font-bold text-slate-800">
                                            {formatCurrency(p.totalRevenue)}
                                        </p>
                                        <p className="text-[11px] text-slate-400">{p.totalSold} ຊິ້ນ</p>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <p className="text-center text-slate-400 py-8 text-sm">ບໍ່ມີຂໍ້ມູນ</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card className="shadow-sm border-slate-100">
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    ສິນຄ້າໃກ້ໝົດ / ໝົດ
                                </CardTitle>
                                <CardDescription className="mt-1">ຕ້ອງສັ່ງເຂົ້າດ່ວນ</CardDescription>
                            </div>
                            {lowStockCount > 0 && (
                                <Badge className="shrink-0 bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                                    {lowStockCount} ລາຍການ
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                            {lowStockProducts?.data?.map((p: any) => {
                                const isOut = p.status === "out-of-stock";
                                const isCrit = p.status === "critical";
                                return (
                                    <div
                                        key={p._id}
                                        className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                                            isOut  ? "bg-rose-50/60 border-rose-100"   :
                                            isCrit ? "bg-orange-50/60 border-orange-100" :
                                                     "bg-amber-50/40 border-amber-100"
                                        }`}
                                    >
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            {isOut  && <XCircle     className="w-4 h-4 text-rose-500   shrink-0 mt-0.5" />}
                                            {isCrit && <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />}
                                            {!isOut && !isCrit && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate" title={p.name}>
                                                    {p.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                                    <span>ເຫຼື ອ <strong>{p.stock}</strong> / min {p.minStock}</span>
                                                    {p.reorderQuantity > 0 && (
                                                        <span className="text-indigo-600 font-semibold">· ສັ່ງ {p.reorderQuantity}</span>
                                                    )}
                                                </div>
                                                {p.supplier && (
                                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{p.supplier}</p>
                                                )}
                                            </div>
                                        </div>

                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 text-[10px] ${
                                                isOut  ? "border-rose-200   text-rose-700   bg-rose-50"   :
                                                isCrit ? "border-orange-200 text-orange-700 bg-orange-50" :
                                                         "border-amber-200  text-amber-700  bg-amber-50"
                                            }`}
                                        >
                                            {isOut ? "ໝົດ" : isCrit ? "ດ່ວນ" : "ໃກ້ໝົດ"}
                                        </Badge>
                                    </div>
                                );
                            })}

                            {(!lowStockProducts?.data || lowStockProducts.data.length === 0) && (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-60" />
                                    <p className="text-sm text-slate-500 font-medium">ສະຕ໋ອກທຸກລາຍການປົກກະຕິ</p>
                                    <p className="text-xs text-slate-400 mt-1">ບໍ່ມີສິນຄ້າໃກ້ໝົດ</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Section 5: Inventory Valuation ──────────────────────────── */}
            <Card className="relative shadow-sm border-slate-100 overflow-hidden">
                {isBasic && (
                    <LockOverlay
                        title="Inventory Valuation Locked"
                        description="Upgrade to PRO to see total inventory value."
                        showUpgradeBadge
                    />
                )}
                <div className={isBasic ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                            ພາບລວມຄັງສິນຄ້າ
                        </CardTitle>
                        <CardDescription>ມູນຄ່າສະຕ໋ອກທັງໝົດ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Cost value */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                                    ມູນຄ່າຕົ້ນທຶນ (Cost Value)
                                </p>
                                <p className="text-3xl font-bold text-slate-800 mt-2">
                                    {formatCurrency(inventory?.totalCostValue)}
                                </p>
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                                    <div>
                                        <p className="text-[11px] text-slate-400">ຈຳນວນລາຍການ</p>
                                        <p className="text-xl font-bold text-slate-700 mt-0.5">{inventory?.totalItems || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400">ຊິ້ນໃນຄັງ</p>
                                        <p className="text-xl font-bold text-slate-700 mt-0.5">{inventory?.totalStock || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Category breakdown + retail value */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
                                        ສັດສ່ວນຕາມໝວດໝູ່
                                    </p>
                                    <div className="space-y-2.5">
                                        {inventory?.categoryBreakdown?.slice(0, 4).map((cat: any) => (
                                            <div key={cat.category}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-700 font-medium truncate mr-2">{cat.category}</span>
                                                    <span className="text-slate-400 tabular-nums shrink-0">{cat.stockCount}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-indigo-400 h-full rounded-full"
                                                        style={{
                                                            width: `${(cat.stockCount / (inventory?.totalStock || 1)) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
                                    <p className="text-[11px] uppercase tracking-widest text-indigo-400 font-semibold">
                                        ມູນຄ່າຂາຍ (Retail Value)
                                    </p>
                                    <p className="text-2xl font-bold text-indigo-700 mt-1.5">
                                        {formatCurrency(inventory?.totalRetailValue)}
                                    </p>
                                    <p className="text-[11px] text-indigo-500 mt-1">
                                        ຄາດຄະເນຍອດຂາຍທັງໝົດຂອງສິນຄ້າ (ນັບຈາກລາຄາຂາຍສົ່ງ ຖ້າສິນຄ້າໃດບໍ່ມີລາຄາສົ່ງ ແມ່ນເອົາລາຄາຂາຍຍ່ອຍ)ຖ້າຂາຍໝົດທຸກຊິ້ນ
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
