import { useState, useEffect } from "react";
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

function QuantityInput({ item, onUpdate, disabled }: { item: any, onUpdate: (qty: number) => void, disabled: boolean }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(item.quantity.toString());

    useEffect(() => {
        setValue(item.quantity.toString());
    }, [item.quantity]);

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
            onClick={() => !disabled && setIsEditing(true)}
            className="w-8 text-center font-bold text-sm bg-white border border-slate-100 rounded mx-1 cursor-pointer hover:bg-slate-50"
        >
            {item.quantity}
        </span>
    );
}

export function POSCart() {
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

    const isLoading = isCartLoading || isMutationLoading;

    // Separate states for each modal to ensure no conflicts
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    // Calculate Totals form Cart Data
    const items = activeCart?.items || [];

    // Placeholder for when BE supports customer in cart
    const customer = activeCart?.customer;

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden font-lao relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            )}

            {/* Multi-Cart Tabs */}
            <div className="flex bg-slate-100 p-2 gap-2 overflow-x-auto border-b border-slate-200 scrollbar-hide">
                {carts.map(cart => (
                    <div
                        key={cart._id}
                        onClick={() => setActiveCartId(cart._id)}
                        className={cn(
                            "py-2 px-6 flex items-start gap-2 rounded-lg cursor-pointer transition-all text-sm select-none border group relative",
                            activeCartId === cart._id
                                ? "bg-white shadow-sm text-blue-700 font-bold border-blue-200"
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
                    className="relative flex items-center justify-center h-full min-h-[44px] w-12 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 transition-colors flex-shrink-0"
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
                <div className="p-3 border-b border-slate-100 bg-white">
                    <div
                        onClick={() => setIsCustomerModalOpen(true)}
                        className={cn(
                            "flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all",
                            customer
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {customer ? <CheckCircle2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            <span className="text-sm font-medium">
                                {customer ? customer?.name : "ເພີ່ມລູກຄ້າ"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Items Header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                <div className="col-span-12 md:col-span-5">ສິນຄ້າ</div>
                <div className="col-span-6 md:col-span-3 text-center">ຈຳນວນ</div>
                <div className="col-span-6 md:col-span-3 text-right">ລວມ (LAK)</div>
                <div className="hidden md:block md:col-span-1"></div>
            </div>

            {/* Items List */}
            <ScrollArea className="flex-1 bg-white">
                <div className="p-2 space-y-1">
                    {!activeCart || items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                            <CreditCard className="h-12 w-12 mb-2 opacity-20" />
                            <p>ຍັງບໍ່ມີລາຍການສິນຄ້າ</p>
                            {!activeCart && <p className="text-xs">ກະລຸນາເລືອກ ຫຼື ສ້າງກະຕ່າໃໝ່</p>}
                        </div>
                    ) : (
                        items.map((item: any) => (
                            <div key={item.product._id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
                                <div className="col-span-12 md:col-span-5 capitalize">
                                    <p className="font-medium text-sm text-slate-800 line-clamp-1">{item.product.name}</p>
                                    <p className="text-[10px] text-slate-400">{item.product.barcode}</p>
                                </div>
                                <div className="col-span-6 md:col-span-3 flex items-center justify-center gap-1">
                                    <button
                                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        onClick={() => addToCart({ productId: item.product._id, quantity: -1, price: item.product.sellPrice })}
                                        disabled={isLoading}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <QuantityInput
                                        item={item}
                                        onUpdate={(newQty) => updateCartItem({
                                            productId: item.product._id,
                                            quantity: newQty,
                                            price: item.product.sellPrice,
                                            currentQuantity: item.quantity
                                        })}
                                        disabled={isLoading}
                                    />
                                    <button
                                        className="w-6 h-6 flex items-center justify-center rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                        onClick={() => {
                                            if (item.quantity + 1 > item.product.stock) {
                                                toast.error(`ບໍ່ສາມາດເພີ່ມໄດ້ເນື່ອງຈາກເກີນຈຳນວນສະຕ໋ອກ (ມີທັງໝົດ ${item.product.stock})`);
                                                return;
                                            }
                                            addToCart({ productId: item.product._id, quantity: 1, price: item.product.sellPrice })
                                        }}
                                        disabled={isLoading}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="col-span-5 md:col-span-3 text-right font-medium text-slate-700 text-sm">
                                    {(item.price * item.quantity).toLocaleString()}
                                </div>
                                <div className="col-span-1 flex justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => removeFromCart(item.product._id)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Summary Footer */}
            {activeCart && (
                <div className="bg-slate-900 text-white p-4 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-10">
                    <div className="flex justify-end items-end mb-4">
                        <div className="space-y-1">
                            <p className="text-slate-400 text-xs">ລວມເງິນທັງໝົດ</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold tracking-tight text-white">{activeCart.total.toLocaleString()}</span>
                                <span className="text-sm font-medium text-green-400">LAK</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <Button variant="outline" className="col-span-1 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white h-12" onClick={() => removeCart(activeCart._id)} disabled={isLoading}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                            className="col-span-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 text-lg font-bold shadow-lg shadow-blue-900/50"
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
