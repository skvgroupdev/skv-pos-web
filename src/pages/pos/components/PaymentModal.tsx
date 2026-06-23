import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, createCustomer, getCustomers, type Customer } from "@/api/pos";
import {
    User, Plus, Search, Wallet, Smartphone, CreditCard,
    X, Loader2, Crown, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenant } from "@/api/tenants";
import PrintBill from "./PrintBill";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarcodeLoadingOverlay } from "@/components/ui/barcode-loading-overlay";
import { usePOSStore } from "@/store/usePOSStore";
import type { BillPrintData } from "./bill-templates/billPrintUtils";
import { type Cart } from "@/api/cart";

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    totalAmount: number;
    cart: Cart;
}

type PaymentMethod = "CASH" | "TRANSFER" | "DEBT";

const METHOD_CONFIG = {
    CASH:     { label: "ເງິນສົດ",  icon: Wallet,     active: "bg-emerald-600 text-white", confirm: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    TRANSFER: { label: "ເງິນໂອນ", icon: Smartphone, active: "bg-sky-600 text-white",     confirm: "bg-sky-600 hover:bg-sky-700 text-white" },
    DEBT:     { label: "ຕິດໜີ້",   icon: CreditCard, active: "bg-rose-600 text-white",    confirm: "bg-rose-600 hover:bg-rose-700 text-white" },
} as const;

function getErrMsg(error: unknown, fallback: string) {
    if (typeof error === "object" && error !== null && "response" in error) {
        const r = (error as { response?: { data?: { error?: string } } }).response;
        return r?.data?.error || fallback;
    }
    if (error instanceof Error) return error.message;
    return fallback;
}

export function PaymentModal({ open, onClose, totalAmount, cart }: PaymentModalProps) {
    const { exchangeRates, saleMode } = usePOSStore();

    const { data: tenant } = useQuery({ queryKey: ["tenant"], queryFn: getTenant });

    const [method, setMethod]                   = useState<PaymentMethod>("CASH");
    const [discount, setDiscount]               = useState("0");
    const [amountStr, setAmountStr]             = useState("0");
    const [selectedCurrency, setSelectedCurrency] = useState("LAK");
    const [selectedCustomer, setSelected]       = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch]   = useState("");
    const [orderToPrint, setOrderToPrint]       = useState<BillPrintData | null>(null);
    const [newName, setNewName]                 = useState("");
    const [newPhone, setNewPhone]               = useState("");
    const [isCreating, setIsCreating]           = useState(false);
    const [customerOpen, setCustomerOpen]       = useState(false);

    const queryClient = useQueryClient();

    const { data: customers } = useQuery<Customer[]>({
        queryKey: ["customers", customerSearch],
        queryFn: () => getCustomers(customerSearch) as Promise<Customer[]>,
        enabled: open && (customerOpen || method === "DEBT"),
    });

    const createOrderMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: (newOrder) => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["carts"] });
            if (newOrder) setOrderToPrint(newOrder as BillPrintData);
            toast.success("ຊຳລະເງິນສຳເລັດ!");
        },
        onError: (err) => toast.error("ຊຳລະບໍ່ສຳເລັດ: " + getErrMsg(err, "ເກີດຂໍ້ຜິດພາດ")),
    });

    const createCustomerMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: (c) => {
            setSelected(c);
            setIsCreating(false);
            setNewName(""); setNewPhone("");
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("ເພີ່ມລູກຄ້າສຳເລັດ!");
        },
        onError: (err) => toast.error(getErrMsg(err, "ເພີ່ມລູກຄ້າບໍ່ສຳເລັດ")),
    });

    // ── derived ──────────────────────────────────────────────────────────────
    const numDiscount      = parseFloat(discount.replace(/,/g, "")) || 0;
    const finalTotal       = Math.max(0, totalAmount - numDiscount);
    const numAmount        = parseFloat(amountStr.replace(/,/g, "")) || 0;
    const selectedRate     = selectedCurrency === "LAK" ? 1 : (exchangeRates.find(r => r.currency === selectedCurrency)?.rate ?? 1);
    const paid             = selectedCurrency === "LAK" ? numAmount : Math.round(numAmount * selectedRate);
    const balanceRemaining = Math.max(0, finalTotal - paid);
    const change           = method === "DEBT" ? 0 : Math.max(0, paid - finalTotal);
    const debtAmount       = method === "DEBT" ? balanceRemaining : 0;
    const canConfirm       = method === "DEBT"
        ? !!selectedCustomer && paid <= finalTotal
        : paid >= finalTotal;

    useEffect(() => {
        if (!open) return;
        const t = window.setTimeout(() => {
            setMethod("CASH");
            setSelected(cart?.customer || null);
            setIsCreating(false);
            setCustomerSearch("");
            setCustomerOpen(false);
            setDiscount("0");
            setAmountStr("0");
            setSelectedCurrency("LAK");
            setNewName(""); setNewPhone("");
        }, 0);
        return () => window.clearTimeout(t);
    }, [open, cart]);

    // auto-open customer panel for DEBT
    useEffect(() => {
        if (method === "DEBT") setCustomerOpen(true);
    }, [method]);

    const handleConfirm = () => {
        if (createOrderMutation.isPending) return;
        if (method === "DEBT" && !selectedCustomer) {
            toast.error("ກະລຸນາເລືອກລູກຄ້າ");
            return;
        }
        if (method === "DEBT" && paid > finalTotal) {
            toast.error("ຈຳນວນເກີນຍອດທັງໝົດ");
            return;
        }
        if (method !== "DEBT" && paid < finalTotal) {
            toast.error("ຈຳນວນເງິນບໍ່ພຽງພໍ");
            return;
        }
        const payload: any = {
            cartId:        cart._id,
            paymentMethod: method,
            discount:      numDiscount,
            exchangeRates: exchangeRates.map((r) => ({ currency: r.currency, rate: r.rate })),
            customerId:    selectedCustomer?._id,
            paidAmount:    paid,
            saleMode,
        };
        // ส่ง payments array เฉพาะเมื่อมีการรับเงินจริง (amount > 0)
        if (numAmount > 0) {
            payload.payments = [{
                currency:    selectedCurrency,
                amount:      numAmount,
                rate:        selectedRate,
                amountInLAK: paid,
            }];
        }
        createOrderMutation.mutate(payload);
    };

    const cfg = METHOD_CONFIG[method];

    return (
        <>
            <PrintBill data={orderToPrint} clearData={() => setOrderToPrint(null)} />
            <BarcodeLoadingOverlay
                open={createOrderMutation.isPending}
                title={method === "DEBT" ? "ກຳລັງບັນທຶກໜີ້" : "ກຳລັງບັນທຶກບິນ"}
                description="ກະລຸນາລໍຖ້າ..."
            />

            <Dialog open={open} onOpenChange={(v) => { if (!v && !createOrderMutation.isPending) onClose(); }}>
                <DialogContent className="flex max-h-[92vh] w-[min(820px,calc(100vw-16px))] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl [&>button.absolute]:hidden">

                    {/* ── Title bar ─────────────────────────────────────────── */}
                    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                                <Wallet className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-black text-slate-900">ຊຳລະເງິນ</DialogTitle>
                                <p className="text-[11px] text-slate-400">ເລືອກວິທີຊຳລະ ແລ້ວປ້ອນຈຳນວນ</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                            <X size={18} />
                        </button>
                    </div>

                    {/* ── Body ──────────────────────────────────────────────── */}
                    <div className="flex min-h-0 flex-1 overflow-hidden">

                        {/* ─── LEFT: input panel ──────────────────────────── */}
                        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">

                            {/* Method tabs */}
                            <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
                                {(["CASH", "TRANSFER", "DEBT"] as PaymentMethod[]).map((m) => {
                                    const c = METHOD_CONFIG[m];
                                    const Icon = c.icon;
                                    const isPro = m === "DEBT" && tenant?.subscriptionPlan !== "ENTERPRISE" && tenant?.subscriptionPlan !== "PRO";
                                    return (
                                        <button
                                            key={m}
                                            onClick={() => {
                                                if (m === "DEBT" && isPro) {
                                                    toast.error("ກະລຸນາອັບເກຣດ PRO/ENTERPRISE ເພື່ອໃຊ້ຕິດໜີ້");
                                                    return;
                                                }
                                                setMethod(m);
                                                setAmountStr("0");
                                            }}
                                            className={cn(
                                                "relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all",
                                                method === m ? c.active + " shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            <Icon size={16} />
                                            {c.label}
                                            {isPro && <Crown className="absolute right-1.5 top-1.5 h-3 w-3 text-yellow-500" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Amount input */}
                            <div className="mb-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                        {method === "DEBT" ? "ຈ່າຍລ່ວງໜ້າ (ຈ່າຍ 0 ໄດ້)" : "ຈຳນວນເງິນຮັບ"}
                                    </p>
                                    {/* Currency selector */}
                                    {exchangeRates.length > 0 && (
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedCurrency("LAK"); setAmountStr("0"); }}
                                                className={cn(
                                                    "rounded-md px-2 py-0.5 text-xs font-bold transition-colors",
                                                    selectedCurrency === "LAK"
                                                        ? "bg-slate-800 text-white"
                                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                )}
                                            >
                                                ₭ LAK
                                            </button>
                                            {exchangeRates.filter(r => !r.isBase).map(r => (
                                                <button
                                                    key={r.currency}
                                                    type="button"
                                                    onClick={() => { setSelectedCurrency(r.currency); setAmountStr("0"); }}
                                                    className={cn(
                                                        "rounded-md px-2 py-0.5 text-xs font-bold transition-colors",
                                                        selectedCurrency === r.currency
                                                            ? "bg-amber-500 text-white"
                                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                    )}
                                                >
                                                    {r.currency}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={amountStr}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/,/g, "");
                                                if (!Number.isNaN(Number(v)))
                                                    setAmountStr(Number(v).toLocaleString());
                                            }}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleConfirm(); } }}
                                            onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                                            inputMode="numeric"
                                            autoFocus
                                            className={cn(
                                                "h-14 rounded-xl pl-5 pr-16 font-mono text-2xl font-black tracking-tight",
                                                method === "DEBT" ? "border-rose-200 focus-visible:ring-rose-300" : ""
                                            )}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-4 text-sm font-bold text-slate-400">
                                            {selectedCurrency === "LAK" ? "₭" : selectedCurrency}
                                        </span>
                                    </div>
                                    {method !== "DEBT" && (
                                        <Button
                                            variant="outline"
                                            className="h-14 rounded-xl px-5 font-bold"
                                            onClick={() => {
                                                if (selectedCurrency === "LAK") {
                                                    setAmountStr(finalTotal.toLocaleString());
                                                } else {
                                                    const inForeign = Math.ceil(finalTotal / selectedRate);
                                                    setAmountStr(inForeign.toLocaleString());
                                                }
                                            }}
                                        >
                                            ພໍດີ
                                        </Button>
                                    )}
                                </div>
                                {/* LAK equivalent when paying in foreign currency */}
                                {selectedCurrency !== "LAK" && numAmount > 0 && (
                                    <p className="mt-1.5 text-right text-xs text-slate-400">
                                        = <span className="font-mono font-bold text-slate-600">{paid.toLocaleString()} ₭</span>
                                        <span className="ml-1">({selectedCurrency} 1 = {selectedRate.toLocaleString()} ₭)</span>
                                    </p>
                                )}
                            </div>

                            {/* Customer section */}
                            <div className={cn(
                                "overflow-hidden rounded-xl border transition-colors",
                                method === "DEBT" ? "border-rose-200" : "border-slate-200"
                            )}>
                                {/* Accordion header */}
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                                    onClick={() => { if (method !== "DEBT") setCustomerOpen((v) => !v); }}
                                >
                                    <div className="flex items-center gap-2">
                                        <User size={15} className={method === "DEBT" ? "text-rose-500" : "text-slate-400"} />
                                        <span className="text-sm font-bold text-slate-700">
                                            {selectedCustomer ? selectedCustomer.name : "ລູກຄ້າ"}
                                        </span>
                                        {!selectedCustomer && method !== "DEBT" && (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                                ບໍ່ບັງຄັບ
                                            </span>
                                        )}
                                        {!selectedCustomer && method === "DEBT" && (
                                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                                                ຕ້ອງເລືອກ
                                            </span>
                                        )}
                                        {selectedCustomer && (
                                            <span className="text-xs text-slate-400">{selectedCustomer.phone}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedCustomer && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setSelected(null); setCustomerOpen(true); }}
                                                className="rounded-md px-2 py-0.5 text-xs font-semibold text-slate-400 hover:text-slate-700"
                                            >
                                                ປ່ຽນ
                                            </button>
                                        )}
                                        {method !== "DEBT" && (
                                            customerOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Accordion body */}
                                {(customerOpen || method === "DEBT") && !selectedCustomer && (
                                    <div className="border-t border-slate-100 p-3">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                                {isCreating ? "ເພີ່ມໃໝ່" : "ຄົ້ນຫາ"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsCreating((v) => !v)}
                                                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                            >
                                                <Plus size={12} />
                                                {isCreating ? "ຄົ້ນຫາ" : "ເພີ່ມໃໝ່"}
                                            </button>
                                        </div>

                                        {isCreating ? (
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="ຊື່ລູກຄ້າ *"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    className="h-9"
                                                />
                                                <Input
                                                    placeholder="ເບີໂທ"
                                                    value={newPhone}
                                                    onChange={(e) => setNewPhone(e.target.value)}
                                                    className="h-9"
                                                />
                                                <Button
                                                    className="h-9 w-full bg-indigo-600 text-sm hover:bg-indigo-700"
                                                    disabled={!newName.trim() || createCustomerMutation.isPending}
                                                    onClick={() => createCustomerMutation.mutate({ name: newName.trim(), phone: newPhone })}
                                                >
                                                    {createCustomerMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "ບັນທຶກ"}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                                    <Input
                                                        className="h-9 pl-9 text-sm"
                                                        placeholder="ຄົ້ນຫາ..."
                                                        value={customerSearch}
                                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                                    />
                                                </div>
                                                <ScrollArea className="h-36 rounded-lg border border-slate-100 bg-slate-50">
                                                    <div className="p-1.5">
                                                        {!customers?.length && (
                                                            <p className="py-6 text-center text-xs text-slate-400">ຍັງບໍ່ມີລູກຄ້າ</p>
                                                        )}
                                                        {customers?.map((c) => (
                                                            <button
                                                                key={c._id}
                                                                type="button"
                                                                onClick={() => { setSelected(c); setCustomerOpen(false); }}
                                                                className="flex w-full items-center justify-between rounded-lg p-2.5 text-left transition-colors hover:bg-white"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                                                        <User size={12} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-700 leading-none">{c.name}</p>
                                                                        <p className="mt-0.5 text-[10px] text-slate-400">{c.phone || "—"}</p>
                                                                    </div>
                                                                </div>
                                                                {c.totalDebt > 0 && (
                                                                    <span className="font-mono text-xs font-bold text-rose-500">
                                                                        ໜີ້ {c.totalDebt.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── RIGHT: summary + confirm ───────────────────── */}
                        <div className="flex w-64 shrink-0 flex-col border-l border-slate-100 bg-slate-50">

                            {/* Summary */}
                            <div className="flex-1 space-y-3 p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ສະຫຼຸບ</p>

                                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>ຍອດບິນ</span>
                                        <span className="font-mono font-bold">{totalAmount.toLocaleString()}</span>
                                    </div>

                                    {/* Discount input inline */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">ສ່ວນຫຼຸດ</span>
                                        <div className="relative w-28">
                                            <Input
                                                value={discount}
                                                onChange={(e) => {
                                                    const v = e.target.value.replace(/,/g, "");
                                                    if (!isNaN(Number(v))) setDiscount(Number(v).toLocaleString());
                                                }}
                                                className="h-7 border-slate-200 pr-8 text-right font-mono text-sm font-bold"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-2 top-1 text-xs text-slate-400">₭</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-900">
                                        <span>ຍອດສຸທິ</span>
                                        <span className="font-mono text-base">{finalTotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Paid / Change / Remaining */}
                                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">ຮັບ</span>
                                        <span className="font-mono font-black text-emerald-600">{paid.toLocaleString()}</span>
                                    </div>

                                    {method !== "DEBT" && (
                                        <div className={cn(
                                            "flex justify-between rounded-lg px-3 py-2 text-sm",
                                            balanceRemaining > 0
                                                ? "bg-red-50 text-red-600"
                                                : change > 0
                                                    ? "bg-sky-50 text-sky-600"
                                                    : "bg-emerald-50 text-emerald-600"
                                        )}>
                                            <span className="font-bold">
                                                {balanceRemaining > 0 ? "ຍັງຂາດ" : "ເງິນທອນ"}
                                            </span>
                                            <span className="font-mono font-black text-base">
                                                {(balanceRemaining > 0 ? balanceRemaining : change).toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    {method === "DEBT" && (
                                        <>
                                            <div className="flex justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                                <span className="font-bold">ຕິດໜີ້</span>
                                                <span className="font-mono font-black text-base">{debtAmount.toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Customer chip */}
                                {selectedCustomer && (
                                    <div className={cn(
                                        "flex items-center gap-2.5 rounded-xl p-3",
                                        method === "DEBT" ? "bg-rose-50 border border-rose-200" : "bg-indigo-50 border border-indigo-100"
                                    )}>
                                        <div className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                            method === "DEBT" ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
                                        )}>
                                            <User size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn("truncate text-sm font-bold", method === "DEBT" ? "text-rose-700" : "text-indigo-700")}>
                                                {selectedCustomer.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400">{selectedCustomer.phone || "—"}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm button */}
                            <div className="shrink-0 border-t border-slate-100 p-4">
                                <Button
                                    className={cn(
                                        "h-13 w-full rounded-xl text-base font-black tracking-wide shadow-md transition-all active:scale-[0.98]",
                                        !canConfirm
                                            ? "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                                            : cfg.confirm
                                    )}
                                    onClick={handleConfirm}
                                    disabled={createOrderMutation.isPending || !canConfirm}
                                >
                                    {createOrderMutation.isPending ? (
                                        <Loader2 className="animate-spin" />
                                    ) : method === "DEBT" ? (
                                        "ບັນທຶກໜີ້"
                                    ) : (
                                        "ຊຳລະ ✓"
                                    )}
                                </Button>
                                {method === "DEBT" && !selectedCustomer && (
                                    <p className="mt-2 text-center text-[11px] font-semibold text-rose-500">
                                        ເລືອກລູກຄ້າກ່ອນ
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
