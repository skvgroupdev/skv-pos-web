import { POSCart } from "./components/POSCart";
import { POSProductGrid } from "./components/POSProductGrid";
import { useState } from "react";
import { ShoppingCart, LayoutGrid, } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";


export default function POS() {
    const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu');

    const { activeCart } = useCart();

    // Calculate total items
    const cartItemCount = activeCart?.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;


    return (
        <div className="h-full w-full flex flex-col gap-0 overflow-hidden bg-slate-50/50">


            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex gap-2 p-2 bg-white border-b shadow-sm flex-shrink-0">
                <button
                    onClick={() => setActiveTab('menu')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-sm",
                        activeTab === 'menu'
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg scale-105"
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
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg scale-105"
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
            <div className="flex-1 flex gap-4 overflow-hidden p-2 md:p-4">
                {/* Left Side - Cart (Responsive) */}
                <div className={cn(
                    "w-full md:w-[40%] lg:w-[35%] xl:w-[30%] h-full",
                    activeTab === 'cart' ? "flex flex-col" : "hidden md:flex md:flex-col"
                )}>
                    <POSCart />
                </div>

                {/* Right Side - Products (Responsive) */}
                <div className={cn(
                    "w-full md:w-[60%] lg:w-[65%] xl:w-[70%] h-full",
                    activeTab === 'menu' ? "flex flex-col" : "hidden md:flex md:flex-col"
                )}>
                    <POSProductGrid />
                </div>
            </div>

            {/* Mobile Floating Action Button (When in Menu Mode) */}
            {activeTab === 'menu' && cartItemCount > 0 && (
                <button
                    onClick={() => setActiveTab('cart')}
                    className="md:hidden fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
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
