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

export function PaymentModal({ open, onClose, totalAmount, cart }: PaymentModalProps) {
    const { exchangeRates } = usePOSStore();

    // Fetch Tenant Info
    const { data: tenant } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });

    const [selectedTab, setSelectedTab] = useState<"CASH" | "TRANSFER" | "DEBT">("CASH");
    const [payments, setPayments] = useState<PaymentEntry[]>([]);
    const [discount, setDiscount] = useState("0");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [orderToPrint, setOrderToPrint] = useState<any>(null);

    // UI Helpers for adding a new payment
    const [currentPayCurrency, setCurrentPayCurrency] = useState("LAK");
    const [currentPayAmount, setCurrentPayAmount] = useState("");

    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    const queryClient = useQueryClient();
    const { data: customers } = useQuery({
        queryKey: ['customers', customerSearch],
        queryFn: () => getCustomers(customerSearch),
        enabled: open && (selectedTab === 'DEBT' || !!customerSearch)
    });

    const createOrderMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: (newOrder) => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['carts'] });
            if (newOrder) {
                setOrderToPrint(newOrder);
            }
            toast.success("Payment Successful!");
        },
        onError: (err: any) => {
            toast.error("Payment Failed: " + (err.response?.data?.error || err.message));
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
        onError: (err: any) => {
            toast.error("Failed to create customer: " + err.response?.data?.error);
        }
    });

    useEffect(() => {
        if (open) {
            setPayments([]);
            setSelectedTab("CASH");
            setSelectedCustomer(cart?.customer || null);
            setIsCreatingCustomer(false);
            setDiscount("0");
            setCurrentPayCurrency("LAK");
            setCurrentPayAmount("");
        }
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
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden font-lao gap-0 border-0 rounded-2xl bg-slate-50">

                    {/* Dark Header - Compacted */}
                    <div className="bg-slate-900 text-white p-4 shadow-xl z-20 shrink-0">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/10 rounded-lg">
                                    <Wallet className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold">ຊຳລະເງິນ</DialogTitle>
                                    <p className="text-slate-400 text-[10px] mt-0.5">ສະກຸນເງິນກີບ (Base Currency)</p>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 items-end">
                            <div>
                                <Label className="text-[10px] font-semibold text-slate-400 uppercase">ສ່ວນຫຼຸດ (₭)</Label>
                                <Input
                                    value={discount}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/,/g, '');
                                        if (!isNaN(Number(val))) setDiscount(Number(val).toLocaleString());
                                    }}
                                    className="h-9 bg-slate-800/50 border-slate-700 text-white text-lg font-mono mt-1"
                                    placeholder="0"
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase">ຍອດທີ່ຕ້ອງຊຳລະ (₭)</p>
                                <p className="text-2xl font-black font-mono">{finalTotal.toLocaleString()}</p>
                            </div>
                            <div className="text-right border-l border-white/10 pl-4">
                                <p className="text-[10px] font-semibold text-indigo-400 uppercase">ຍັງເຫຼືອ / ເງິນທອນ (₭)</p>
                                {balanceRemaining > 0 ? (
                                    <p className="text-2xl font-black font-mono text-red-400">-{balanceRemaining.toLocaleString()}</p>
                                ) : (
                                    <p className="text-2xl font-black font-mono text-emerald-400">+{change.toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Side: Payment Input & List */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-6">
                            <Tabs
                                value={selectedTab}
                                onValueChange={(v) => {
                                    const hasPermission = tenant?.subscriptionPlan === 'ENTERPRISE' || tenant?.subscriptionPlan === 'PRO';
                                    if (v === 'DEBT' && !hasPermission) {
                                        toast.error("Upgrade Plan Required", {
                                            description: "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນຕິດໜີ້ (PRO/ENTERPRISE)"
                                        });
                                        return;
                                    }
                                    setSelectedTab(v as any)
                                }}
                                className="w-full"
                            >
                                <TabsList className="w-full h-12 bg-white border rounded-xl mb-6">
                                    <TabsTrigger value="CASH" className="flex-1 gap-2"><Wallet size={18} /> ເງິນສົດ</TabsTrigger>
                                    <TabsTrigger value="TRANSFER" className="flex-1 gap-2"><Smartphone size={18} /> ເງິນໂອນ</TabsTrigger>
                                    <TabsTrigger value="DEBT" className="flex-1 gap-2 font-bold text-red-600 relative">
                                        <CreditCard size={18} /> ຕິດໜີ້
                                        {tenant?.subscriptionPlan !== 'ENTERPRISE' && tenant?.subscriptionPlan !== 'PRO' && (
                                            <Crown className="absolute top-1 right-1 h-3 w-3 text-yellow-500" />
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                {/* Payment Input Area */}
                                {selectedTab !== 'DEBT' && (
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                                        <div className="flex items-center justify-between border-b pb-4 mb-4">
                                            <h3 className="font-bold text-slate-700">ເພີ່ມລາຍການຊຳລະ</h3>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant={currentPayCurrency === 'LAK' ? "default" : "outline"}
                                                    onClick={() => setCurrentPayCurrency('LAK')}
                                                    size="sm"
                                                    className="h-8 font-bold"
                                                >
                                                    LAK
                                                </Button>
                                                {exchangeRates.map((r) => (
                                                    <Button
                                                        key={r._id}
                                                        variant={currentPayCurrency === r.currency ? "default" : "outline"}
                                                        onClick={() => setCurrentPayCurrency(r.currency)}
                                                        size="sm"
                                                        className="h-8 font-bold"
                                                    >
                                                        {r.currency}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex-1 relative">
                                                <Input
                                                    value={currentPayAmount}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/,/g, '');
                                                        if (!isNaN(Number(val))) setCurrentPayAmount(Number(val).toLocaleString());
                                                    }}
                                                    placeholder="ປ້ອນຈຳນວນເງິນ..."
                                                    className="h-14 text-2xl font-bold font-mono pl-4 pr-16"
                                                    autoFocus
                                                />
                                                <span className="absolute right-4 top-4 text-slate-400 font-bold">{currentPayCurrency}</span>
                                            </div>
                                            <Button onClick={handleAddPayment} className="h-14 w-20 bg-indigo-600 hover:bg-indigo-700">
                                                <Plus size={24} />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            {[finalTotal, 1000, 2000, 5000, 10000, 20000, 50000, 100000].map(amt => (
                                                <Button
                                                    key={amt}
                                                    variant="outline"
                                                    className="h-10 font-mono text-xs"
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

                                {/* Debt UI - Customer Select */}
                                {selectedTab === 'DEBT' && (
                                    <div className="space-y-4">
                                        {!selectedCustomer ? (
                                            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label className="font-bold">ຄົ້ນຫາລູກຄ້າ</Label>
                                                    <Button variant="link" size="sm" onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}>
                                                        {isCreatingCustomer ? "ກັບໄປຄົ້ນຫາ" : "+ ເພີ່ມລູກຄ້າໃໝ່"}
                                                    </Button>
                                                </div>

                                                {isCreatingCustomer ? (
                                                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border">
                                                        <Input placeholder="ຊື່ລູກຄ້າ" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
                                                        <Input placeholder="ເບີໂທລະສັບ" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
                                                        <Button className="w-full" onClick={() => createCustomerMutation.mutate({ name: newCustomerName, phone: newCustomerPhone })}>ບັນທຶກ</Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                                            <Input placeholder="ຄົ້ນຫາ..." className="pl-10" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                                                        </div>
                                                        <ScrollArea className="h-64 border rounded-xl p-2 bg-slate-50">
                                                            {customers?.map((c: any) => (
                                                                <div key={c._id} onClick={() => setSelectedCustomer(c)} className="p-3 hover:bg-white rounded-lg cursor-pointer flex justify-between items-center border border-transparent hover:border-slate-200 shadow-sm mb-2 transition-all">
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
                                            <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
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

                            {/* Payment List */}
                            {payments.length > 0 && selectedTab !== 'DEBT' && (
                                <div className="space-y-3">
                                    <h3 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider px-2">ລາຍການຊຳລະເງິນ (Payment Records)</h3>
                                    {payments.map((p, i) => (
                                        <div key={i} className="bg-white p-4 rounded-xl border flex items-center justify-between animate-in slide-in-from-left-2 duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                                                    {p.currency === 'LAK' ? '₭' : p.currency.slice(0, 1)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{p.amount.toLocaleString()} {p.currency}</p>
                                                    {p.currency !== 'LAK' && <p className="text-[10px] text-slate-400">ອັດຕາ: {p.rate.toLocaleString()} ₭</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold">ເປັນເງິນກີບ</p>
                                                    <p className="font-mono font-bold text-slate-700">{p.amountInLAK.toLocaleString()}</p>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemovePayment(i)} className="text-slate-300 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar: Summary & Action */}
                        <div className="w-80 bg-white border-l p-4 flex flex-col gap-5 shadow-inner shrink-0 leading-tight">
                            <div className="space-y-3">
                                <h3 className="font-bold text-slate-700 text-sm">ສະຫຼຸບ</h3>
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>ລວມຍອດບິນ:</span>
                                        <span className="font-mono font-bold">{totalAmount.toLocaleString()} ₭</span>
                                    </div>
                                    <div className="flex justify-between text-red-500">
                                        <span>ສ່ວນຫຼຸດ:</span>
                                        <span className="font-mono font-bold">-{numDiscount.toLocaleString()} ₭</span>
                                    </div>
                                    <div className="pt-1.5 border-t flex justify-between text-lg font-black text-slate-800">
                                        <span>ຍອດສຸທິ:</span>
                                        <span className="font-mono">{finalTotal.toLocaleString()} ₭</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-dashed space-y-3">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">ຍອດຈ່າຍແລ້ວ (₭)</p>
                                    <p className="text-2xl font-black font-mono text-indigo-700">{totalPaidInLAK.toLocaleString()}</p>
                                </div>
                                {change > 0 && (
                                    <div className="bg-emerald-50 p-2 rounded-lg text-center border border-emerald-100">
                                        <p className="text-[10px] text-emerald-600 uppercase font-bold mb-0.5">ເງິນທອນ (₭)</p>
                                        <p className="text-lg font-black text-emerald-700 font-mono">{change.toLocaleString()} ₭</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-20 text-xl font-bold rounded-2xl shadow-xl transition-all active:scale-95 mt-auto",
                                    (selectedTab !== 'DEBT' && balanceRemaining > 0) || (selectedTab === 'DEBT' && !selectedCustomer)
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        : selectedTab === 'DEBT'
                                            ? "bg-red-600 hover:bg-red-700 text-white shadow-red-100"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
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
