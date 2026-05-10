import {
    ChevronLeft,
    ChevronRight,
    Crown,
    History,
    Pencil,
    Printer,
    Trash2,
} from "lucide-react";
import type { Product } from "@/api/products";
import { Button } from "@/components/ui/button";
import {
    PRODUCT_PAGE_LIMIT,
    type ProductsResponse,
} from "../services/productManagementService";

interface ProductsTableProps {
    isBasicPlan: boolean;
    isLoading: boolean;
    onDelete: (id: string) => void;
    onEdit: (product: Product) => void;
    onHistoryClick: (product: Product) => void;
    onPageChange: (page: number) => void;
    onPrintBarcode: (product: Product) => void;
    page: number;
    productsData?: ProductsResponse;
}

export function ProductsTable({
    isBasicPlan,
    isLoading,
    onDelete,
    onEdit,
    onHistoryClick,
    onPageChange,
    onPrintBarcode,
    page,
    productsData,
}: ProductsTableProps) {
    const products = productsData?.data || [];
    const pagination = productsData?.pagination;

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
            <div className="relative flex-1 overflow-auto">
                <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-indigo-600 text-white shadow-sm">
                        <tr>
                            <th className="w-16 bg-indigo-600 px-4 py-3 text-left font-medium">
                                #
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-left font-medium">
                                ບາໂຄດ
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-left font-medium">
                                ຊື່ສິນຄ້າ
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-left font-medium">
                                ໝວດໝູ່
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-right font-medium">
                                ຕົ້ນທຶນ
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-right font-medium">
                                ລາຄາຂາຍ
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-right font-medium">
                                ຂາຍສົ່ງ
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-center font-medium">
                                ຈຳນວນ
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-center font-medium">
                                ໜ່ວຍ
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-center font-medium">
                                ສະຖານະ
                            </th>
                            <th className="bg-indigo-600 px-4 py-3 text-center font-medium">
                                ຈັດການ
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={11}
                                    className="py-20 text-center text-slate-500"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
                                        <p>ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={11}
                                    className="py-20 text-center text-slate-500"
                                >
                                    ບໍ່ມີຂໍ້ມູນສິນຄ້າ
                                </td>
                            </tr>
                        ) : (
                            products.map((product, index) => (
                                <ProductTableRow
                                    key={product._id}
                                    index={index}
                                    isBasicPlan={isBasicPlan}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                    onHistoryClick={onHistoryClick}
                                    onPrintBarcode={onPrintBarcode}
                                    page={page}
                                    product={product}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && pagination && (
                <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">
                        ສະແດງ {(page - 1) * PRODUCT_PAGE_LIMIT + 1} ຫາ{" "}
                        {Math.min(page * PRODUCT_PAGE_LIMIT, pagination.total)}{" "}
                        ຈາກທັງໝົດ {pagination.total} ລາຍການ
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="h-8 px-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                            <span className="text-sm font-medium text-slate-700">
                                ໜ້າ {page} / {pagination.totalPages}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                onPageChange(Math.min(pagination.totalPages, page + 1));
                            }}
                            disabled={page >= pagination.totalPages}
                            className="h-8 px-2"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ProductTableRowProps {
    index: number;
    isBasicPlan: boolean;
    onDelete: (id: string) => void;
    onEdit: (product: Product) => void;
    onHistoryClick: (product: Product) => void;
    onPrintBarcode: (product: Product) => void;
    page: number;
    product: Product;
}

function ProductTableRow({
    index,
    isBasicPlan,
    onDelete,
    onEdit,
    onHistoryClick,
    onPrintBarcode,
    page,
    product,
}: ProductTableRowProps) {
    const isLowStock = product.stock <= (product.minStock || 0);

    return (
        <tr className="transition-colors hover:bg-slate-50">
            <td className="px-4 py-3 text-sm text-slate-500">
                {(page - 1) * PRODUCT_PAGE_LIMIT + index + 1}
            </td>
            <td className="px-4 py-3 font-mono text-sm text-slate-600">
                {product.barcode || "-"}
            </td>
            <td className="px-4 py-3 font-medium text-slate-800">
                {product.name}
            </td>
            <td className="px-4 py-3 text-slate-600">
                <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {product.category || "-"}
                </span>
            </td>
            <td className="px-4 py-3 text-right text-slate-600">
                {product.costPrice.toLocaleString()}{" "}
                <span className="text-xs text-slate-400">
                    {product.costCurrency}
                </span>
            </td>
            <td className="px-4 py-3 text-right font-medium text-green-600">
                {product.sellPrice.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right font-medium text-sky-700">
                {(product.wholesalePrice || 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-center">
                <span
                    className={`rounded px-2 py-1 text-xs font-bold ${
                        isLowStock
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                    }`}
                >
                    {product.stock}
                </span>
            </td>
            <td className="px-4 py-3 text-center text-slate-600">
                {product.unit}
            </td>
            <td className="px-4 py-3 text-center">
                <span
                    className={`mr-1 inline-block h-2 w-2 rounded-full ${
                        product.status === "active" ? "bg-green-500" : "bg-slate-300"
                    }`}
                />
            </td>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => onPrintBarcode(product)}
                        className="p-1.5 text-slate-400 transition-colors hover:text-emerald-600"
                        title="Print Barcode"
                    >
                        <Printer size={18} />
                    </button>
                    <button
                        onClick={() => onHistoryClick(product)}
                        className={`relative p-1.5 transition-colors ${
                            isBasicPlan
                                ? "cursor-not-allowed text-slate-300"
                                : "text-slate-400 hover:text-blue-600"
                        }`}
                        title={
                            isBasicPlan
                                ? "Upgrade to PRO to view history"
                                : "View History"
                        }
                    >
                        <History size={18} />
                        {isBasicPlan && (
                            <Crown className="absolute -right-1 -top-1 h-2.5 w-2.5 text-yellow-500" />
                        )}
                    </button>
                    <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-slate-400 transition-colors hover:text-indigo-600"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(product._id)}
                        className="p-1.5 text-slate-400 transition-colors hover:text-red-600"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
