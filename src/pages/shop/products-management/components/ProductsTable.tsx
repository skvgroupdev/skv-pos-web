import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, History, Pencil, Printer, Trash2 } from "lucide-react";
import type { Product } from "@/api/products";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PRODUCT_PAGE_LIMIT, type ProductsResponse } from "../services/productManagementService";

interface ProductsTableProps {
    isBasicPlan: boolean;
    isError: boolean;
    isLoading: boolean;
    onDelete: (id: string) => boolean;
    onEdit: (product: Product) => void;
    onHistoryClick: (product: Product) => void;
    onPageChange: (page: number) => void;
    onPrintBarcode: (product: Product) => void;
    onRetry: () => void;
    page: number;
    productsData?: ProductsResponse;
}

export function ProductsTable({
    isBasicPlan,
    isError,
    isLoading,
    onDelete,
    onEdit,
    onHistoryClick,
    onPageChange,
    onPrintBarcode,
    onRetry,
    page,
    productsData,
}: ProductsTableProps) {
    const products = productsData?.data || [];
    const pagination = productsData?.pagination;
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const tableScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        tableScrollRef.current?.scrollTo({ top: 0 });
    }, [page]);

    const runAction = (action: (product: Product) => void) => {
        if (!selectedProduct) return;
        action(selectedProduct);
        setSelectedProduct(null);
    };

    return (
        <>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div ref={tableScrollRef} className="min-w-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[1050px] table-fixed text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                            <tr>
                                <th scope="col" className="w-[5%] px-3 py-3 text-center font-semibold">#</th>
                                <th scope="col" className="w-[22%] px-3 py-3 text-left font-semibold">ສິນຄ້າ</th>
                                <th scope="col" className="w-[16%] px-3 py-3 text-left font-semibold">ບາໂຄດ</th>
                                <th scope="col" className="w-[13%] px-3 py-3 text-right font-semibold">ລາຄາຕົ້ນທຶນ</th>
                                <th scope="col" className="w-[12%] px-3 py-3 text-right font-semibold">ລາຄາຂາຍ</th>
                                <th scope="col" className="w-[12%] px-3 py-3 text-right font-semibold">ລາຄາຂາຍສົ່ງ</th>
                                <th scope="col" className="w-[8%] px-3 py-3 text-center font-semibold">ຈຳນວນ</th>
                                <th scope="col" className="sticky right-0 z-20 w-[12%] border-l border-slate-200 bg-slate-100 px-3 py-3 text-right font-semibold">ຂໍ້ມູນ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-600">ກຳລັງໂຫຼດສິນຄ້າ...</td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-600">
                                        <p>ໂຫຼດລາຍການສິນຄ້າບໍ່ສຳເລັດ</p>
                                        <Button variant="outline" className="mt-3" onClick={onRetry}>ລອງອີກຄັ້ງ</Button>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-600">ບໍ່ພົບສິນຄ້າ</td>
                                </tr>
                            ) : (
                                products.map((product, index) => {
                                    const isOutOfStock = product.stock <= 0;
                                    const isLowStock = !isOutOfStock && product.stock < (product.minStock && product.minStock > 0 ? product.minStock : 2);
                                    const stockStatus = isOutOfStock ? "ໝົດ" : isLowStock ? "ເຫຼືອນ້ອຍ" : "ປົກກະຕິ";

                                    return (
                                        <tr key={product._id} className="hover:bg-slate-50">
                                            <td className="px-3 py-3 text-center tabular-nums text-slate-500">{(page - 1) * PRODUCT_PAGE_LIMIT + index + 1}</td>
                                            <td className="px-3 py-3 align-middle">
                                                <p className="break-words font-medium text-slate-900">{product.name}</p>
                                                {product.category && <p className="mt-1 break-words text-xs text-slate-600">{product.category}</p>}
                                            </td>
                                            <td className="break-all px-3 py-3 font-mono text-xs text-slate-700">{product.barcode || "—"}</td>
                                            <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-700">
                                                {product.costPrice.toLocaleString()} {product.costCurrency || "LAK"}
                                            </td>
                                            <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-800">
                                                {product.sellPrice.toLocaleString()} ₭
                                            </td>
                                            <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-700">
                                                {(product.wholesalePrice || 0).toLocaleString()} ₭
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span
                                                    title={stockStatus}
                                                    className={`inline-flex min-w-10 justify-center rounded-md px-2 py-1 font-semibold tabular-nums ${
                                                        isOutOfStock
                                                            ? "bg-red-100 text-red-800"
                                                            : isLowStock
                                                              ? "bg-amber-100 text-amber-900"
                                                              : "bg-emerald-100 text-emerald-900"
                                                    }`}
                                                >
                                                    {product.stock.toLocaleString()}
                                                    <span className="sr-only"> {product.unit} · {stockStatus}</span>
                                                </span>
                                            </td>
                                            <td className="sticky right-0 z-[1] border-l border-slate-100 bg-white px-3 py-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10"
                                                    onClick={() => setSelectedProduct(product)}
                                                    aria-label={`ລາຍລະອຽດ ${product.name}`}
                                                >
                                                    ລາຍລະອຽດ
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && pagination && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-600">
                            ສະແດງ {pagination.total === 0 ? 0 : (page - 1) * PRODUCT_PAGE_LIMIT + 1} ຫາ{" "}
                            {Math.min(page * PRODUCT_PAGE_LIMIT, pagination.total)} ຈາກ {pagination.total} ລາຍການ
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="ໜ້າກ່ອນ">
                                <ChevronLeft aria-hidden="true" />
                            </Button>
                            <span className="min-w-20 text-center text-sm font-medium text-slate-700">ໜ້າ {page} / {pagination.totalPages}</span>
                            <Button variant="outline" size="icon" onClick={() => onPageChange(Math.min(pagination.totalPages, page + 1))} disabled={page >= pagination.totalPages} aria-label="ໜ້າຕໍ່ໄປ">
                                <ChevronRight aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
                {selectedProduct && (
                    <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
                        <DialogHeader className="pr-8">
                            <DialogTitle className="break-words leading-relaxed">{selectedProduct.name}</DialogTitle>
                            <DialogDescription>ຂໍ້ມູນສິນຄ້າ ແລະ ການຈັດການ</DialogDescription>
                        </DialogHeader>

                        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div><dt className="text-slate-500">ບາໂຄດ</dt><dd className="mt-1 break-words font-medium text-slate-900">{selectedProduct.barcode || "-"}</dd></div>
                            <div><dt className="text-slate-500">ໝວດໝູ່</dt><dd className="mt-1 break-words font-medium text-slate-900">{selectedProduct.category || "-"}</dd></div>
                            <div><dt className="text-slate-500">ລາຄາຂາຍ</dt><dd className="mt-1 font-semibold tabular-nums text-slate-900">{selectedProduct.sellPrice.toLocaleString()} ₭</dd></div>
                            <div><dt className="text-slate-500">ລາຄາຂາຍສົ່ງ</dt><dd className="mt-1 font-medium tabular-nums text-slate-900">{(selectedProduct.wholesalePrice || 0).toLocaleString()} ₭</dd></div>
                            <div><dt className="text-slate-500">ຕົ້ນທຶນ</dt><dd className="mt-1 font-medium tabular-nums text-slate-900">{selectedProduct.costPrice.toLocaleString()} {selectedProduct.costCurrency || "LAK"}</dd></div>
                            <div><dt className="text-slate-500">ຈຳນວນໃນສາງ</dt><dd className="mt-1 font-medium tabular-nums text-slate-900">{selectedProduct.stock.toLocaleString()} {selectedProduct.unit}</dd></div>
                            <div><dt className="text-slate-500">ເຕືອນເມື່ອຕ່ຳກວ່າ</dt><dd className="mt-1 font-medium tabular-nums text-slate-900">{selectedProduct.minStock && selectedProduct.minStock > 0 ? selectedProduct.minStock : 2}</dd></div>
                            <div><dt className="text-slate-500">ສະຖານະຂາຍ</dt><dd className="mt-1 font-medium text-slate-900">{selectedProduct.status === "active" ? "ຂາຍຢູ່" : "ຢຸດຂາຍ"}</dd></div>
                            {selectedProduct.sku && <div><dt className="text-slate-500">SKU</dt><dd className="mt-1 break-words font-medium text-slate-900">{selectedProduct.sku}</dd></div>}
                            {selectedProduct.brand && <div><dt className="text-slate-500">ຍີ່ຫໍ້</dt><dd className="mt-1 break-words font-medium text-slate-900">{selectedProduct.brand}</dd></div>}
                        </dl>

                        {selectedProduct.description && <p className="border-t pt-4 text-sm leading-relaxed text-slate-700">{selectedProduct.description}</p>}

                        <div className="flex flex-wrap gap-2 border-t pt-4">
                            <Button onClick={() => runAction(onEdit)}><Pencil aria-hidden="true" /> ແກ້ໄຂ</Button>
                            <Button variant="outline" onClick={() => runAction(onHistoryClick)}>
                                <History aria-hidden="true" /> ປະຫວັດ {isBasicPlan && <span className="text-xs text-amber-800">PRO</span>}
                            </Button>
                            <Button variant="outline" disabled={!selectedProduct.barcode} onClick={() => runAction(onPrintBarcode)}>
                                <Printer aria-hidden="true" /> ພິມບາໂຄດ
                            </Button>
                            <Button variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800 sm:ml-auto" onClick={() => { if (onDelete(selectedProduct._id)) setSelectedProduct(null); }}>
                                <Trash2 aria-hidden="true" /> ລຶບ
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}
