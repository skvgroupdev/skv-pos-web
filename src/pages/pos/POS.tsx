import { POSCart } from "./components/POSCart";
import { POSProductGrid } from "./components/POSProductGrid";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCart, useCartMutations } from "@/hooks/useCart";
import { usePOSStore } from "@/store/usePOSStore";
import { saleModeConfig, type POSSaleMode } from "./posSaleMode";
import type { CartItem } from "@/api/cart";

export default function POS() {
    const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu');
    const saleMode = usePOSStore((state) => state.saleMode);
    const setSaleMode = usePOSStore((state) => state.setSaleMode);
    const setSaleModeSyncing = usePOSStore((state) => state.setSaleModeSyncing);
    const { activeCart } = useCart();
    const { updateCartPrices, isUpdatingCartPrices } = useCartMutations();
    const syncedCartRef = useRef<{ cartId: string | null; mode: POSSaleMode }>({ cartId: null, mode: saleMode });
    const cartCountRef = useRef<{ cartId: string | null; count: number }>({ cartId: null, count: 0 });
    const theme = saleModeConfig[saleMode];

    const cartItemCount = activeCart?.items?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) || 0;

    useEffect(() => {
        setSaleModeSyncing(isUpdatingCartPrices);
    }, [isUpdatingCartPrices, setSaleModeSyncing]);

    useEffect(() => {
        const cartId = activeCart?._id || null;
        const previous = cartCountRef.current;

        if (previous.cartId === cartId && cartItemCount > previous.count) {
            setActiveTab("cart");
        }

        cartCountRef.current = { cartId, count: cartItemCount };
    }, [activeCart?._id, cartItemCount]);

    useEffect(() => {
        if (!activeCart?._id) return;

        const hasItems = (activeCart.items?.length || 0) > 0;
        const previous = syncedCartRef.current;
        const isAlreadySynced = previous.cartId === activeCart._id && previous.mode === saleMode;

        if (isAlreadySynced) return;

        if (!hasItems) {
            syncedCartRef.current = { cartId: activeCart._id, mode: saleMode };
            return;
        }

        updateCartPrices(saleMode, {
            onSuccess: () => {
                syncedCartRef.current = { cartId: activeCart._id, mode: saleMode };
            },
            onError: () => {
                setSaleMode(previous.mode);
                syncedCartRef.current = previous;
            },
        });
    }, [activeCart?._id, activeCart?.items?.length, saleMode, setSaleMode, updateCartPrices]);

    return (
        <div className={cn("flex h-full w-full flex-col overflow-hidden text-slate-950", theme.softBg)}>
            {/* Mobile Tab Switcher */}
            <div className="flex shrink-0 gap-2 border-b bg-white p-2 shadow-sm md:hidden">
                <button
                    onClick={() => setActiveTab('menu')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-sm",
                        activeTab === 'menu'
                            ? `${theme.activeBg} text-white shadow-lg scale-105`
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95"
                    )}
                >
                    <LayoutGrid className="h-5 w-5" />
                    <span>ສິນຄ້າ</span>
                </button>
                <button
                    onClick={() => setActiveTab('cart')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-sm relative",
                        activeTab === 'cart'
                            ? `${theme.activeBg} text-white shadow-lg scale-105`
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95"
                    )}
                >
                    <ShoppingCart className="h-5 w-5" />
                    <span>ກະຕ່າ</span>
                    {cartItemCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center rounded-full bg-red-500 text-white text-xs border-2 border-white">
                            {cartItemCount > 9 ? '9+' : cartItemCount}
                        </Badge>
                    )}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 gap-3 overflow-hidden p-2">
                {/* Left Side - Products */}
                <div className={cn(
                    "h-full min-w-0 flex-1",
                    activeTab === 'menu' ? "flex flex-col" : "hidden md:flex md:flex-col"
                )}>
                    <POSProductGrid saleMode={saleMode} isSaleModeSyncing={isUpdatingCartPrices} />
                </div>

                {/* Right Side - Cart */}
                <div className={cn(
                    "h-full w-full md:flex md:w-[390px] md:shrink-0 xl:w-[430px]",
                    activeTab === 'cart' ? "flex flex-col" : "hidden md:flex-col"
                )}>
                    <POSCart saleMode={saleMode} isSaleModeSyncing={isUpdatingCartPrices} />
                </div>
            </div>

            {/* Mobile Floating Action Button (When in Menu Mode) */}
            {activeTab === 'menu' && cartItemCount > 0 && (
                <button
                    onClick={() => setActiveTab('cart')}
                    className={cn("md:hidden fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all", theme.activeBg)}
                >
                    <ShoppingCart className="h-7 w-7" />
                    <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 border-4 border-white flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                        {cartItemCount > 9 ? '9+' : cartItemCount}
                    </div>
                </button>
            )}
        </div>
    );
}
