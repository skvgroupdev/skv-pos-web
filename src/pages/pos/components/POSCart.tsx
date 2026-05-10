import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, Minus, CreditCard, User, X, CheckCircle2, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { getTenant } from "@/api/tenants";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { PaymentModal } from "./PaymentModal";
import { CustomerSelectionModal } from "./CustomerSelectionModal";
import { useCart, useCartMutations } from "@/hooks/useCart";
import { usePOSStore } from "@/store/usePOSStore";
import { Input } from "@/components/ui/input";
import { saleModeConfig, type POSSaleMode } from "../posSaleMode";
import type { CartItem } from "@/api/cart";
import type { Product } from "@/api/products";

type POSCartLine = Omit<CartItem, "product"> & { product: Product };

function QuantityInput({ item, onUpdate, disabled }: { item: POSCartLine, onUpdate: (qty: number) => void, disabled: boolean }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState("");

    const handleSubmit = () => {
        const newQty = parseInt(value);
        if (!isNaN(newQty) && newQty > 0 && newQty !== item.quantity) {
            if (newQty > item.product.stock) {
                toast.error(`ບໍ່ສາມາດປ່ຽນໄດ້ເນື່ອງຈາກເກີນຈຳນວນສະຕ໋ອກ (ມີທັງໝົດ ${item.product.stock})`);
                setValue(item.quantity.toString());
                setIsEditing(false);
                return;
            }
            onUpdate(newQty);
        } else {
            setValue(item.quantity.toString());
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSubmit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                }}
                className="w-12 h-6 text-center text-xs p-0 mx-1"
                autoFocus
                disabled={disabled}
            />
        );
    }

    return (
        <span
            onClick={() => {
                if (disabled) return;
                setValue(item.quantity.toString());
                setIsEditing(true);
            }}
            className="w-8 text-center font-bold text-sm bg-white border border-slate-100 rounded mx-1 cursor-pointer hover:bg-slate-50"
        >
            {item.quantity}
        </span>
    );
}

export function POSCart({ saleMode, isSaleModeSyncing = false }: { saleMode: POSSaleMode; isSaleModeSyncing?: boolean }) {
    const { carts, activeCart, isLoading: isCartLoading } = useCart();
    const {
        addToCart,
        removeFromCart,
        removeCart, // Deletes the tab
        createCart, // Adds a new tab
        updateCustomer,
        updateCartItem,
        isLoading: isMutationLoading
    } = useCartMutations();
    const { activeCartId, setActiveCartId } = usePOSStore();

    // Fetch Tenant Info
    const { data: tenant } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });

    const isLoading = isCartLoading || isMutationLoading || isSaleModeSyncing;

    // Separate states for each modal to ensure no conflicts
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    // Calculate Totals form Cart Data
    const items = (activeCart?.items || []) as POSCartLine[];

    // Placeholder for when BE supports customer in cart
    const customer = activeCart?.customer;
    const saleModeLabel = saleMode === "wholesale" ? "ຂາຍສົ່ງ" : "ຂາຍຍ່ອຍ";
    const theme = saleModeConfig[saleMode];

    return (
        <div className={cn("relative flex h-full flex-col overflow-hidden rounded-lg border bg-white font-lao shadow-md", theme.softBorder)}>
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                    <Loader2 className={cn("h-8 w-8 animate-spin", theme.accentText)} />
                </div>
            )}

            <div className={cn("border-b px-3 py-2.5 text-white", saleMode === "wholesale" ? "border-sky-800 bg-sky-950" : "border-emerald-800 bg-emerald-950")}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="text-xs text-slate-400">Checkout</p>
                        </div>
                    </div>
                    <span className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        saleMode === "wholesale" ? "bg-sky-500/20 text-sky-100" : "bg-emerald-500/20 text-emerald-100"
                    )}>
                        {saleModeLabel}
                    </span>
                </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-100 p-1.5 scrollbar-hide">
                {carts.map(cart => (
                    <div
                        key={cart._id}
                        onClick={() => setActiveCartId(cart._id)}
                        className={cn(
                            "group relative flex min-w-[92px] cursor-pointer select-none items-start gap-2 rounded-md border px-3 py-1.5 text-xs transition-all",
                            activeCartId === cart._id
                                ? `${theme.softBorder} bg-white font-bold ${theme.accentText} shadow-sm`
                                : "bg-slate-50 border-transparent text-slate-500 hover:bg-white hover:shadow-sm"
                        )}
                    >
                        <div className="flex flex-col truncate">
                            <span className="truncate">{cart.name}</span>
                            <span className="text-[10px] font-normal text-slate-400">
                                {cart.items.length} ຢ່າງ
                            </span>
                        </div>

                        {carts.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); removeCart(cart._id); }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ))}

                <button
                    onClick={() => {
                        const hasPermission = tenant?.subscriptionPlan === 'ENTERPRISE' || tenant?.subscriptionPlan === 'PRO';

                        if (carts.length > 0 && !hasPermission) {
                            toast.error("Upgrade Plan Required", {
                                description: "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອເພີ່ມກະຕ່າຫຼາຍກວ່າ 1 (PRO/ENTERPRISE)"
                            });
                            return;
                        }
                        createCart()
                    }}
                    className={cn("relative flex min-h-[36px] w-10 shrink-0 items-center justify-center rounded-md border transition-colors", theme.softBorder, theme.buttonSoft)}
                    disabled={isLoading}
                >
                    <Plus className="h-5 w-5" />
                    {carts.length > 0 && (tenant?.subscriptionPlan !== 'ENTERPRISE' && tenant?.subscriptionPlan !== 'PRO') && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                            <Crown className="h-3 w-3 text-yellow-500" />
                        </div>
                    )}
                </button>
            </div>

            {/* Customer Info (Only show if a cart is active) */}
            {activeCart && (
                <div className="border-b border-slate-100 bg-white p-2">
                    <div
                        onClick={() => setIsCustomerModalOpen(true)}
                        className={cn(
                            "flex cursor-pointer items-center justify-between rounded-md border px-2.5 py-2 transition-all",
                            customer
                                ? `${theme.softBg} ${theme.softBorder} ${theme.accentText}`
                                : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {customer ? <CheckCircle2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            <span className="text-sm font-bold">
                                {customer ? customer?.name : "ເພີ່ມລູກຄ້າ"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                <span>ສິນຄ້າໃນບິນ</span>
                <span>{items.length} ລາຍການ</span>
            </div>

            {/* Items List */}
            <ScrollArea className="flex-1 bg-white">
                <div className="space-y-1.5 p-2">
                    {!activeCart || items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                            <CreditCard className="h-12 w-12 mb-2 opacity-20" />
                            <p>ຍັງບໍ່ມີລາຍການສິນຄ້າ</p>
                            {!activeCart && <p className="text-xs">ກະລຸນາເລືອກ ຫຼື ສ້າງກະຕ່າໃໝ່</p>}
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.product._id} className="group rounded-lg border border-slate-100 bg-white p-2 shadow-sm transition-colors hover:border-slate-200 hover:bg-slate-50">
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <div className="min-w-0 capitalize">
                                        <p className="line-clamp-1 text-sm font-bold leading-snug text-slate-900">{item.product.name}</p>
                                        <p className="mt-1 font-mono text-[10px] text-slate-400">{item.product.barcode || "-"}</p>
                                        <p className="text-xs font-semibold text-slate-500">{item.price.toLocaleString()} LAK</p>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.product._id)}
                                        className="rounded-md p-1 text-red-400 opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                                        disabled={isLoading}
                                        title="ລົບລາຍການ"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1">
                                        <button
                                            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            onClick={() => addToCart({ productId: item.product._id, quantity: -1, price: item.price })}
                                            disabled={isLoading}
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <QuantityInput
                                            item={item}
                                            onUpdate={(newQty) => updateCartItem({
                                                productId: item.product._id,
                                                quantity: newQty,
                                                price: item.price,
                                                currentQuantity: item.quantity
                                            })}
                                            disabled={isLoading}
                                        />
                                        <button
                                            className={cn("flex h-7 w-7 items-center justify-center rounded-md", theme.buttonSoft)}
                                            onClick={() => {
                                                if (item.quantity + 1 > item.product.stock) {
                                                    toast.error(`ບໍ່ສາມາດເພີ່ມໄດ້ເນື່ອງຈາກເກີນຈຳນວນສະຕ໋ອກ (ມີທັງໝົດ ${item.product.stock})`);
                                                    return;
                                                }
                                                addToCart({ productId: item.product._id, quantity: 1, price: item.price })
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">ລວມ</p>
                                        <p className="font-black text-slate-900">{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Summary Footer */}
            {activeCart && (
                <div className={cn("z-10 rounded-t-2xl p-3 text-white shadow-[0_-8px_30px_rgba(15,23,42,0.18)]", saleMode === "wholesale" ? "bg-sky-950" : "bg-emerald-950")}>
                    <div className="mb-3 flex items-end justify-between">
                        <div>
                            <p className="text-xs text-slate-400">ໂໝດລາຄາ</p>
                            <p className="font-bold text-slate-100">{saleModeLabel}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-slate-400 text-xs">ລວມເງິນທັງໝົດ</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black tracking-tight text-white">{activeCart.total.toLocaleString()}</span>
                                <span className={cn("text-sm font-medium", saleMode === "wholesale" ? "text-sky-300" : "text-emerald-300")}>LAK</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <Button variant="outline" className="col-span-1 h-10 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => removeCart(activeCart._id)} disabled={isLoading}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                            className={cn("col-span-3 h-10 text-base font-bold text-white shadow-lg", theme.buttonSolid)}
                            onClick={() => setIsPaymentOpen(true)}
                            disabled={items.length === 0 || isLoading}
                        >
                            ຮັບເງິນ
                        </Button>
                    </div>
                </div>
            )}

            {/* Render Modals at Root Level */}
            {activeCart && (
                <PaymentModal
                    open={isPaymentOpen}
                    onClose={() => setIsPaymentOpen(false)}
                    totalAmount={activeCart.total}
                    cart={activeCart}
                />
            )}

            <CustomerSelectionModal
                open={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSelect={(customer) => {
                    updateCustomer(customer?._id || null); // Pass ID
                    setIsCustomerModalOpen(false);
                }}
            />
        </div>
    );
}
