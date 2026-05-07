import { useState, useMemo, useEffect, useRef } from "react";
import { getProducts, type ProductFilters } from "@/api/products";
import { useGetProducts } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Search, Grid3x3, List, Plus, ScanBarcode, Package, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useCart, useCartMutations } from "@/hooks/useCart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ProductFilterBar } from "@/pages/shop/components/ProductFilterBar";

export function POSProductGrid() {
    const [searchTerm, setSearchTerm] = useState("");
    const [barcodeInput, setBarcodeInput] = useState("");

    // Unified Filters State (Default active status and best_selling sort)
    const [filters, setFilters] = useState<ProductFilters>({
        status: 'active', // POS should default to showing active products
        // sort: 'best_selling' // ProductFilterBar doesn't have sort yet, we might need to keep sort separate or add to it. 
        // Let's keep sort separate for now as it's often a separate UI control, 
        // OR we can pass it to the hook. The hook accepts filters object.
        // Actually ProductService.getProducts check filters.sort. 
        // But ProductFilterBar doesn't have a sort picker.
    });

    // We'll keep sort separate in UI but pass it in filters to the hook if needed, 
    // or just pass as separate arg if the hook expects it. 
    // Checking useGetProducts hook: `useGetProducts(page, limit, search, filters)`
    // And `ProductService.getProducts` checks `filters.sort`. 
    // So we can merge sort into filters.
    const [sortBy, _] = useState("best_selling");

    // Combine UI filters with Sort for the API call
    const activeFilters = useMemo(() => ({
        ...filters,
        sort: sortBy
    }), [filters, sortBy]);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('posViewMode');
            return (saved === 'grid' || saved === 'list') ? saved : 'grid';
        }
        return 'grid';
    });

    useEffect(() => {
        localStorage.setItem('posViewMode', viewMode);
    }, [viewMode]);

    const { data: productsData, isLoading } = useGetProducts(1, 100, searchTerm, activeFilters);
    const { activeCart } = useCart();
    const { addToCart, isLoading: isCartLoading } = useCartMutations();

    const [loadingId, setLoadingId] = useState<string | null>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus barcode input
    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    const handleAddToCart = (product: any) => {
        if (isCartLoading || loadingId) return;

        if (product.status === 'inactive') {
            toast.error("ສິນຄ້າບໍ່ພ້ອມໃຊ້ງານ");
            return;
        }

        if (product.stock <= 0) {
            toast.error("ສິນຄ້າໝົດສະຕ໋ອກ");
            return;
        }

        // Check if current cart quantity + 1 exceeds stock
        const cartItem = activeCart?.items?.find((item: any) => item.product._id === product._id);
        const currentQty = cartItem?.quantity || 0;
        if (currentQty + 1 > product.stock) {
            toast.error(`ບໍ່ສາມາດເພີ່ມໄດ້ເນື່ອງຈາກເກີນຈຳນວນສະຕ໋ອກ (ມີທັງໝົດ ${product.stock})`);
            return;
        }

        setLoadingId(product._id);

        addToCart({
            productId: product._id,
            quantity: 1,
            price: product.sellPrice
        }, {
            onSuccess: () => {
                toast.success(`ເພີ່ມ ${product.name} ແລ້ວ`);
                setLoadingId(null);
                setBarcodeInput(""); // Clear barcode after successful add
                barcodeInputRef.current?.focus(); // Re-focus
            },
            onError: () => {
                setLoadingId(null);
                barcodeInputRef.current?.focus();
            }
        });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Filter products locally? No, we are switching to Server Side Filtering.
    // So `products` is just `productsData.data`.
    const products = productsData?.data || [];

    // Layout-independent key mapping
    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow control keys (backspace, enter, tab, etc.)
        if (e.key === 'Enter') return; // Let form submit handle it
        if (e.key === 'Backspace') return;
        if (e.key === 'Tab') return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // Map physical keys to characters (Layout Independent)
        let char = '';
        const code = e.code;

        if (code.startsWith('Digit')) {
            char = code.replace('Digit', '');
        } else if (code.startsWith('Key')) {
            char = code.replace('Key', '').toLowerCase();
        } else if (code === 'Minus') char = '-';
        else if (code === 'Equal') char = '=';

        // Numpad support
        else if (code.startsWith('Numpad') && code.length === 7) {
            char = code.replace('Numpad', '');
        }

        if (char) {
            e.preventDefault();
            setBarcodeInput(prev => prev + char);
        }
    };

    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput) return;

        // 1. Try to find in currently loaded products (fastest)
        let targetProduct = products.find((p: any) => p.barcode === barcodeInput);

        // 2. If not found, fetch from server (it might be on another page or filtered out)
        if (!targetProduct) {
            try {
                // We search specifically by barcode text
                const result = await getProducts(1, 1, barcodeInput, { status: 'active' });
                if (result.data && result.data.length > 0) {
                    // Start strict match
                    const exact = result.data.find((p: any) => p.barcode === barcodeInput);
                    if (exact) targetProduct = exact;
                    else targetProduct = result.data[0];
                }
            } catch (err) {
                console.error("Scan lookup failed", err);
            }
        }

        if (targetProduct) {
            handleAddToCart(targetProduct);
            // clear is handled in onSuccess of addToCart
        } else {
            toast.error("ບໍ່ພົບສິນຄ້າ");
            setBarcodeInput("");
        }
    };


    return (
        <div className="flex flex-col h-full gap-3">
            {/* Enhanced Search and Filter Bar */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* 1. Barcode Input (Auto-Focus) */}
                        <form onSubmit={handleBarcodeSubmit} className="relative flex-1 md:max-w-xs">
                            <ScanBarcode className="absolute left-3 top-2.5 h-5 w-5 text-indigo-500 z-10" />
                            <Input
                                ref={barcodeInputRef}
                                placeholder="ສະແກນບາໂຄດ..."
                                className="pl-10 h-10 border-indigo-200 focus:border-indigo-500 bg-indigo-50/50 text-lg font-bold text-indigo-700 placeholder:text-indigo-300/70"
                                value={barcodeInput}
                                onChange={(e) => {
                                    // Only allow clearing or pasting if needed, but keydown handles typing
                                    // OR: we can let onChange handle standard input if keydown didn't prevent default?
                                    // Better: if we preventDefault in keydown, onChange won't fire for those keys.
                                    // So onChange will only capture paste or unhandled keys.
                                    setBarcodeInput(e.target.value);
                                }}
                                onKeyDown={handleBarcodeKeyDown}
                                autoFocus
                            />
                        </form>

                        {/* 2. Text Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 z-10" />
                            <Input
                                placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ..."
                                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <ProductFilterBar
                            filters={filters}
                            onFilterChange={setFilters}
                        />

                        {/* View Mode Toggle */}
                        <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-2 transition-colors",
                                    viewMode === 'grid'
                                        ? "bg-indigo-600 text-white"
                                        : "bg-white text-slate-400 hover:bg-slate-50"
                                )}
                                title="Grid View"
                            >
                                <Grid3x3 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-2 transition-colors border-l border-slate-200",
                                    viewMode === 'list'
                                        ? "bg-indigo-600 text-white"
                                        : "bg-white text-slate-400 hover:bg-slate-50"
                                )}
                                title="List View"
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Product Grid/List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                        <p className="text-sm text-slate-500">ກຳລັງໂຫຼດສິນຄ້າ...</p>
                    </div>
                ) : products && products.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                            <Package className="h-16 w-16 text-slate-300 mb-3" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">ບໍ່ພົບສິນຄ້າ</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {searchTerm ? "ລອງຄົ້ນຫາດ້ວຍຄຳອື່ນ" : "ກະລຸນາເພີ່ມສິນຄ້າ"}
                            </p>
                        </CardContent>
                    </Card>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {products?.map((product: any, index: number) => (
                            <Card
                                key={product._id}
                                onClick={() => handleAddToCart(product)}
                                className={cn(
                                    "cursor-pointer transition-all hover:shadow-lg active:scale-95 group border-slate-200 hover:border-indigo-300 relative overflow-hidden",
                                    product.stock <= 0 && "opacity-50 cursor-not-allowed",
                                    loadingId === product._id && "pointer-events-none"
                                )}
                            >
                                {loadingId === product._id && (
                                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-200 border-t-indigo-600"></div>
                                    </div>
                                )}

                                {/* Best Seller Badge */}
                                {index < 3 && (product.soldCount || 0) > 0 && sortBy === 'best_selling' && (
                                    <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                        <Flame className="w-3 h-3 fill-white" />
                                        HOT
                                    </div>
                                )}

                                {/* Stock Badge */}
                                {product.stock <= 10 && product.stock > 0 && (
                                    <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                        ເຫຼືອ: {product.stock}
                                    </div>
                                )}

                                {product.stock <= 0 && (
                                    <div className="absolute inset-0 z-10 bg-slate-900/50 flex items-center justify-center">
                                        <div className="bg-red-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                                            ໝົດສະຕ໋ອກ
                                        </div>
                                    </div>
                                )}

                                <CardContent className="p-3 flex flex-col h-full">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] px-2 h-5">
                                                <Package className="h-3 w-3 mr-1" />
                                                {product.stock}
                                            </Badge>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                {product.unit || 'unit'}
                                            </span>
                                        </div>

                                        <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-snug group-hover:text-indigo-600 min-h-[2.5rem]">
                                            {product.name}
                                        </h3>

                                        <div className="flex flex-col gap-0.5">
                                            {product.barcode && (
                                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                                    {product.barcode}
                                                </p>
                                            )}
                                            {(product.soldCount || 0) > 0 && (
                                                <span className="text-[10px] text-emerald-600 font-medium">
                                                    ✓ ຂາຍແລ້ວ {product.soldCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-lg font-black text-indigo-600">
                                                    {product.sellPrice.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    ກີບ
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                                <Plus className="h-5 w-5 text-indigo-600 group-hover:text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    // List View
                    <div className="space-y-2">
                        {products?.map((product: any, index: number) => (
                            <Card
                                key={product._id}
                                onClick={() => handleAddToCart(product)}
                                className={cn(
                                    "cursor-pointer transition-all hover:shadow-md active:scale-[0.99] group border-slate-200 hover:border-indigo-300 relative",
                                    product.stock <= 0 && "opacity-50 cursor-not-allowed",
                                    loadingId === product._id && "pointer-events-none"
                                )}
                            >
                                {loadingId === product._id && (
                                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-200 border-t-indigo-600"></div>
                                    </div>
                                )}

                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600">
                                                    {product.name}
                                                </h3>
                                                {index < 3 && (product.soldCount || 0) > 0 && sortBy === 'best_selling' && (
                                                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                                                        <Flame className="w-3 h-3 mr-1 fill-white" />
                                                        HOT
                                                    </Badge>
                                                )}
                                                {product.stock <= 10 && product.stock > 0 && (
                                                    <Badge className="bg-orange-500 text-white">
                                                        ເຫຼືອ: {product.stock}
                                                    </Badge>
                                                )}
                                                {product.stock <= 0 && (
                                                    <Badge className="bg-red-500 text-white">
                                                        ໝົດສະຕ໋ອກ
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                {product.barcode && (
                                                    <span className="font-mono">{product.barcode}</span>
                                                )}
                                                <span>ສະຕ໋ອກ: {product.stock} {product.unit || 'unit'}</span>
                                                {(product.soldCount || 0) > 0 && (
                                                    <span className="text-emerald-600">ຂາຍແລ້ວ: {product.soldCount}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-indigo-600">
                                                {product.sellPrice.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-slate-400">ກີບ</div>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors flex-shrink-0">
                                            <Plus className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
