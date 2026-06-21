import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, getUnpaidOrders } from "@/api/pos";
import { getDebtTransactions, payDebt } from "@/api/debt";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PrintDebtReceipt from "@/components/PrintDebtReceipt";
import {
    Search,
    CreditCard,
    Wallet,
    Smartphone,
    Receipt,
    Clock,
    Eye,
    DollarSign,
    Users,
    BarChart3,
    Download,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";

export default function ShopDebts() {
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [selectedOrderToPay, setSelectedOrderToPay] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "MIXED">("CASH");
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [isGeneralPayOpen, setIsGeneralPayOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Filters
    const [dateRange, setDateRange] = useState("30days");
    const [customDates, setCustomDates] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    const [paymentMethodFilter, _] = useState<string>("ALL");

    // Pagination States
    const [customerPage, setCustomerPage] = useState(1);
    const [transactionPage, setTransactionPage] = useState(1);
    const customersPerPage = 10;
    const transactionsPerPage = 15;

    // Print States
    const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
    const [orderToView, setOrderToView] = useState<any>(null);

    const queryClient = useQueryClient();

    // Get Date Range
    const getDates = () => {
        const end = new Date();
        let start = new Date();

        if (dateRange === 'custom') {
            return {
                startDate: customDates.start,
                endDate: customDates.end
            };
        }

        switch (dateRange) {
            case '7days':
                start = subDays(new Date(), 7);
                break;
            case '30days':
                start = subDays(new Date(), 30);
                break;
            case 'month':
                start = startOfMonth(new Date());
                break;
            default:
                start = subDays(new Date(), 30);
        }
        return {
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        };
    };

    const { startDate, endDate } = getDates();

    // Fetch Customers
    const { data: customers } = useQuery({
        queryKey: ['customers', search],
        queryFn: () => getCustomers(search)
    });

    const debtors = customers?.filter((c: any) => c.totalDebt > 0) || [];

    // Fetch Debt Transactions with Analytics
    const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
        queryKey: ['debt-transactions', startDate, endDate, paymentMethodFilter],
        queryFn: () => getDebtTransactions({
            startDate,
            endDate,
            paymentMethod: paymentMethodFilter === "ALL" ? undefined : paymentMethodFilter
        })
    });

    // Fetch Customer Details
    const { data: unpaidOrders, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['unpaid-orders', selectedCustomer?._id],
        queryFn: () => getUnpaidOrders(selectedCustomer._id),
        enabled: !!selectedCustomer
    });

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
            queryClient.invalidateQueries({ queryKey: ['debt-transactions'] });

            const receiptData = {
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

            toast.success("ຊຳລະໜີ້ສຳເລັດ", {
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

        if (selectedOrderToPay && amt > selectedOrderToPay.remainingAmount) {
            toast.error(`ຈຳນວນເງິນເກີນຍອດຄົງຄ້າງ`);
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

    const totalCollected = transactionsData?.analytics?.total?.totalAmount || 0;
    const totalTransactions = transactionsData?.analytics?.total?.count || 0;
    const totalDebt = debtors.reduce((sum: number, d: any) => sum + d.totalDebt, 0);

    // Pagination calculations
    const totalCustomerPages = Math.ceil(debtors.length / customersPerPage);
    const paginatedDebtors = debtors.slice(
        (customerPage - 1) * customersPerPage,
        customerPage * customersPerPage
    );

    const transactions = transactionsData?.transactions || [];
    const totalTransactionPages = Math.ceil(transactions.length / transactionsPerPage);
    const paginatedTransactions = transactions.slice(
        (transactionPage - 1) * transactionsPerPage,
        transactionPage * transactionsPerPage
    );

    return (
        <div className="min-h-screen flex flex-col p-4 space-y-4 font-lao bg-slate-50">
            {/* Print Component */}
            <PrintDebtReceipt data={receiptToPrint} clearData={() => setReceiptToPrint(null)} />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        ລະບົບຄຸ້ມຄອງໜີ້ສິນ
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Debt Management System</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => toast.info("Export feature coming soon")}
                >
                    <Download className="w-3 h-3" />
                    Export
                </Button>
            </div>

            {/* Analytics Cards - Compact */}
            <div className="grid grid-cols-4 gap-3">
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-500 rounded-lg">
                                <Users className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-red-600 font-medium">ລູກຄ້າຕິດໜີ້</p>
                                <p className="text-2xl font-bold text-red-700">{debtors.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-500 rounded-lg">
                                <DollarSign className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-amber-600 font-medium">ຍອດໜີ້ທັງໝົດ</p>
                                <p className="text-lg font-bold text-amber-700">
                                    {formatCurrency(totalDebt)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>


            </div>

            {/* Main Content */}
            <Card className="flex-1">
                <CardHeader className="bg-white p-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-9">
                            <TabsTrigger value="overview" className="gap-1 text-xs">
                                <Users className="w-3 h-3" />
                                ພາບລວມ
                            </TabsTrigger>
                            <TabsTrigger value="transactions" className="gap-1 text-xs">
                                <Receipt className="w-3 h-3" />
                                ປະຫວັດ
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="p-4">
                    <Tabs value={activeTab} className="w-full">
                        {/* Overview Tab */}
                        <TabsContent value="overview" className="mt-0 space-y-3">
                            <div className="flex gap-4">
                                {/* LEFT: Customer List */}
                                <div className="w-1/3 flex flex-col space-y-2 bg-slate-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center pb-2">
                                        <h3 className="font-semibold text-sm">ລູກຄ້າຕິດໜີ້</h3>
                                        <Badge variant="destructive" className="text-xs px-2">{debtors.length}</Badge>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
                                        <Input
                                            placeholder="ຄົ້ນຫາ..."
                                            className="pl-7 h-8 text-sm"
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setCustomerPage(1);
                                            }}
                                        />
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        {debtors.length === 0 ? (
                                            <div className="text-center p-8 text-slate-400">
                                                <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs">ບໍ່ພົບລູກຄ້າ</p>
                                            </div>
                                        ) : (
                                            paginatedDebtors.map((debtor: any) => (
                                                <div
                                                    key={debtor._id}
                                                    onClick={() => setSelectedCustomer(debtor)}
                                                    className={cn(
                                                        "p-2 rounded cursor-pointer transition-all text-sm",
                                                        selectedCustomer?._id === debtor._id
                                                            ? "bg-indigo-100"
                                                            : "bg-white hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-sm truncate">{debtor.name}</h4>
                                                            <p className="text-xs text-slate-500">{debtor.phone}</p>
                                                        </div>
                                                        <Badge variant="destructive" className="text-xs ml-2">
                                                            {formatCurrency(debtor.totalDebt)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Pagination Controls for Customers */}
                                    {debtors.length > 0 && totalCustomerPages > 1 && (
                                        <div className="flex items-center justify-between pt-3">
                                            <p className="text-sm text-slate-500">
                                                ໜ້າ {customerPage} ຈາກ {totalCustomerPages} ({debtors.length} ລູກຄ້າ)
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                                                    disabled={customerPage === 1}
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCustomerPage(p => Math.min(totalCustomerPages, p + 1))}
                                                    disabled={customerPage === totalCustomerPages}
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT: Customer Details */}
                                <div className="flex-1 bg-slate-50 p-3 rounded-lg overflow-hidden">
                                    {!selectedCustomer ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                            <Search className="h-10 w-10 mb-2" />
                                            <p className="text-sm">ເລືອກລູກຄ້າ</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center mb-3 pb-3">
                                                <div>
                                                    <h2 className="text-lg font-bold">{selectedCustomer.name}</h2>
                                                    <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                                                    <Badge variant="destructive" className="text-sm px-2 py-0.5 mt-1">
                                                        {formatCurrency(selectedCustomer.totalDebt)}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => openPayModal()}
                                                >
                                                    <DollarSign className="w-4 h-4 mr-1" />
                                                    ຊຳລະ
                                                </Button>
                                            </div>

                                            <div className="space-y-2 h-[550px] overflow-y-auto">
                                                <h3 className="font-semibold text-sm mb-2 sticky top-0 bg-white">ບິນຄ້າງຊຳລະ</h3>
                                                {isLoadingOrders ? (
                                                    <div className="text-center py-6 text-sm">ກຳລັງໂຫຼດ...</div>
                                                ) : !unpaidOrders || unpaidOrders.length === 0 ? (
                                                    <div className="text-center py-6 text-slate-400 text-sm">ບໍ່ມີບິນຄ້າງຊຳລະ</div>
                                                ) : (
                                                    unpaidOrders.map((order: any) => (
                                                        <Card key={order._id} className="border-l-2 border-l-red-500">
                                                            <CardContent className="p-2">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <h4 className="font-semibold text-sm">#{order.orderId}</h4>
                                                                        <p className="text-xs text-slate-500">
                                                                            {format(new Date(order.createdAt), "dd/MM/yy")}
                                                                        </p>
                                                                    </div>
                                                                    <Badge variant={order.paymentStatus === "UNPAID" ? "destructive" : "secondary"} className="text-xs">
                                                                        {order.paymentStatus === "UNPAID" ? "ຍັງບໍ່ຊຳລະ" : "ບາງສ່ວນ"}
                                                                    </Badge>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-500">ລວມ:</span>
                                                                        <span>{formatCurrency(order.total)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-500">ຊຳລະແລ້ວ:</span>
                                                                        <span className="text-emerald-600">{formatCurrency(order.paidAmount)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between col-span-2 pt-1 font-semibold text-sm">
                                                                        <span>ຄົງເຫຼື ອ:</span>
                                                                        <span className="text-red-600">{formatCurrency(order.remainingAmount)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        className="flex-1 bg-green-600 hover:bg-green-700 h-7 text-xs"
                                                                        onClick={() => openPayModal(order)}
                                                                    >
                                                                        <Wallet className="w-3 h-3 mr-1" />
                                                                        ຊຳລະ
                                                                    </Button>
                                                                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setOrderToView(order)}>
                                                                        <Eye className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TRANSACTIONS TAB */}
                        <TabsContent value="transactions" className="space-y-3 mt-0">
                            {/* Filters */}
                            <Card>
                                <CardContent className="p-3">
                                    <div className="grid grid-cols-4 gap-3">
                                        {/* Date Range */}
                                        <div className="space-y-1">
                                            <Label className="text-xs">ໄລຍະເວລາ</Label>
                                            <Select value={dateRange} onValueChange={(value) => {
                                                setDateRange(value);
                                                setTransactionPage(1);
                                            }}>
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="7days">7 ວັນ</SelectItem>
                                                    <SelectItem value="30days">30 ວັນ</SelectItem>
                                                    <SelectItem value="month">ເດືອນນີ້</SelectItem>
                                                    <SelectItem value="custom">ກຳນົດເອງ</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {dateRange === 'custom' && (
                                            <>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">ເລີ່ມຕົ້ນ</Label>
                                                    <Input
                                                        type="date"
                                                        className="h-8 text-sm"
                                                        value={customDates.start}
                                                        onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">ສິ້ນສຸດ</Label>
                                                    <Input
                                                        type="date"
                                                        className="h-8 text-sm"
                                                        value={customDates.end}
                                                        onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}

                    
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Transactions List */}
                            <Card>
                                <CardHeader className="bg-slate-50 p-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-sm">
                                                <Receipt className="w-4 h-4 text-emerald-600" />
                                                ປະຫວັດການຊຳລະ
                                            </CardTitle>
                                            <CardDescription className="mt-0.5 text-xs">
                                                {totalTransactions} ລາຍການ • {formatCurrency(totalCollected)}
                                            </CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Download className="w-4 h-4" />
                                            Export
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3">
                                    <div className="space-y-2 min-h-[350px]">
                                        {isLoadingTransactions ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                                                <p className="text-slate-500 text-xs">ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
                                            </div>
                                        ) : !transactions || transactions.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p className="text-sm font-medium">ບໍ່ມີຂໍ້ມູນການຊຳລະ</p>
                                                <p className="text-xs mt-0.5">ລອງປັບຕົວກອງເພື່ອຄົ້ນຫາ</p>
                                            </div>
                                        ) : (
                                            paginatedTransactions.map((transaction: any) => (
                                                <Card key={transaction._id} className="border-l-2 border-l-emerald-500">
                                                    <CardContent className="p-2">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Badge className="bg-emerald-600 text-white px-2 py-0 text-xs">
                                                                        #{transaction.receiptNumber || transaction._id.slice(-6)}
                                                                    </Badge>
                                                                    <span className="text-sm font-semibold text-slate-800">
                                                                        {transaction.customer?.name}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-slate-600 space-y-0.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                                        <span>{format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                                                    </div>
                                                                    {transaction.processedBy && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Users className="w-3 h-3 text-slate-400" />
                                                                            <span>ພະນັກງານ: <strong>{transaction.processedBy.username}</strong></span>
                                                                        </div>
                                                                    )}
                                                                    {transaction.paymentMethod && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            {transaction.paymentMethod === "CASH" ? (
                                                                                <Wallet className="w-3 h-3 text-green-600" />
                                                                            ) : (
                                                                                <Smartphone className="w-3 h-3 text-blue-600" />
                                                                            )}
                                                                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                                                {transaction.paymentMethod === "CASH" ? "ເງິນສົດ" :
                                                                                    transaction.paymentMethod === "TRANSFER" ? "ໂອນເງິນ" : "ປະສົມ"}
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-base font-bold text-emerald-600">
                                                                    {formatCurrency(transaction.amount)}
                                                                </p>
                                                                {transaction.order && (
                                                                    <p className="text-xs text-slate-500">#{transaction.order.orderId}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {transaction.note && (
                                                            <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-1 rounded">
                                                                {transaction.note}
                                                            </p>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>

                                    {/* Pagination Controls for Transactions */}
                                    {transactions.length > 0 && totalTransactionPages > 1 && (
                                        <div className="flex items-center justify-between pt-2 mt-2">
                                            <p className="text-xs text-slate-500">
                                                ໜ້າ {transactionPage}/{totalTransactionPages} ({transactions.length} ລາຍການ)
                                            </p>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
                                                    disabled={transactionPage === 1}
                                                >
                                                    <ChevronLeft className="w-3 h-3" />
                                                </Button>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({ length: Math.min(5, totalTransactionPages) }, (_, i) => {
                                                        const pageNum = i + 1;
                                                        return (
                                                            <Button
                                                                key={pageNum}
                                                                variant={transactionPage === pageNum ? "default" : "outline"}
                                                                size="sm"
                                                                className="h-7 w-7 p-0 text-xs"
                                                                onClick={() => setTransactionPage(pageNum)}
                                                            >
                                                                {pageNum}
                                                            </Button>
                                                        );
                                                    })}
                                                    {totalTransactionPages > 5 && <span className="text-slate-400 text-xs">...</span>}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => setTransactionPage(p => Math.min(totalTransactionPages, p + 1))}
                                                    disabled={transactionPage === totalTransactionPages}
                                                >
                                                    <ChevronRight className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                
                    </Tabs>
                </CardContent>
            </Card>

            {/* Payment Modal */}
            <Dialog open={isGeneralPayOpen} onOpenChange={setIsGeneralPayOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedOrderToPay ? `ຊຳລະບິນ #${selectedOrderToPay.orderId}` : `ຊຳລະໜີ້ລວມ`}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 py-3">
                        <div className="p-3 bg-red-50 rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-sm">ຍອດທີ່ຕ້ອງຊຳລະ:</span>
                                <span className="font-bold text-red-600 text-xl font-mono">
                                    {formatCurrency(selectedOrderToPay?.remainingAmount || selectedCustomer?.totalDebt)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="amount" className="text-xs">ຈຳນວນເງິນຊຳລະ *</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0"
                                className="text-lg font-mono h-10"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">ວິທີການຊຳລະ *</Label>
                            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4" />
                                            ເງິນສົດ
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="TRANSFER">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="w-4 h-4" />
                                            ໂອນເງິນ
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="MIXED">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            ປະສົມ
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentMethod === "TRANSFER" && (
                            <div className="space-y-1">
                                <Label htmlFor="reference" className="text-xs">ເລກອ້າງອິງ</Label>
                                <Input
                                    id="reference"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="Transaction ID"
                                    className="h-9"
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label htmlFor="note" className="text-xs">ໝາຍເຫດ</Label>
                            <Input
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="ໝາຍເຫດເພີ່ມເຕີມ..."
                                className="h-9"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsGeneralPayOpen(false)}>
                            ຍົກເລີກ
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePay}
                            disabled={payDebtMutation.isPending || !paymentAmount}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {payDebtMutation.isPending ? "ກຳລັງດຳເນີນການ..." : "ຢືນຢັນການຊຳລະ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Bill Modal */}
            <Dialog open={!!orderToView} onOpenChange={(open) => !open && setOrderToView(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base">ບິນ #{orderToView?.orderId}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="text-left p-1.5">ສິນຄ້າ</th>
                                    <th className="text-right p-1.5">ຈຳນວນ</th>
                                    <th className="text-right p-1.5">ລາຄາ</th>
                                    <th className="text-right p-1.5">ລວມ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderToView?.items?.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="p-1.5">{item.name}</td>
                                        <td className="text-right p-1.5">{item.quantity}</td>
                                        <td className="text-right p-1.5">{formatCurrency(item.price)}</td>
                                        <td className="text-right p-1.5">{formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold">
                                <tr>
                                    <td colSpan={3} className="p-1.5 text-right">ລວມ:</td>
                                    <td className="text-right p-1.5 text-sm">{formatCurrency(orderToView?.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button size="sm" onClick={() => setOrderToView(null)}>ປິດ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
