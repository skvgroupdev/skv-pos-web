import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getOrders, cancelOrder, addPaymentToOrder, addOrderNote
} from "@/api/pos";
import { getUsers } from "@/api/users";
import { getExchangeRates } from "@/api/exchangeRates";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Search, Printer, Ban, AlertCircle, Eye,
    RefreshCw, DollarSign,
    Clock, TrendingUp, ShoppingBag, CreditCard,
    FileText, History, MessageSquare, Wallet,
    Receipt, User, Tag, X,
    ChevronRight,
    ChevronLeft
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import PrintBill from "../pos/components/PrintBill";
import { toast } from "sonner";
import StatusBadge from "@/components/ui/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";


export default function ShopSales() {
    // --- State ---
    // Load from localStorage for persistence
    const [dateRange, setDateRange] = useState<{ from: string, to: string }>(() => {
        const saved = localStorage.getItem('sales-dateRange');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // ignore
            }
        }
        const today = new Date().toISOString().split('T')[0];
        return { from: today, to: today };
    });

    const [search, setSearch] = useState("");
    const [cashierId, setCashierId] = useState<string>(() => localStorage.getItem('sales-cashierId') || "ALL");
    const [status, setStatus] = useState<string>(() => localStorage.getItem('sales-status') || "ALL");
    const [paymentMethod, setPaymentMethod] = useState<string>(() => localStorage.getItem('sales-paymentMethod') || "ALL");

    const [page, setPage] = useState(1);
    const pageSize = 20;

    // Modals
    const [orderToPrint, setOrderToPrint] = useState<any>(null);
    const [orderToCancel, setOrderToCancel] = useState<any>(null);
    const [orderToView, setOrderToView] = useState<any>(null);
    const [orderToPayDebt, setOrderToPayDebt] = useState<any>(null);
    const [orderToAddNote, setOrderToAddNote] = useState<any>(null);
    const [orderPaymentHistory, setOrderPaymentHistory] = useState<any>(null);

    // Payment form state
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentCurrency, setPaymentCurrency] = useState("LAK");
    const [paymentNote, setPaymentNote] = useState("");
    const [noteText, setNoteText] = useState("");

    const queryClient = useQueryClient();

    // Persist filters to localStorage
    useEffect(() => {
        localStorage.setItem('sales-dateRange', JSON.stringify(dateRange));
    }, [dateRange]);

    useEffect(() => {
        localStorage.setItem('sales-cashierId', cashierId);
    }, [cashierId]);

    useEffect(() => {
        localStorage.setItem('sales-status', status);
    }, [status]);

    useEffect(() => {
        localStorage.setItem('sales-paymentMethod', paymentMethod);
    }, [paymentMethod]);

    // --- Queries ---

    // 1. Fetch Exchange Rates
    const { data: exchangeRatesResponse } = useQuery({
        queryKey: ['exchange-rates'],
        queryFn: getExchangeRates
    });
    const exchangeRates = exchangeRatesResponse?.data || [];

    // 2. Fetch Users (Cashiers)
    const { data: usersData } = useQuery({
        queryKey: ['users', 'all'],
        queryFn: () => getUsers(1, 100)
    });
    const cashiers = usersData?.data || [];

    // 3. Fetch Orders
    const queryParams = useMemo(() => {
        // Construct dates
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
        };
        if (cashierId && cashierId !== 'ALL') p.cashierId = cashierId;
        if (status && status !== 'ALL') p.paymentStatus = status;
        if (paymentMethod && paymentMethod !== 'ALL') p.paymentMethod = paymentMethod;

        return p;
    }, [page, search, dateRange, cashierId, status, paymentMethod]);

    const { data: ordersResponse, isLoading } = useQuery({
        queryKey: ['shop-orders', queryParams],
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
            queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
            queryClient.invalidateQueries({ queryKey: ['shop-summary'] });
            setOrderToCancel(null);
            toast.success("ຍົກເລີກບິນສຳເລັດແລ້ວ");
        },
        onError: (err: any) => {
            toast.error("ການຍົກເລີກລົ້ມແຫລວ: " + (err.response?.data?.error || err.message));
        }
    });

    const addPaymentMutation = useMutation({
        mutationFn: ({ orderId, payment }: any) => addPaymentToOrder(orderId, payment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
            queryClient.invalidateQueries({ queryKey: ['shop-summary'] });
            queryClient.invalidateQueries({ queryKey: ['customer-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['customer-debt-summary'] });
            setOrderToPayDebt(null);
            setPaymentAmount("");
            setPaymentCurrency("LAK");
            setPaymentNote("");
            toast.success("ຊຳລະເງິນສຳເລັດແລ້ວ");
        },
        onError: (err: any) => {
            toast.error("ການຊຳລະລົ້ມແຫລວ: " + (err.response?.data?.error || err.message));
        }
    });

    const addNoteMutation = useMutation({
        mutationFn: ({ orderId, note }: any) => addOrderNote(orderId, note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
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
        setCashierId("ALL");
        setStatus("ALL");
        setPaymentMethod("ALL");
        const today = new Date().toISOString().split('T')[0];
        setDateRange({ from: today, to: today });
        setPage(1);
        // Clear localStorage
        localStorage.removeItem('sales-dateRange');
        localStorage.removeItem('sales-cashierId');
        localStorage.removeItem('sales-status');
        localStorage.removeItem('sales-paymentMethod');
    };

    const handleAddPayment = () => {
        if (!orderToPayDebt) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("ກະລຸນາໃສ່ຈຳນວນເງິນທີ່ຖືກຕ້ອງ");
            return;
        }

        const rate = paymentCurrency === 'LAK' ? 1 :
            exchangeRates?.find((r: any) => r.currency === paymentCurrency)?.rate || 1;

        const amountInLAK = paymentCurrency === 'LAK' ? amount : Math.round(amount * rate);

        if (amountInLAK > orderToPayDebt.remainingAmount) {
            toast.error(`ຈຳນວນເງິນເກີນຍອດຄົງຄ້າງ (${formatCurrency(orderToPayDebt.remainingAmount)})`);
            return;
        }

        addPaymentMutation.mutate({
            orderId: orderToPayDebt._id,
            payment: {
                amount,
                currency: paymentCurrency,
                rate,
                note: paymentNote || undefined
            }
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

    // Calculate stats from filtered data (excluding cancelled)
    const stats = useMemo(() => {
        const activeOrders = orders.filter((o: any) => o.status !== 'CANCELLED');
        if (activeOrders.length === 0) {
            return {
                totalSales: 0,
                totalOrders: 0,
                totalDebt: 0,
                totalPaid: 0
            };
        }

        return {
            totalSales: activeOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
            totalOrders: activeOrders.length,
            totalDebt: activeOrders.reduce((sum: number, o: any) =>
                sum + (o.remainingAmount || 0), 0),
            totalPaid: activeOrders.reduce((sum: number, o: any) =>
                sum + (o.paidAmount || 0), 0)
        };
    }, [orders]);

    return (
        <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen font-lao">
            <PrintBill data={orderToPrint} clearData={() => setOrderToPrint(null)} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="w-7 h-7 text-indigo-600" />
                        ປະຫວັດການຂາຍ
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                        <RefreshCw className="w-4 h-4 mr-2" /> ລ້າງຄ່າ
                    </Button>
                </div>
            </div>

            {/* Stats Cards - Professional KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ຍອດຂາຍລວມ</p>
                                <p className="text-2xl font-bold text-indigo-600 mt-1">
                                    {formatCurrency(stats.totalSales)}
                                </p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-indigo-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ຈຳນວນບິນ</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">
                                    {stats.totalOrders.toLocaleString()}
                                </p>
                            </div>
                            <FileText className="w-10 h-10 text-blue-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ຊຳລະແລ້ວ</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">
                                    {formatCurrency(stats.totalPaid)}
                                </p>
                            </div>
                            <CreditCard className="w-10 h-10 text-emerald-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ຍອດໜີ້ຄົງຄ້າງ</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {formatCurrency(stats.totalDebt)}
                                </p>
                            </div>
                            <AlertCircle className="w-10 h-10 text-red-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="ຄົ້ນຫາເລກບິນ ຫຼື ຊື່ລູກຄ້າ..."
                        className="pl-9 bg-slate-50 border-slate-200"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                {/* Date Picker (Custom) */}
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        date={{
                            from: dateRange.from ? new Date(dateRange.from) : undefined,
                            to: dateRange.to ? new Date(dateRange.to) : undefined,
                        }}
                        onSelect={(range: any) => {
                            if (range?.from) {
                                setDateRange({
                                    from: format(range.from, "yyyy-MM-dd"),
                                    to: range.to ? format(range.to, "yyyy-MM-dd") : "",
                                });
                            } else {
                                setDateRange({ from: "", to: "" });
                            }
                        }}
                    />
                </div>

                {/* Cashier Filter */}
                <Select value={cashierId} onValueChange={setCashierId}>
                    <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200">
                        <SelectValue placeholder="ພະນັກງານ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">ທັງໝົດ</SelectItem>
                        {cashiers.map((c: any) => (
                            <SelectItem key={c._id} value={c._id}>
                                {c.username || c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200">
                        <SelectValue placeholder="ສະຖານະ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">ທັງໝົດ</SelectItem>
                        <SelectItem value="PAID">ຈ່າຍແລ້ວ</SelectItem>
                        <SelectItem value="UNPAID">ຕິດໜີ້</SelectItem>
                        <SelectItem value="PARTIAL">ຈ່າຍບາງສ່ວນ</SelectItem>
                    </SelectContent>
                </Select>

                {/* Payment Method Filter */}
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200">
                        <SelectValue placeholder="ການຊຳລະ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">ທັງໝົດ</SelectItem>
                        <SelectItem value="CASH">ເງິນສົດ</SelectItem>
                        <SelectItem value="TRANSFER">ໂອນ</SelectItem>
                        <SelectItem value="DEBT">ຕິດໜີ້</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">ID</th>
                                <th className="py-4 px-6">ວັນທີ</th>
                                <th className="py-4 px-6">ລູກຄ້າ</th>
                                <th className="py-4 px-6">ຜູ້ຂາຍ</th>
                                <th className="py-4 px-6 text-center">ລາຍການ</th>
                                <th className="py-4 px-6 text-right">ຍອດລວມ</th>
                                <th className="py-4 px-6 text-center">ຊ່ອງທາງ</th>
                                <th className="py-4 px-6 text-center">ສະຖານະ</th>
                                <th className="py-4 px-6 text-right">ຈັດການ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-slate-400">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                <Search className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p>ບໍ່ພົບລາຍການຂາຍ</p>
                                            <Button variant="link" onClick={resetFilters}>Reset Filters</Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order: any) => (
                                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6 font-mono font-bold text-indigo-600">
                                            #{order.orderId}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800">
                                                    {format(new Date(order.createdAt), "dd/MM/yyyy")}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {format(new Date(order.createdAt), "HH:mm")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-medium text-slate-700">
                                            {order.customerId?.name || "ລູກຄ້າທົ່ວໄປ"}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 text-xs">
                                            <div className="flex items-center gap-2">

                                                {order.cashierId?.username || "Staff"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center text-slate-600">
                                            {order.items?.length || 0}
                                        </td>
                                        <td className="py-4 px-6 text-right font-bold text-slate-800">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="py-4  text-center text">
                                            <StatusBadge status={order.paymentMethod} type="paymentMethod" />
                                        </td>
                                        <td className="py-4  text-center">
                                            <StatusBadge status={order.status === 'CANCELLED' ? 'CANCELLED' : order.paymentStatus} type="paymentStatus" />
                                        </td>
                                        <td className="py-4  text-right">
                                            <div className="flex justify-end gap-1">
                                                {/* View Details */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => setOrderToView(order)}
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {/* Payment History */}
                                                {order.payments && order.payments.length > 0 && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={() => setOrderPaymentHistory(order)}
                                                        title="Payment History"
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Pay Debt */}
                                                {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                        onClick={() => setOrderToPayDebt(order)}
                                                        title="Pay Debt"
                                                    >
                                                        <Wallet className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Add Note */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                                                    onClick={() => setOrderToAddNote(order)}
                                                    title="Add Note"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>

                                                {/* Print */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                                                    onClick={() => setOrderToPrint(order)}
                                                    title="Reprint Bill"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>

                                                {/* Cancel */}
                                                {order.status !== 'CANCELLED' && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => setOrderToCancel(order)}
                                                        title="Cancel Order"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t p-4 flex items-center justify-between bg-slate-50">
                    <p className="text-xs text-slate-500">
                        ສະແດງ {orders.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, totalItems)} ຈາກ {totalItems} ລາຍການ
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="bg-white"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center px-4 text-sm font-medium text-slate-600">
                            ໜ້າ {page} ຈາກ {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="bg-white"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- Modals (Copied/Refined from BillManager.tsx) --- */}

            {/* View Details Dialog - Professional */}
            <Dialog open={!!orderToView} onOpenChange={(open) => !open && setOrderToView(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] font-lao overflow-hidden flex flex-col">
                    <DialogHeader className="border-b pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <Receipt className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-slate-900">
                                        ບິນເລກທີ #{orderToView?.orderId}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm mt-1">
                                        {orderToView && format(new Date(orderToView.createdAt), "EEEE, dd MMMM yyyy · HH:mm")}
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="text-right">
                                <StatusBadge status={orderToView?.status === 'CANCELLED' ? 'CANCELLED' : orderToView?.paymentStatus} type="paymentStatus" />
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-6 space-y-6">
                        {/* Customer & Staff Info Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="border-indigo-100 bg-indigo-50/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <User className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-0.5">ລູກຄ້າ (Customer)</p>
                                            <p className="font-bold text-slate-900">{orderToView?.customerId?.name || "ລູກຄ້າທົ່ວໄປ"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-100 bg-blue-50/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-0.5">ພະນັກງານ (Staff)</p>
                                            <p className="font-bold text-slate-900">{orderToView?.cashierId?.username || "Staff"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Items Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <ShoppingBag className="h-5 w-5 text-slate-400" />
                                <h3 className="font-bold text-slate-900">ລາຍການສິນຄ້າ ({orderToView?.items?.length || 0})</h3>
                            </div>
                            <Card>
                                <div className="divide-y">
                                    {orderToView?.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-900">{item.name}</p>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-xs">ລາຄາ:</span>
                                                            <span className="font-mono font-medium">{item.price.toLocaleString()} ₭</span>
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-xs">x</span>
                                                            <span className="font-bold text-indigo-600">{item.quantity}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-slate-900">{(item.price * item.quantity).toLocaleString()} ₭</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Summary Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="h-5 w-5 text-slate-400" />
                                <h3 className="font-bold text-slate-900">ສະຫຼຸບຍອດ</h3>
                            </div>
                            <Card className="border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">ລວມຍອດສິນຄ້າ (Subtotal)</span>
                                        <span className="font-mono font-bold text-slate-800">
                                            {(orderToView?.items?.reduce((a: any, b: any) => a + (b.price * b.quantity), 0) || 0).toLocaleString()} ₭
                                        </span>
                                    </div>

                                    {orderToView?.discount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-red-600 flex items-center gap-1">
                                                <Tag className="h-3.5 w-3.5" />
                                                ສ່ວນຫຼຸດ (Discount)
                                            </span>
                                            <span className="font-mono font-bold text-red-600">
                                                -{orderToView.discount.toLocaleString()} ₭
                                            </span>
                                        </div>
                                    )}

                                    <div className="border-t-2 border-dashed border-indigo-200 pt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-slate-900">ຍອດລວມທັງໝົດ (Total)</span>
                                            <span className="text-2xl font-black text-indigo-600 font-mono">
                                                {orderToView?.total.toLocaleString()} ₭
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">ຊຳລະແລ້ວ (Paid)</span>
                                            <span className="font-mono font-bold text-emerald-600">
                                                {orderToView?.paidAmount?.toLocaleString() || 0} ₭
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">ຄົງຄ້າງ (Remaining)</span>
                                            <span className="font-mono font-bold text-red-600">
                                                {orderToView?.remainingAmount?.toLocaleString() || 0} ₭
                                            </span>
                                        </div>
                                    </div>

                                    {orderToView?.change > 0 && (
                                        <div className="bg-emerald-100 border border-emerald-200 p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-emerald-900">ເງິນທອນ (Change)</span>
                                                <span className="font-mono font-black text-emerald-700 text-lg">
                                                    {orderToView.change.toLocaleString()} ₭
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet className="h-5 w-5 text-slate-400" />
                                <h3 className="font-bold text-slate-900">ວິທີການຊຳລະ</h3>
                            </div>
                            <Card className="border-slate-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">ຊ່ອງທາງຊຳລະ (Payment Method)</span>
                                        <StatusBadge status={orderToView?.paymentMethod} type="paymentMethod" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment History if exists */}
                        {orderToView?.payments && orderToView.payments.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <History className="h-5 w-5 text-slate-400" />
                                    <h3 className="font-bold text-slate-900">ປະຫວັດການຊຳລະ ({orderToView.payments.length})</h3>
                                </div>
                                <Card>
                                    <div className="divide-y">
                                        {orderToView.payments.map((p: any, idx: number) => (
                                            <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                            <span className="font-bold text-emerald-700 text-sm">
                                                                {p.currency === 'LAK' ? '₭' : p.currency[0]}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">
                                                                {p.amount.toLocaleString()} {p.currency}
                                                            </p>
                                                            {p.currency !== 'LAK' && (
                                                                <p className="text-xs text-slate-500">
                                                                    Rate: 1 {p.currency} = {p.rate.toLocaleString()} ₭
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-mono font-bold text-emerald-600">
                                                            {p.amountInLAK.toLocaleString()} ₭
                                                        </p>
                                                        <p className="text-xs text-slate-400">Payment #{idx + 1}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t pt-4 flex-row gap-2">
                        <Button variant="outline" onClick={() => setOrderToView(null)} className="flex-1">
                            <X className="w-4 h-4 mr-2" /> ປິດ
                        </Button>
                        <Button onClick={() => {
                            setOrderToPrint(orderToView);
                            setOrderToView(null);
                        }} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                            <Printer className="w-4 h-4 mr-2" /> ພິມບິນ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
                <DialogContent className="font-lao">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            ຍົກເລີກບິນຂາຍ
                        </DialogTitle>
                        <DialogDescription>
                            ທ່ານຕ້ອງການຍົກເລີກບິນ <strong>#{orderToCancel?.orderId}</strong>
                            <br />
                            ການກະທຳນີ້ຈະມີຜົນດັ່ງນີ້:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-600 space-y-2">
                        <div className="flex items-start gap-2">
                            <RefreshCw className="w-4 h-4 text-slate-400 mt-0.5" />
                            <p>ຄືນສິນຄ້າເຂົ້າຄັງຈຳນວນ <strong>{orderToCancel?.items?.length} ລາຍການ</strong></p>
                        </div>
                        <div className="flex items-start gap-2">
                            <Ban className="w-4 h-4 text-slate-400 mt-0.5" />
                            <p>ລົບຍອດຂາຍ <strong>{orderToCancel?.total.toLocaleString()} ກີບ</strong> ອອກຈາກລາຍງານ</p>
                        </div>
                        {orderToCancel?.paymentMethod === 'DEBT' && (
                            <div className="flex items-start gap-2">
                                <DollarSign className="w-4 h-4 text-slate-400 mt-0.5" />
                                <p>ລົບຍອດໜີ້ຄ້າງຊຳລະຂອງລູກຄ້າອອກ</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrderToCancel(null)}>ຍົກເລີກ</Button>
                        <Button
                            variant="destructive"
                            onClick={() => cancelMutation.mutate(orderToCancel._id)}
                            disabled={cancelMutation.isPending}
                        >
                            {cancelMutation.isPending ? "ກຳລັງຍົກເລີກ..." : "ຢືນຢັນຍົກເລີກ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pay Debt Dialog - Professional */}
            <Dialog open={!!orderToPayDebt} onOpenChange={(open) => !open && setOrderToPayDebt(null)}>
                <DialogContent className="max-w-md font-lao">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <Wallet className="h-5 w-5" />
                            ຊຳລະໜີ້ (Pay Debt)
                        </DialogTitle>
                        <DialogDescription>
                            ບິນ #{orderToPayDebt?.orderId} - {orderToPayDebt?.customerId?.name || "ລູກຄ້າທົ່ວໄປ"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Order Summary */}
                        <div className="bg-slate-50 p-4 rounded-lg border space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">ຍອດລວມບິນ:</span>
                                <span className="font-bold">{formatCurrency(orderToPayDebt?.total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">ຊຳລະແລ້ວ:</span>
                                <span className="text-emerald-600 font-bold">{formatCurrency(orderToPayDebt?.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="font-semibold text-slate-700">ຄົງຄ້າງ:</span>
                                <span className="font-bold text-red-600 text-lg">{formatCurrency(orderToPayDebt?.remainingAmount)}</span>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="paymentAmount">ຈຳນວນເງິນຊຳລະ *</Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    placeholder="0"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="mt-1"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <Label htmlFor="paymentCurrency">ສະກຸນເງິນ</Label>
                                <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
                                    <SelectTrigger id="paymentCurrency" className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LAK">₭ LAK (ກີບ)</SelectItem>
                                        {exchangeRates?.map((rate: any) => (
                                            <SelectItem key={rate.currency} value={rate.currency}>
                                                {rate.currency} (1 = {rate.rate.toLocaleString()} ₭)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {paymentCurrency !== 'LAK' && paymentAmount && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm">
                                    <p className="text-blue-800">
                                        = <strong>{formatCurrency(
                                            parseFloat(paymentAmount) *
                                            (exchangeRates?.find((r: any) => r.currency === paymentCurrency)?.rate || 1)
                                        )}</strong>
                                    </p>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="paymentNote">ໝາຍເຫດ (ທາງເລືອກ)</Label>
                                <Textarea
                                    id="paymentNote"
                                    placeholder="ເພີ່ມໝາຍເຫດສຳລັບການຊຳລະນີ້..."
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    className="mt-1"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrderToPayDebt(null)}>ຍົກເລີກ</Button>
                        <Button
                            onClick={handleAddPayment}
                            disabled={addPaymentMutation.isPending || !paymentAmount}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {addPaymentMutation.isPending ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກການຊຳລະ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment History Dialog */}
            <Dialog open={!!orderPaymentHistory} onOpenChange={(open) => !open && setOrderPaymentHistory(null)}>
                <DialogContent className="max-w-2xl font-lao">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-blue-600" />
                            ປະຫວັດການຊຳລະ (Payment History)
                        </DialogTitle>
                        <DialogDescription>
                            ບິນ #{orderPaymentHistory?.orderId}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-slate-500 mb-1">ຍອດລວມ</p>
                                    <p className="text-xl font-bold">{formatCurrency(orderPaymentHistory?.total)}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-emerald-200 bg-emerald-50">
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-emerald-600 mb-1">ຊຳລະແລ້ວ</p>
                                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(orderPaymentHistory?.paidAmount)}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-red-200 bg-red-50">
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-red-600 mb-1">ຄົງຄ້າງ</p>
                                    <p className="text-xl font-bold text-red-700">{formatCurrency(orderPaymentHistory?.remainingAmount)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Timeline */}
                        <div className="border rounded-lg">
                            <div className="bg-slate-50 px-4 py-3 border-b">
                                <h4 className="font-semibold text-sm">รายการการຊຳລະ</h4>
                            </div>
                            <div className="divide-y max-h-[400px] overflow-y-auto">
                                {orderPaymentHistory?.payments?.map((payment: any, idx: number) => (
                                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <CreditCard className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {payment.amount.toLocaleString()} {payment.currency}
                                                    </p>
                                                    {payment.currency !== 'LAK' && (
                                                        <p className="text-xs text-slate-500">
                                                            ອັດຕາ: 1 {payment.currency} = {payment.rate.toLocaleString()} ₭
                                                        </p>
                                                    )}
                                                    {payment.note && (
                                                        <p className="text-sm text-slate-600 mt-1">{payment.note}</p>
                                                    )}
                                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {payment.paidAt ? format(new Date(payment.paidAt), "dd/MM/yyyy HH:mm") :
                                                            format(new Date(orderPaymentHistory.createdAt), "dd/MM/yyyy HH:mm")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-600">
                                                    {formatCurrency(payment.amountInLAK)}
                                                </p>
                                                <Badge variant="outline" className="mt-1 text-xs">
                                                    #{idx + 1}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!orderPaymentHistory?.payments || orderPaymentHistory.payments.length === 0) && (
                                    <div className="p-8 text-center text-slate-400">
                                        ບໍ່ມີປະຫວັດການຊຳລະ
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setOrderPaymentHistory(null)}>ປິດ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Note Dialog */}
            <Dialog open={!!orderToAddNote} onOpenChange={(open) => !open && setOrderToAddNote(null)}>
                <DialogContent className="max-w-md font-lao">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-purple-600">
                            <MessageSquare className="h-5 w-5" />
                            ເພີ່ມໝາຍເຫດ (Add Note)
                        </DialogTitle>
                        <DialogDescription>
                            ບິນ #{orderToAddNote?.orderId}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Existing Notes */}
                        {orderToAddNote?.notes && orderToAddNote.notes.length > 0 && (
                            <div className="border rounded-lg p-3 bg-slate-50 max-h-[200px] overflow-y-auto space-y-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase">ໝາຍເຫດເກົ່າ:</p>
                                {orderToAddNote.notes.map((note: any, idx: number) => (
                                    <div key={idx} className="bg-white p-2 rounded border text-sm">
                                        <p className="text-slate-700">{note.text}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {note.createdBy} - {format(new Date(note.createdAt), "dd/MM/yyyy HH:mm")}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New Note Input */}
                        <div>
                            <Label htmlFor="noteText">ໝາຍເຫດໃໝ່ *</Label>
                            <Textarea
                                id="noteText"
                                placeholder="ໃສ່ໝາຍເຫດສຳລັບບິນນີ້..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="mt-1"
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrderToAddNote(null)}>ຍົກເລີກ</Button>
                        <Button
                            onClick={handleAddNote}
                            disabled={addNoteMutation.isPending || !noteText.trim()}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {addNoteMutation.isPending ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກໝາຍເຫດ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Missing icon import hack (DollarSign used in Cancel modal but not imported)
// I will add it to the imports
