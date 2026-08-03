import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, CreditCard, Eye, History, Search, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { getUnpaidOrders } from "@/api/pos";
import { getExchangeRates, type ExchangeRate } from "@/api/exchangeRates";
import { getDebtHistory, getDebtors, getDebtTransactions, payDebt, type DebtorRow } from "@/api/debt";
import PrintDebtReceipt from "@/components/PrintDebtReceipt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Method = "CASH" | "TRANSFER" | "MIXED";
interface DebtOrder {
    _id: string;
    orderId: string;
    total: number;
    remainingAmount: number;
    payments?: Array<{
        currency: string;
        amount: number;
        rate: number;
        amountInLAK: number;
    }>;
    items?: Array<{
        product: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    saleMode?: "retail" | "wholesale";
    createdAt: string;
}
const money = (value?: number) => `${(value || 0).toLocaleString()} ₭`;
const methodLabel: Record<string, string> = { CASH: "ເງິນສົດ", TRANSFER: "ເງິນໂອນ", MIXED: "ປະສົມ" };
const apiError = (error: unknown) => {
    const candidate = error as { response?: { data?: { error?: string } }; message?: string };
    return candidate.response?.data?.error || candidate.message || "Request failed";
};

export default function ShopDebts() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState("customers");
    const [search, setSearch] = useState("");
    const [customerPage, setCustomerPage] = useState(1);
    const [transactionPage, setTransactionPage] = useState(1);
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [methodFilter, setMethodFilter] = useState("ALL");
    const [selectedCustomer, setSelectedCustomer] = useState<DebtorRow | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<DebtOrder | null>(null);
    const [payOpen, setPayOpen] = useState(false);
    const [method, setMethod] = useState<Method>("CASH");
    const [currency, setCurrency] = useState("LAK");
    const [cashAmount, setCashAmount] = useState(0);
    const [transferAmount, setTransferAmount] = useState(0);
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);

    const { data: ratesResponse } = useQuery({ queryKey: ["exchange-rates"], queryFn: getExchangeRates });
    const rates = (Array.isArray(ratesResponse?.data) ? ratesResponse.data : []) as ExchangeRate[];
    const rate = currency === "LAK" ? 1 : rates.find((item) => item.currency === currency)?.rate || 1;
    const sourceAmount = method === "CASH" ? cashAmount : method === "TRANSFER" ? transferAmount : cashAmount + transferAmount;
    const amountInLAK = Math.round(sourceAmount * rate);

    const { data: debtors, isLoading: loadingDebtors } = useQuery({
        queryKey: ["debtors", search, customerPage],
        queryFn: () => getDebtors({ search: search || undefined, page: customerPage, limit: 20 }),
        placeholderData: (previous) => previous,
    });

    const transactionParams = useMemo(() => ({
        startDate: new Date(`${startDate}T00:00:00`).toISOString(),
        endDate: new Date(`${endDate}T23:59:59.999`).toISOString(),
        paymentMethod: methodFilter === "ALL" ? undefined : methodFilter,
        page: transactionPage,
        limit: 20,
    }), [startDate, endDate, methodFilter, transactionPage]);
    const { data: transactions, isLoading: loadingTransactions } = useQuery({
        queryKey: ["debt-transactions", transactionParams],
        queryFn: () => getDebtTransactions(transactionParams),
        placeholderData: (previous) => previous,
    });

    const { data: unpaidResponse, isLoading: loadingOrders } = useQuery({
        queryKey: ["unpaid-orders", selectedCustomer?._id],
        queryFn: () => getUnpaidOrders(selectedCustomer!._id),
        enabled: !!selectedCustomer,
    });
    const unpaidOrders: DebtOrder[] = (Array.isArray(unpaidResponse) ? unpaidResponse : unpaidResponse?.data || []) as DebtOrder[];
    const { data: customerHistory = [], isLoading: loadingCustomerHistory } = useQuery({
        queryKey: ["debt-history", selectedCustomer?._id],
        queryFn: () => getDebtHistory(selectedCustomer!._id),
        enabled: !!selectedCustomer,
    });
    const repaymentHistory = useMemo(
        () => customerHistory.filter((transaction) => transaction.type === "DEBIT"),
        [customerHistory]
    );

    const resetPayment = () => {
        setPayOpen(false);
        setSelectedOrder(null);
        setCashAmount(0);
        setTransferAmount(0);
        setReference("");
        setNote("");
        setCurrency("LAK");
        setMethod("CASH");
    };

    const paymentMutation = useMutation({
        mutationFn: () => {
            if (!selectedCustomer) throw new Error("Customer is required");
            const paymentLines = [
                ...(method !== "TRANSFER" && cashAmount > 0 ? [{ method: "CASH" as const, currency, amount: cashAmount, rate, amountInLAK: Math.round(cashAmount * rate) }] : []),
                ...(method !== "CASH" && transferAmount > 0 ? [{ method: "TRANSFER" as const, currency, amount: transferAmount, rate, amountInLAK: Math.round(transferAmount * rate), reference }] : []),
            ];
            return payDebt({
                customerId: selectedCustomer._id,
                orderId: selectedOrder?.orderId,
                amount: amountInLAK,
                paymentMethod: method,
                reference: reference || undefined,
                note: note || undefined,
                payments: paymentLines,
            });
        },
        onSuccess: (result) => {
            setReceipt({
                receiptNumber: result.receiptNumber || result.transactionId,
                amount: amountInLAK,
                paymentMethod: method,
                reference,
                note,
                customer: selectedCustomer,
                order: selectedOrder,
                balanceBefore: selectedCustomer?.totalDebt || 0,
                balanceAfter: result.newDebt,
                createdAt: new Date().toISOString(),
            });
            setSelectedCustomer((customer) => customer ? { ...customer, totalDebt: result.newDebt } : customer);
            queryClient.invalidateQueries({ queryKey: ["debtors"] });
            queryClient.invalidateQueries({ queryKey: ["debt-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["debt-history", selectedCustomer?._id] });
            queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });
            resetPayment();
            toast.success("ຮັບຊຳລະໜີ້ສຳເລັດ");
        },
        onError: (error: unknown) => toast.error(apiError(error)),
    });

    const openPayment = (customer: DebtorRow, order?: DebtOrder) => {
        setSelectedCustomer(customer);
        setSelectedOrder(order || null);
        setCashAmount(0);
        setTransferAmount(0);
        setPayOpen(true);
    };

    const maxPayment = selectedOrder?.remainingAmount || selectedCustomer?.totalDebt || 0;
    const invalidPayment = amountInLAK <= 0 || amountInLAK > maxPayment || (method === "MIXED" && (cashAmount <= 0 || transferAmount <= 0)) || (method !== "CASH" && !reference.trim());

    return (
        <div className="min-h-screen space-y-4 bg-slate-50 p-4 font-lao md:p-6">
            <PrintDebtReceipt data={receipt} clearData={() => setReceipt(null)} />
            <div><h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><CreditCard className="h-5 w-5 text-amber-600" /> ຄຸ້ມຄອງໜີ້</h1><p className="mt-1 text-sm text-slate-500">ລູກໜີ້, ບິນຄ້າງ ແລະ ປະຫວັດຮັບເງິນ</p></div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="ລູກຄ້າຕິດໜີ້" value={(debtors?.summary.customers || 0).toLocaleString()} icon={Users} tone="red" /><Metric label="ໜີ້ຄົງເຫຼືອ" value={money(debtors?.summary.totalDebt)} icon={CreditCard} tone="yellow" /><Metric label="ຮັບຊຳລະຕາມຕົວກອງ" value={money(transactions?.analytics.total.totalAmount)} icon={Wallet} tone="green" /><Metric label="ຈຳນວນການຊຳລະ" value={(transactions?.analytics.total.count || 0).toLocaleString()} icon={History} tone="green" /></div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2 md:w-[360px]"><TabsTrigger value="customers">ລູກໜີ້</TabsTrigger><TabsTrigger value="transactions">ປະຫວັດຮັບຊຳລະ</TabsTrigger></TabsList>
                <TabsContent value="customers" className="space-y-3">
                    <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input className="bg-white pl-9" placeholder="ຄົ້ນຫາຊື່ ຫຼື ເບີໂທ" value={search} onChange={(event) => { setSearch(event.target.value); setCustomerPage(1); }} /></div>
                    <div className="overflow-hidden border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="border-b bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-4 py-3">ລູກຄ້າ</th><th className="px-4 py-3">ເບີໂທ</th><th className="px-4 py-3 text-right">ບິນຄ້າງ</th><th className="px-4 py-3 text-right">ໜີ້ຄົງເຫຼືອ</th><th className="px-4 py-3">ຄ້າງເກົ່າສຸດ</th><th className="px-4 py-3">ຊຳລະລ່າສຸດ</th><th className="px-4 py-3 text-right">ຈັດການ</th></tr></thead><tbody className="divide-y">{loadingDebtors ? <tr><td colSpan={7} className="p-10 text-center text-slate-400">Loading...</td></tr> : debtors?.data.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-slate-400">ບໍ່ມີລູກໜີ້</td></tr> : debtors?.data.map((customer) => <tr key={customer._id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{customer.name}</td><td className="px-4 py-3">{customer.phone}</td><td className="px-4 py-3 text-right">{customer.unpaidOrders}</td><td className="px-4 py-3 text-right font-bold text-red-700">{money(customer.totalDebt)}</td><td className="px-4 py-3">{customer.oldestDebt ? format(new Date(customer.oldestDebt), "dd/MM/yyyy") : "-"}</td><td className="px-4 py-3">{customer.lastPaymentDate ? format(new Date(customer.lastPaymentDate), "dd/MM/yyyy HH:mm") : "-"}</td><td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => setSelectedCustomer(customer)}><Eye className="mr-1 h-4 w-4" />ເບິ່ງບິນ</Button><Button size="sm" onClick={() => openPayment(customer)}><Wallet className="mr-1 h-4 w-4" />ຮັບຊຳລະ</Button></td></tr>)}</tbody></table></div><Pager page={customerPage} totalPages={debtors?.totalPages || 1} total={debtors?.total || 0} setPage={setCustomerPage} /></div>
                </TabsContent>
                <TabsContent value="transactions" className="space-y-3">
                    <div className="grid gap-3 bg-white p-3 md:grid-cols-[160px_160px_180px]"><Input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setTransactionPage(1); }} /><Input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setTransactionPage(1); }} /><Select value={methodFilter} onValueChange={(value) => { setMethodFilter(value); setTransactionPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">ທຸກຊ່ອງທາງ</SelectItem><SelectItem value="CASH">ເງິນສົດ</SelectItem><SelectItem value="TRANSFER">ເງິນໂອນ</SelectItem><SelectItem value="MIXED">ປະສົມ</SelectItem></SelectContent></Select></div>
                    <div className="overflow-hidden border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-sm"><thead className="border-b bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-4 py-3">ວັນເວລາ</th><th className="px-4 py-3">ເລກໃບຮັບ</th><th className="px-4 py-3">ລູກຄ້າ</th><th className="px-4 py-3">ບິນ</th><th className="px-4 py-3">ປະເພດການຂາຍ</th><th className="px-4 py-3">ຜູ້ຮັບເງິນ</th><th className="px-4 py-3">ລາຍລະອຽດການຈ່າຍ</th><th className="px-4 py-3 text-right">ລວມເປັນກີບ</th><th className="px-4 py-3">Reference</th></tr></thead><tbody className="divide-y">{loadingTransactions ? <tr><td colSpan={9} className="p-10 text-center text-slate-400">Loading...</td></tr> : transactions?.transactions.length === 0 ? <tr><td colSpan={9} className="p-10 text-center text-slate-400">ບໍ່ພົບລາຍການ</td></tr> : transactions?.transactions.map((transaction) => <tr key={transaction._id} className="hover:bg-slate-50"><td className="px-4 py-3 whitespace-nowrap">{format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}</td><td className="px-4 py-3 font-mono">#{transaction.receiptNumber || transaction._id.slice(-8)}</td><td className="px-4 py-3 font-medium">{transaction.customer?.name || "-"}</td><td className="px-4 py-3">{transaction.order?.orderId ? `#${transaction.order.orderId}` : "FIFO"}</td><td className="px-4 py-3">{transaction.order ? transaction.order.saleMode === "wholesale" ? "ຂາຍສົ່ງ" : transaction.order.saleMode === "retail" ? "ຂາຍຍ່ອຍ" : "ບໍ່ລະບຸ" : "-"}</td><td className="px-4 py-3">{transaction.processedBy?.username || "-"}</td><td className="px-4 py-3">{transaction.paymentBreakdown?.length ? transaction.paymentBreakdown.map((line, index) => <div key={index}>{methodLabel[line.method]}: {line.amount.toLocaleString()} {line.currency} × {line.rate.toLocaleString()}</div>) : methodLabel[transaction.paymentMethod || ""]}</td><td className="px-4 py-3 text-right font-bold text-emerald-700">{money(transaction.amount)}</td><td className="px-4 py-3">{transaction.reference || "-"}</td></tr>)}</tbody></table></div><Pager page={transactionPage} totalPages={transactions?.totalPages || 1} total={transactions?.total || 0} setPage={setTransactionPage} /></div>
                </TabsContent>
            </Tabs>

            <Dialog open={!!selectedCustomer && !payOpen} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
                <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedCustomer?.name}</DialogTitle>
                        <DialogDescription>ໜີ້ຄົງເຫຼືອ {money(selectedCustomer?.totalDebt)} · ສະແດງທັງບິນຄ້າງ ແລະ ການຊຳລະພາຍຫຼັງ</DialogDescription>
                    </DialogHeader>

                    <section className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-700">ບິນທີ່ຍັງຄ້າງ</h3>
                        <div className="overflow-x-auto border">
                            <table className="w-full min-w-[850px] text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-3 text-left">ບິນ</th>
                                        <th className="p-3 text-left">ວັນທີ</th>
                                        <th className="p-3 text-left">ປະເພດ</th>
                                        <th className="p-3 text-right">ຍອດບິນ</th>
                                        <th className="p-3 text-right">ຈ່າຍຕອນອອກບິນ</th>
                                        <th className="p-3 text-right">ຄົງເຫຼືອ</th>
                                        <th className="p-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingOrders ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading...</td></tr>
                                    ) : unpaidOrders.length === 0 ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">ບໍ່ມີບິນຄ້າງ</td></tr>
                                    ) : unpaidOrders.map((order) => {
                                        const paidAtCheckout = order.payments?.reduce((sum, payment) => sum + payment.amountInLAK, 0) || 0;
                                        return (
                                            <Fragment key={order._id}>
                                                <tr className="border-t">
                                                    <td className="p-3 font-mono">#{order.orderId}</td>
                                                    <td className="p-3">{format(new Date(order.createdAt), "dd/MM/yyyy")}</td>
                                                    <td className="p-3">{order.saleMode === "wholesale" ? "ຂາຍສົ່ງ" : order.saleMode === "retail" ? "ຂາຍຍ່ອຍ" : "ບໍ່ລະບຸ"}</td>
                                                    <td className="p-3 text-right">{money(order.total)}</td>
                                                    <td className="p-3 text-right text-emerald-700">{money(paidAtCheckout)}</td>
                                                    <td className="p-3 text-right font-bold text-red-700">{money(order.remainingAmount)}</td>
                                                    <td className="p-3 text-right"><Button size="sm" onClick={() => openPayment(selectedCustomer!, order)}>ຊຳລະບິນນີ້</Button></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={7} className="bg-slate-50/70 px-3 pb-3">
                                                        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                                                            <div className="grid grid-cols-[minmax(220px,1fr)_80px_130px_130px] gap-3 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                                                                <span>ສິນຄ້າໃນບິນ</span>
                                                                <span className="text-right">ຈຳນວນ</span>
                                                                <span className="text-right">ລາຄາ/ຊິ້ນ</span>
                                                                <span className="text-right">ລວມ</span>
                                                            </div>
                                                            {order.items?.length ? (
                                                                <div className="divide-y divide-slate-100">
                                                                    {order.items.map((item, index) => (
                                                                        <div
                                                                            key={`${order._id}-${item.product || index}`}
                                                                            className="grid grid-cols-[minmax(220px,1fr)_80px_130px_130px] gap-3 px-3 py-2 text-sm"
                                                                        >
                                                                            <span className="font-medium text-slate-700">{item.name}</span>
                                                                            <span className="text-right tabular-nums text-slate-600">{item.quantity.toLocaleString()}</span>
                                                                            <span className="text-right tabular-nums text-slate-600">{money(item.price)}</span>
                                                                            <span className="text-right font-semibold tabular-nums text-slate-800">{money(item.price * item.quantity)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="px-3 py-3 text-sm text-slate-400">ບິນເກົ່ານີ້ບໍ່ມີຂໍ້ມູນລາຍການສິນຄ້າ</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-700">ປະຫວັດຊຳລະພາຍຫຼັງ</h3>
                        <div className="overflow-x-auto border">
                            <table className="w-full min-w-[980px] text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-3 text-left">ວັນເວລາ</th>
                                        <th className="p-3 text-left">ໃບຮັບ</th>
                                        <th className="p-3 text-left">ບິນ</th>
                                        <th className="p-3 text-left">ຊ່ອງທາງ / ສະກຸນ</th>
                                        <th className="p-3 text-left">ຜູ້ຮັບ</th>
                                        <th className="p-3 text-right">ຈຳນວນ</th>
                                        <th className="p-3 text-left">ໝາຍເຫດ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingCustomerHistory ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading...</td></tr>
                                    ) : repaymentHistory.length === 0 ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">ຍັງບໍ່ມີການຊຳລະພາຍຫຼັງ</td></tr>
                                    ) : repaymentHistory.map((transaction) => (
                                        <tr key={transaction._id} className="border-t align-top">
                                            <td className="whitespace-nowrap p-3">{format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}</td>
                                            <td className="p-3 font-mono">#{transaction.receiptNumber || transaction._id.slice(-8)}</td>
                                            <td className="p-3">{transaction.order?.orderId ? `#${transaction.order.orderId}` : "FIFO"}</td>
                                            <td className="p-3">
                                                {transaction.paymentBreakdown?.length
                                                    ? transaction.paymentBreakdown.map((line, index) => <div key={`${transaction._id}-${index}`}>{methodLabel[line.method]} · {line.amount.toLocaleString()} {line.currency}</div>)
                                                    : methodLabel[transaction.paymentMethod || ""] || transaction.paymentMethod || "-"}
                                            </td>
                                            <td className="p-3">{transaction.processedBy?.username || "-"}</td>
                                            <td className="p-3 text-right font-bold text-emerald-700">{money(transaction.amount)}</td>
                                            <td className="p-3">{transaction.note || transaction.reference || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </DialogContent>
            </Dialog>

            <Dialog open={payOpen} onOpenChange={(open) => !open && resetPayment()}><DialogContent><DialogHeader><DialogTitle>ຮັບຊຳລະໜີ້ {selectedCustomer?.name}</DialogTitle><DialogDescription>{selectedOrder ? `ບິນ #${selectedOrder.orderId}` : "ຕັດຊຳລະບິນເກົ່າກ່ອນ (FIFO)"} · ສູງສຸດ {money(maxPayment)}</DialogDescription></DialogHeader><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><Label>ວິທີຊຳລະ</Label><Select value={method} onValueChange={(value: Method) => setMethod(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CASH">ເງິນສົດ</SelectItem><SelectItem value="TRANSFER">ເງິນໂອນ</SelectItem><SelectItem value="MIXED">ປະສົມ</SelectItem></SelectContent></Select></div><div><Label>ສະກຸນເງິນ</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LAK">LAK</SelectItem>{rates.filter((item) => !item.isBase).map((item) => <SelectItem key={item.currency} value={item.currency}>{item.currency} · rate {item.rate.toLocaleString()}</SelectItem>)}</SelectContent></Select></div></div>{method !== "TRANSFER" && <div><Label>ຈຳນວນເງິນສົດ ({currency})</Label><Input type="number" min={0} value={cashAmount} onChange={(event) => setCashAmount(Math.max(0, Number(event.target.value)))} /></div>}{method !== "CASH" && <div><Label>ຈຳນວນເງິນໂອນ ({currency})</Label><Input type="number" min={0} value={transferAmount} onChange={(event) => setTransferAmount(Math.max(0, Number(event.target.value)))} /></div>}{method !== "CASH" && <div><Label>Transfer reference *</Label><Input value={reference} onChange={(event) => setReference(event.target.value)} /></div>}<div className="flex justify-between border-y py-3"><span>ລວມເປັນກີບ</span><strong className={amountInLAK > maxPayment ? "text-red-700" : "text-emerald-700"}>{money(amountInLAK)}</strong></div><div><Label>ໝາຍເຫດ</Label><Input value={note} onChange={(event) => setNote(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={resetPayment}>ປິດ</Button><Button disabled={invalidPayment || paymentMutation.isPending} onClick={() => paymentMutation.mutate()}>ຢືນຢັນຮັບເງິນ</Button></DialogFooter></DialogContent></Dialog>
        </div>
    );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Users; tone: "green" | "red" | "yellow" }) { const colors = { green: "border-emerald-500 text-emerald-700", red: "border-red-500 text-red-700", yellow: "border-amber-500 text-amber-700" }; return <div className={`flex items-center justify-between border-l-4 bg-white p-4 ${colors[tone]}`}><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div><Icon className="h-5 w-5" /></div>; }
function Pager({ page, totalPages, total, setPage }: { page: number; totalPages: number; total: number; setPage: (page: number) => void }) { return <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-sm"><span>{total} ລາຍການ</span><div className="flex items-center gap-2"><Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button><span>{page} / {totalPages}</span><Button size="icon" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>; }
