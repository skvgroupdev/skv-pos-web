import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getOrders, cancelOrder, addOrderNote
} from "@/api/pos";
import { payDebt } from "@/api/debt";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
    Search, Printer, Ban, AlertCircle, Eye,
    RefreshCw, TrendingUp, CreditCard,
    FileText, History, MessageSquare, Wallet,
    Receipt,
    ChevronRight,
    ChevronLeft,
    Smartphone,
    DollarSign
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import PrintBill from "./components/PrintBill";
import PrintDebtReceipt from "@/components/PrintDebtReceipt";
import { toast } from "sonner";
import StatusBadge from "@/components/ui/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";

export default function BillManager() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    // --- State ---
    const [dateRange, setDateRange] = useState<{ from: string, to: string }>(() => {
        const today = new Date().toISOString().split('T')[0];
        return { from: today, to: today };
    });

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<string>("ALL");
    const [paymentMethod, setPaymentMethod] = useState<string>("ALL");
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Modals
    const [orderToPrint, setOrderToPrint] = useState<any>(null);
    const [overridePaperSize, setOverridePaperSize] = useState<"A4" | "A5" | undefined>(undefined);
    const [wholesalePrintOrder, setWholesalePrintOrder] = useState<any>(null);
    const [wholesalePaperSize, setWholesalePaperSize] = useState<"A4" | "A5">("A4");
    const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
    const [orderToCancel, setOrderToCancel] = useState<any>(null);
    const [orderToView, setOrderToView] = useState<any>(null);
    const [orderToPayDebt, setOrderToPayDebt] = useState<any>(null);
    const [orderToAddNote, setOrderToAddNote] = useState<any>(null);
    const [orderPaymentHistory, setOrderPaymentHistory] = useState<any>(null);

    // Payment form state
    const [paymentAmount, setPaymentAmount] = useState("");
    const [repaymentMethod, setRepaymentMethod] = useState<"CASH" | "TRANSFER" | "MIXED">("CASH");
    const [paymentReference, setPaymentReference] = useState("");
    const [paymentNote, setPaymentNote] = useState("");
    const [noteText, setNoteText] = useState("");

    // --- Queries ---

    // 2. Fetch Orders (Filtered by Current Cashier)
    const queryParams = useMemo(() => {
        const startDate = dateRange.from ? new Date(dateRange.from) : undefined;
        if (startDate) startDate.setHours(0, 0, 0, 0);

        const endDate = dateRange.to ? new Date(dateRange.to) : undefined;
        if (endDate) endDate.setHours(23, 59, 59, 999);

        const p: any = {
            page,
            limit: pageSize,
            search,
            startDate,
            endDate,
            cashierId: user?.id || "", // Enforce current cashier
        };
        if (status && status !== 'ALL') p.paymentStatus = status;
        if (paymentMethod && paymentMethod !== 'ALL') p.paymentMethod = paymentMethod;

        return p;
    }, [page, search, dateRange, status, paymentMethod, user]);

    const { data: ordersResponse, isLoading } = useQuery({
        queryKey: ['cashier-orders', queryParams],
        queryFn: () => getOrders(queryParams),
        placeholderData: (prev) => prev
    });

    const orders = ordersResponse?.data || [];
    const totalItems = ordersResponse?.total || 0;
    const totalPages = ordersResponse?.totalPages || 1;

    // --- Mutations ---
    const cancelMutation = useMutation({
        mutationFn: cancelOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashier-orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setOrderToCancel(null);
            toast.success("ຍົກເລີກບິນສຳເລັດແລ້ວ");
        },
        onError: (err: any) => {
            toast.error("ການຍົກເລີກລົ້ມແຫລວ: " + (err.response?.data?.error || err.message));
        }
    });

    const addPaymentMutation = useMutation({
        mutationFn: (data: any) => payDebt(data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cashier-orders'] });

            const receiptData = {
                receiptNumber: data.receiptNumber,
                processedBy: { username: user?.username },
                amount: variables.amount,
                paymentMethod: variables.paymentMethod,
                reference: variables.reference,
                note: variables.note,
                customer: orderToPayDebt?.customerId,
                order: orderToPayDebt,
                balanceBefore: orderToPayDebt?.remainingAmount || 0,
                balanceAfter: data.newDebt,
                createdAt: new Date().toISOString()
            };

            setOrderToPayDebt(null);
            setPaymentAmount("");
            setRepaymentMethod("CASH");
            setPaymentReference("");
            setPaymentNote("");

            toast.success("ຊຳລະເງິນສຳເລັດແລ້ວ", {
                action: {
                    label: "ພິມໃບຮັບ",
                    onClick: () => setReceiptToPrint(receiptData)
                }
            });
        },
        onError: (err: any) => {
            toast.error("ການຊຳລະລົ້ມແຫລວ: " + (err.response?.data?.error || err.message));
        }
    });

    const addNoteMutation = useMutation({
        mutationFn: ({ orderId, note }: any) => addOrderNote(orderId, note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashier-orders'] });
            setOrderToAddNote(null);
            setNoteText("");
            toast.success("ເພີ່ມໝາຍເຫດສຳເລັດແລ້ວ");
        },
        onError: (err: any) => {
            toast.error("ການເພີ່ມໝາຍເຫດລົ້ມແຫລວ: " + (err.response?.data?.error || err.message));
        }
    });

    // --- Helpers ---
    const formatCurrency = (val: number) => `₭${val?.toLocaleString() || 0}`;

    const resetFilters = () => {
        setSearch("");
        setStatus("ALL");
        setPaymentMethod("ALL");
        const today = new Date().toISOString().split('T')[0];
        setDateRange({ from: today, to: today });
        setPage(1);
    };

    const handleAddPayment = () => {
        if (!orderToPayDebt) return;
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("ກະລຸນາໃສ່ຈຳນວນເງິນທີ່ຖືກຕ້ອງ");
            return;
        }

        if (amount > orderToPayDebt.remainingAmount) {
            toast.error(`ຈຳນວນເງິນເກີນຍອດຄົງຄ້າງ (${formatCurrency(orderToPayDebt.remainingAmount)})`);
            return;
        }

        addPaymentMutation.mutate({
            customerId: orderToPayDebt.customerId?._id,
            orderId: orderToPayDebt.orderId,
            amount,
            paymentMethod: repaymentMethod,
            reference: paymentReference || undefined,
            note: paymentNote || undefined
        });
    };

    const handleAddNote = () => {
        if (!orderToAddNote || !noteText.trim()) {
            toast.error("ກະລຸນາໃສ່ໝາຍເຫດ");
            return;
        }
        addNoteMutation.mutate({
            orderId: orderToAddNote._id,
            note: noteText
        });
    };

    const stats = useMemo(() => {
        const activeOrders = orders.filter((o: any) => o.status !== 'CANCELLED');
        if (activeOrders.length === 0) return { totalSales: 0, totalOrders: 0, totalDebt: 0, totalPaid: 0 };
        return {
            totalSales: activeOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
            totalOrders: activeOrders.length,
            totalDebt: activeOrders.reduce((sum: number, o: any) => sum + (o.remainingAmount || 0), 0),
            totalPaid: activeOrders.reduce((sum: number, o: any) => sum + Math.max(0, (o.paidAmount || 0) - (o.change || 0)), 0)
        };
    }, [orders]);

    return (
        <div className="h-full flex flex-col p-4 md:p-6 space-y-6 bg-slate-50/50 font-lao overflow-y-auto">
            <PrintBill data={orderToPrint} clearData={() => { setOrderToPrint(null); setOverridePaperSize(undefined); }} overridePaperSize={overridePaperSize} />
            <PrintDebtReceipt data={receiptToPrint} clearData={() => setReceiptToPrint(null)} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Receipt className="w-7 h-7 text-indigo-600" />
                        ຈັດການໃບບິນ
                    </h1>
                    <p className="text-slate-500 text-sm">ປະຫວັດການຂາຍຂອງທ່ານ (ສະແດງສະເພາະບິນຂອງທ່ານ)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                        <RefreshCw className="w-4 h-4 mr-2" /> ລ້າງຄ່າ
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">ຍອດຂາຍລວມ</p>
                            <p className="text-xl font-bold text-indigo-600 mt-1">{formatCurrency(stats.totalSales)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-indigo-500 opacity-20" />
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">ຈຳນວນບິນ</p>
                            <p className="text-xl font-bold text-blue-600 mt-1">{stats.totalOrders}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500 opacity-20" />
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">ຊຳລະແລ້ວ</p>
                            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalPaid)}</p>
                        </div>
                        <CreditCard className="w-8 h-8 text-emerald-500 opacity-20" />
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">ຍອດໜີ້ຄົງຄ້າງ</p>
                            <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(stats.totalDebt)}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
                    </CardContent>
                </Card>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="ຄົ້ນຫາເລກບິນ ຫຼື  ຊື່ລູກຄ້າ..."
                        className="pl-9 bg-slate-50"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="w-full md:w-40 bg-slate-50"
                    />
                    <span className="text-slate-400">ຫາ</span>
                    <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="w-full md:w-40 bg-slate-50"
                    />
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full md:w-[140px] bg-slate-50">
                        <SelectValue placeholder="ສະຖານະ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">ທັງໝົດ</SelectItem>
                        <SelectItem value="PAID">ຈ່າຍແລ້ວ</SelectItem>
                        <SelectItem value="UNPAID">ຕິດໜີ້</SelectItem>
                        <SelectItem value="PARTIAL">ຈ່າຍບາງສ່ວນ</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b">
                            <tr>
                                <th className="py-4 px-6">ID</th>
                                <th className="py-4 px-6">ວັນທີ</th>
                                <th className="py-4 px-6">ລູກຄ້າ</th>
                                <th className="py-4 px-6 text-right">ຍອດລວມ</th>
                                <th className="py-4 px-6 text-center">ຊ່ອງທາງ</th>
                                <th className="py-4 px-6 text-center">ສະຖານະ</th>
                                <th className="py-4 px-6 text-right">ຈັດການ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-400">ບໍ່ພົບລາຍການຂາຍ</td></tr>
                            ) : (
                                orders.map((order: any) => (
                                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono font-bold text-indigo-600">#{order.orderId}</span>
                                                {order.saleMode === "wholesale" ? (
                                                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700">ຂາຍສົ່ງ</span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-700">ຂາຍຍ່ອຍ</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{format(new Date(order.createdAt), "dd/MM/yyyy")}</span>
                                                <span className="text-xs text-slate-400">{format(new Date(order.createdAt), "HH:mm")}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">{order.customerId?.name || "ລູກຄ້າທົ່ວໄປ"}</td>
                                        <td className="py-4 px-6 text-right font-bold">{formatCurrency(order.total)}</td>
                                        <td className="py-4 px-6 text-center"><StatusBadge status={order.paymentMethod} type="paymentMethod" /></td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={order.status === 'CANCELLED' ? 'CANCELLED' : order.paymentStatus} type="paymentStatus" />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setOrderToView(order)}><Eye className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setOrderPaymentHistory(order)}><History className="h-4 w-4" /></Button>
                                                {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => setOrderToPayDebt(order)}><Wallet className="h-4 w-4" /></Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-purple-600" onClick={() => setOrderToAddNote(order)}><MessageSquare className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { if (order.saleMode === "wholesale") { setWholesalePaperSize("A4"); setWholesalePrintOrder(order); } else { setOverridePaperSize(undefined); setOrderToPrint(order); } }}><Printer className="h-4 w-4" /></Button>
                                                {order.status !== 'CANCELLED' && (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setOrderToCancel(order)}><Ban className="h-4 w-4" /></Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t p-4 flex items-center justify-between bg-slate-50">
                    <p className="text-xs text-slate-500">ສະແດງ {totalItems > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, totalItems)} ຈາກ {totalItems}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <div className="flex items-center px-2 text-sm">ໜ້າ {page} / {totalPages}</div>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* View Details Dialog */}
            <Dialog open={!!orderToView} onOpenChange={(open) => !open && setOrderToView(null)}>
                <DialogContent className="max-w-3xl font-lao max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ລາຍລະອຽດບິນ #{orderToView?.orderId}</DialogTitle>
                        <DialogDescription>{orderToView && format(new Date(orderToView.createdAt), "EEEE, dd MMMM yyyy · HH:mm")}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-indigo-50/50"><CardContent className="p-3">
                                <p className="text-xs text-slate-500">ລູກຄ້າ</p>
                                <p className="font-bold">{orderToView?.customerId?.name || "ລູກຄ້າທົ່ວໄປ"}</p>
                            </CardContent></Card>
                            <Card className="bg-blue-50/50"><CardContent className="p-3">
                                <p className="text-xs text-slate-500">ຜູ້ຊຳລະ</p>
                                <p className="font-bold">{orderToView?.cashierId?.username || "Staff"}</p>
                            </CardContent></Card>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50"><tr><th className="p-2 text-left">ສິນຄ້າ</th><th className="p-2 text-center">ຈຳນວນ</th><th className="p-2 text-right">ລວມ</th></tr></thead>
                                <tbody className="divide-y">
                                    {orderToView?.items?.map((item: any, i: number) => (
                                        <tr key={i}><td className="p-2">{item.name}</td><td className="p-2 text-center">{item.quantity}</td><td className="p-2 text-right">{(item.price * item.quantity).toLocaleString()}</td></tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold">
                                    <tr><td colSpan={2} className="p-2 text-right">ລວມທັງໝົດ:</td><td className="p-2 text-right text-indigo-600 font-mono">{orderToView?.total.toLocaleString()} ₭</td></tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrderToView(null)}>ປິດ</Button>
                        <Button onClick={() => { setOrderToPrint(orderToView); setOrderToView(null); }}><Printer className="w-4 h-4 mr-2" /> ພິມບິນ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pay Debt Dialog (Professional Collection) */}
            <Dialog open={!!orderToPayDebt} onOpenChange={(open) => !open && setOrderToPayDebt(null)}>
                <DialogContent className="max-w-md font-lao">
                    <DialogHeader>
                        <DialogTitle className="text-emerald-600 flex items-center gap-2"><DollarSign className="h-5 w-5" /> ຊຳລະໜີ້ (Repayment)</DialogTitle>
                        <DialogDescription>
                            ບິນ #{orderToPayDebt?.orderId} - {orderToPayDebt?.customerId?.name || "ລູກຄ້າທົ່ວໄປ"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-2">
                            <div className="flex justify-between text-slate-500"><span>ຍອດລວມ:</span><span>{formatCurrency(orderToPayDebt?.total)}</span></div>
                            <div className="flex justify-between text-emerald-600"><span>ຊຳລະແລ້ວ:</span><span>{formatCurrency(orderToPayDebt?.paidAmount)}</span></div>
                            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-base">
                                <span className="text-slate-700">ຄົງຄ້າງ:</span>
                                <span className="text-red-600">{formatCurrency(orderToPayDebt?.remainingAmount)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">ຈຳນວນເງິນຊຳລະ *</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="text-lg font-bold pl-8 border-indigo-200 ring-indigo-50"
                                        placeholder="0"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₭</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">ວິທີການຊຳລະ *</Label>
                                <Select value={repaymentMethod} onValueChange={(v: any) => setRepaymentMethod(v)}>
                                    <SelectTrigger className="h-10 border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">
                                            <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-500" /> ເງິນສົດ (Cash)</div>
                                        </SelectItem>
                                        <SelectItem value="TRANSFER">
                                            <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-500" /> ໂອນເງິນ (Transfer)</div>
                                        </SelectItem>
                                        <SelectItem value="MIXED">
                                            <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-purple-500" /> ປະສົມ (Mixed)</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {repaymentMethod === 'TRANSFER' && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold tracking-wider text-slate-500">ເລກອ້າງອີງ (Reference)</Label>
                                    <Input
                                        placeholder="Transaction ID / ເລກອ້າງອີງ..."
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        className="h-10 border-slate-200"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold tracking-wider text-slate-500">ໝາຍເຫດ (Note)</Label>
                                <Textarea
                                    placeholder="ໝາຍເຫດເພີ່ມເຕີມ..."
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    rows={2}
                                    className="border-slate-200 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={() => setOrderToPayDebt(null)} className="flex-1">ຍົກເລີກ</Button>
                        <Button onClick={handleAddPayment} disabled={addPaymentMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-md">
                            {addPaymentMutation.isPending ? "ກຳລັງບັນທຶກ..." : "ຢືນຢັນການຊຳລະ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History, Note, Cancel Modals (similar to above, omitted for brevity but should be fully implemented) */}
            <Dialog open={!!orderPaymentHistory} onOpenChange={(open) => !open && setOrderPaymentHistory(null)}>
                <DialogContent className="max-w-xl font-lao">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="h-5 w-5 text-blue-600" /> ປະຫວັດການຊຳລະ</DialogTitle></DialogHeader>
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                        {orderPaymentHistory?.payments?.map((p: any, i: number) => (
                            <div key={i} className="p-4 flex justify-between items-center">
                                <div><p className="font-bold">{p.amount.toLocaleString()} {p.currency}</p><p className="text-xs text-slate-400">{p.paidAt ? format(new Date(p.paidAt), "dd/MM/yyyy HH:mm") : "-"}</p></div>
                                <p className="font-mono text-emerald-600 font-bold">{formatCurrency(p.amountInLAK)}</p>
                            </div>
                        ))}
                    </div>
                    <DialogFooter><Button onClick={() => setOrderPaymentHistory(null)}>ປິດ</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!orderToAddNote} onOpenChange={(open) => !open && setOrderToAddNote(null)}>
                <DialogContent className="font-lao">
                    <DialogHeader><DialogTitle>ເພີ່ມໝາຍເຫດ</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <Textarea placeholder="ໃສ່ໝາຍເຫດ..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrderToAddNote(null)}>ຍົກເລີກ</Button>
                        <Button onClick={handleAddNote} disabled={addNoteMutation.isPending}>ບັນທຶກ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
                <DialogContent className="font-lao">
                    <DialogHeader><DialogTitle className="text-red-600">ຍົກເລີກບິນ</DialogTitle><DialogDescription>ບິນ #{orderToCancel?.orderId}</DialogDescription></DialogHeader>
                    <div className="bg-red-50 p-4 border border-red-100 text-red-800 text-sm rounded-lg">ການກະທຳນີ້ຈະຄືນສະຕັອກ ແລະ ຫັກຍອດຂາຍ. ຢືນຢັນ?</div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrderToCancel(null)}>ຍົກເລີກ</Button>
                        <Button variant="destructive" onClick={() => cancelMutation.mutate(orderToCancel._id)} disabled={cancelMutation.isPending}>ຢືນຢັນຍົກເລີກ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Wholesale Paper Size Picker */}
            <Dialog open={!!wholesalePrintOrder} onOpenChange={(open) => !open && setWholesalePrintOrder(null)}>
                <DialogContent className="max-w-sm font-lao">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Printer className="h-5 w-5 text-emerald-600" /> ເລືອກຂະໜາດກະດາດ
                        </DialogTitle>
                        <DialogDescription>ບິນ #{wholesalePrintOrder?.orderId} (ຂາຍສົ່ງ)</DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 py-2">
                        <Button
                            variant={wholesalePaperSize === "A4" ? "default" : "outline"}
                            className={wholesalePaperSize === "A4" ? "flex-1 bg-emerald-600 hover:bg-emerald-700" : "flex-1"}
                            onClick={() => setWholesalePaperSize("A4")}
                        >
                            A4
                        </Button>
                        <Button
                            variant={wholesalePaperSize === "A5" ? "default" : "outline"}
                            className={wholesalePaperSize === "A5" ? "flex-1 bg-emerald-600 hover:bg-emerald-700" : "flex-1"}
                            onClick={() => setWholesalePaperSize("A5")}
                        >
                            A5
                        </Button>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setWholesalePrintOrder(null)}>ຍົກເລີກ</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                                setOverridePaperSize(wholesalePaperSize);
                                setOrderToPrint(wholesalePrintOrder);
                                setWholesalePrintOrder(null);
                            }}
                        >
                            <Printer className="h-4 w-4 mr-2" /> ພິມ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
