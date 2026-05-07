import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DollarSign,
    TrendingUp,
    ArrowDownRight,
    ShoppingBag,
    Wallet,
    Smartphone,
    AlertCircle
} from "lucide-react";
import { StatCard } from "./StatCard";

interface OverviewTabProps {
    summary: any;
    formatCurrency: (val?: number) => string;
    subscriptionPlan?: string;
}

import { LockOverlay } from "@/components/ui/lock-overlay";

export const OverviewTab = ({ summary, formatCurrency, subscriptionPlan }: OverviewTabProps) => {
    const isProOrEnterprise = subscriptionPlan === 'PRO' || subscriptionPlan === 'ENTERPRISE';
    const isEnterprise = subscriptionPlan === 'ENTERPRISE';

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="ຍອດຂາຍລວມ"
                    value={formatCurrency(summary?.totalSales)}
                    icon={DollarSign}
                    colorClass="bg-indigo-500"
                    trend={12.5} // Mock trend
                    subtext="ລວມຍອດບິນທັງໝົດ"
                />
                <StatCard
                    title="ກຳໄລລວມ"
                    value={formatCurrency(summary?.totalProfit)}
                    icon={TrendingUp}
                    colorClass="bg-emerald-500"
                    subtext={`ກຳໄລແທ້ຫຼັງຫັກຕົ້ນທຶນ`}
                />
                <StatCard
                    title="ສ່ວນຫຼຸດ"
                    value={formatCurrency(summary?.totalDiscount)}
                    icon={ArrowDownRight}
                    colorClass="bg-rose-500"
                    subtext="ລວມສ່ວນຫຼຸດທີ່ໃຫ້ລູກຄ້າ"
                />
                <StatCard
                    title="ຈຳນວນໃບບຶນ "
                    value={(summary?.totalOrders || 0).toLocaleString()}
                    icon={ShoppingBag}
                    colorClass="bg-blue-500"
                    subtext={`ສະເລ່ຍ ${formatCurrency(summary?.avgOrderValue)}/ບິນ`}
                />
            </div>

            {/* Payment Method Reports (NEW) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cash Report */}
                <Card className="border-slate-100 shadow-sm overflow-hidden group hover:border-indigo-200 transition-colors">
                    <div className="bg-indigo-600 p-4 text-white">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-bold uppercase tracking-wider opacity-80">ເງິນສົດ</p>
                            <Wallet className="w-4 h-4" />
                        </div>
                        <h3 className="text-2xl font-black font-mono">
                            {formatCurrency(summary?.breakdownByMethod?.find((b: any) => b.method === 'CASH')?.netRevenue || 0)}
                        </h3>
                    </div>
                    <CardContent className="p-4 bg-white">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>ຈຳນວນບິນ:</span>
                            <span className="font-bold text-slate-700">
                                {summary?.breakdownByMethod?.find((b: any) => b.method === 'CASH')?.totalOrders || 0} ບິນ
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-rose-500">
                            <span>ສ່ວນຫຼຸດ:</span>
                            <span className="font-bold">
                                -{formatCurrency(summary?.breakdownByMethod?.find((b: any) => b.method === 'CASH')?.totalDiscount || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Transfer Report */}
                <Card className="border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
                    <div className="bg-blue-600 p-4 text-white">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-bold uppercase tracking-wider opacity-80">ເງິນໂອນ</p>
                            <Smartphone className="w-4 h-4" />
                        </div>
                        <h3 className="text-2xl font-black font-mono">
                            {formatCurrency(summary?.breakdownByMethod?.find((b: any) => b.method === 'TRANSFER')?.totalSales || 0)}
                        </h3>
                    </div>
                    <CardContent className="p-4 bg-white">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>ຈຳນວນບິນ:</span>
                            <span className="font-bold text-slate-700">
                                {summary?.breakdownByMethod?.find((b: any) => b.method === 'TRANSFER')?.totalOrders || 0} ບິນ
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-rose-500">
                            <span>ສ່ວນຫຼຸດ:</span>
                            <span className="font-bold">
                                -{formatCurrency(summary?.breakdownByMethod?.find((b: any) => b.method === 'TRANSFER')?.totalDiscount || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Debt Report */}
                <Card className="relative border-slate-100 shadow-sm overflow-hidden group hover:border-red-200 transition-colors">
                    {!isProOrEnterprise && (
                        <LockOverlay
                            title="Reports Locked"
                            description="Upgrade to PRO to view Debt Reports & Customer Analytics"
                        />
                    )}
                    <div className={!isProOrEnterprise ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
                        <div className="bg-red-600 p-4 text-white">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold uppercase tracking-wider opacity-80">ຕິດໜີ້</p>
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <h3 className="text-2xl font-black font-mono">
                                {formatCurrency(summary?.breakdownByMethod?.find((b: any) => b.method === 'DEBT')?.totalDebt || 0)}
                            </h3>
                        </div>
                        <CardContent className="p-4 bg-white">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>ຈຳນວນບິນ:</span>
                                <span className="font-bold text-slate-700">
                                    {summary?.breakdownByMethod?.find((b: any) => b.method === 'DEBT')?.totalOrders || 0} ບິນ
                                </span>
                            </div>
                            <div className="flex justify-between text-xs text-rose-500">
                                <span>ສ່ວນຫຼຸດ:</span>
                                <span className="font-bold">
                                    -{formatCurrency(summary?.breakdownByMethod?.find((b: any) => b.method === 'DEBT')?.totalDiscount || 0)}
                                </span>
                            </div>
                        </CardContent>
                    </div>
                </Card>
            </div>

            {/* Multi-Currency Received Breakdown */}
            <Card className="py-10 relative border-slate-100 shadow-sm overflow-hidden">
                {!isEnterprise && (
                    <LockOverlay
                        title="ຂາຍຫຼາຍສະກຸນຖືກລັອກໄວ້"
                        description="Upgrade to ENTERPRISE for Multi-Currency Logic"
                    />
                )}
                <div className={!isEnterprise ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
                    <CardHeader className="bg-slate-50/50 pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-indigo-500" />
                                ສະກຸນເງິນທີ່ຮັບມາ.
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">*</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-slate-100">
                            {summary?.receivedBreakdown?.map((b: any) => (
                                <div key={b.currency} className="bg-white p-4">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{b.currency}</p>
                                    <p className="text-xl font-mono font-bold text-slate-800">
                                        {b.amount.toLocaleString()} {b.currency}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        ≈ {formatCurrency(b.amountInLAK)}
                                    </p>
                                </div>
                            ))}
                            {(!summary?.receivedBreakdown || summary.receivedBreakdown.length === 0) && (
                                <div className="bg-white p-4 col-span-4 text-center text-slate-400 text-sm">
                                    ຍັງບໍ່ມີຂໍ້ມູນການຮັບເງິນ
                                </div>
                            )}
                        </div>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
