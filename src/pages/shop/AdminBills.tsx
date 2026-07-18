import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Ban,
    Banknote,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    DollarSign,
    Eye,
    FileText,
    HandCoins,
    PackageX,
    Receipt,
    RotateCcw,
    Search,
    ShoppingBag,
    Store,
    UserRound,
    Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { createOrderReturn, getFinancialActivities, getOrderReturns, restockReturnItem, type FinancialActivity, type FinancialOrder, type OrderReturnRecord } from "@/api/financial";
import { cancelOrder } from "@/api/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getShopSummary, type DateRangeParams } from "@/api/reports";
import { StatCard } from "./components/StatCard";

const money = (value?: number) => `${(value || 0).toLocaleString()} ₭`;
const sourceLabel: Record<string, string> = {
    SALE: "ຂາຍ",
    DEBT_REPAYMENT: "ຮັບຊຳລະໜີ້",
    REFUND: "ຄືນເງິນ",
    REVERSAL: "ຍົກເລີກ",
};
const methodLabel: Record<string, string> = { CASH: "ເງິນສົດ", TRANSFER: "ເງິນໂອນ", MIXED: "ປະສົມ", DEBT: "ຕິດໜີ້" };
const paymentStatusLabel: Record<string, string> = { PAID: "ຊຳລະແລ້ວ", PARTIAL: "ຊຳລະບາງສ່ວນ", UNPAID: "ຍັງບໍ່ຊຳລະ" };
const paymentStatusClass: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-700",
    PARTIAL: "bg-amber-100 text-amber-700",
    UNPAID: "bg-red-100 text-red-700",
};
const saleModeLabel = (mode?: string) => mode === "wholesale" ? "ຂາຍສົ່ງ" : mode === "retail" ? "ຂາຍຍ່ອຍ" : "ຂໍ້ມູນເກົ່າບໍ່ລະບຸ";
const returnDispositionLabel = (item: { condition: string; disposition: string }) => {
    if (item.disposition === "RESTOCK_APPROVED") return "ຮັບເຂົ້າ stock ແລ້ວ";
    if (item.condition === "SELLABLE" && item.disposition === "NO_RESTOCK") return "ລໍຖ້າຮັບເຂົ້າ stock";
    return "ຕັດທິ້ງ";
};
const returnDispositionClass = (item: { condition: string; disposition: string }) => {
    if (item.disposition === "RESTOCK_APPROVED") return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (item.condition === "SELLABLE" && item.disposition === "NO_RESTOCK") return "bg-amber-100 text-amber-700 border-amber-300";
    return "bg-rose-100 text-rose-700 border-rose-300";
};
const apiError = (error: unknown) => {
    const candidate = error as { response?: { data?: { error?: string } }; message?: string };
    return candidate.response?.data?.error || candidate.message || "Request failed";
};

interface AdminBillsProps {
    cashierId?: string;
    title?: string;
    subtitle?: string;
    queryKeyPrefix?: string;
    useActivitySummary?: boolean;
    showReturnsButton?: boolean;
    allowActions?: boolean;
    constrainedHeight?: boolean;
}

export default function AdminBills({
    cashierId,
    title = "ການຮັບ-ຈ່າຍ / ຄືນສິນຄ້າ",
    subtitle = "ໃບບິນຂາຍ, ຮັບຊຳລະໜີ້, ຄືນເງິນ ແລະ ຍົກເລີກ ຢູ່ໜ້າດຽວ",
    queryKeyPrefix = "admin",
    useActivitySummary = false,
    showReturnsButton = true,
    allowActions = true,
    constrainedHeight = false,
}: AdminBillsProps = {}) {
    const queryClient = useQueryClient();
    const today = format(new Date(), "yyyy-MM-dd");
    const [filters, setFilters] = useState({ start: today, end: today, sourceType: "ALL", paymentMethod: "ALL", saleMode: "ALL", search: "" });
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<FinancialActivity | null>(null);
    const [cancelTarget, setCancelTarget] = useState<FinancialOrder | null>(null);
    const [returnTarget, setReturnTarget] = useState<FinancialOrder | null>(null);
    const [reason, setReason] = useState("");
    const [reasonCode, setReasonCode] = useState("CUSTOMER_REQUEST");
    const [refundMethod, setRefundMethod] = useState<"CASH" | "TRANSFER">("CASH");
    const [reference, setReference] = useState("");
    const [refundAmount, setRefundAmount] = useState(0);
    const [restoreStockOnCancel, setRestoreStockOnCancel] = useState(true);
    const [returnItems, setReturnItems] = useState<Record<string, { quantity: number; condition: string }>>({});
    const [returnsOpen, setReturnsOpen] = useState(false);
    const selectedOrder = selected?.order;

    const params = useMemo(() => {
        const startDate = new Date(`${filters.start}T00:00:00`);
        const endDate = new Date(`${filters.end}T23:59:59.999`);
        return {
            page,
            limit: 20,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            sourceType: filters.sourceType,
            paymentMethod: filters.paymentMethod,
            saleMode: filters.saleMode,
            cashierId,
            search: filters.search || undefined,
        };
    }, [cashierId, filters, page]);

    const activitySummaryParams = useMemo(() => {
        const startDate = new Date(`${filters.start}T00:00:00`);
        const endDate = new Date(`${filters.end}T23:59:59.999`);
        return {
            page: 1,
            limit: 1,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            sourceType: "ALL",
            paymentMethod: "ALL",
            saleMode: filters.saleMode,
            cashierId,
        };
    }, [cashierId, filters.start, filters.end, filters.saleMode]);

    const reportParams = useMemo<DateRangeParams>(() => ({
        startDate: new Date(`${filters.start}T00:00:00`),
        endDate: new Date(`${filters.end}T23:59:59.999`),
        cashierId,
        saleMode: filters.saleMode === "retail" ? "retail" : filters.saleMode === "wholesale" ? "wholesale" : undefined,
    }), [cashierId, filters.start, filters.end, filters.saleMode]);

    const { data, isLoading } = useQuery({
        queryKey: [queryKeyPrefix, "financial-activities", params],
        queryFn: () => getFinancialActivities(params),
        placeholderData: (previous) => previous,
    });
    const { data: reportSummary } = useQuery({
        queryKey: [queryKeyPrefix, "bills-report-summary", reportParams],
        queryFn: () => getShopSummary(reportParams),
        enabled: !useActivitySummary,
    });
    const { data: activityReportSummary } = useQuery({
        queryKey: [queryKeyPrefix, "bills-activity-summary", activitySummaryParams],
        queryFn: () => getFinancialActivities(activitySummaryParams),
        enabled: useActivitySummary,
        placeholderData: (previous) => previous,
    });
    const effectiveSummary = useActivitySummary ? activityReportSummary?.summary : reportSummary;
    const { data: returnsData } = useQuery({
        queryKey: [queryKeyPrefix, "order-returns", cashierId],
        queryFn: () => getOrderReturns({ page: 1, limit: 50, cashierId }),
        enabled: showReturnsButton,
    });
    const { data: selectedReturnsData } = useQuery({
        queryKey: [queryKeyPrefix, "order-returns", selectedOrder?.orderId, cashierId],
        queryFn: () => getOrderReturns({ orderId: selectedOrder!.orderId, page: 1, limit: 50, cashierId }),
        enabled: !!selectedOrder,
    });

    const resetAction = () => {
        setCancelTarget(null);
        setReturnTarget(null);
        setReason("");
        setReference("");
        setRefundAmount(0);
        setRestoreStockOnCancel(true);
        setReturnItems({});
    };

    const cancelMutation = useMutation({
        mutationFn: async () => {
            if (!cancelTarget) throw new Error("Order is required");
            const appliedPaid = Math.max(0, cancelTarget.total - cancelTarget.remainingAmount);
            return cancelOrder(cancelTarget._id, reason, {
                cancelReasonCode: reasonCode,
                refundPaymentMethod: refundMethod,
                restoreStock: restoreStockOnCancel,
                refundPayments: appliedPaid > 0 ? [{
                    method: refundMethod,
                    currency: "LAK",
                    amount: appliedPaid,
                    rate: 1,
                    amountInLAK: appliedPaid,
                    reference: reference || undefined,
                }] : [],
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "financial-activities"] });
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "bills-report-summary"] });
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "bills-activity-summary"] });
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "order-returns"] });
            queryClient.invalidateQueries({ queryKey: ["financial-activities"] });
            queryClient.invalidateQueries({ queryKey: ["shop-summary"] });
            queryClient.invalidateQueries({ queryKey: ["admin-bills-report-summary"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
            resetAction();
            toast.success(restoreStockOnCancel ? "ຍົກເລີກບິນແລ້ວ ແລະ stock ໄດ້ຖືກຄືນກັບອັດຕະໂນມັດ" : "ຍົກເລີກບິນແລ້ວ");
        },
        onError: (error: unknown) => toast.error(apiError(error)),
    });

    const returnMutation = useMutation({
        mutationFn: () => {
            if (!returnTarget) throw new Error("Order is required");
            const items = Object.entries(returnItems)
                .filter(([, value]) => value.quantity > 0)
                .map(([productId, value]) => ({ productId, ...value }));
            return createOrderReturn({
                orderId: returnTarget._id,
                items,
                reasonCode,
                note: reason,
                refundAmount,
                refundPaymentMethod: refundMethod,
                refundPayments: refundAmount > 0 ? [{
                    method: refundMethod,
                    currency: "LAK",
                    amount: refundAmount,
                    rate: 1,
                    amountInLAK: refundAmount,
                    reference: reference || undefined,
                }] : [],
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "financial-activities"] });
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "bills-report-summary"] });
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "bills-activity-summary"] });
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "order-returns"] });
            queryClient.invalidateQueries({ queryKey: ["financial-activities"] });
            queryClient.invalidateQueries({ queryKey: ["shop-summary"] });
            queryClient.invalidateQueries({ queryKey: ["admin-bills-report-summary"] });
            resetAction();
            toast.success("ບັນທຶກການຄືນສິນຄ້າແລ້ວ; stock ລໍຖ້າ admin ຮັບເຂົ້າແຍກຕ່າງຫາກ");
        },
        onError: (error: unknown) => toast.error(apiError(error)),
    });

    const restockMutation = useMutation({
        mutationFn: ({ returnId, productId }: { returnId: string; productId: string }) =>
            restockReturnItem(returnId, productId, "Admin approved sellable return"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "order-returns"] });
            queryClient.invalidateQueries({ queryKey: ["order-returns"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
            toast.success("ຮັບສິນຄ້າກັບເຂົ້າ stock ແລ້ວ");
        },
        onError: (error: unknown) => toast.error(apiError(error)),
    });

    const openReturn = (order: FinancialOrder) => {
        setReturnTarget(order);
        setReason("");
        setRefundAmount(0);
        setReturnItems(Object.fromEntries((order.items || []).map((item) => [
            String(item.product),
            { quantity: 0, condition: "INCOMPLETE" },
        ])));
    };

    const selectedReturnValue = returnTarget?.items?.reduce((sum, item) => {
        const quantity = returnItems[String(item.product)]?.quantity || 0;
        return sum + quantity * item.price;
    }, 0) || 0;

    const rootClass = constrainedHeight
        ? "flex h-full min-h-0 flex-col gap-4 overflow-hidden bg-slate-50 p-4 font-lao md:p-6"
        : "min-h-screen space-y-4 bg-slate-50 p-4 font-lao md:p-6";
    const tableShellClass = constrainedHeight
        ? "min-h-0 flex-1 overflow-hidden border bg-white flex flex-col"
        : "overflow-hidden border bg-white";
    const tableScrollClass = constrainedHeight ? "min-h-0 flex-1 overflow-auto" : "overflow-x-auto";

    return (
        <div className={rootClass}>
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Receipt className="h-5 w-5 text-emerald-600" /> {title}</h1>
                    <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>
                {showReturnsButton && <Button variant="outline" onClick={() => setReturnsOpen(true)}><PackageX className="mr-2 h-4 w-4" />ສິນຄ້າຄືນ ({returnsData?.total || 0})</Button>}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:[&>div]:p-2 md:[&>div>div]:gap-1.5 md:[&>div_p:first-of-type]:text-[8px] md:[&>div_p:first-of-type]:tracking-normal md:[&>div_p:nth-of-type(2)]:whitespace-nowrap md:[&>div_p:nth-of-type(2)]:text-[12px] md:[&>div_p:nth-of-type(2)]:leading-none md:[&>div_p:nth-of-type(3)]:mt-1 md:[&>div_p:nth-of-type(3)]:text-[9px] md:[&>div_svg]:h-3.5 md:[&>div_svg]:w-3.5 lg:[&>div]:p-4 lg:[&>div>div]:gap-3 lg:[&>div_p:first-of-type]:text-[10px] lg:[&>div_p:nth-of-type(2)]:text-lg lg:[&>div_p:nth-of-type(3)]:text-xs xl:gap-4 xl:[&>div]:p-5 xl:[&>div_p:first-of-type]:text-[11px] xl:[&>div_p:first-of-type]:tracking-widest xl:[&>div_p:nth-of-type(2)]:text-2xl xl:[&>div_svg]:h-5 xl:[&>div_svg]:w-5">
                <StatCard
                    title="ຍອດຂາຍ"
                    value={money(effectiveSummary?.totalSales)}
                    icon={DollarSign}
                    accent="slate"
                    subtext={`${(effectiveSummary?.totalOrders || 0).toLocaleString()} ບິນທີ່ບໍ່ຖືກຍົກເລີກ`}
                />

                <StatCard
                    title="ຈຳນວນບິນ"
                    value={(effectiveSummary?.totalOrders || 0).toLocaleString()}
                    icon={FileText}
                    accent="indigo"
                    subtext="ບິນທີ່ບໍ່ຖືກຍົກເລີກ"
                />
                <StatCard
                    title="ຮັບຈາກການຂາຍ"
                    value={money(effectiveSummary?.actualReceivedFromOrders)}
                    icon={Banknote}
                    accent="emerald"
                    subtext="ເງິນທີ່ຮັບຈິງຈາກບິນໃໝ່"
                />

                <StatCard
                    title="ຮັບຊຳລະໜີ້"
                    value={money(effectiveSummary?.debtRepaymentIncome)}
                    icon={HandCoins}
                    accent="emerald"
                    subtext={`${(effectiveSummary?.debtRepaymentCount || 0).toLocaleString()} ລາຍການ`}
                />
                <StatCard
                    title="ເງິນທີ່ໄດ້ຮັບທັງໝົດ"
                    value={money(effectiveSummary?.totalIncomeToday ?? ((effectiveSummary?.actualReceivedFromOrders || 0) + (effectiveSummary?.debtRepaymentIncome || 0)))}
                    icon={ArrowUpRight}
                    accent="emerald"
                    subtext="ບໍ່ລວມ ໜີ້ ຄ້າງຊຳລະ"
                />
                <StatCard
                    title="ຍອດໜີ້ຄົງຄ້າງ"
                    value={money(effectiveSummary?.totalDebt)}
                    icon={CreditCard}
                    accent="rose"
                    subtext="ຍອດທີ່ລູກຄ້າຍັງຄ້າງ"
                />
                 <StatCard
                    title="ເງິນອອກ"
                    value={money(data?.summary.moneyOut)}
                    icon={Wallet}
                    accent="rose"
                    subtext="refund ແລະ reversal"
                />
                <StatCard
                    title="ເງິນທອນ"
                    value={money(data?.summary.change)}
                    icon={RotateCcw}
                    accent="amber"
                    subtext="ທອນຈາກການຂາຍ"
                />
            </div>

            <div className="grid gap-3 border bg-white p-3 md:grid-cols-[minmax(220px,1fr)_minmax(280px,330px)_150px_150px_170px]">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input value={filters.search} onChange={(event) => { setFilters({ ...filters, search: event.target.value }); setPage(1); }} placeholder="ເລກບິນ, ລູກຄ້າ, reference" className="pl-9" />
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        className="rounded-lg bg-white shadow-sm"
                        date={{ from: new Date(filters.start), to: new Date(filters.end) }}
                        onSelect={(range) => {
                            if (range?.from) {
                                setFilters({
                                    ...filters,
                                    start: format(range.from, "yyyy-MM-dd"),
                                    end: format(range.to || range.from, "yyyy-MM-dd"),
                                });
                                setPage(1);
                            }
                        }}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0 bg-white text-indigo-600"
                        onClick={() => {
                            const currentDate = format(new Date(), "yyyy-MM-dd");
                            setFilters({ ...filters, start: currentDate, end: currentDate });
                            setPage(1);
                        }}
                    >
                        ມື້ນີ້
                    </Button>
                </div>
                <Select value={filters.sourceType} onValueChange={(value) => { setFilters({ ...filters, sourceType: value }); setPage(1); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ALL">ທຸກປະເພດ</SelectItem><SelectItem value="SALE">ຂາຍ</SelectItem><SelectItem value="DEBT_REPAYMENT">ຊຳລະໜີ້</SelectItem><SelectItem value="REFUND">ຄືນເງິນ</SelectItem><SelectItem value="REVERSAL">ຍົກເລີກ</SelectItem></SelectContent>
                </Select>
                <Select value={filters.paymentMethod} onValueChange={(value) => { setFilters({ ...filters, paymentMethod: value }); setPage(1); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ALL">ທຸກຊ່ອງທາງ</SelectItem><SelectItem value="CASH">ເງິນສົດ</SelectItem><SelectItem value="TRANSFER">ເງິນໂອນ</SelectItem><SelectItem value="MIXED">ປະສົມ</SelectItem></SelectContent>
                </Select>
                <Select value={filters.saleMode} onValueChange={(value) => { setFilters({ ...filters, saleMode: value }); setPage(1); }}>
                    <SelectTrigger aria-label="ປະເພດການຂາຍ"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ALL">ທຸກປະເພດການຂາຍ</SelectItem><SelectItem value="retail">ຂາຍຍ່ອຍ</SelectItem><SelectItem value="wholesale">ຂາຍສົ່ງ</SelectItem></SelectContent>
                </Select>
            </div>

            <div className={tableShellClass}>
                <div className={tableScrollClass}>
                    <table className="w-full min-w-[1280px] text-sm">
                        <thead className="border-b bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-4 py-3">ວັນເວລາ</th><th className="px-4 py-3">ເລກລາຍການ</th><th className="px-4 py-3">ປະເພດ</th><th className="px-4 py-3">ປະເພດການຂາຍ</th><th className="px-4 py-3">ຍອດບິນ / ສະຖານະ</th><th className="px-4 py-3">ລູກຄ້າ</th><th className="px-4 py-3">ພະນັກງານ</th><th className="px-4 py-3">ຊ່ອງທາງ</th><th className="px-4 py-3 text-right">ຈຳນວນທີ່ຮັບ</th><th className="px-4 py-3 text-right">ລວມເປັນກີບ</th><th className="px-4 py-3 text-right">ທອນ</th><th className="px-4 py-3 text-right">ຈັດການ</th></tr></thead>
                        <tbody className="divide-y">
                            {isLoading ? <tr><td colSpan={12} className="p-10 text-center text-slate-400">Loading...</td></tr> : data?.data.length === 0 ? <tr><td colSpan={12} className="p-10 text-center text-slate-400">ບໍ່ພົບລາຍການ</td></tr> : data?.data.map((activity) => (
                                <tr key={activity._id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3"><div>{format(new Date(activity.createdAt), "dd/MM/yyyy")}</div><div className="text-xs text-slate-400">{format(new Date(activity.createdAt), "HH:mm:ss")}</div></td>
                                    <td className="px-4 py-3"><div className="font-mono font-semibold">#{activity.order?.orderId || activity.transactionId}</div>{activity.order && <div className="mt-1 text-xs text-slate-400">{activity.order.items?.length || 0} ລາຍການ</div>}</td>
                                    <td className="px-4 py-3"><Badge className={activity.direction === "OUT" ? "bg-red-100 text-red-700" : activity.sourceType === "DEBT_REPAYMENT" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>{sourceLabel[activity.sourceType]}</Badge>{activity.migrationStatus === "INCOMPLETE" && <div className="mt-1 text-[10px] text-amber-600">ຂໍ້ມູນເກົ່າອາດບໍ່ຄົບ</div>}</td>
                                    <td className="px-4 py-3">{activity.order ? <Badge className={activity.order.saleMode === "wholesale" ? "bg-emerald-100 text-emerald-700" : activity.order.saleMode === "retail" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}>{saleModeLabel(activity.order.saleMode)}</Badge> : "-"}</td>
                                    <td className="px-4 py-3">{activity.order ? <div><div className="font-semibold">{money(activity.order.total)}</div><Badge className={`mt-1 ${paymentStatusClass[activity.order.paymentStatus] || "bg-slate-100 text-slate-700"}`}>{paymentStatusLabel[activity.order.paymentStatus] || activity.order.paymentStatus}</Badge>{activity.order.remainingAmount > 0 && <div className="mt-1 text-xs text-red-600">ຄ້າງ {money(activity.order.remainingAmount)}</div>}</div> : "-"}</td>
                                    <td className="px-4 py-3"><div className="font-medium">{activity.customer?.name || "ລູກຄ້າທົ່ວໄປ"}</div><div className="text-xs text-slate-400">{activity.customer?.phone}</div></td>
                                    <td className="px-4 py-3">{activity.processedBy?.username || "-"}</td>
                                    <td className="px-4 py-3">{methodLabel[activity.paymentMethod] || activity.paymentMethod}</td>
                                    <td className="px-4 py-3 text-right">{activity.payments?.map((line, index) => <div key={index}>{line.amount.toLocaleString()} {line.currency}</div>)}</td>
                                    <td className={`px-4 py-3 text-right font-bold ${activity.direction === "OUT" ? "text-red-600" : "text-emerald-700"}`}>{activity.direction === "OUT" ? "-" : "+"}{money(activity.appliedAmountInLAK)}</td>
                                    <td className="px-4 py-3 text-right text-amber-700">{money(activity.changeInLAK)}</td>
                                    <td className="px-4 py-3 text-right"><Button size="icon" variant="ghost" title="ລາຍລະອຽດ" onClick={() => setSelected(activity)}><Eye className="h-4 w-4" /></Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-sm"><span>{data?.total || 0} ລາຍການ</span><div className="flex items-center gap-2"><Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /></Button><span>{page} / {data?.totalPages || 1}</span><Button size="icon" variant="outline" disabled={page >= (data?.totalPages || 1)} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
            </div>

            <BillDetailsDialog
                activity={selected}
                returns={selectedReturnsData?.data || []}
                onClose={() => setSelected(null)}
                onReturn={(order) => {
                    openReturn(order);
                    setSelected(null);
                }}
                onCancel={(order) => {
                    setCancelTarget(order);
                    setRefundAmount(Math.max(0, order.total - order.remainingAmount));
                    setRestoreStockOnCancel(true);
                    setSelected(null);
                }}
                allowActions={allowActions}
            />

            <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && resetAction()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-700">ຍົກເລີກບິນ #{cancelTarget?.orderId}</DialogTitle>
                        <DialogDescription>
                            {restoreStockOnCancel ? `ລະບົບຈະຄືນ stock ແລະບັນທຶກເງິນຄືນ ${money(refundAmount)}` : `ລະບົບຈະບັນທຶກເງິນຄືນ ${money(refundAmount)} ແຕ່ຈະບໍ່ເພີ່ມ stock ອັດຕະໂນມັດ`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-start gap-3 rounded-md border bg-slate-50 p-3 text-sm">
                        <Checkbox id="restore-stock" checked={restoreStockOnCancel} onCheckedChange={(checked) => setRestoreStockOnCancel(checked === true)} />
                        <div className="space-y-1">
                            <Label htmlFor="restore-stock" className="cursor-pointer font-medium">ຄືນ stock ອັດຕະໂນມັດ</Label>
                            <p className="text-slate-500">
                                ເມື່ອເລືອກຕົວນີ້ ລະບົບຈະສ້າງ movement ເພື່ອເພີ່ມ stock ກັບຄືນຕາມຈຳນວນໃນບິນ.
                            </p>
                        </div>
                    </div>
                    <ActionFields reason={reason} setReason={setReason} reasonCode={reasonCode} setReasonCode={setReasonCode} refundMethod={refundMethod} setRefundMethod={setRefundMethod} reference={reference} setReference={setReference} showRefund={refundAmount > 0} />
                    <DialogFooter>
                        <Button variant="outline" onClick={resetAction}>ປິດ</Button>
                        <Button variant="destructive" disabled={!reason.trim() || (refundMethod === "TRANSFER" && !reference.trim()) || cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
                            {restoreStockOnCancel ? "ຍືນຢັນຍົກເລີກ + ຄືນ stock" : "ຍືນຢັນຍົກເລີກ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!returnTarget} onOpenChange={(open) => !open && resetAction()}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ຄືນສິນຄ້າບິນ #{returnTarget?.orderId}</DialogTitle>
                        <DialogDescription>ເລືອກຈຳນວນ ແລະ ສະພາບ; ລາຍການ sellable ຈະລໍຮັບເຂົ້າ stock, ລາຍການອື່ນຈະຖືກຕັດທິ້ງ</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {returnTarget?.items?.map((item) => {
                            const key = String(item.product);
                            const value = returnItems[key] || { quantity: 0, condition: "INCOMPLETE" };
                            const isSellable = value.quantity > 0 && value.condition === "SELLABLE";
                            const isWriteOff = value.quantity > 0 && value.condition !== "SELLABLE";
                            return (
                                <div key={key} className="grid grid-cols-[1fr_90px_160px_160px] items-center gap-2 border p-2">
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-slate-500">ຂາຍ {item.quantity} · {money(item.price)}/ຊິ້ນ</div>
                                    </div>
                                    <Input type="number" min={0} max={item.quantity} value={value.quantity} onChange={(event) => setReturnItems({ ...returnItems, [key]: { ...value, quantity: Math.min(item.quantity, Math.max(0, Number(event.target.value))) } })} />
                                    <Select value={value.condition} onValueChange={(condition) => setReturnItems({ ...returnItems, [key]: { ...value, condition } })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SELLABLE">ສະພາບດີ</SelectItem>
                                            <SelectItem value="DAMAGED">ເສຍຫາຍ</SelectItem>
                                            <SelectItem value="DEFECTIVE">ມີຕຳໜິ</SelectItem>
                                            <SelectItem value="INCOMPLETE">ບໍ່ຄົບ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Badge variant="outline" className={returnDispositionClass({ condition: value.condition, disposition: isSellable ? "NO_RESTOCK" : isWriteOff ? "WRITE_OFF" : "NO_RESTOCK" })}>
                                        {returnDispositionLabel({ condition: value.condition, disposition: isSellable ? "NO_RESTOCK" : isWriteOff ? "WRITE_OFF" : "NO_RESTOCK" })}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid gap-3 border-t pt-3 md:grid-cols-2">
                        <div>
                            <Label>ຈຳນວນເງິນຄືນ (ສູງສຸດ {money(selectedReturnValue)})</Label>
                            <Input type="number" min={0} max={selectedReturnValue} value={refundAmount} onChange={(event) => setRefundAmount(Math.min(selectedReturnValue, Math.max(0, Number(event.target.value))))} />
                        </div>
                    </div>
                    <ActionFields reason={reason} setReason={setReason} reasonCode={reasonCode} setReasonCode={setReasonCode} refundMethod={refundMethod} setRefundMethod={setRefundMethod} reference={reference} setReference={setReference} showRefund={refundAmount > 0} />
                    <DialogFooter>
                        <Button variant="outline" onClick={resetAction}>ປິດ</Button>
                        <Button disabled={selectedReturnValue <= 0 || !reason.trim() || (refundMethod === "TRANSFER" && !reference.trim()) || returnMutation.isPending} onClick={() => returnMutation.mutate()}>ບັນທຶກການຄືນ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={returnsOpen} onOpenChange={setReturnsOpen}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader><DialogTitle>ສິນຄ້າຄືນທີ່ລໍຖ້າຈັດການ</DialogTitle><DialogDescription>ລາຍການ sellable ກົດຮັບເຂົ້າ stock, ລາຍການອື່ນຖືກຕັດທິ້ງ ແລະບໍ່ຄວນຮັບເຂົ້າ stock</DialogDescription></DialogHeader>
                    <div className="overflow-hidden border">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-3 text-left">Return / Bill</th>
                                    <th className="p-3 text-left">ສິນຄ້າ</th>
                                    <th className="p-3 text-right">ຈຳນວນ</th>
                                    <th className="p-3 text-left">ສະພາບ</th>
                                    <th className="p-3 text-left">ຕ້ອງຈັດການ</th>
                                    <th className="p-3 text-left">Stock</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {returnsData?.data.flatMap((orderReturn) => orderReturn.items.map((item, index) => {
                                    const isSellable = item.condition === "SELLABLE";
                                    return (
                                        <tr key={`${orderReturn.returnId}-${item.product}-${index}`} className="border-t">
                                            <td className="p-3">
                                                <div className="font-mono">#{orderReturn.returnId}</div>
                                                <div className="text-xs text-slate-500">#{orderReturn.order?.orderId}</div>
                                            </td>
                                            <td className="p-3 font-medium">{item.name}</td>
                                            <td className="p-3 text-right">{item.quantity}</td>
                                            <td className="p-3"><Badge variant="outline">{item.condition}</Badge></td>
                                            <td className="p-3">
                                                <Badge variant="outline" className={returnDispositionClass(item)}>
                                                    {returnDispositionLabel(item)}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <Badge className={item.disposition === "RESTOCK_APPROVED" ? "bg-emerald-100 text-emerald-700" : item.disposition === "WRITE_OFF" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}>
                                                    {item.disposition === "RESTOCK_APPROVED" ? "รับเข้า stock แล้ว" : item.disposition === "WRITE_OFF" ? "ตัดทิ้ง" : "รอจัดการ"}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right">
                                                {isSellable && item.disposition === "NO_RESTOCK" && <Button size="sm" disabled={restockMutation.isPending} onClick={() => restockMutation.mutate({ returnId: orderReturn.returnId, productId: String(item.product) })}>ຮັບເຂົ້າ stock</Button>}
                                            </td>
                                        </tr>
                                    );
                                }))}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function formatDateTime(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : format(date, "dd/MM/yyyy HH:mm:ss");
}

function BillDetailsDialog({
    activity,
    returns,
    onClose,
    onReturn,
    onCancel,
    allowActions,
}: {
    activity: FinancialActivity | null;
    returns: OrderReturnRecord[];
    onClose: () => void;
    onReturn: (order: FinancialOrder) => void;
    onCancel: (order: FinancialOrder) => void;
    allowActions: boolean;
}) {
    const order = activity?.order;
    const customer = activity?.customer || order?.customerId;
    const cashier = order?.cashierId || activity?.processedBy;
    const subtotal = order?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
    const returnedAmount = returns.reduce((sum, orderReturn) => sum + orderReturn.refundAmount, 0);
    const shop = order?.tenantSnapshot;

    return (
        <Dialog open={!!activity} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0">
                {activity && <>
                    <DialogHeader className="sticky top-0 z-10 border-b bg-white px-6 py-5">
                        <div className="flex flex-col justify-between gap-3 pr-8 sm:flex-row sm:items-start">
                            <div>
                                <DialogTitle className="flex items-center gap-2 text-xl"><Receipt className="h-5 w-5 text-emerald-600" />ລາຍລະອຽດບິນ #{order?.orderId || activity.transactionId}</DialogTitle>
                                <DialogDescription className="mt-1">{sourceLabel[activity.sourceType]} · {formatDateTime(activity.createdAt)}</DialogDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge className={activity.direction === "OUT" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}>{activity.direction === "OUT" ? "ເງິນອອກ" : "ເງິນເຂົ້າ"}</Badge>
                                {order && <Badge className={order.status === "CANCELLED" ? "bg-red-100 text-red-700" : paymentStatusClass[order.paymentStatus] || "bg-slate-100 text-slate-700"}>{order.status === "CANCELLED" ? "ຍົກເລີກແລ້ວ" : paymentStatusLabel[order.paymentStatus] || order.paymentStatus}</Badge>}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 px-6 py-5">
                        <section>
                            <SectionTitle icon={<FileText className="h-4 w-4" />} title="ຂໍ້ມູນລາຍການ" />
                            <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Detail label="ເລກທຸລະກຳ" value={activity.transactionId} mono />
                                <Detail label="ປະເພດ" value={sourceLabel[activity.sourceType]} />
                                <Detail label="ສະຖານະບັນຊີ" value={activity.status === "POSTED" ? "ບັນທຶກແລ້ວ" : "ກັບລາຍການແລ້ວ"} />
                                <Detail label="ຄຸນນະພາບຂໍ້ມູນ" value={activity.migrationStatus === "COMPLETE" ? "ຄົບຖ້ວນ" : "ຂໍ້ມູນເກົ່າອາດບໍ່ຄົບ"} />
                                <Detail label="ວັນເວລາລາຍການ" value={formatDateTime(activity.createdAt)} />
                                <Detail label="ຜູ້ດຳເນີນການ" value={activity.processedBy?.username || "-"} />
                                <Detail label="ລະຫັດພະນັກງານ" value={activity.processedBy?.employeeCode || "-"} />
                                <Detail label="ຜູ້ອະນຸມັດ" value={activity.approvedBy ? `${activity.approvedBy.username}${activity.approvedAt ? ` · ${formatDateTime(activity.approvedAt)}` : ""}` : "-"} />
                            </div>
                            {(activity.reasonCode || activity.note) && <div className="mt-3 rounded-md border-l-4 border-slate-400 bg-slate-50 p-3 text-sm"><div><strong>ເຫດຜົນ:</strong> {activity.reasonCode || "-"}</div>{activity.note && <div className="mt-1 whitespace-pre-wrap text-slate-600">{activity.note}</div>}</div>}
                        </section>

                        <section className="grid gap-4 md:grid-cols-2">
                            <InfoCard icon={<UserRound className="h-5 w-5 text-indigo-600" />} title="ຂໍ້ມູນລູກຄ້າ">
                                <Detail label="ຊື່" value={customer?.name || "ລູກຄ້າທົ່ວໄປ"} />
                                <Detail label="ເບີໂທ" value={customer?.phone || "-"} />
                                <Detail label="ທີ່ຢູ່" value={customer?.address || "-"} />
                            </InfoCard>
                            <InfoCard icon={<UserRound className="h-5 w-5 text-sky-600" />} title="ຂໍ້ມູນພະນັກງານຂາຍ">
                                <Detail label="ຊື່ຜູ້ໃຊ້" value={cashier?.username || "-"} />
                                <Detail label="ລະຫັດ" value={cashier?.employeeCode || "-"} />
                                <Detail label="ເບີໂທ" value={cashier?.phone || "-"} />
                            </InfoCard>
                        </section>

                        {order && <>
                            <section>
                                <SectionTitle icon={<ShoppingBag className="h-4 w-4" />} title={`ລາຍການສິນຄ້າ (${order.items?.length || 0})`} />
                                <div className="overflow-x-auto rounded-lg border">
                                    <table className="w-full min-w-[680px] text-sm">
                                        <thead className="bg-slate-50 text-slate-600"><tr><th className="w-12 p-3 text-center">#</th><th className="p-3 text-left">ສິນຄ້າ</th><th className="p-3 text-right">ລາຄາ/ໜ່ວຍ</th><th className="p-3 text-right">ຈຳນວນ</th><th className="p-3 text-right">ລວມ</th></tr></thead>
                                        <tbody>{order.items?.map((item, index) => <tr key={`${item.product}-${index}`} className="border-t"><td className="p-3 text-center text-slate-400">{index + 1}</td><td className="p-3"><div className="font-medium">{item.name}</div><div className="mt-1 font-mono text-[10px] text-slate-400">{String(item.product)}</div></td><td className="p-3 text-right">{money(item.price)}</td><td className="p-3 text-right font-semibold">{item.quantity.toLocaleString()}</td><td className="p-3 text-right font-semibold">{money(item.price * item.quantity)}</td></tr>)}</tbody>
                                        <tfoot className="border-t-2 bg-slate-50"><tr><td colSpan={4} className="p-3 text-right text-slate-600">ລວມລາຄາສິນຄ້າ</td><td className="p-3 text-right font-semibold">{money(subtotal)}</td></tr>{order.discount > 0 && <tr><td colSpan={4} className="p-3 text-right text-red-600">ສ່ວນຫຼຸດ</td><td className="p-3 text-right font-semibold text-red-600">-{money(order.discount)}</td></tr>}<tr><td colSpan={4} className="p-3 text-right font-bold">ຍອດບິນສຸດທິ</td><td className="p-3 text-right text-lg font-bold text-indigo-700">{money(order.total)}</td></tr></tfoot>
                                    </table>
                                </div>
                            </section>

                            <section>
                                <SectionTitle icon={<CreditCard className="h-4 w-4" />} title="ສະຫຼຸບບິນ ແລະ ການຊຳລະ" />
                                <div className="grid gap-3 rounded-lg border bg-gradient-to-br from-white to-indigo-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <Detail label="ປະເພດການຂາຍ" value={saleModeLabel(order.saleMode)} />
                                    <Detail label="ຊ່ອງທາງໃນບິນ" value={methodLabel[order.paymentMethod] || order.paymentMethod} />
                                    <Detail label="ວັນສ້າງບິນ" value={formatDateTime(order.createdAt)} />
                                    <Detail label="ວັນແກ້ໄຂລ່າສຸດ" value={formatDateTime(order.updatedAt)} />
                                    <Detail label="ຍອດບິນ" value={money(order.total)} />
                                    <Detail label="ຊຳລະສະສົມ" value={money(order.paidAmount)} tone="green" />
                                    <Detail label="ຍອດຄ້າງ" value={money(order.remainingAmount)} tone={order.remainingAmount > 0 ? "red" : undefined} />
                                    <Detail label="ເງິນທອນໃນບິນ" value={money(order.change)} />
                                    <Detail label="ຮັບ/ຈ່າຍໃນລາຍການນີ້" value={money(activity.grossReceivedInLAK)} />
                                    <Detail label="ຍອດທີ່ນຳໃຊ້" value={money(activity.appliedAmountInLAK)} tone={activity.direction === "OUT" ? "red" : "green"} />
                                    <Detail label="ເງິນທອນໃນລາຍການນີ້" value={money(activity.changeInLAK)} />
                                    <Detail label="ຄືນເງິນບາງລາຍການສະສົມ" value={money(returnedAmount)} tone={returnedAmount > 0 ? "red" : undefined} />
                                </div>
                            </section>
                        </>}

                        <section>
                            <SectionTitle icon={<Wallet className="h-4 w-4" />} title={`ລາຍລະອຽດການຈ່າຍ (${activity.payments?.length || 0})`} />
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full min-w-[820px] text-sm">
                                    <thead className="bg-slate-50"><tr><th className="p-3 text-left">ຊ່ອງທາງ</th><th className="p-3 text-left">ສະກຸນ</th><th className="p-3 text-right">ຈຳນວນ</th><th className="p-3 text-right">Rate</th><th className="p-3 text-right">ເປັນກີບ</th><th className="p-3 text-left">Reference / ໝາຍເຫດ</th><th className="p-3 text-left">ເວລາຊຳລະ</th></tr></thead>
                                    <tbody>{activity.payments?.length ? activity.payments.map((line, index) => {
                                        const orderPayment = activity.sourceType === "SALE" ? order?.payments?.[index] : undefined;
                                        return <tr key={`${line.currency}-${line.reference || index}`} className="border-t"><td className="p-3">{methodLabel[line.method] || line.method}</td><td className="p-3 font-semibold">{line.currency}</td><td className="p-3 text-right">{line.amount.toLocaleString()}</td><td className="p-3 text-right">{line.rate.toLocaleString()}</td><td className="p-3 text-right font-semibold">{money(line.amountInLAK)}</td><td className="p-3">{line.reference || orderPayment?.note || "-"}</td><td className="whitespace-nowrap p-3">{formatDateTime(orderPayment?.paidAt)}</td></tr>;
                                    }) : <tr><td colSpan={7} className="p-6 text-center text-slate-400">ບໍ່ມີລາຍລະອຽດການຈ່າຍໃນຂໍ້ມູນນີ້</td></tr>}</tbody>
                                </table>
                            </div>
                        </section>

                        {!!order?.exchangeRateSnapshots?.length && <section><SectionTitle icon={<CreditCard className="h-4 w-4" />} title="ອັດຕາແລກປ່ຽນທີ່ໃຊ້ໃນບິນ" /><div className="flex flex-wrap gap-2">{order.exchangeRateSnapshots.map((rate) => <Badge key={rate.currency} variant="outline" className="px-3 py-1.5">1 {rate.currency} = {rate.rate.toLocaleString()} ₭</Badge>)}</div></section>}

                        {!!order?.notes?.length && <section><SectionTitle icon={<FileText className="h-4 w-4" />} title={`ໝາຍເຫດຂອງບິນ (${order.notes.length})`} /><div className="space-y-2">{order.notes.map((note, index) => <div key={`${note.createdAt}-${index}`} className="rounded-md border bg-slate-50 p-3 text-sm"><div className="whitespace-pre-wrap text-slate-800">{note.text}</div><div className="mt-2 text-xs text-slate-400">{note.createdBy} · {formatDateTime(note.createdAt)}</div></div>)}</div></section>}

                        {!!returns.length && <section><SectionTitle icon={<PackageX className="h-4 w-4" />} title={`ປະຫວັດຄືນບາງລາຍການ (${returns.length})`} /><div className="space-y-3">{returns.map((orderReturn) => <div key={orderReturn.returnId} className="border-l-4 border-amber-500 bg-amber-50 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>#{orderReturn.returnId}</strong><span>{formatDateTime(orderReturn.createdAt)}</span></div><div className="mt-1 text-slate-600">{orderReturn.reasonCode}{orderReturn.note ? ` · ${orderReturn.note}` : ""}</div><div className="mt-2 divide-y border bg-white">{orderReturn.items.map((item) => <div key={`${orderReturn.returnId}-${item.product}`} className="flex flex-wrap items-center justify-between gap-3 p-2"><span>{item.name} × {item.quantity} · {item.condition}</span><Badge variant="outline" className={returnDispositionClass(item)}>{returnDispositionLabel(item)}</Badge><span>{money(item.price * item.quantity)}</span></div>)}</div><div className="mt-2 text-right font-semibold text-red-700">ຄືນເງິນ {money(orderReturn.refundAmount)}</div></div>)}</div></section>}

                        {order?.status === "CANCELLED" && <section><SectionTitle icon={<Ban className="h-4 w-4" />} title="ຂໍ້ມູນການຍົກເລີກ" /><div className="grid gap-3 border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800 sm:grid-cols-2"><Detail label="ລະຫັດເຫດຜົນ" value={order.cancelReasonCode || "-"} /><Detail label="ວັນເວລາ" value={formatDateTime(order.cancelledAt)} /><Detail label="ຜູ້ຍົກເລີກ" value={order.cancelledBy?.username || activity.processedBy?.username || "-"} /><Detail label="ເຫດຜົນ" value={order.cancelReason || "-"} /></div></section>}

                        {shop && <section><SectionTitle icon={<Store className="h-4 w-4" />} title="ຂໍ້ມູນຮ້ານທີ່ບັນທຶກໃນບິນ" /><div className="grid gap-3 rounded-lg border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4"><Detail label="ຊື່ຮ້ານ" value={shop.shopName || "-"} /><Detail label="ເບີໂທ" value={shop.phone || "-"} /><Detail label="ທີ່ຢູ່" value={shop.address || "-"} /><Detail label="ທະນາຄານ" value={[shop.bankName, shop.bankAccount].filter(Boolean).join(" · ") || "-"} />{shop.receiptNote && <div className="sm:col-span-2 lg:col-span-4"><Detail label="ຂໍ້ຄວາມທ້າຍບິນ" value={shop.receiptNote} /></div>}</div></section>}
                    </div>

                    <DialogFooter className="sticky bottom-0 gap-2 border-t bg-white px-6 py-4">
                        <Button variant="outline" onClick={onClose}>ປິດ</Button>
                        {allowActions && activity.sourceType === "SALE" && order && order.status !== "CANCELLED" && <><Button variant="outline" onClick={() => onReturn(order)}><PackageX className="mr-2 h-4 w-4" />ຄືນບາງລາຍການ</Button><Button variant="destructive" onClick={() => onCancel(order)}><Ban className="mr-2 h-4 w-4" />ຍົກເລີກ + ຄືນ stock</Button></>}
                    </DialogFooter>
                </>}
            </DialogContent>
        </Dialog>
    );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
    return <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><span className="text-slate-500">{icon}</span>{title}</h3>;
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
    return <div className="rounded-lg border bg-white p-4"><div className="mb-3 flex items-center gap-2"><span className="rounded-full bg-slate-100 p-2">{icon}</span><h3 className="font-bold text-slate-900">{title}</h3></div><div className="grid gap-3 sm:grid-cols-3">{children}</div></div>;
}

function Detail({ label, value, mono = false, tone }: { label: string; value: ReactNode; mono?: boolean; tone?: "green" | "red" }) {
    const toneClass = tone === "green" ? "text-emerald-700" : tone === "red" ? "text-red-700" : "text-slate-900";
    return <div><div className="text-xs text-slate-500">{label}</div><div className={`mt-1 break-words font-semibold ${mono ? "font-mono" : ""} ${toneClass}`}>{value}</div></div>;
}

function ActionFields(props: { reason: string; setReason: (value: string) => void; reasonCode: string; setReasonCode: (value: string) => void; refundMethod: "CASH" | "TRANSFER"; setRefundMethod: (value: "CASH" | "TRANSFER") => void; reference: string; setReference: (value: string) => void; showRefund: boolean }) {
    return <div className="grid gap-3"><div><Label>ປະເພດເຫດຜົນ</Label><Select value={props.reasonCode} onValueChange={props.setReasonCode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CUSTOMER_REQUEST">ລູກຄ້າຮ້ອງຂໍ</SelectItem><SelectItem value="WRONG_ITEM">ສິນຄ້າຜິດ</SelectItem><SelectItem value="DEFECTIVE">ສິນຄ້າມີບັນຫາ</SelectItem><SelectItem value="BILL_ERROR">ບິນຜິດ</SelectItem><SelectItem value="OTHER">ອື່ນໆ</SelectItem></SelectContent></Select></div><div><Label>ລາຍລະອຽດ *</Label><Textarea value={props.reason} onChange={(event) => props.setReason(event.target.value)} /></div>{props.showRefund && <div className="grid grid-cols-2 gap-3"><div><Label>ຊ່ອງທາງຄືນເງິນ</Label><Select value={props.refundMethod} onValueChange={(value: "CASH" | "TRANSFER") => props.setRefundMethod(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CASH">ເງິນສົດ</SelectItem><SelectItem value="TRANSFER">ເງິນໂອນ</SelectItem></SelectContent></Select></div>{props.refundMethod === "TRANSFER" && <div><Label>Transfer reference *</Label><Input value={props.reference} onChange={(event) => props.setReference(event.target.value)} /></div>}</div>}</div>;
}
