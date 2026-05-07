import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getCustomers, getUnpaidOrders, getDebtHistory } from "@/api/pos";
import { payDebt, getCashierDebtSummary } from "@/api/debt";
import { Card, CardContent } from "@/components/ui/card";
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
    Clock,
    FileText,
    Eye,

    DollarSign,
    BarChart3
} from "lucide-react";
import { format } from "date-fns";

export default function DebtManager() {
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [selectedOrderToPay, setSelectedOrderToPay] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "MIXED">("CASH");
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [isGeneralPayOpen, setIsGeneralPayOpen] = useState(false);

    // Print States
    const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
    const [orderToView, setOrderToView] = useState<any>(null);

    const queryClient = useQueryClient();

    // Fetch Customers
    const { data: customers } = useQuery({
        queryKey: ['customers', search],
        queryFn: () => getCustomers(search)
    });

    const debtors = customers?.filter((c: any) => c.totalDebt > 0) || [];



    // Fetch Customer Details
    const { data: unpaidOrders, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['unpaid-orders', selectedCustomer?._id],
        queryFn: () => getUnpaidOrders(selectedCustomer._id),
        enabled: !!selectedCustomer
    });

    const { data: debtHistory, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['debt-history', selectedCustomer?._id],
        queryFn: () => getDebtHistory(selectedCustomer._id),
        enabled: !!selectedCustomer
    });

    const { data: cashierSummary } = useQuery({
        queryKey: ['cashier-debt-summary'],
        queryFn: () => getCashierDebtSummary()
    });

    const totalCollectedToday = cashierSummary?.summary?.reduce((sum: number, s: any) => sum + s.total, 0) || 0;

    // Payment Mutation
    const payDebtMutation = useMutation({
        mutationFn: (data: {
            customerId: string,
            amount: number,
            orderId?: string,
            paymentMethod: "CASH" | "TRANSFER" | "MIXED",
            reference?: string,
            note?: string
        }) => payDebt(data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
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

        const amt = parseFloat(paymentAmount);

        if (amt <= 0) {
            toast.error("ຈຳນວນເງິນຕ້ອງຫຼາຍກວ່າ 0");
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
            reference: reference || undefined,
            note: note || undefined
        });
    };

    const openPayModal = (order: any = null) => {
        setSelectedOrderToPay(order);
        setPaymentAmount(order ? order.remainingAmount.toString() : "");
        setPaymentMethod("CASH");
        setReference("");
        setNote("");
        setIsGeneralPayOpen(true);
    };

    const formatCurrency = (amount: number | undefined | null) => {
        const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
        return `${value.toLocaleString()}₭`;
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-6 font-lao bg-slate-50/50">
            {/* Print Component */}
            <PrintDebtReceipt data={receiptToPrint} clearData={() => setReceiptToPrint(null)} />

            {/* Header with Cashier Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-7 h-7 text-indigo-600" />
                        ຈັດການໃບບິນຕິດໜີ້
                    </h1>
                    <p className="text-slate-500 mt-1">ຕິດຕາມ ແລະ ຊຳລະໜີ້ລູກຄ້າ ແບບມືອາຊີບ</p>
                </div>

                <div className="flex gap-4">
                    <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-emerald-50/10 min-w-[200px]">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-emerald-600 font-medium whitespace-nowrap">ເກັບໜີ້ໄດ້ມື້ນີ້</p>
                                <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totalCollectedToday)}</p>
                            </div>
                            <Wallet className="w-8 h-8 text-emerald-600 opacity-20" />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex gap-6 h-[calc(100vh-200px)] overflow-hidden">
                {/* LEFT: Customer List */}
                <div className="w-1/3 flex flex-col space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">ລູກຄ້າຕິດໜີ້</h3>
                        <Badge variant="destructive">{debtors.length}</Badge>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="ຄົ້ນຫາຊື່..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {debtors.length === 0 ? (
                            <div className="text-center p-8 text-slate-400">
                                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>ບໍ່ພົບລູກຄ້າທີ່ຕິດໜີ້</p>
                            </div>
                        ) : (
                            debtors.map((debtor: any) => (
                                <div
                                    key={debtor._id}
                                    onClick={() => setSelectedCustomer(debtor)}
                                    className={cn(
                                        "p-4 rounded-xl cursor-pointer border transition-all hover:shadow-md",
                                        selectedCustomer?._id === debtor._id
                                            ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 shadow-md"
                                            : "bg-white border-slate-100 hover:border-indigo-200"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-800">{debtor.name}</h4>
                                            <p className="text-xs text-slate-500">{debtor.phone}</p>
                                        </div>
                                        <Badge variant="destructive" className="ml-2">
                                            {formatCurrency(debtor.totalDebt)}
                                        </Badge>
                                    </div>
                                    {debtor.lastPaymentDate && (
                                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                                            <Clock className="w-3 h-3" />
                                            ຊຳລະຄັ້ງສຸດທ້າຍ: {format(new Date(debtor.lastPaymentDate), "dd/MM/yyyy")}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Details Panel */}
                <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {!selectedCustomer ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <div className="p-6 bg-slate-50 rounded-full">
                                <Search className="h-12 w-12" />
                            </div>
                            <p className="text-lg">ເລືອກລູກຄ້າເພື່ອເບິ່ງລາຍລະອຽດ</p>
                        </div>
                    ) : (
                        <>
                            {/* Customer Header */}
                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedCustomer.name}</h2>
                                    <p className="text-slate-500">{selectedCustomer.phone}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Badge variant="destructive" className="text-lg px-3 py-1">
                                            ຍອດໜີ້: {formatCurrency(selectedCustomer.totalDebt)}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    size="lg"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => openPayModal()}
                                >
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    ຊຳລະໜີ້ລວມ
                                </Button>
                            </div>

                            {/* Tabs */}
                            <Tabs defaultValue="bills" className="flex-1 flex flex-col overflow-hidden">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="bills">
                                        <FileText className="w-4 h-4 mr-2" />
                                        ບິນຄ້າງຊຳລະ
                                    </TabsTrigger>
                                    <TabsTrigger value="history">
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        ປະຫວັດການຊຳລະ
                                    </TabsTrigger>
                                </TabsList>

                                {/* Unpaid Bills Tab */}
                                <TabsContent value="bills" className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                    {isLoadingOrders ? (
                                        <div className="text-center py-8">ກຳລັງໂຫຼດ...</div>
                                    ) : !unpaidOrders || unpaidOrders.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                            <p>ບໍ່ມີບິນຄ້າງຊຳລະ</p>
                                        </div>
                                    ) : (
                                        unpaidOrders.map((order: any) => (
                                            <Card key={order._id} className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">ບິນ #{order.orderId}</h4>
                                                            <p className="text-xs text-slate-500">
                                                                {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            variant={order.paymentStatus === "UNPAID" ? "destructive" : "secondary"}
                                                        >
                                                            {order.paymentStatus === "UNPAID" ? "ຍັງບໍ່ຊຳລະ" : "ຊຳລະບາງສ່ວນ"}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">ຍອດລວມ:</span>
                                                            <span className="font-semibold">{formatCurrency(order.total)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">ຊຳລະແລ້ວ:</span>
                                                            <span className="text-emerald-600 font-semibold">{formatCurrency(order.paidAmount)}</span>
                                                        </div>
                                                        <div className="flex justify-between col-span-2 pt-2 border-t">
                                                            <span className="text-slate-700 font-medium">ຄົງເຫຼືອ:</span>
                                                            <span className="text-red-600 font-bold text-lg">{formatCurrency(order.remainingAmount)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                                            onClick={() => openPayModal(order)}
                                                        >
                                                            <Wallet className="w-4 h-4 mr-2" />
                                                            ຊຳລະບິນນີ້
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setOrderToView(order)}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            ເບິ່ງ
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </TabsContent>

                                {/* Payment History Tab */}
                                <TabsContent value="history" className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                    {isLoadingHistory ? (
                                        <div className="text-center py-8">ກຳລັງໂຫຼດ...</div>
                                    ) : !debtHistory || debtHistory.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <Receipt className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                            <p>ຍັງບໍ່ມີປະຫວັດການຊຳລະ</p>
                                        </div>
                                    ) : (
                                        debtHistory.map((transaction: any) => (
                                            <Card key={transaction._id} className={cn(
                                                "border-l-4",
                                                transaction.type === "DEBIT" ? "border-l-emerald-500" : "border-l-red-500"
                                            )}>
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={transaction.type === "DEBIT" ? "default" : "destructive"}>
                                                                    {transaction.type === "DEBIT" ? "ຊຳລະ" : "ໜີ້ໃໝ່"}
                                                                </Badge>
                                                                {transaction.receiptNumber && (
                                                                    <span className="text-xs text-slate-500">
                                                                        #{transaction.receiptNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={cn(
                                                                "text-xl font-bold",
                                                                transaction.type === "DEBIT" ? "text-emerald-600" : "text-red-600"
                                                            )}>
                                                                {transaction.type === "DEBIT" ? "-" : "+"}{formatCurrency(transaction.amount)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {transaction.order && (
                                                        <div className="text-sm text-slate-600 mb-2">
                                                            <FileText className="w-3 h-3 inline mr-1" />
                                                            ບິນ #{transaction.order.orderId}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2">
                                                        {transaction.paymentMethod && (
                                                            <div className="flex items-center gap-1">
                                                                {transaction.paymentMethod === "CASH" ? (
                                                                    <Wallet className="w-3 h-3" />
                                                                ) : (
                                                                    <Smartphone className="w-3 h-3" />
                                                                )}
                                                                <span>
                                                                    {transaction.paymentMethod === "CASH" ? "ເງິນສົດ" :
                                                                        transaction.paymentMethod === "TRANSFER" ? "ໂອນເງິນ" :
                                                                            "ປະສົມ"}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {transaction.processedBy && (
                                                            <div className="flex items-center gap-1">
                                                                <span>ພະນັກງານ: {transaction.processedBy.username}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {transaction.note && (
                                                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded">
                                                            {transaction.note}
                                                        </p>
                                                    )}

                                                    <div className="flex justify-between text-xs mt-2 pt-2 border-t">
                                                        <span>ຍອດໜີ້ຫຼັງຊຳລະ:</span>
                                                        <span className={cn(
                                                            "font-semibold",
                                                            transaction.balanceAfter > 0 ? "text-red-600" : "text-emerald-600"
                                                        )}>
                                                            {formatCurrency(transaction.balanceAfter)}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </div>
            </div>

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
                        {paymentMethod === "TRANSFER" && (
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
