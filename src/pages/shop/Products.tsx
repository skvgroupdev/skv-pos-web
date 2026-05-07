import { useState, useEffect, useMemo } from "react";
import { useGetProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useTouchCategory, useTouchUnit } from "@/hooks/useProducts";
import type { Product, CreateProductDto, ProductFilters } from "@/api/products";
import { searchProducts, adjustProductStock } from "@/api/products";
import { getTenant } from "@/api/tenants";
import { Plus, Pencil, Trash2, Search, History, ChevronLeft, ChevronRight, Crown, Printer, TrendingUp, Box, CreditCard, AlertTriangle, RotateCcw } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductForm } from "./components/ProductForm";
import { BarcodeScannerModal } from "./components/BarcodeScannerModal";
import { StockUpdateModal } from "./components/StockUpdateModal";
import { ProductHistoryModal } from "./components/ProductHistoryModal";
import { InventoryHistoryModal } from "./components/InventoryHistoryModal";
import { ProductFilterBar } from "./components/ProductFilterBar";
import { BarcodePrinter } from "@/components/BarcodePrinter";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function ShopProducts() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    
    // Load persisted search and filters
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('product-search') || "");
    const [filters, setFilters] = useState<ProductFilters>(() => {
        const saved = localStorage.getItem('product-filters');
        return saved ? JSON.parse(saved) : {};
    });

    // Handle persistence
    useEffect(() => {
        localStorage.setItem('product-search', searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        localStorage.setItem('product-filters', JSON.stringify(filters));
    }, [filters]);

    const { data: productsData, isLoading } = useGetProducts(page, limit, searchTerm, filters);

    const { data: tenant } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });


    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();
    const touchCategoryMutation = useTouchCategory();
    const touchUnitMutation = useTouchUnit();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<CreateProductDto>({
        name: "",
        category: "",
        costPrice: 0,
        costCurrency: "LAK",
        sellPrice: 0,
        wholesalePrice: 0,
        stock: 0,
        minStock: 0,
        unit: "",
        barcode: "",
        brand: "",
        modelName: "",
        status: "active",
        description: "",
        supplier: "",
        sku: "",
        catalog: {
            No: "",
            code: "",
            page: "",
            number: ""
        },
    });

    // Modal States
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [keepScanning, setKeepScanning] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
    const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);
    
    // Barcode individual print state
    const [productsForPrint, setProductsForPrint] = useState<Product[]>([]);
    const [isBarcodePrinterOpen, setIsBarcodePrinterOpen] = useState(false);

    const handlePrintBarcode = (product: Product) => {
        setProductsForPrint([product]);
        setIsBarcodePrinterOpen(true);
    };

    const resetFilters = () => {
        setSearchTerm("");
        setFilters({});
        localStorage.removeItem('product-search');
        localStorage.removeItem('product-filters');
        setPage(1);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        const initial: CreateProductDto = {
            name: product.name,
            category: product.category || "",
            costPrice: product.costPrice,
            costCurrency: product.costCurrency || "LAK",
            sellPrice: product.sellPrice,
            wholesalePrice: product.wholesalePrice || 0,
            stock: product.stock,
            unit: product.unit,
            barcode: product.barcode || "",
            brand: product.brand || "",
            modelName: product.modelName || "",
            status: product.status || "active",
            description: product.description || "",
            supplier: product.supplier || "",
            sku: product.sku || "",
            minStock: product.minStock || 0,
            images: product.images || [],
            catalog: {
                No: product.catalog?.No || "",
                code: product.catalog?.code || "",
                page: product.catalog?.page || "",
                number: product.catalog?.number || ""
            },
        };
        setFormData(initial);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            deleteProductMutation.mutate(id);
        }
    };

    const handleHistoryClick = (product: Product) => {
        setHistoryProduct(product);
        setIsHistoryModalOpen(true);
    };

    // const handlePrintBarcodes = (products?: Product[]) => {
    //     const toPrint = products || productsData?.data || [];
    //     setProductsForPrint(toPrint);
    //     setIsBarcodePrinterOpen(true);
    // };

    const handleScanClick = () => {
        setIsScanModalOpen(true);
    };

    const [isScanning, setIsScanning] = useState(false);

    const handleBarcodeScanned = async (barcode: string, keepOpen = false) => {
        // Do not close immediately, show loading first
        setIsScanning(true);
        setKeepScanning(keepOpen); // Store the preference

        try {
            const results = await searchProducts(barcode);
            // Check if exact match found
            const match = results.find((p: Product) => p.barcode === barcode);

            // Close scan modal only after search is done
            setIsScanModalOpen(false); // We close it to open the next modal or create form

            if (match) {
                setFoundProduct(match);
                setIsStockModalOpen(true);
            } else {
                // Not found -> Open Create Form with pre-filled barcode
                handleCreate(barcode);
            }
        } catch (error) {
            console.error(error);
            setIsScanModalOpen(false);
            // On error or not found, proceed to create
            handleCreate(barcode);
        } finally {
            setIsScanning(false);
        }
    };

    const handleStockUpdate = (productId: string, adjustment: number, type: string, note: string) => {
        adjustProductStock(productId, { adjustment, type, note }).then(() => {

            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsStockModalOpen(false);
            setFoundProduct(null);
            if (keepScanning) {
                setTimeout(() => setIsScanModalOpen(true), 300);
            }
        }).catch((err: any) => {
            console.error("Failed to adjust stock", err);
            // Optionally show toast error
        });
    };

    const handleStockCancel = () => {
        setIsStockModalOpen(false);
        setFoundProduct(null);
        setIsScanModalOpen(true);
    };

    const handleCreate = (barcode?: string) => {
        setEditingProduct(null);
        setFormData({
            name: "",
            category: "",
            costPrice: 0,
            costCurrency: "LAK",
            sellPrice: 0,
            wholesalePrice: 0,
            stock: 0,
            unit: "",
            barcode: barcode || "",
            brand: "",
            modelName: "",
            status: "active",
            description: "",
            supplier: "",
            sku: "",
            minStock: 0,
            images: [],
            catalog: {
                No: "",
                code: "",
                page: "",
                number: ""
            },
        });
        setIsModalOpen(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFormSubmit = (data: CreateProductDto) => {
        if (isSubmitting) return; // improved debounce/guard
        setIsSubmitting(true);

        if (editingProduct) {
            updateProductMutation.mutate({ id: editingProduct._id, data }, {
                onSuccess: () => {
                    // Update usage timestamps
                    if (data.category) touchCategoryMutation.mutate(data.category);
                    if (data.unit) touchUnitMutation.mutate(data.unit);
                    setIsModalOpen(false)
                },
                onSettled: () => setIsSubmitting(false)
            });
        } else {
            createProductMutation.mutate(data, {
                onSuccess: () => {
                    // Update usage timestamps
                    if (data.category) touchCategoryMutation.mutate(data.category);
                    if (data.unit) touchUnitMutation.mutate(data.unit);

                    setIsModalOpen(false);
                    // Re-open scan modal if keepScanning is true (only for new creation)
                    if (keepScanning) {
                        setTimeout(() => setIsScanModalOpen(true), 300);
                    }
                },
                onSettled: () => setIsSubmitting(false)
            });
        }
    }

    const stats = useMemo(() => {
        const prodList = productsData?.data || [];
        const totalProducts = productsData?.pagination?.total || prodList.length;
        const lowStock = prodList.filter((p: any) => p.stock <= (p.minStock || 0)).length;
        const totalValue = prodList.reduce((sum: number, p: any) => sum + (p.costPrice * p.stock), 0);
        const potentialProfit = prodList.reduce((sum: number, p: any) => sum + ((p.sellPrice - p.costPrice) * p.stock), 0);

        return { totalProducts, lowStock, totalValue, potentialProfit };
    }, [productsData]);

    const formatCurrency = (val: number) => `₭${val?.toLocaleString() || 0}`;

    return (
        <div className="p-4 space-y-6 bg-slate-50/50 min-h-screen font-lao flex flex-col">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ສິນຄ້າທັງໝົດ</p>
                                <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalProducts.toLocaleString()}</p>
                            </div>
                            <Box className="w-10 h-10 text-indigo-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ສິນຄ້າໃກ້ໝົດ</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{stats.lowStock.toLocaleString()}</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ມູນຄ່າສິນຄ້າລວມ</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalValue)}</p>
                            </div>
                            <CreditCard className="w-10 h-10 text-emerald-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">ກຳໄລຄາດໝາຍ</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.potentialProfit)}</p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-blue-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Header Actions */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex gap-2 items-center flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="search"
                            placeholder="ຄົ້ນຫາບາໂຄດ ຫຼື ຊື່ສິນຄ້າ..."
                            className="pl-9 bg-slate-50 border-slate-200"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <ProductFilterBar filters={filters} onFilterChange={(f) => { setFilters(f); setPage(1); }} />
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-slate-500">
                        <RotateCcw className="w-4 h-4 mr-2" /> ລ້າງຄ່າ
                    </Button>
                </div>
                <div className="flex gap-2 items-center ml-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (tenant?.subscriptionPlan === 'BASIC') {
                                toast.error("Upgrade Plan Required", {
                                    description: "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນນີ້ (PRO/ENTERPRISE)"
                                });
                            } else {
                                setIsGlobalHistoryOpen(true);
                            }
                        }}
                        className={`h-10 border-slate-200 text-slate-600 bg-white relative overflow-hidden group ${tenant?.subscriptionPlan === 'BASIC' ? 'opacity-70 cursor-not-allowed' : 'hover:text-indigo-600'}`}
                    >
                        <History size={18} className="mr-2" />
                        <span>ປະຫວັດສາງ</span>
                        {tenant?.subscriptionPlan === 'BASIC' && (
                            <Crown className="w-3 h-3 text-yellow-500 absolute top-1 right-1" />
                        )}
                    </Button>
                    <Button onClick={handleScanClick} className="bg-indigo-600 text-white hover:bg-indigo-700 h-10 shadow-sm gap-2">
                        <Plus size={20} /> ເພີ່ມສິນຄ້າ
                    </Button>
                </div>
            </div>

            {/* Sub Header */}
            <div className="bg-slate-100 p-2 rounded-t-lg border-b border-white flex items-center gap-2">
                <div className="h-4 w-1 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-slate-600">ລາຍຊື່ສິນຄ້າ</span>
            </div>



            {/* Table Container - Modified for Scroll */}
            <div className="flex-1 bg-white rounded-lg shadow overflow-hidden border border-slate-200 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto relative">
                    <table className="w-full">
                        <thead className="bg-indigo-600 text-white sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium w-16 bg-indigo-600">#</th>
                                <th className="py-3 px-4 text-left font-medium bg-indigo-600">ບາໂຄດ</th>
                                <th className="py-3 px-4 text-left font-medium bg-indigo-600">ຊື່ສິນຄ້າ</th>
                                <th className="py-3 px-4 text-left font-medium bg-indigo-600">ໝວດໝູ່</th>
                                <th className="py-3 px-4 text-right font-medium bg-indigo-600">ຕົ້ນທຶນ</th>
                                <th className="py-3 px-4 text-right font-medium bg-indigo-600">ລາຄາຂາຍ</th>
                                {/* <th className="py-3 px-4 text-right font-medium bg-indigo-600">ຂາຍສົ່ງ</th> */}
                                <th className="py-3 px-4 text-center font-medium bg-indigo-600">ຈຳນວນ</th>
                                <th className="py-3 px-4 text-center font-medium bg-indigo-600">ໜ່ວຍ</th>
                                <th className="py-3 px-4 text-center font-medium bg-indigo-600">ສະຖານະ</th>
                                <th className="py-3 px-4 text-center font-medium bg-indigo-600">ຈັດການ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-20 text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            <p>ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : productsData?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-20 text-slate-500">ບໍ່ມີຂໍ້ມູນສິນຄ້າ</td>
                                </tr>
                            ) : (
                                productsData?.data?.map((product: Product, index: number) => (
                                    <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4 text-slate-500 text-sm">{(page - 1) * limit + index + 1}</td>
                                        <td className="py-3 px-4 text-slate-600 font-mono text-sm">{product.barcode || "-"}</td>
                                        <td className="py-3 px-4 text-slate-800 font-medium">{product.name}</td>
                                        <td className="py-3 px-4 text-slate-600">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">
                                                {product.category || "-"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-600">
                                            {product.costPrice.toLocaleString()} <span className="text-xs text-slate-400">{product.costCurrency}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-green-600 font-medium">{product.sellPrice.toLocaleString()}</td>
                                        {/* <td className="py-3 px-4 text-right text-blue-600 font-medium">{(product.wholesalePrice || 0).toLocaleString()}</td> */}
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock <= (product?.minStock || 0) ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center text-slate-600">{product.unit}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`w-2 h-2 rounded-full inline-block mr-1 ${product.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                            {/* <span className="text-xs text-slate-500 capitalize">{product.status}</span> */}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handlePrintBarcode(product)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                                                    title="Print Barcode"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (tenant?.subscriptionPlan === 'BASIC') {
                                                            toast.error("Upgrade Plan Required", {
                                                                description: "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນນີ້ (PRO/ENTERPRISE)"
                                                            });
                                                        } else {
                                                            handleHistoryClick(product);
                                                        }
                                                    }}
                                                    className={`p-1.5 transition-colors relative group ${tenant?.subscriptionPlan === 'BASIC'
                                                        ? 'text-slate-300 cursor-not-allowed'
                                                        : 'text-slate-400 hover:text-blue-600'
                                                        }`}
                                                    title={tenant?.subscriptionPlan === 'BASIC' ? "Upgrade to PRO to view history" : "View History"}
                                                >
                                                    <History size={18} />
                                                    {tenant?.subscriptionPlan === 'BASIC' && (
                                                        <Crown className="w-2.5 h-2.5 text-yellow-500 absolute -top-1 -right-1" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {!isLoading && productsData?.pagination && (
                    <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between shrink-0">
                        <div className="text-sm text-slate-500">
                            ສະແດງ {(page - 1) * limit + 1} ຫາ {Math.min(page * limit, productsData.pagination.total)} ຈາກທັງໝົດ {productsData.pagination.total} ລາຍການ
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-8 px-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1 px-2">
                                <span className="text-sm font-medium text-slate-700">ໜ້າ {page} / {productsData.pagination.totalPages}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(productsData.pagination.totalPages, p + 1))}
                                disabled={page >= productsData.pagination.totalPages}
                                className="h-8 px-2"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    className="max-w-[900px] w-[90vw] max-h-[90vh] flex flex-col p-0 gap-0 bg-slate-50 overflow-hidden"
                >
                    <DialogHeader className="p-6 pb-4 bg-white border-b flex-shrink-0 pr-10">
                        <DialogTitle>{editingProduct ? "ແກ້ໄຂຂໍ້ມູນສິນຄ້າ" : "ເພີ່ມສິນຄ້າໃໝ່"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6">
                        <ProductForm
                            initialData={formData}
                            onSubmit={handleFormSubmit}
                            onCancel={() => setIsModalOpen(false)}
                            key={editingProduct ? editingProduct._id : 'new'}
                            isLoading={createProductMutation.isPending || updateProductMutation.isPending}
                        />
                    </div>
                    {/* Footer is handled inside Form since we moved control there, 
                        or we can keep it here but we need to trigger form submit. 
                        Given the previous file content showed Footer here, 
                        I should probably pass the isLoading prop to the buttons here if I keep them.
                        Wait, in the previous `ProductForm` view, it had `<form id="product-form" ...>`.
                        And the footer here has `<Button form="product-form" ...>`.
                        So the footer IS here.
                        I will update the footer to use the loading state.
                    */}
                    <DialogFooter className="p-4 bg-white border-t flex-shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            ຍົກເລີກ
                        </Button>
                        <Button
                            type="submit"
                            form="product-form"
                            className="bg-indigo-600 text-white hover:bg-indigo-700 min-w-32"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> ພວມບັນທຶກ...</>
                            ) : (
                                editingProduct ? "ບັນທຶກການແກ້ໄຂ" : "ເພີ່ມສິນຄ້າໃໝ່"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BarcodeScannerModal
                isOpen={isScanModalOpen}
                onClose={() => setIsScanModalOpen(false)}
                onBarcodeScanned={handleBarcodeScanned}
                isLoading={isScanning}
            />

            <StockUpdateModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                product={foundProduct}
                onConfirm={handleStockUpdate}
                onCancel={handleStockCancel}
                onEdit={(product) => {
                    setIsStockModalOpen(false);
                    handleEdit(product);
                }}
            />

            <ProductHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                productId={historyProduct?._id || null}
                productName={historyProduct?.name || ""}
            />

            <InventoryHistoryModal
                isOpen={isGlobalHistoryOpen}
                onClose={() => setIsGlobalHistoryOpen(false)}
            />

            <BarcodePrinter
                isOpen={isBarcodePrinterOpen}
                onClose={() => setIsBarcodePrinterOpen(false)}
                products={productsForPrint}
            />
        </div>
    );
}

