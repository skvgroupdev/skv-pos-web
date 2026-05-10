import { ProductModals } from "./components/ProductModals";
import { ProductStatsCards } from "./components/ProductStatsCards";
import { ProductToolbar } from "./components/ProductToolbar";
import { ProductsTable } from "./components/ProductsTable";
import { useProductsManagement } from "./hooks/useProductsManagement";

export default function ProductsManagement() {
    const products = useProductsManagement();

    return (
        <div className="flex min-h-screen flex-col space-y-6 bg-slate-50/50 p-4 font-lao">
            <ProductStatsCards stats={products.stats} />

            <ProductToolbar
                filters={products.filters}
                isBasicPlan={products.isBasicPlan}
                onCreateClick={products.handleScanClick}
                onFilterChange={products.handleFilterChange}
                onOpenGlobalHistory={products.handleOpenGlobalHistory}
                onResetFilters={products.resetFilters}
                onSearchChange={products.handleSearchChange}
                searchTerm={products.searchTerm}
            />

            <div className="flex items-center gap-2 rounded-t-lg border-b border-white bg-slate-100 p-2">
                <div className="h-4 w-1 rounded-full bg-green-500" />
                <span className="font-semibold text-slate-600">
                    ລາຍຊື່ສິນຄ້າ
                </span>
            </div>

            <ProductsTable
                isBasicPlan={products.isBasicPlan}
                isLoading={products.isLoading}
                onDelete={products.handleDelete}
                onEdit={products.handleEdit}
                onHistoryClick={products.handleRestrictedHistoryClick}
                onPageChange={products.setPage}
                onPrintBarcode={products.handlePrintBarcode}
                page={products.page}
                productsData={products.productsData}
            />

            <ProductModals
                editingProduct={products.editingProduct}
                formData={products.formData}
                foundProduct={products.foundProduct}
                historyProduct={products.historyProduct}
                isBarcodePrinterOpen={products.isBarcodePrinterOpen}
                isCreatePending={products.createProductMutation.isPending}
                isGlobalHistoryOpen={products.isGlobalHistoryOpen}
                isHistoryModalOpen={products.isHistoryModalOpen}
                isModalOpen={products.isModalOpen}
                isScanModalOpen={products.isScanModalOpen}
                isScanning={products.isScanning}
                isStockModalOpen={products.isStockModalOpen}
                isSubmitting={products.isSubmitting}
                isUpdatePending={products.updateProductMutation.isPending}
                onBarcodeScanned={products.handleBarcodeScanned}
                onEdit={products.handleEdit}
                onFormSubmit={products.handleFormSubmit}
                onSetBarcodePrinterOpen={products.setIsBarcodePrinterOpen}
                onSetGlobalHistoryOpen={products.setIsGlobalHistoryOpen}
                onSetHistoryModalOpen={products.setIsHistoryModalOpen}
                onSetModalOpen={products.setIsModalOpen}
                onSetScanModalOpen={products.setIsScanModalOpen}
                onSetStockModalOpen={products.setIsStockModalOpen}
                onStockCancel={products.handleStockCancel}
                onStockUpdate={products.handleStockUpdate}
                productsForPrint={products.productsForPrint}
            />
        </div>
    );
}
