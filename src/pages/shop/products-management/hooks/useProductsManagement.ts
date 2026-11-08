import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateProductDto, Product, ProductFilters } from "@/api/products";
import { adjustProductStock, searchProducts } from "@/api/products";
import { getTenant } from "@/api/tenants";
import { useAuthStore } from "@/store/useAuthStore";
import {
    useCreateProduct,
    useDeleteProduct,
    useGetProducts,
    useTouchCategory,
    useTouchUnit,
    useUpdateProduct,
} from "@/hooks/useProducts";
import {
    createEmptyProductForm,
    createProductFormFromProduct,
    getProductStats,
    isBasicPlan,
    PRODUCT_FILTERS_KEY,
    PRODUCT_PAGE_LIMIT,
    PRODUCT_PAGE_KEY,
    PRODUCT_SEARCH_KEY,
    type ProductsResponse,
    type TenantSummary,
} from "../services/productManagementService";

const readSavedFilters = (): ProductFilters => {
    const saved = localStorage.getItem(PRODUCT_FILTERS_KEY);
    if (!saved) return {};

    try {
        return JSON.parse(saved) as ProductFilters;
    } catch {
        return {};
    }
};

export const useProductsManagement = () => {
    const queryClient = useQueryClient();
    const tenantId = useAuthStore((state) => state.user?.tenantId || state.user?.id);
    const pageKey = `${PRODUCT_PAGE_KEY}:${tenantId || "default"}`;
    const [page, setPage] = useState(() => {
        const savedPage = Number(sessionStorage.getItem(pageKey));
        return Number.isSafeInteger(savedPage) && savedPage > 0 ? savedPage : 1;
    });
    const [searchTerm, setSearchTerm] = useState(() => {
        return localStorage.getItem(PRODUCT_SEARCH_KEY) || "";
    });
    const [filters, setFilters] = useState<ProductFilters>(readSavedFilters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<CreateProductDto>(() => {
        return createEmptyProductForm();
    });
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [keepScanning, setKeepScanning] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
    const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);
    const [productsForPrint, setProductsForPrint] = useState<Product[]>([]);
    const [isBarcodePrinterOpen, setIsBarcodePrinterOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        localStorage.setItem(PRODUCT_SEARCH_KEY, searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        localStorage.setItem(PRODUCT_FILTERS_KEY, JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        sessionStorage.setItem(pageKey, String(page));
    }, [page, pageKey]);

    const productsQuery = useGetProducts(
        page,
        PRODUCT_PAGE_LIMIT,
        searchTerm,
        filters
    );
    const productsData = productsQuery.data as ProductsResponse | undefined;
    const { data: tenantData } = useQuery({
        queryKey: ["tenant", tenantId],
        queryFn: getTenant,
        staleTime: 60_000,
    });
    const tenant = tenantData as TenantSummary | undefined;
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();
    const touchCategoryMutation = useTouchCategory();
    const touchUnitMutation = useTouchUnit();

    const stats = useMemo(() => getProductStats(productsData), [productsData]);

    useEffect(() => {
        const lastPage = productsData?.pagination?.totalPages;
        if (lastPage !== undefined && page > Math.max(1, lastPage)) setPage(Math.max(1, lastPage));
    }, [page, productsData]);

    const resetFilters = () => {
        setSearchTerm("");
        setFilters({});
        localStorage.removeItem(PRODUCT_SEARCH_KEY);
        localStorage.removeItem(PRODUCT_FILTERS_KEY);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    const handleFilterChange = (nextFilters: ProductFilters) => {
        setFilters(nextFilters);
        setPage(1);
    };

    const handleStockCardClick = (stockLevel: "low" | "out") => {
        handleFilterChange({ ...filters, stockLevel: filters.stockLevel === stockLevel ? "all" : stockLevel });
    };

    const handleCreate = (barcode = "") => {
        setEditingProduct(null);
        setFormData(createEmptyProductForm(barcode));
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData(createProductFormFromProduct(product));
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("ຕ້ອງການລຶບສິນຄ້ານີ້ບໍ?")) {
            deleteProductMutation.mutate(id);
            return true;
        }
        return false;
    };

    const handleHistoryClick = (product: Product) => {
        setHistoryProduct(product);
        setIsHistoryModalOpen(true);
    };

    const handlePrintBarcode = (product: Product) => {
        setProductsForPrint([product]);
        setIsBarcodePrinterOpen(true);
    };

    const handleScanClick = () => {
        setIsScanModalOpen(true);
    };

    const handleBarcodeScanned = async (barcode: string, keepOpen = false) => {
        setIsScanning(true);
        setKeepScanning(keepOpen);

        try {
            const results = await searchProducts(barcode);
            const match = results.find((product: Product) => {
                return product.barcode === barcode;
            });

            setIsScanModalOpen(false);
            if (match) {
                setFoundProduct(match);
                setIsStockModalOpen(true);
                return;
            }

            handleCreate(barcode);
        } catch (error) {
            console.error(error);
            setIsScanModalOpen(false);
            handleCreate(barcode);
        } finally {
            setIsScanning(false);
        }
    };

    const handleStockUpdate = (
        productId: string,
        adjustment: number,
        type: string,
        note: string
    ) => {
        adjustProductStock(productId, { adjustment, type, note })
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ["products"] });
                setIsStockModalOpen(false);
                setFoundProduct(null);
                if (keepScanning) {
                    setTimeout(() => setIsScanModalOpen(true), 300);
                }
            })
            .catch((error: unknown) => {
                console.error("Failed to adjust stock", error);
            });
    };

    const handleStockCancel = () => {
        setIsStockModalOpen(false);
        setFoundProduct(null);
        setIsScanModalOpen(true);
    };

    const touchProductLookups = (data: CreateProductDto) => {
        if (data.category) touchCategoryMutation.mutate(data.category);
        if (data.unit) touchUnitMutation.mutate(data.unit);
    };

    const handleFormSubmit = (data: CreateProductDto) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        if (editingProduct) {
            updateProductMutation.mutate(
                { id: editingProduct._id, data },
                {
                    onSuccess: () => {
                        touchProductLookups(data);
                        setIsModalOpen(false);
                    },
                    onSettled: () => setIsSubmitting(false),
                }
            );
            return;
        }

        createProductMutation.mutate(data, {
            onSuccess: () => {
                touchProductLookups(data);
                setIsModalOpen(false);
                if (keepScanning) {
                    setTimeout(() => setIsScanModalOpen(true), 300);
                }
            },
            onSettled: () => setIsSubmitting(false),
        });
    };

    const handleOpenGlobalHistory = () => {
        if (isBasicPlan(tenant)) {
            toast.error("Upgrade Plan Required", {
                description:
                    "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນນີ້ (PRO/ENTERPRISE)",
            });
            return;
        }

        setIsGlobalHistoryOpen(true);
    };

    const handleRestrictedHistoryClick = (product: Product) => {
        if (isBasicPlan(tenant)) {
            toast.error("Upgrade Plan Required", {
                description:
                    "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນນີ້ (PRO/ENTERPRISE)",
            });
            return;
        }

        handleHistoryClick(product);
    };

    return {
        createProductMutation,
        deleteProductMutation,
        editingProduct,
        filters,
        formData,
        foundProduct,
        handleBarcodeScanned,
        handleCreate,
        handleDelete,
        handleEdit,
        handleFilterChange,
        handleFormSubmit,
        handleOpenGlobalHistory,
        handlePrintBarcode,
        handleRestrictedHistoryClick,
        handleScanClick,
        handleSearchChange,
        handleStockCancel,
        handleStockCardClick,
        handleStockUpdate,
        historyProduct,
        isBarcodePrinterOpen,
        isBasicPlan: isBasicPlan(tenant),
        isGlobalHistoryOpen,
        isHistoryModalOpen,
        isModalOpen,
        isScanModalOpen,
        isScanning,
        isStockModalOpen,
        isSubmitting,
        isLoading: productsQuery.isLoading,
        isError: productsQuery.isError,
        page,
        productsData,
        productsForPrint,
        resetFilters,
        retryProducts: productsQuery.refetch,
        searchTerm,
        setIsBarcodePrinterOpen,
        setIsGlobalHistoryOpen,
        setIsHistoryModalOpen,
        setIsModalOpen,
        setIsScanModalOpen,
        setIsStockModalOpen,
        setPage,
        stats,
        updateProductMutation,
    };
};
