import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendingUp,
    Wallet,
    Clock,
    BarChart2,
    CreditCard,
    Banknote,
    SmartphoneNfc,
    CircleX,
    PackageX,
    Undo2,
    HandCoins,
    BadgePercent,
    CircleGauge,
    ReceiptText,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { LockOverlay } from "@/components/ui/lock-overlay";
import { PeakHoursChart } from "./charts/PeakHoursChart";
import { PaymentDonutChart } from "./charts/PaymentDonutChart";
import { SaleModeChart } from "./charts/SaleModeChart";
import type { SummaryStats } from "@/api/reports";
import { DebtRepaymentModal } from "./DebtRepaymentModal";

interface OverviewTabProps {
    summary?: SummaryStats;
    formatCurrency: (val?: number) => string;
    subscriptionPlan?: string;
    showLocks?: boolean;
    showSensitiveData?: boolean;
    showPaymentMethods?: boolean;
    reportingPeriod?: {
        startDate: Date;
        endDate: Date;
        saleMode?: "retail" | "wholesale";
    };
}

export const OverviewTab = ({
    summary,
    formatCurrency,
    subscriptionPlan,
    showLocks = true,
    showSensitiveData = true,
    showPaymentMethods = showSensitiveData,
    reportingPeriod,
}: OverviewTabProps) => {
    const [repaymentsOpen, setRepaymentsOpen] = useState(false);
    const isProOrEnterprise = subscriptionPlan === 'PRO' || subscriptionPlan === 'ENTERPRISE';
    const isEnterprise = subscriptionPlan === 'ENTERPRISE';
    const shouldLockAdvancedReports = showLocks && !isProOrEnterprise;
    const shouldLockMultiCurrency = showLocks && !isEnterprise;

    const retail    = summary?.breakdownBySaleMode?.find((breakdown) => breakdown.mode === "retail");
    const wholesale = summary?.breakdownBySaleMode?.find((breakdown) => breakdown.mode === "wholesale");
    const saleModeBreakdown = summary?.breakdownBySaleMode || [];
    const receivedBreakdown = summary?.receivedBreakdown || [];

    const hourlyBreakdown: { hour: number; orders: number; sales: number }[] =
        summary?.hourlyBreakdown || [];
    const peakHour = hourlyBreakdown.length > 0
        ? hourlyBreakdown.reduce((best, h) => (h.orders > best.orders ? h : best), hourlyBreakdown[0])
        : null;
    const hoursWithSales = hourlyBreakdown.filter((h) => h.orders > 0).length;

    const cashData     = summary?.receivedByMethod?.find((breakdown) => breakdown.method === "CASH");
    const transferData = summary?.receivedByMethod?.find((breakdown) => breakdown.method === "TRANSFER");
    const debtData     = summary?.breakdownByMethod?.find((breakdown) => breakdown.method === "DEBT");
    const cashInFromNewBills = summary?.cashInFromNewBills ?? summary?.actualReceivedFromOrders ?? 0;
    const debtRepaymentIncome = summary?.debtRepaymentIncome ?? 0;
    const moneyOut = summary?.moneyOut ?? ((summary?.refundAmount || 0) + (summary?.reversalAmount || 0));
    const discountAmount = summary?.discountAmount ?? summary?.totalDiscount ?? 0;
    const netCashReceived = summary?.netCashReceived ?? summary?.netCashFlow ?? (cashInFromNewBills + debtRepaymentIncome - moneyOut);
    const netProfit = summary?.netCashProfit ?? summary?.netProfitAfterAdjustments ?? summary?.netProfit ?? 0;

    return (
        <div className="space-y-5">

            {/* ─── KPI Row ─── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {showSensitiveData ? (
                    <>
                        <StatCard
                            title="ເງິນຮັບສຸດທິ"
                            value={formatCurrency(netCashReceived)}
                            icon={TrendingUp}
                            accent={netCashReceived >= 0 ? "emerald" : "rose"}
                            subtext="ຂາຍຫຼັງຫຼຸດ + ໜີ້ - ຄືນເງິນ"
                        />
                        <StatCard
                            title="ຮັບຈາກບິນໃໝ່"
                            value={formatCurrency(cashInFromNewBills)}
                            icon={Banknote}
                            accent="emerald"
                            subtext="ຫຼັງຫັກສ່ວນຫຼຸດໜ້າຮ້ານ"
                        />
                        <StatCard
                            title="ຮັບຊຳລະໜີ້"
                            value={formatCurrency(debtRepaymentIncome)}
                            icon={HandCoins}
                            accent="emerald"
                            subtext={`${summary?.debtRepaymentCount || 0} ລາຍການ`}
                            onClick={reportingPeriod ? () => setRepaymentsOpen(true) : undefined}
                            ariaLabel="ເບິ່ງລາຍການຮັບຊຳລະໜີ້"
                        />
                        <StatCard
                            title="ກຳໄລຮັບຮູ້"
                            value={formatCurrency(netProfit)}
                            icon={TrendingUp}
                            accent={netProfit >= 0 ? "emerald" : "rose"}
                            subtext="ບໍ່ນັບໜີ້ທີ່ຍັງບໍ່ຊຳລະ"
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="ຈຳນວນບິນ"
                            value={(summary?.totalOrders || 0).toLocaleString()}
                            icon={ReceiptText}
                            accent="indigo"
                            subtext="ບິນຂາຍຂອງທ່ານ"
                        />
                        <StatCard
                            title="ສະເລ່ຍຕໍ່ບິນ"
                            value={formatCurrency(summary?.avgOrderValue)}
                            icon={CircleGauge}
                            accent="indigo"
                            subtext="ຄິດຈາກຍອດຂາຍຂອງທ່ານ"
                        />
                    </>
                )}
            </div>

            {showSensitiveData ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <StatCard title="ບິນຕິດໜີ້" value={(debtData?.totalOrders || 0).toLocaleString()} icon={CreditCard} accent="rose" subtext={formatCurrency(debtData?.totalDebt || summary?.totalDebt)} />
                    <StatCard title="ສ່ວນຫຼຸດໜ້າຮ້ານ" value={formatCurrency(discountAmount)} icon={BadgePercent} accent="amber" subtext="" />
                    <StatCard title="ຄືນເງິນ/ຍົກເລີກ" value={formatCurrency(moneyOut)} icon={Undo2} accent="rose" subtext="refund ແລະ reversal" />
                    <StatCard title="ບິນຍົກເລີກ" value={(summary?.cancelledOrders?.count || 0).toLocaleString()} icon={CircleX} accent="rose" subtext={formatCurrency(summary?.cancelledOrders?.amount)} />
                    <StatCard title="ສິນຄ້າຄືນ" value={`${summary?.returns?.units || 0} ຊິ້ນ`} icon={PackageX} accent="amber" subtext={`${summary?.returns?.count || 0} ລາຍການ · ${formatCurrency(summary?.returns?.value)}`} />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="ບິນຍົກເລີກ" value={(summary?.cancelledOrders?.count || 0).toLocaleString()} icon={CircleX} accent="rose" subtext="ສະເພາະບິນຂອງທ່ານ" />
                    <StatCard title="ສິນຄ້າຄືນ" value={`${summary?.returns?.units || 0} ຊິ້ນ`} icon={PackageX} accent="amber" subtext={`${summary?.returns?.count || 0} ລາຍການ`} />
                </div>
            )}

            {/* ─── Sale Mode ─── */}
            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="px-5 pt-5 pb-0">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-indigo-500" />
                        ການຂາຍແຍກປະເພດ
                        <span className="ml-auto flex gap-2 text-[10px] font-semibold">
                            <span className="flex items-center gap-1 text-indigo-600">
                                <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                                ຂາຍຍ່ອຍ
                            </span>
                            <span className="flex items-center gap-1 text-indigo-400">
                                <span className="inline-block h-2 w-2 rounded-full bg-indigo-300" />
                                ຂາຍສົ່ງ
                            </span>
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                        {/* Chart */}
                        <div className="md:col-span-2">
                            {saleModeBreakdown.length > 0 ? (
                                <SaleModeChart
                                    breakdownBySaleMode={saleModeBreakdown}
                                    formatCurrency={formatCurrency}
                                    showProfit={showSensitiveData}
                                />
                            ) : (
                                <div className="h-52 flex items-center justify-center text-slate-300 text-sm">
                                    ຍັງບໍ່ມີຂໍ້ມູນ
                                </div>
                            )}
                        </div>

                        {/* Stat panels */}
                        <div className="flex flex-col gap-3">
                            {/* Retail */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="h-1.5 w-4 rounded-full bg-indigo-500" />
                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ຂາຍຍ່ອຍ</span>
                                </div>
                                {retail ? (
                                    <div className="space-y-2">
                                        {showSensitiveData && <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] text-slate-400">ຍອດ</span>
                                            <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(retail.totalSales)}</span>
                                        </div>}
                                        {showSensitiveData && <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] text-slate-400">ບິນ</span>
                                            <span className="text-xs font-semibold text-slate-700 tabular-nums">{retail.totalOrders} ບິນ</span>
                                        </div>}
                                        {showSensitiveData && <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] text-slate-400">ກຳໄລ</span>
                                            <span className="text-xs font-semibold text-emerald-600 tabular-nums">
                                                {formatCurrency(retail.totalProfit)}
                                                {retail.totalSales > 0 && (
                                                    <span className="text-slate-400 ml-1 font-normal">
                                                        {(((retail.totalProfit || 0) / retail.totalSales) * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </span>
                                        </div>}
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] text-slate-400">avg/ບິນ</span>
                                            <span className="text-xs font-semibold text-slate-700 tabular-nums">{formatCurrency(retail.avgOrderValue)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-300 py-2">ຍັງບໍ່ມີຂໍ້ມູນ</p>
                                )}
                            </div>

                            {/* Wholesale */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="h-1.5 w-4 rounded-full bg-indigo-300" />
                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ຂາຍສົ່ງ</span>
                                </div>
                                {wholesale ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] text-slate-400">ຍອດ</span>
                                            <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(wholesale.totalSales)}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] text-slate-400">ບິນ</span>
                                            <span className="text-xs font-semibold text-slate-700 tabular-nums">{wholesale.totalOrders} ບິນ</span>
                                        </div>
                                        {showSensitiveData && <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] text-slate-400">ກຳໄລ</span>
                                            <span className="text-xs font-semibold text-emerald-600 tabular-nums">
                                                {formatCurrency(wholesale.totalProfit)}
                                                {wholesale.totalSales > 0 && (
                                                    <span className="text-slate-400 ml-1 font-normal">
                                                        {(((wholesale.totalProfit || 0) / wholesale.totalSales) * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </span>
                                        </div>}
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] text-slate-400">avg/ບິນ</span>
                                            <span className="text-xs font-semibold text-slate-700 tabular-nums">{formatCurrency(wholesale.avgOrderValue)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-300 py-2">ຍັງບໍ່ມີຂໍ້ມູນ</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Payment Methods ─── */}
            {showPaymentMethods && <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Donut */}
                <Card className="border-slate-200 shadow-sm bg-white lg:col-span-2 flex flex-col justify-center p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
                        ສັດສ່ວນວິທີຊຳລະ
                    </p>
                    <PaymentDonutChart
                        breakdownByMethod={summary?.receivedByMethod || []}
                        formatCurrency={formatCurrency}
                    />
                </Card>

                {/* Method cards */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cash */}
                    <Card className="border-slate-200 shadow-sm bg-white hover:border-emerald-200 transition-colors">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <Banknote className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ເງິນສົດ</span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                                    {cashData?.transactionCount || 0} ລາຍການ
                                </span>
                            </div>
                            <p className="text-xl font-bold text-slate-900 tabular-nums leading-none">
                                {formatCurrency(cashData?.totalReceived || 0)}
                            </p>
                            <p className="text-xs text-slate-400 mt-2 font-medium">ຂາຍ + ຮັບຊຳລະໜີ້</p>
                        </CardContent>
                    </Card>

                    {/* Transfer */}
                    <Card className="border-slate-200 shadow-sm bg-white hover:border-sky-200 transition-colors">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-sky-50 flex items-center justify-center">
                                        <SmartphoneNfc className="w-4 h-4 text-sky-500" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ເງິນໂອນ</span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-500">
                                    {transferData?.transactionCount || 0} ລາຍການ
                                </span>
                            </div>
                            <p className="text-xl font-bold text-slate-900 tabular-nums leading-none">
                                {formatCurrency(transferData?.totalReceived || 0)}
                            </p>
                            <p className="text-xs text-slate-400 mt-2 font-medium">ຂາຍ + ຮັບຊຳລະໜີ້</p>
                        </CardContent>
                    </Card>

                    {/* Debt */}
                    <Card className="relative border-slate-200 shadow-sm bg-white hover:border-rose-200 transition-colors">
                        {shouldLockAdvancedReports && (
                            <LockOverlay
                                title="Reports Locked"
                                description="Upgrade to PRO"
                            />
                        )}
                        <div className={shouldLockAdvancedReports ? "blur-[2px] opacity-40 pointer-events-none select-none" : ""}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center">
                                            <CreditCard className="w-4 h-4 text-rose-400" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ຕິດໜີ້</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500">
                                        {debtData?.totalOrders || 0} ບິນ
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-rose-600 tabular-nums leading-none">
                                    {formatCurrency(debtData?.totalDebt || 0)}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">ຍອດຄ້າງຊຳລະ</p>
                            </CardContent>
                        </div>
                    </Card>
                </div>
            </div>}

            {/* ─── Peak Hours ─── */}
            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="px-5 pt-5 pb-0">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        ຊ່ວງເວລາຂາຍດີ
                        {peakHour && peakHour.orders > 0 && (
                            <span className="ml-auto text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                                peak {peakHour.hour}:00 — {peakHour.orders} ບິນ
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-4">
                    {hourlyBreakdown.length > 0 ? (
                        <>
                            <PeakHoursChart hourlyBreakdown={hourlyBreakdown} />
                            <div className="flex gap-6 mt-3 pt-3 border-t border-slate-100">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">ຊ່ວງໜ້ອຍ</p>
                                    <p className="text-sm font-bold text-slate-800">
                                        {peakHour ? `${peakHour.hour}:00 — ${peakHour.orders} ບິນ` : "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">ຊ່ວງທີ່ມີຂາຍ</p>
                                    <p className="text-sm font-bold text-slate-800">{hoursWithSales} ຊ່ວງ</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-44 text-slate-300 text-sm">
                            ຍັງບໍ່ມີຂໍ້ມູນ
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── Multi-Currency (ENTERPRISE) ─── */}
            {showSensitiveData && <Card className="relative border-slate-200 shadow-sm bg-white overflow-hidden">
                {shouldLockMultiCurrency && (
                    <LockOverlay
                        title="Multi-Currency Locked"
                        description="Upgrade to ENTERPRISE"
                    />
                )}
                <div className={shouldLockMultiCurrency ? "blur-[2px] opacity-40 pointer-events-none select-none" : ""}>
                    <CardHeader className="px-5 pt-5 pb-0">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-indigo-400" />
                            ສະກຸນເງິນທີ່ຮັບ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        {receivedBreakdown.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {receivedBreakdown.map((b) => (
                                    <div key={b.currency} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">{b.currency}</p>
                                        <p className="text-lg font-bold text-slate-900 tabular-nums leading-none">
                                            {b.amount.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1.5">
                                            ≈ {formatCurrency(b.amountInLAK)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-300 text-center py-4">ຍັງບໍ່ມີຂໍ້ມູນ</p>
                        )}
                    </CardContent>
                </div>
            </Card>}

            {reportingPeriod && (
                <DebtRepaymentModal
                    open={repaymentsOpen}
                    onOpenChange={setRepaymentsOpen}
                    startDate={reportingPeriod.startDate}
                    endDate={reportingPeriod.endDate}
                    saleMode={reportingPeriod.saleMode}
                />
            )}
        </div>
    );
};
