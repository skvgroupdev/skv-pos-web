import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnpaidOrders, getDebtHistory } from "@/api/pos";
import { payDebt, getCashierDebtSummary, getDebtors } from "@/api/debt";
import { useAuthStore } from "@/store/useAuthStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PrintDebtReceipt from "@/components/PrintDebtReceipt";
import {
    Search,
    CreditCard,
    Wallet,
    Smartphone,
    Receipt,
    FileText,
    Eye,

    DollarSign,
    BarChart3,
    Users
} from "lucide-react";
import { format } from "date-fns";
import { StatCard } from "@/pages/shop/components/StatCard";

export default function DebtManager() {
    const { user } = useAuthStore();
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [selectedOrderToPay, setSelectedOrderToPay] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [transferPortion, setTransferPortion] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "MIXED">("CASH");
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [isGeneralPayOpen, setIsGeneralPayOpen] = useState(false);

    // Print States
    const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
    const [orderToView, setOrderToView] = useState<any>(null);

    const queryClient = useQueryClient();

    const cashierId = user?.id || "";

    // Fetch debt customers for the current POS user only.
    const { data: debtorsResponse } = useQuery({
        queryKey: ['pos-debtors', search, cashierId],
        queryFn: () => getDebtors({ search, page: 1, limit: 100, cashierId })
    });

    const debtors = debtorsResponse?.data || [];



    // Fetch Customer Details
    const { data: unpaidOrders, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['unpaid-orders', selectedCustomer?._id, cashierId],
        queryFn: () => getUnpaidOrders(selectedCustomer._id, { cashierId }),
        enabled: !!selectedCustomer
    });

    const { data: debtHistory, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['debt-history', selectedCustomer?._id, cashierId],
        queryFn: () => getDebtHistory(selectedCustomer._id, { cashierId }),
        enabled: !!selectedCustomer
    });

    const { data: cashierSummary } = useQuery({
        queryKey: ['cashier-debt-summary'],
        queryFn: () => getCashierDebtSummary()
    });

    const totalCollectedToday = cashierSummary?.summary?.reduce((sum: number, s: any) => sum + s.total, 0) || 0;
    const totalDebt = debtorsResponse?.summary?.totalDebt || debtors.reduce((sum: number, debtor: any) => sum + (debtor.totalDebt || 0), 0);
    const totalDebtCustomers = debtorsResponse?.summary?.customers || debtors.length;
    const totalUnpaidBills = debtors.reduce((sum: number, debtor: any) => sum + (debtor.unpaidOrders || 0), 0);

    // Payment Mutation
    const payDebtMutation = useMutation({
        mutationFn: (data: {
            customerId: string,
            amount: number,
            orderId?: string,
            paymentMethod: "CASH" | "TRANSFER" | "MIXED",
            cashierId?: string,
            reference?: string,
            note?: string
            payments?: Array<{ method: "CASH" | "TRANSFER"; currency: string; amount: number; rate: number; amountInLAK: number; reference?: string }>
        }) => payDebt(data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['pos-debtors'] });
            queryClient.invalidateQueries({ queryKey: ['unpaid-orders'] });
            queryClient.invalidateQueries({ queryKey: ['debt-history'] });
            queryClient.invalidateQueries({ queryKey: ['cashier-debt-summary'] });

            // Prepare receipt data for printing
            const receiptData = {
                ...debtHistory?.[0],
                receiptNumber: data.receiptNumber,
                processedBy: { username: data.processedBy },
                amount: variables.amount,
                paymentMethod: variables.paymentMethod,
                reference: variables.reference,
                note: variables.note,
                customer: selectedCustomer,
                order: selectedOrderToPay,
                balanceBefore: selectedCustomer?.totalDebt || 0,
                balanceAfter: data.newDebt,
                createdAt: new Date().toISOString()
            };

            setPaymentAmount("");
            setReference("");
            setTransferPortion("");
            setNote("");
            setPaymentMethod("CASH");
            setSelectedOrderToPay(null);
            setIsGeneralPayOpen(false);

            toast.success("ຊຳລະໜີ້ສຳເລັດ (Payment Recorded)", {
                description: `Receipt #${data.receiptNumber}`,
                action: {
                    label: "ພິມໃບຮັບ",
                    onClick: () => setReceiptToPrint(receiptData)
                }
            });
        },
        onError: (err: any) => toast.error("Failed: " + (err.response?.data?.error || err.message))
    });

    const handlePay = () => {
        if (!selectedCustomer || !paymentAmount) {
            toast.error("ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ");
            return;
        }

        const cashPart = parseFloat(paymentAmount) || 0;
        const transferPart = paymentMethod === "MIXED" ? (parseFloat(transferPortion) || 0) : 0;
        const amt = cashPart + transferPart;

        if (amt <= 0) {
            toast.error("ຈຳນວນເງິນຕ້ອງຫຼາຍກວ່າ 0");
            return;
        }
        if (paymentMethod === "MIXED" && (cashPart <= 0 || transferPart <= 0)) {
            toast.error("ການຈ່າຍແບບປະສົມຕ້ອງມີທັງເງິນສົດ ແລະ ເງິນໂອນ");
            return;
        }
        if (paymentMethod !== "CASH" && !reference.trim()) {
            toast.error("ກະລຸນາໃສ່ເລກອ້າງອີງການໂອນ");
            return;
        }

        // Validation for specific bill
        if (selectedOrderToPay && amt > selectedOrderToPay.remainingAmount) {
            toast.error(`ຈຳນວນເງິນເກີນຍອດຄົງຄ້າງ (${selectedOrderToPay.remainingAmount.toLocaleString()}₭)`);
            return;
        }

        payDebtMutation.mutate({
            customerId: selectedCustomer._id,
            amount: amt,
            orderId: selectedOrderToPay?.orderId,
            paymentMethod: paymentMethod,
            cashierId,
            reference: reference || undefined,
            note: note || undefined,
            payments: [
                ...(paymentMethod !== "TRANSFER" ? [{ method: "CASH" as const, currency: "LAK", amount: cashPart, rate: 1, amountInLAK: cashPart }] : []),
                ...(paymentMethod !== "CASH" ? [{ method: "TRANSFER" as const, currency: "LAK", amount: paymentMethod === "TRANSFER" ? cashPart : transferPart, rate: 1, amountInLAK: paymentMethod === "TRANSFER" ? cashPart : transferPart, reference }] : []),
            ]
        });
    };

    const openPayModal = (order: any = null) => {
        setSelectedOrderToPay(order);
        setPaymentAmount(order ? order.remainingAmount.toString() : "");
        setPaymentMethod("CASH");
        setReference("");
        setTransferPortion("");
        setNote("");
        setIsGeneralPayOpen(true);
    };

    const formatCurrency = (amount: number | undefined | null) => {
        const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
        return `${value.toLocaleString()}₭`;
    };

    return (
        <div className="min-h-screen space-y-4 bg-slate-50 p-4 font-lao md:p-6">
            {/* Print Component */}
            <PrintDebtReceipt data={receiptToPrint} clearData={() => setReceiptToPrint(null)} />

            {/* Header with Cashier Stats */}
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        <CreditCard className="h-5 w-5 text-amber-600" />
                        ຈັດການໃບບິນຕິດໜີ້
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">ລູກໜີ້, ບິນຄ້າງ ແລະ ການຮັບຊຳລະຂອງທ່ານ</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="ລູກຄ້າຕິດໜີ້"
                    value={totalDebtCustomers.toLocaleString()}
                    icon={Users}
                    accent="slate"
                    subtext="ສະເພາະຂອງພະນັກງານນີ້"
                />
                <StatCard
                    title="ບິນຄ້າງຊຳລະ"
                    value={totalUnpaidBills.toLocaleString()}
                    icon={FileText}
                    accent="indigo"
                    subtext="ບິນທີ່ຍັງມີຍອດຄ້າງ"
                />
                <StatCard
                    title="ໜີ້ຄົງເຫຼືອ"
                    value={formatCurrency(totalDebt)}
                    icon={CreditCard}
                    accent="rose"
                    subtext="ຍອດຄ້າງຊຳລະທັງໝົດ"
                />
                <StatCard
                    title="ເກັບໜີ້ໄດ້ມື້ນີ້"
                    value={formatCurrency(totalCollectedToday)}
                    icon={Wallet}
                    accent="emerald"
                    subtext="ລາຍງານການຮັບຊຳລະ"
                />
            </div>

            <div className="grid gap-3 border bg-white p-3 md:grid-cols-[minmax(220px,420px)_1fr]">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="ຄົ້ນຫາຊື່ ຫຼື ເບີໂທ"
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-end text-sm text-slate-500">
                    {debtors.length.toLocaleString()} ລາຍການ
                </div>
            </div>

            <div className="overflow-hidden border bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                        <thead className="border-b bg-slate-50 text-left text-xs text-slate-500">
                            <tr>
                                <th className="px-4 py-3">ລູກຄ້າ</th>
                                <th className="px-4 py-3">ເບີໂທ</th>
                                <th className="px-4 py-3 text-right">ບິນຄ້າງ</th>
                                <th className="px-4 py-3 text-right">ໜີ້ຄົງເຫຼືອ</th>
                                <th className="px-4 py-3">ຄ້າງເກົ່າສຸດ</th>
                                <th className="px-4 py-3">ຊຳລະລ່າສຸດ</th>
                                <th className="px-4 py-3 text-right">ຈັດການ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {debtors.length === 0 ? (
                                <tr><td colSpan={7} className="p-10 text-center text-slate-400">ບໍ່ມີລູກໜີ້ຂອງທ່ານ</td></tr>
                            ) : (
                                debtors.map((debtor: any) => (
                                    <tr key={debtor._id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-semibold">{debtor.name}</td>
                                        <td className="px-4 py-3">{debtor.phone || "-"}</td>
                                        <td className="px-4 py-3 text-right">{(debtor.unpaidOrders || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-700">{formatCurrency(debtor.totalDebt)}</td>
                                        <td className="px-4 py-3">{debtor.oldestDebt ? format(new Date(debtor.oldestDebt), "dd/MM/yyyy") : "-"}</td>
                                        <td className="px-4 py-3">{debtor.lastPaymentDate ? format(new Date(debtor.lastPaymentDate), "dd/MM/yyyy HH:mm") : "-"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedCustomer(debtor)}>
                                                <Eye className="mr-1 h-4 w-4" />ເບິ່ງບິນ
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => {
                                                    setSelectedCustomer(debtor);
                                                    openPayModal();
                                                }}
                                            >
                                                <Wallet className="mr-1 h-4 w-4" />ຮັບຊຳລະ
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-sm">
                    <span>{debtorsResponse?.total || debtors.length} ລາຍການ</span>
                    <span className="text-slate-500">ສະແດງສະເພາະພະນັກງານ: {user?.username || "-"}</span>
                </div>
            </div>

            <Dialog open={!!selectedCustomer && !isGeneralPayOpen} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
                <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto font-lao">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between gap-3">
                            <span>{selectedCustomer?.name}</span>
                            <Badge variant="destructive" className="text-sm">ໜີ້ {formatCurrency(selectedCustomer?.totalDebt)}</Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-slate-500">
                            {selectedCustomer?.phone || "-"} · ສະແດງບິນຄ້າງ ແລະ ປະຫວັດຮັບຊຳລະຂອງພະນັກງານນີ້
                        </div>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => openPayModal()}
                        >
                            <DollarSign className="mr-2 h-4 w-4" />
                            ຊຳລະໜີ້ລວມ
                        </Button>
                    </div>

                    <Tabs defaultValue="bills" className="space-y-3">
                        <TabsList className="grid w-full grid-cols-2 md:w-[360px]">
                            <TabsTrigger value="bills">
                                <FileText className="mr-2 h-4 w-4" />
                                ບິນຄ້າງຊຳລະ
                            </TabsTrigger>
                            <TabsTrigger value="history">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                ປະຫວັດການຊຳລະ
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="bills">
                            <div className="overflow-x-auto border">
                                <table className="w-full min-w-[850px] text-sm">
                                    <thead className="bg-slate-50 text-left text-xs text-slate-500">
                                        <tr>
                                            <th className="p-3">ບິນ</th>
                                            <th className="p-3">ວັນທີ</th>
                                            <th className="p-3">ສະຖານະ</th>
                                            <th className="p-3 text-right">ຍອດບິນ</th>
                                            <th className="p-3 text-right">ຈ່າຍແລ້ວ</th>
                                            <th className="p-3 text-right">ຄົງເຫຼືອ</th>
                                            <th className="p-3 text-right">ຈັດການ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoadingOrders ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading...</td></tr>
                                        ) : !unpaidOrders || unpaidOrders.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">ບໍ່ມີບິນຄ້າງ</td></tr>
                                        ) : unpaidOrders.map((order: any) => (
                                            <tr key={order._id} className="hover:bg-slate-50">
                                                <td className="p-3 font-mono font-semibold">#{order.orderId}</td>
                                                <td className="whitespace-nowrap p-3">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</td>
                                                <td className="p-3">
                                                    <Badge variant={order.paymentStatus === "UNPAID" ? "destructive" : "secondary"}>
                                                        {order.paymentStatus === "UNPAID" ? "ຍັງບໍ່ຊຳລະ" : "ຊຳລະບາງສ່ວນ"}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-right">{formatCurrency(order.total)}</td>
                                                <td className="p-3 text-right text-emerald-700">{formatCurrency(order.paidAmount)}</td>
                                                <td className="p-3 text-right font-bold text-red-700">{formatCurrency(order.remainingAmount)}</td>
                                                <td className="p-3 text-right">
                                                    <Button size="sm" variant="ghost" onClick={() => setOrderToView(order)}>
                                                        <Eye className="mr-1 h-4 w-4" />ເບິ່ງ
                                                    </Button>
                                                    <Button size="sm" onClick={() => openPayModal(order)}>
                                                        <Wallet className="mr-1 h-4 w-4" />ຊຳລະ
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="history">
                            <div className="overflow-x-auto border">
                                <table className="w-full min-w-[900px] text-sm">
                                    <thead className="bg-slate-50 text-left text-xs text-slate-500">
                                        <tr>
                                            <th className="p-3">ວັນເວລາ</th>
                                            <th className="p-3">ໃບຮັບ</th>
                                            <th className="p-3">ບິນ</th>
                                            <th className="p-3">ຊ່ອງທາງ</th>
                                            <th className="p-3">ຜູ້ຮັບ</th>
                                            <th className="p-3 text-right">ຈຳນວນ</th>
                                            <th className="p-3 text-left">ໝາຍເຫດ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoadingHistory ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading...</td></tr>
                                        ) : !debtHistory || debtHistory.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">ຍັງບໍ່ມີປະຫວັດການຊຳລະ</td></tr>
                                        ) : debtHistory.map((transaction: any) => (
                                            <tr key={transaction._id} className="hover:bg-slate-50">
                                                <td className="whitespace-nowrap p-3">{format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}</td>
                                                <td className="p-3 font-mono">#{transaction.receiptNumber || transaction._id.slice(-8)}</td>
                                                <td className="p-3">{transaction.order?.orderId ? `#${transaction.order.orderId}` : "FIFO"}</td>
                                                <td className="p-3">
                                                    {transaction.paymentMethod === "CASH" ? "ເງິນສົດ" :
                                                        transaction.paymentMethod === "TRANSFER" ? "ໂອນເງິນ" :
                                                            transaction.paymentMethod === "MIXED" ? "ປະສົມ" : "-"}
                                                </td>
                                                <td className="p-3">{transaction.processedBy?.username || "-"}</td>
                                                <td className="p-3 text-right font-bold text-emerald-700">{formatCurrency(transaction.amount)}</td>
                                                <td className="p-3">{transaction.note || transaction.reference || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={isGeneralPayOpen} onOpenChange={setIsGeneralPayOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {selectedOrderToPay
                                ? `ຊຳລະບິນ #${selectedOrderToPay.orderId}`
                                : `ຊຳລະໜີ້ລວມ`}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Amount Due */}
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">ຍອດທີ່ຕ້ອງຊຳລະ:</span>
                                <span className="font-bold text-red-600 text-2xl font-mono">
                                    {formatCurrency(selectedOrderToPay?.remainingAmount || selectedCustomer?.totalDebt)}
                                </span>
                            </div>
                        </div>

                        {/* Payment Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-base">ຈຳນວນເງິນຊຳລະ *</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0"
                                className="text-2xl font-mono h-14"
                                autoFocus
                            />
                        </div>

                        {paymentMethod === "MIXED" && (
                            <div className="space-y-2">
                                <Label htmlFor="transferPortion">ຈຳນວນເງິນໂອນ (LAK) *</Label>
                                <Input id="transferPortion" type="number" value={transferPortion} onChange={(e) => setTransferPortion(e.target.value)} placeholder="0" />
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod" className="text-base">ວິທີການຊຳລະ *</Label>
                            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                <SelectTrigger className="h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4" />
                                            ເງິນສົດ (Cash)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="TRANSFER">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="w-4 h-4" />
                                            ໂອນເງິນ (Transfer)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="MIXED">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            ປະສົມ (Mixed)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reference (for Transfer) */}
                        {paymentMethod !== "CASH" && (
                            <div className="space-y-2">
                                <Label htmlFor="reference">ເລກອ້າງອິງ (Transaction ID)</Label>
                                <Input
                                    id="reference"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="ເລກ Transaction ໂອນເງິນ"
                                />
                            </div>
                        )}

                        {/* Note */}
                        <div className="space-y-2">
                            <Label htmlFor="note">ໝາຍເຫດ (Optional)</Label>
                            <Input
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="ໝາຍເຫດເພີ່ມເຕີມ..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsGeneralPayOpen(false);
                                setPaymentAmount("");
                                setReference("");
                                setTransferPortion("");
                                setNote("");
                                setPaymentMethod("CASH");
                            }}
                        >
                            ຍົກເລີກ
                        </Button>
                        <Button
                            onClick={handlePay}
                            disabled={payDebtMutation.isPending || !paymentAmount}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                        >
                            {payDebtMutation.isPending ? (
                                "ກຳລັງດຳເນີນການ..."
                            ) : (
                                <>
                                    <Receipt className="w-4 h-4 mr-2" />
                                    ຢືນຢັນການຊຳລະ
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Bill Details Modal */}
            <Dialog open={!!orderToView} onOpenChange={(open) => !open && setOrderToView(null)}>
                <DialogContent className="max-w-lg font-lao">
                    <DialogHeader>
                        <DialogTitle>ລາຍລະອຽດບິນ #{orderToView?.orderId}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto mt-2">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="text-left p-2">ສິນຄ້າ</th>
                                    <th className="text-right p-2">ຈຳນວນ</th>
                                    <th className="text-right p-2">ລາຄາ</th>
                                    <th className="text-right p-2">ລວມ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderToView?.items?.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b">
                                        <td className="p-2">{item.name}</td>
                                        <td className="text-right p-2">{item.quantity}</td>
                                        <td className="text-right p-2">{formatCurrency(item.price)}</td>
                                        <td className="text-right p-2 font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold">
                                <tr>
                                    <td colSpan={3} className="p-2 text-right">ລວມທັງໝົດ:</td>
                                    <td className="text-right p-2 text-lg">{formatCurrency(orderToView?.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button className="w-full" onClick={() => setOrderToView(null)}>ປິດ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
