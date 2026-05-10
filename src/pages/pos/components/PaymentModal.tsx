import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, createCustomer, getCustomers, type Customer } from "@/api/pos";
import { User, Plus, Search, Wallet, Smartphone, CreditCard, X, Loader2, Trash2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenant } from "@/api/tenants";
import PrintBill from "./PrintBill";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePOSStore } from "@/store/usePOSStore";
import type { BillPrintData } from "./bill-templates/billPrintUtils";

import { type Cart } from "@/api/cart";

interface PaymentEntry {
    currency: string;
    amount: number;
    rate: number;
    amountInLAK: number;
}

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    totalAmount: number; // In LAK
    cart: Cart;
}

type PaymentMethod = "CASH" | "TRANSFER" | "DEBT";

const getPaymentErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { data?: { error?: string } } }).response;
        return response?.data?.error || fallback;
    }

    if (error instanceof Error) return error.message;

    return fallback;
};

export function PaymentModal({ open, onClose, totalAmount, cart }: PaymentModalProps) {
    const { exchangeRates } = usePOSStore();

    // Fetch Tenant Info
    const { data: tenant } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });

    const [selectedTab, setSelectedTab] = useState<PaymentMethod>("CASH");
    const [payments, setPayments] = useState<PaymentEntry[]>([]);
    const [discount, setDiscount] = useState("0");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [orderToPrint, setOrderToPrint] = useState<BillPrintData | null>(null);

    // UI Helpers for adding a new payment
    const [currentPayCurrency, setCurrentPayCurrency] = useState("LAK");
    const [currentPayAmount, setCurrentPayAmount] = useState("");

    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    const queryClient = useQueryClient();
    const { data: customers } = useQuery<Customer[]>({
        queryKey: ['customers', customerSearch],
        queryFn: () => getCustomers(customerSearch) as Promise<Customer[]>,
        enabled: open && (selectedTab === 'DEBT' || !!customerSearch)
    });

    const createOrderMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: (newOrder) => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['carts'] });
            if (newOrder) {
                setOrderToPrint(newOrder as BillPrintData);
            }
            toast.success("Payment Successful!");
        },
        onError: (error: unknown) => {
            toast.error("Payment Failed: " + getPaymentErrorMessage(error, "Failed to create order"));
        }
    });

    const createCustomerMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: (newCustomer) => {
            setSelectedCustomer(newCustomer);
            setIsCreatingCustomer(false);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success("Customer created!");
        },
        onError: (error: unknown) => {
            toast.error("Failed to create customer: " + getPaymentErrorMessage(error, "Failed to create customer"));
        }
    });

    useEffect(() => {
        if (!open) return;

        const resetTimer = window.setTimeout(() => {
            setPayments([]);
            setSelectedTab("CASH");
            setSelectedCustomer(cart?.customer || null);
            setIsCreatingCustomer(false);
            setDiscount("0");
            setCurrentPayCurrency("LAK");
            setCurrentPayAmount("");
        }, 0);

        return () => window.clearTimeout(resetTimer);
    }, [open, cart]);

    const numDiscount = parseFloat(discount.replace(/,/g, '')) || 0;
    const finalTotal = Math.max(0, totalAmount - numDiscount);

    // Calc total paid in LAK
    const totalPaidInLAK = payments.reduce((sum, p) => sum + p.amountInLAK, 0);
    const balanceRemaining = Math.max(0, finalTotal - totalPaidInLAK);
    const change = Math.max(0, totalPaidInLAK - finalTotal);

    const handleAddPayment = () => {
        const amt = parseFloat(currentPayAmount.replace(/,/g, '')) || 0;
        if (amt <= 0) return;

        const rateObj = exchangeRates.find(r => r.currency === currentPayCurrency);
        const rate = rateObj?.rate || 1;
        const amountInLAK = currentPayCurrency === 'LAK' ? amt : Math.round(amt * rate);

        setPayments(prev => [
            ...prev,
            { currency: currentPayCurrency, amount: amt, rate, amountInLAK }
        ]);
        setCurrentPayAmount("");
    };

    const handleRemovePayment = (index: number) => {
        setPayments(prev => prev.filter((_, i) => i !== index));
    };

    const handlePayment = () => {
        if (!cart || !cart.items.length) return;

        const orderData = {
            cartId: cart._id,
            paymentMethod: selectedTab,
            discount: numDiscount,
            payments: payments.length > 0 ? payments : [
                { currency: 'LAK', amount: totalPaidInLAK, rate: 1, amountInLAK: totalPaidInLAK }
            ],
            exchangeRates: exchangeRates.map(r => ({ currency: r.currency, rate: r.rate })),
            customerId: selectedCustomer?._id,
            paidAmount: totalPaidInLAK
        };

        if (selectedTab === 'DEBT' && !selectedCustomer) {
            toast.error("Please select or create a customer for Debt payment.");
            return;
        }

        if (selectedTab !== 'DEBT' && totalPaidInLAK < finalTotal) {
            toast.error("Insufficient payment amount.");
            return;
        }

        createOrderMutation.mutate(orderData);
    };

    return (
        <>
            <PrintBill data={orderToPrint} clearData={() => setOrderToPrint(null)} />
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="flex h-[92vh] w-[min(1120px,calc(100vw-24px))] max-w-none flex-col gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0 font-lao shadow-2xl [&>button.absolute]:hidden">
                    <div className="z-20 shrink-0 border-b border-slate-200 bg-white px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black text-slate-950">ຊຳລະເງິນ</DialogTitle>
                                    <p className="mt-0.5 text-xs font-medium text-slate-500">ກວດຍອດ ແລະ ຮັບເງິນໃຫ້ຄົບກ່ອນປິດບິນ</p>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={onClose} className="h-9 w-9 rounded-lg p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_1fr_1fr]">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ສ່ວນຫຼຸດ</Label>
                                <Input
                                    value={discount}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/,/g, '');
                                        if (!isNaN(Number(val))) setDiscount(Number(val).toLocaleString());
                                    }}
                                    className="mt-1 h-9 border-slate-200 bg-white text-right font-mono text-lg font-bold"
                                    placeholder="0"
                                />
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ຍອດບິນ</p>
                                <p className="font-mono text-lg font-black text-slate-700">{totalAmount.toLocaleString()} ₭</p>
                                {numDiscount > 0 && <p className="mt-0.5 text-xs font-semibold text-red-500">-{numDiscount.toLocaleString()} ₭</p>}
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">ຍອດຕ້ອງຊຳລະ</p>
                                <p className="font-mono text-2xl font-black text-emerald-700">{finalTotal.toLocaleString()}</p>
                            </div>
                            <div className={cn(
                                "rounded-lg border p-3 text-right",
                                balanceRemaining > 0 ? "border-red-200 bg-red-50" : "border-sky-200 bg-sky-50"
                            )}>
                                <p className={cn("text-[10px] font-bold uppercase tracking-wide", balanceRemaining > 0 ? "text-red-600" : "text-sky-600")}>
                                    {balanceRemaining > 0 ? "ຍັງຂາດ" : "ເງິນທອນ"}
                                </p>
                                {balanceRemaining > 0 ? (
                                    <p className="font-mono text-2xl font-black text-red-600">{balanceRemaining.toLocaleString()}</p>
                                ) : (
                                    <p className="font-mono text-2xl font-black text-sky-700">{change.toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
                        <div className="min-h-0 overflow-y-auto bg-slate-50 p-4">
                            <Tabs
                                value={selectedTab}
                                onValueChange={(v) => {
                                    const hasPermission = tenant?.subscriptionPlan === 'ENTERPRISE' || tenant?.subscriptionPlan === 'PRO';
                                    const nextTab = v as PaymentMethod;
                                    if (nextTab === 'DEBT' && !hasPermission) {
                                        toast.error("Upgrade Plan Required", {
                                            description: "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນຕິດໜີ້ (PRO/ENTERPRISE)"
                                        });
                                        return;
                                    }
                                    setSelectedTab(nextTab);
                                }}
                                className="w-full"
                            >
                                <TabsList className="mb-4 grid h-11 w-full grid-cols-3 rounded-lg border border-slate-200 bg-white p-1">
                                    <TabsTrigger value="CASH" className="gap-2 rounded-md text-sm font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                        <Wallet size={16} /> ເງິນສົດ
                                    </TabsTrigger>
                                    <TabsTrigger value="TRANSFER" className="gap-2 rounded-md text-sm font-bold data-[state=active]:bg-sky-600 data-[state=active]:text-white">
                                        <Smartphone size={16} /> ເງິນໂອນ
                                    </TabsTrigger>
                                    <TabsTrigger value="DEBT" className="relative gap-2 rounded-md text-sm font-bold text-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                                        <CreditCard size={16} /> ຕິດໜີ້
                                        {tenant?.subscriptionPlan !== 'ENTERPRISE' && tenant?.subscriptionPlan !== 'PRO' && (
                                            <Crown className="absolute top-1 right-1 h-3 w-3 text-yellow-500" />
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                {selectedTab !== 'DEBT' && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <h3 className="font-bold text-slate-900">ເພີ່ມລາຍການຊຳລະ</h3>
                                                <p className="text-xs text-slate-500">ເລືອກສະກຸນເງິນ ແລ້ວປ້ອນຈຳນວນ</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <Button
                                                    variant={currentPayCurrency === 'LAK' ? "default" : "outline"}
                                                    onClick={() => setCurrentPayCurrency('LAK')}
                                                    size="sm"
                                                    className={cn("h-8 rounded-md font-bold", currentPayCurrency === 'LAK' && "bg-emerald-600 hover:bg-emerald-700")}
                                                >
                                                    LAK
                                                </Button>
                                                {exchangeRates.map((r) => (
                                                    <Button
                                                        key={r._id}
                                                        variant={currentPayCurrency === r.currency ? "default" : "outline"}
                                                        onClick={() => setCurrentPayCurrency(r.currency)}
                                                        size="sm"
                                                        className={cn("h-8 rounded-md font-bold", currentPayCurrency === r.currency && "bg-emerald-600 hover:bg-emerald-700")}
                                                    >
                                                        {r.currency}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <div className="flex-1 relative">
                                                <Input
                                                    value={currentPayAmount}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/,/g, '');
                                                        if (!isNaN(Number(val))) setCurrentPayAmount(Number(val).toLocaleString());
                                                    }}
                                                    placeholder="ປ້ອນຈຳນວນເງິນ..."
                                                    className="h-12 rounded-lg border-slate-300 pl-4 pr-16 font-mono text-xl font-bold"
                                                    autoFocus
                                                />
                                                <span className="absolute right-4 top-3.5 font-bold text-slate-400">{currentPayCurrency}</span>
                                            </div>
                                            <Button onClick={handleAddPayment} className="h-12 w-14 rounded-lg bg-emerald-600 hover:bg-emerald-700">
                                                <Plus size={22} />
                                            </Button>
                                        </div>

                                        <div className="mt-3 grid grid-cols-4 gap-2">
                                            {[finalTotal, 1000, 2000, 5000, 10000, 20000, 50000, 100000].map(amt => (
                                                <Button
                                                    key={amt}
                                                    variant="outline"
                                                    className="h-9 rounded-md border-slate-200 bg-slate-50 font-mono text-xs hover:bg-white"
                                                    onClick={() => {
                                                        const val = currentPayCurrency === 'LAK' ? amt : Math.round(amt / (exchangeRates.find(r => r.currency === currentPayCurrency)?.rate || 1));
                                                        setCurrentPayAmount(val.toLocaleString());
                                                    }}
                                                >
                                                    {amt.toLocaleString()} ₭
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedTab === 'DEBT' && (
                                    <div className="space-y-4">
                                        {!selectedCustomer ? (
                                            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                <div className="flex justify-between items-center">
                                                    <Label className="font-bold">ຄົ້ນຫາລູກຄ້າ</Label>
                                                    <Button variant="link" size="sm" onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}>
                                                        {isCreatingCustomer ? "ກັບໄປຄົ້ນຫາ" : "+ ເພີ່ມລູກຄ້າໃໝ່"}
                                                    </Button>
                                                </div>

                                                {isCreatingCustomer ? (
                                                    <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
                                                        <Input placeholder="ຊື່ລູກຄ້າ" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
                                                        <Input placeholder="ເບີໂທລະສັບ" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
                                                        <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => createCustomerMutation.mutate({ name: newCustomerName, phone: newCustomerPhone })}>ບັນທຶກ</Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                                            <Input placeholder="ຄົ້ນຫາ..." className="pl-10" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                                                        </div>
                                                        <ScrollArea className="h-64 rounded-lg border bg-slate-50 p-2">
                                                            {customers?.map((c) => (
                                                                <div key={c._id} onClick={() => setSelectedCustomer(c)} className="mb-2 flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-3 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
                                                                            <User size={14} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-sm text-slate-700">{c.name}</p>
                                                                            <p className="text-[10px] text-slate-400">{c.phone}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-[10px] uppercase text-slate-400">ໜີ້ທັງໝົດ</p>
                                                                        <p className="font-mono text-xs font-bold text-red-500">{c.totalDebt.toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </ScrollArea>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between rounded-xl bg-red-600 p-5 text-white shadow-lg">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center">
                                                        <User size={28} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-bold">{selectedCustomer.name}</p>
                                                        <p className="text-indigo-200">{selectedCustomer.phone}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10" onClick={() => setSelectedCustomer(null)}>
                                                    ປ່ຽນ
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Tabs>

                            {payments.length > 0 && selectedTab !== 'DEBT' && (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                    <h3 className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">ລາຍການຊຳລະເງິນ</h3>
                                    <div className="mt-2 space-y-2">
                                        {payments.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 animate-in slide-in-from-left-2 duration-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-slate-500 shadow-sm">
                                                        {p.currency === 'LAK' ? '₭' : p.currency.slice(0, 1)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{p.amount.toLocaleString()} {p.currency}</p>
                                                        {p.currency !== 'LAK' && <p className="text-[10px] text-slate-400">ອັດຕາ: {p.rate.toLocaleString()} ₭</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold uppercase text-slate-400">ເປັນກີບ</p>
                                                        <p className="font-mono font-bold text-slate-700">{p.amountInLAK.toLocaleString()}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemovePayment(i)} className="text-slate-300 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex min-h-0 flex-col gap-4 border-l border-slate-200 bg-white p-4">
                            <div className="rounded-xl border border-slate-200 p-4">
                                <h3 className="text-sm font-bold text-slate-800">ສະຫຼຸບການຂາຍ</h3>
                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>ລວມຍອດບິນ</span>
                                        <span className="font-mono font-bold">{totalAmount.toLocaleString()} ₭</span>
                                    </div>
                                    <div className="flex justify-between text-red-500">
                                        <span>ສ່ວນຫຼຸດ</span>
                                        <span className="font-mono font-bold">-{numDiscount.toLocaleString()} ₭</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 text-lg font-black text-slate-900">
                                        <span>ຍອດສຸທິ</span>
                                        <span className="font-mono">{finalTotal.toLocaleString()} ₭</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                                <div className="text-center">
                                    <p className="mb-0.5 text-[10px] font-bold uppercase text-slate-400">ຍອດຈ່າຍແລ້ວ</p>
                                    <p className="font-mono text-2xl font-black text-emerald-700">{totalPaidInLAK.toLocaleString()}</p>
                                </div>
                                {change > 0 && (
                                    <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50 p-2 text-center">
                                        <p className="mb-0.5 text-[10px] font-bold uppercase text-sky-600">ເງິນທອນ</p>
                                        <p className="font-mono text-lg font-black text-sky-700">{change.toLocaleString()} ₭</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                className={cn(
                                    "mt-auto h-14 w-full rounded-xl text-lg font-bold shadow-lg transition-all active:scale-95",
                                    (selectedTab !== 'DEBT' && balanceRemaining > 0) || (selectedTab === 'DEBT' && !selectedCustomer)
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        : selectedTab === 'DEBT'
                                            ? "bg-red-600 hover:bg-red-700 text-white shadow-red-100"
                                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                                )}
                                onClick={handlePayment}
                                disabled={createOrderMutation.isPending || (selectedTab !== 'DEBT' && balanceRemaining > 0) || (selectedTab === 'DEBT' && !selectedCustomer)}
                            >
                                {createOrderMutation.isPending ? <Loader2 className="animate-spin" /> : "ຢືນຢັນການຊຳລະ"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
