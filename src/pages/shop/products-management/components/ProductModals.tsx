import type { CreateProductDto, Product } from "@/api/products";
import { BarcodePrinter } from "@/components/BarcodePrinter";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { BarcodeScannerModal } from "@/pages/shop/components/BarcodeScannerModal";
import { InventoryHistoryModal } from "@/pages/shop/components/InventoryHistoryModal";
import { ProductForm } from "@/pages/shop/components/ProductForm";
import { ProductHistoryModal } from "@/pages/shop/components/ProductHistoryModal";
import { StockUpdateModal } from "@/pages/shop/components/StockUpdateModal";

interface ProductModalsProps {
    editingProduct: Product | null;
    formData: CreateProductDto;
    foundProduct: Product | null;
    historyProduct: Product | null;
    isBarcodePrinterOpen: boolean;
    isCreatePending: boolean;
    isGlobalHistoryOpen: boolean;
    isHistoryModalOpen: boolean;
    isModalOpen: boolean;
    isScanModalOpen: boolean;
    isScanning: boolean;
    isStockModalOpen: boolean;
    isSubmitting: boolean;
    isUpdatePending: boolean;
    onBarcodeScanned: (barcode: string, keepOpen?: boolean) => void;
    onEdit: (product: Product) => void;
    onFormSubmit: (data: CreateProductDto) => void;
    onSetBarcodePrinterOpen: (isOpen: boolean) => void;
    onSetGlobalHistoryOpen: (isOpen: boolean) => void;
    onSetHistoryModalOpen: (isOpen: boolean) => void;
    onSetModalOpen: (isOpen: boolean) => void;
    onSetScanModalOpen: (isOpen: boolean) => void;
    onSetStockModalOpen: (isOpen: boolean) => void;
    onStockCancel: () => void;
    onStockUpdate: (
        productId: string,
        adjustment: number,
        type: string,
        note: string
    ) => void;
    productsForPrint: Product[];
}

export function ProductModals({
    editingProduct,
    formData,
    foundProduct,
    historyProduct,
    isBarcodePrinterOpen,
    isCreatePending,
    isGlobalHistoryOpen,
    isHistoryModalOpen,
    isModalOpen,
    isScanModalOpen,
    isScanning,
    isStockModalOpen,
    isSubmitting,
    isUpdatePending,
    onBarcodeScanned,
    onEdit,
    onFormSubmit,
    onSetBarcodePrinterOpen,
    onSetGlobalHistoryOpen,
    onSetHistoryModalOpen,
    onSetModalOpen,
    onSetScanModalOpen,
    onSetStockModalOpen,
    onStockCancel,
    onStockUpdate,
    productsForPrint,
}: ProductModalsProps) {
    return (
        <>
            <Dialog open={isModalOpen} onOpenChange={onSetModalOpen}>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    className="flex max-h-[90vh] w-[90vw] max-w-[900px] flex-col gap-0 overflow-hidden bg-slate-50 p-0"
                >
                    <DialogHeader className="flex-shrink-0 border-b bg-white p-6 pb-4 pr-10">
                        <DialogTitle>
                            {editingProduct
                                ? "ແກ້ໄຂຂໍ້ມູນສິນຄ້າ"
                                : "ເພີ່ມສິນຄ້າໃໝ່"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6">
                        <ProductForm
                            initialData={formData}
                            onSubmit={onFormSubmit}
                            onCancel={() => onSetModalOpen(false)}
                            key={editingProduct ? editingProduct._id : "new"}
                            isLoading={isCreatePending || isUpdatePending}
                        />
                    </div>
                    <DialogFooter className="flex-shrink-0 border-t bg-white p-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onSetModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            ຍົກເລີກ
                        </Button>
                        <Button
                            type="submit"
                            form="product-form"
                            className="min-w-32 bg-indigo-600 text-white hover:bg-indigo-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                    ພວມບັນທຶກ...
                                </>
                            ) : editingProduct ? (
                                "ບັນທຶກການແກ້ໄຂ"
                            ) : (
                                "ເພີ່ມສິນຄ້າໃໝ່"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BarcodeScannerModal
                isOpen={isScanModalOpen}
                onClose={() => onSetScanModalOpen(false)}
                onBarcodeScanned={onBarcodeScanned}
                isLoading={isScanning}
            />

            <StockUpdateModal
                isOpen={isStockModalOpen}
                onClose={() => onSetStockModalOpen(false)}
                product={foundProduct}
                onConfirm={onStockUpdate}
                onCancel={onStockCancel}
                onEdit={(product) => {
                    onSetStockModalOpen(false);
                    onEdit(product);
                }}
            />

            <ProductHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => onSetHistoryModalOpen(false)}
                productId={historyProduct?._id || null}
                productName={historyProduct?.name || ""}
            />

            <InventoryHistoryModal
                isOpen={isGlobalHistoryOpen}
                onClose={() => onSetGlobalHistoryOpen(false)}
            />

            <BarcodePrinter
                isOpen={isBarcodePrinterOpen}
                onClose={() => onSetBarcodePrinterOpen(false)}
                products={productsForPrint}
            />
        </>
    );
}
