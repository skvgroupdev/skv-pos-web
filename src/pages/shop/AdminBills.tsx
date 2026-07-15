import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Ban,
    ChevronLeft,
    ChevronRight,
    Eye,
    History,
    PackageX,
    Receipt,
    RotateCcw,
    Search,
    Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { createOrderReturn, getFinancialActivities, getOrderReturns, restockReturnItem, type FinancialActivity, type FinancialOrder } from "@/api/financial";
import { cancelOrder } from "@/api/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const money = (value?: number) => `${(value || 0).toLocaleString()} ₭`;
const sourceLabel: Record<string, string> = {
    SALE: "ຂາຍ",
    DEBT_REPAYMENT: "ຮັບຊຳລະໜີ້",
    REFUND: "ຄືນເງິນ",
    REVERSAL: "ຍົກເລີກ",
};
const methodLabel: Record<string, string> = { CASH: "ເງິນສົດ", TRANSFER: "ເງິນໂອນ", MIXED: "ປະສົມ" };
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

export default function AdminBills() {
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
            search: filters.search || undefined,
        };
    }, [filters, page]);

    const { data, isLoading } = useQuery({
        queryKey: ["financial-activities", params],
        queryFn: () => getFinancialActivities(params),
        placeholderData: (previous) => previous,
    });
    const { data: returnsData } = useQuery({
        queryKey: ["order-returns"],
        queryFn: () => getOrderReturns({ page: 1, limit: 50 }),
    });
    const { data: selectedReturnsData } = useQuery({
        queryKey: ["order-returns", selectedOrder?.orderId],
        queryFn: () => getOrderReturns({ orderId: selectedOrder!.orderId, page: 1, limit: 50 }),
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
            queryClient.invalidateQueries({ queryKey: ["financial-activities"] });
            queryClient.invalidateQueries({ queryKey: ["shop-summary"] });
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
            queryClient.invalidateQueries({ queryKey: ["financial-activities"] });
            queryClient.invalidateQueries({ queryKey: ["shop-summary"] });
            resetAction();
            toast.success("ບັນທຶກການຄືນສິນຄ້າແລ້ວ; stock ລໍຖ້າ admin ຮັບເຂົ້າແຍກຕ່າງຫາກ");
        },
        onError: (error: unknown) => toast.error(apiError(error)),
    });

    const restockMutation = useMutation({
        mutationFn: ({ returnId, productId }: { returnId: string; productId: string }) =>
            restockReturnItem(returnId, productId, "Admin approved sellable return"),
        onSuccess: () => {
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

    return (
        <div className="min-h-screen space-y-4 bg-slate-50 p-4 font-lao md:p-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Receipt className="h-5 w-5 text-emerald-600" /> ການເງິນ ແລະ ໃບບິນ</h1>
                    <p className="mt-1 text-sm text-slate-500">ການຂາຍ, ຮັບຊຳລະໜີ້, ຄືນເງິນ ແລະ ຍົກເລີກ</p>
                </div>
                <Button variant="outline" onClick={() => setReturnsOpen(true)}><PackageX className="mr-2 h-4 w-4" />ສິນຄ້າຄືນ ({returnsData?.total || 0})</Button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label="ເງິນເຂົ້າ" value={data?.summary.moneyIn} icon={ArrowDownLeft} tone="green" />
                <Metric label="ເງິນອອກ" value={data?.summary.moneyOut} icon={ArrowUpRight} tone="red" />
                <Metric label="ສຸດທິ" value={data?.summary.net} icon={Wallet} tone={(data?.summary.net || 0) >= 0 ? "green" : "red"} />
                <Metric label="ເງິນທອນ" value={data?.summary.change} icon={RotateCcw} tone="yellow" />
            </div>

            <div className="grid gap-3 border bg-white p-3 md:grid-cols-[1fr_150px_150px_150px_150px_160px]">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input value={filters.search} onChange={(event) => { setFilters({ ...filters, search: event.target.value }); setPage(1); }} placeholder="ເລກບິນ, ລູກຄ້າ, reference" className="pl-9" />
                </div>
                <Input type="date" value={filters.start} onChange={(event) => { setFilters({ ...filters, start: event.target.value }); setPage(1); }} />
                <Input type="date" value={filters.end} onChange={(event) => { setFilters({ ...filters, end: event.target.value }); setPage(1); }} />
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

            <div className="overflow-hidden border bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-sm">
                        <thead className="border-b bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-4 py-3">ວັນເວລາ</th><th className="px-4 py-3">ເລກລາຍການ</th><th className="px-4 py-3">ປະເພດ</th><th className="px-4 py-3">ປະເພດການຂາຍ</th><th className="px-4 py-3">ລູກຄ້າ</th><th className="px-4 py-3">ພະນັກງານ</th><th className="px-4 py-3">ຊ່ອງທາງ</th><th className="px-4 py-3 text-right">ຈຳນວນທີ່ຮັບ</th><th className="px-4 py-3 text-right">ລວມເປັນກີບ</th><th className="px-4 py-3 text-right">ທອນ</th><th className="px-4 py-3 text-right">ຈັດການ</th></tr></thead>
                        <tbody className="divide-y">
                            {isLoading ? <tr><td colSpan={11} className="p-10 text-center text-slate-400">Loading...</td></tr> : data?.data.length === 0 ? <tr><td colSpan={11} className="p-10 text-center text-slate-400">ບໍ່ພົບລາຍການ</td></tr> : data?.data.map((activity) => (
                                <tr key={activity._id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3"><div>{format(new Date(activity.createdAt), "dd/MM/yyyy")}</div><div className="text-xs text-slate-400">{format(new Date(activity.createdAt), "HH:mm:ss")}</div></td>
                                    <td className="px-4 py-3 font-mono font-semibold">#{activity.order?.orderId || activity.transactionId}</td>
                                    <td className="px-4 py-3"><Badge className={activity.direction === "OUT" ? "bg-red-100 text-red-700" : activity.sourceType === "DEBT_REPAYMENT" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>{sourceLabel[activity.sourceType]}</Badge>{activity.migrationStatus === "INCOMPLETE" && <div className="mt-1 text-[10px] text-amber-600">ຂໍ້ມູນເກົ່າອາດບໍ່ຄົບ</div>}</td>
                                    <td className="px-4 py-3">{activity.order ? <Badge className={activity.order.saleMode === "wholesale" ? "bg-emerald-100 text-emerald-700" : activity.order.saleMode === "retail" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}>{saleModeLabel(activity.order.saleMode)}</Badge> : "-"}</td>
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

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader><DialogTitle>ລາຍລະອຽດ #{selected?.order?.orderId || selected?.transactionId}</DialogTitle><DialogDescription>{selected && `${sourceLabel[selected.sourceType]} · ${format(new Date(selected.createdAt), "dd/MM/yyyy HH:mm:ss")}`}</DialogDescription></DialogHeader>
                    {selected && <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 border-y py-3 md:grid-cols-5"><Detail label="ລູກຄ້າ" value={selected.customer?.name || "ທົ່ວໄປ"} /><Detail label="ປະເພດການຂາຍ" value={selected.order ? saleModeLabel(selected.order.saleMode) : "-"} /><Detail label="ຜູ້ຮັບເງິນ" value={selected.processedBy?.username || "-"} /><Detail label="ຮັບ/ຄືນ" value={money(selected.grossReceivedInLAK)} /><Detail label="ເງິນທອນ" value={money(selected.changeInLAK)} /></div>
                        <div><h3 className="mb-2 text-sm font-semibold">ລາຍລະອຽດການຈ່າຍ</h3><div className="overflow-hidden border"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-2 text-left">ຊ່ອງທາງ</th><th className="p-2 text-left">ສະກຸນ</th><th className="p-2 text-right">ຈຳນວນ</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">ເປັນກີບ</th><th className="p-2 text-left">Reference</th></tr></thead><tbody>{selected.payments?.map((line, index) => <tr key={index} className="border-t"><td className="p-2">{methodLabel[line.method]}</td><td className="p-2">{line.currency}</td><td className="p-2 text-right">{line.amount.toLocaleString()}</td><td className="p-2 text-right">{line.rate.toLocaleString()}</td><td className="p-2 text-right font-semibold">{money(line.amountInLAK)}</td><td className="p-2">{line.reference || "-"}</td></tr>)}</tbody></table></div></div>
                        {selectedOrder && selectedOrder.items.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">ສິນຄ້າ</h3><div className="divide-y border">{selectedOrder.items.map((item, index) => <div key={index} className="flex justify-between p-2 text-sm"><span>{item.name} × {item.quantity}</span><span>{money(item.price * item.quantity)}</span></div>)}</div></div>}
                        {!!selectedReturnsData?.data.length && <div><h3 className="mb-2 text-sm font-semibold text-amber-800">ປະຫວັດຄືນບາງລາຍການ</h3><div className="space-y-2">{selectedReturnsData.data.map((orderReturn) => <div key={orderReturn.returnId} className="border-l-4 border-amber-500 bg-amber-50 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>#{orderReturn.returnId}</strong><span>{format(new Date(orderReturn.createdAt), "dd/MM/yyyy HH:mm")}</span></div><div className="mt-1 text-slate-600">{orderReturn.reasonCode}{orderReturn.note ? ` · ${orderReturn.note}` : ""}</div><div className="mt-2 divide-y border bg-white">{orderReturn.items.map((item) => <div key={`${orderReturn.returnId}-${item.product}`} className="flex flex-wrap items-center justify-between gap-3 p-2"><span>{item.name} × {item.quantity} · {item.condition}</span><Badge variant="outline" className={returnDispositionClass(item)}>{returnDispositionLabel(item)}</Badge><span>{money(item.price * item.quantity)}</span></div>)}</div><div className="mt-2 text-right font-semibold text-red-700">ຄືນເງິນ {money(orderReturn.refundAmount)}</div></div>)}</div></div>}
                        {selectedOrder?.status === "CANCELLED" && <div className="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800"><strong>ຍົກເລີກ:</strong> {selectedOrder.cancelReason || "-"}</div>}
                    </div>}
                    <DialogFooter className="gap-2">
                        {selected?.sourceType === "SALE" && selectedOrder && selectedOrder.status !== "CANCELLED" && <><Button variant="outline" onClick={() => { openReturn(selectedOrder); setSelected(null); }}><PackageX className="mr-2 h-4 w-4" />ຄືນບາງລາຍການ</Button><Button variant="destructive" onClick={() => { setCancelTarget(selectedOrder); setRefundAmount(Math.max(0, selectedOrder.total - selectedOrder.remainingAmount)); setRestoreStockOnCancel(true); setSelected(null); }}><Ban className="mr-2 h-4 w-4" />ຍົກເລີກ + ຄືນ stock</Button></>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

function Metric({ label, value, icon: Icon, tone }: { label: string; value?: number; icon: typeof History; tone: "green" | "red" | "yellow" }) {
    const colors = { green: "border-emerald-500 text-emerald-700 bg-emerald-50", red: "border-red-500 text-red-700 bg-red-50", yellow: "border-amber-500 text-amber-700 bg-amber-50" };
    return <div className={`flex items-center justify-between border-l-4 bg-white p-4 ${colors[tone]}`}><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{money(value)}</p></div><div className={`p-2 ${colors[tone]}`}><Icon className="h-5 w-5" /></div></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-semibold">{value}</div></div>; }

function ActionFields(props: { reason: string; setReason: (value: string) => void; reasonCode: string; setReasonCode: (value: string) => void; refundMethod: "CASH" | "TRANSFER"; setRefundMethod: (value: "CASH" | "TRANSFER") => void; reference: string; setReference: (value: string) => void; showRefund: boolean }) {
    return <div className="grid gap-3"><div><Label>ປະເພດເຫດຜົນ</Label><Select value={props.reasonCode} onValueChange={props.setReasonCode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CUSTOMER_REQUEST">ລູກຄ້າຮ້ອງຂໍ</SelectItem><SelectItem value="WRONG_ITEM">ສິນຄ້າຜິດ</SelectItem><SelectItem value="DEFECTIVE">ສິນຄ້າມີບັນຫາ</SelectItem><SelectItem value="BILL_ERROR">ບິນຜິດ</SelectItem><SelectItem value="OTHER">ອື່ນໆ</SelectItem></SelectContent></Select></div><div><Label>ລາຍລະອຽດ *</Label><Textarea value={props.reason} onChange={(event) => props.setReason(event.target.value)} /></div>{props.showRefund && <div className="grid grid-cols-2 gap-3"><div><Label>ຊ່ອງທາງຄືນເງິນ</Label><Select value={props.refundMethod} onValueChange={(value: "CASH" | "TRANSFER") => props.setRefundMethod(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CASH">ເງິນສົດ</SelectItem><SelectItem value="TRANSFER">ເງິນໂອນ</SelectItem></SelectContent></Select></div>{props.refundMethod === "TRANSFER" && <div><Label>Transfer reference *</Label><Input value={props.reference} onChange={(event) => props.setReference(event.target.value)} /></div>}</div>}</div>;
}
