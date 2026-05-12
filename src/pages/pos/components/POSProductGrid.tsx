import { useEffect, useMemo, useRef, useState } from "react";
import {
    Flame,
    Grid3x3,
    ImageIcon,
    List,
    Package,
    Plus,
    ScanBarcode,
    Search,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProducts, type Product, type ProductFilters } from "@/api/products";
import { useGetProducts } from "@/hooks/useProducts";
import { ProductFilterBar } from "@/pages/shop/components/ProductFilterBar";
import { useCart, useCartMutations } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { getProductSalePrice, isWholesalePriceFallback, saleModeConfig, type POSSaleMode } from "../posSaleMode";

interface POSProductGridProps {
    saleMode: POSSaleMode;
    isSaleModeSyncing?: boolean;
}

const getProductImage = (product: Product) => {
    return product.imageVariants?.[0]?.medium || product.imageVariants?.[0]?.small || product.images?.[0] || "";
};

function ProductImage({ product }: { product: Product }) {
    const imageUrl = getProductImage(product);

    if (!imageUrl) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                <ImageIcon className="h-10 w-10" />
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
        />
    );
}

export function POSProductGrid({ saleMode, isSaleModeSyncing = false }: POSProductGridProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [barcodeInput, setBarcodeInput] = useState("");
    const [filters, setFilters] = useState<ProductFilters>({ status: "active" });
    const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
        const saved = localStorage.getItem("posViewMode");
        return saved === "grid" || saved === "list" ? saved : "grid";
    });
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const sortBy = "best_selling";
    const activeFilters = useMemo(() => ({ ...filters, sort: sortBy }), [filters]);
    const { data: productsData, isLoading } = useGetProducts(1, 100, searchTerm, activeFilters);
    const { activeCart } = useCart();
    const { addToCart, isLoading: isCartLoading } = useCartMutations();
    const products: Product[] = productsData?.data || [];
    const theme = saleModeConfig[saleMode];

    useEffect(() => {
        localStorage.setItem("posViewMode", viewMode);
    }, [viewMode]);

    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    const handleAddToCart = (product: Product) => {
        if (isCartLoading || loadingId || isSaleModeSyncing) return;

        if (product.status === "inactive") {
            toast.error("ສິນຄ້າບໍ່ພ້ອມໃຊ້ງານ");
            return;
        }

        if (product.stock <= 0) {
            toast.error("ສິນຄ້າໝົດສະຕ໋ອກ");
            return;
        }

        const currentQty = activeCart?.items?.find((item) => item.product?._id === product._id)?.quantity || 0;
        if (currentQty + 1 > product.stock) {
            toast.error(`ບໍ່ສາມາດເພີ່ມໄດ້ເນື່ອງຈາກເກີນຈຳນວນສະຕ໋ອກ (ມີທັງໝົດ ${product.stock})`);
            return;
        }

        setLoadingId(product._id);
        addToCart(
            {
                productId: product._id,
                quantity: 1,
                price: getProductSalePrice(product, saleMode),
            },
            {
                onSuccess: () => {
                    toast.success(`ເພີ່ມ ${product.name} ແລ້ວ`);
                    setLoadingId(null);
                    setBarcodeInput("");
                    barcodeInputRef.current?.focus();
                },
                onError: () => {
                    setLoadingId(null);
                    barcodeInputRef.current?.focus();
                },
            }
        );
    };

    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (["Enter", "Backspace", "Tab"].includes(e.key)) return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        let char = "";
        if (e.code.startsWith("Digit")) char = e.code.replace("Digit", "");
        if (e.code.startsWith("Key")) char = e.code.replace("Key", "").toLowerCase();
        if (e.code === "Minus") char = "-";
        if (e.code === "Equal") char = "=";
        if (e.code.startsWith("Numpad") && e.code.length === 7) char = e.code.replace("Numpad", "");

        if (char) {
            e.preventDefault();
            setBarcodeInput((prev) => prev + char);
        }
    };

    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput) return;

        let targetProduct = products.find((product) => product.barcode === barcodeInput);

        if (!targetProduct) {
            try {
                const result = await getProducts(1, 1, barcodeInput, { status: "active" });
                targetProduct = result.data?.find((product: Product) => product.barcode === barcodeInput) || result.data?.[0];
            } catch (error) {
                console.error("Scan lookup failed", error);
            }
        }

        if (targetProduct) {
            handleAddToCart(targetProduct);
            return;
        }

        toast.error("ບໍ່ພົບສິນຄ້າ");
        setBarcodeInput("");
    };

    return (
        <div className="flex h-full flex-col gap-2">
            <div className={cn("rounded-lg")}>
                <div className="flex flex-col gap-2 px-2.5 py-2 lg:flex-row lg:items-center">
                   

                    <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[minmax(180px,0.42fr)_minmax(260px,1fr)]">
                        <form onSubmit={handleBarcodeSubmit} className="relative min-w-0">
                            <ScanBarcode className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", theme.accentText)} />
                            <Input
                                ref={barcodeInputRef}
                                placeholder="ສະແກນບາໂຄດ..."
                                className={cn("h-10 rounded-md border-slate-300 bg-white pl-9 text-sm font-bold shadow-sm shadow-slate-100 placeholder:text-slate-400", theme.accentText)}
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                autoFocus
                            />
                        </form>
                        <div className="relative min-w-0">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ບາໂຄດ, ຍີ່ຫໍ້..."
                                className="h-10 rounded-md border-slate-300 bg-white pl-9 pr-8 text-sm font-medium shadow-sm shadow-slate-100"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 hover:text-slate-700"
                                >
                                    x
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <ProductFilterBar filters={filters} onFilterChange={setFilters} />
                        <div className="flex overflow-hidden rounded-md border border-slate-200 bg-white">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode("grid")}
                                className={cn("h-10 w-10 rounded-none", viewMode === "grid" && `${theme.activeBg} text-white hover:text-white`)}
                                title="Grid View"
                            >
                                <Grid3x3 className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode("list")}
                                className={cn("h-10 w-10 rounded-none border-l border-slate-200", viewMode === "list" && `${theme.activeBg} text-white hover:text-white`)}
                                title="List View"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                        <p className="text-sm text-slate-500">ກຳລັງໂຫຼດສິນຄ້າ...</p>
                    </div>
                ) : products.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex h-64 flex-col items-center justify-center p-6 text-center">
                            <Package className="mb-3 h-16 w-16 text-slate-300" />
                            <h3 className="mb-1 text-lg font-semibold text-slate-700">ບໍ່ພົບສິນຄ້າ</h3>
                            <p className="text-sm text-slate-500">{searchTerm ? "ລອງຄົ້ນຫາດ້ວຍຄຳອື່ນ" : "ກະລຸນາເພີ່ມສິນຄ້າ"}</p>
                        </CardContent>
                    </Card>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
                        {products.map((product, index) => (
                            <ProductCard
                                key={product._id}
                                index={index}
                                isLoading={loadingId === product._id}
                                onClick={() => handleAddToCart(product)}
                                product={product}
                                saleMode={saleMode}
                                sortBy={sortBy}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {products.map((product, index) => (
                            <ProductListRow
                                key={product._id}
                                index={index}
                                isLoading={loadingId === product._id}
                                onClick={() => handleAddToCart(product)}
                                product={product}
                                saleMode={saleMode}
                                sortBy={sortBy}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface ProductDisplayProps {
    index: number;
    isLoading: boolean;
    onClick: () => void;
    product: Product;
    saleMode: POSSaleMode;
    sortBy: string;
}

function ProductCard({ index, isLoading, onClick, product, saleMode, sortBy }: ProductDisplayProps) {
    const price = getProductSalePrice(product, saleMode);
    const theme = saleModeConfig[saleMode];

    return (
        <Card
            onClick={onClick}
            className={cn(
                "group relative cursor-pointer overflow-hidden rounded-md border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]",
                theme.hoverBorder,
                product.stock <= 0 && "cursor-not-allowed opacity-50",
                isLoading && "pointer-events-none"
            )}
        >
            {isLoading && <LoadingOverlay />}
            <div className="relative aspect-[4/3] overflow-hidden bg-white">
                <ProductImage product={product} />
            </div>

            <CardContent className="flex min-h-[96px] flex-col p-1.5">
                <div className="mb-1 flex items-center justify-between gap-1">
                    <Badge variant="secondary" className="h-4 bg-slate-100 px-1 text-[9px] text-slate-600">
                        <Package className="mr-0.5 h-2.5 w-2.5" />
                        {product.stock}
                    </Badge>
                    <div className="flex min-w-0 items-center gap-1">
                        {index < 3 && (product.soldCount || 0) > 0 && sortBy === "best_selling" && (
                            <Badge className="h-4 border-0 bg-orange-500 px-1 text-[9px] text-white">
                                <Flame className="mr-0.5 h-2 w-2 fill-white" />
                                HOT
                            </Badge>
                        )}
                        {product.stock <= 0 && <Badge className="h-4 bg-red-500 px-1 text-[9px] text-white">ໝົດ</Badge>}
                        <span className="truncate text-[9px] font-medium text-slate-400">{product.unit || "unit"}</span>
                    </div>
                </div>

                <h3 className={cn("line-clamp-2 min-h-[30px] text-[11px] font-bold leading-snug text-slate-900", saleMode === "wholesale" ? "group-hover:text-emerald-800" : "group-hover:text-sky-800")}>
                    {product.name}
                </h3>
                <p className="truncate font-mono text-[9px] text-slate-400">{product.barcode || "-"}</p>

                <div className="mt-auto flex items-end justify-between gap-1.5 border-t border-slate-100 pt-1.5">
                    <div className="min-w-0">
                        {isWholesalePriceFallback(product, saleMode) && (
                            <p className="mb-0.5 text-[9px] font-semibold text-amber-600">ໃຊ້ລາຄາປີກ</p>
                        )}
                        <p className={cn("text-sm font-black", theme.accentText)}>
                            {price.toLocaleString()}
                        </p>
                    </div>
                    <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors group-hover:text-white", theme.buttonSoft, saleMode === "wholesale" ? "group-hover:bg-emerald-600" : "group-hover:bg-sky-600")}>
                        <Plus className="h-3.5 w-3.5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ProductListRow({ index, isLoading, onClick, product, saleMode, sortBy }: ProductDisplayProps) {
    const price = getProductSalePrice(product, saleMode);
    const theme = saleModeConfig[saleMode];

    return (
        <Card
            onClick={onClick}
            className={cn(
                "group relative cursor-pointer overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.99]",
                theme.hoverBorder,
                product.stock <= 0 && "cursor-not-allowed opacity-50",
                isLoading && "pointer-events-none"
            )}
        >
            {isLoading && <LoadingOverlay />}
            <CardContent className="flex items-center gap-2 p-2">
                <div className="h-14 w-16 shrink-0 overflow-hidden rounded-md border border-slate-100 bg-slate-100">
                    <ProductImage product={product} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                        <h3 className={cn("line-clamp-1 text-sm font-bold text-slate-900", saleMode === "wholesale" ? "group-hover:text-emerald-800" : "group-hover:text-sky-800")}>{product.name}</h3>
                        {index < 3 && (product.soldCount || 0) > 0 && sortBy === "best_selling" && (
                            <Badge className="border-0 bg-orange-500 text-white">
                                <Flame className="mr-1 h-3 w-3 fill-white" />
                                HOT
                            </Badge>
                        )}
                        {product.stock <= 0 && <Badge className="bg-red-500 text-white">ໝົດສະຕ໋ອກ</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span className="font-mono">{product.barcode || "-"}</span>
                        <span>ສະຕ໋ອກ: {product.stock} {product.unit || "unit"}</span>
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    {isWholesalePriceFallback(product, saleMode) && (
                        <p className="text-[10px] font-semibold text-amber-600">ໃຊ້ລາຄາປີກ</p>
                    )}
                    <p className={cn("text-lg font-black", theme.accentText)}>
                        {price.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">LAK</p>
                </div>
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors group-hover:text-white", theme.buttonSoft, saleMode === "wholesale" ? "group-hover:bg-emerald-600" : "group-hover:bg-sky-600")}>
                    <Plus className="h-4 w-4" />
                </div>
            </CardContent>
        </Card>
    );
}

function LoadingOverlay() {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
    );
}
