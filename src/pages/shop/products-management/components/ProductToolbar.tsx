import { Crown, History, Plus, RotateCcw, Search } from "lucide-react";
import type { ProductFilters } from "@/api/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductFilterBar } from "@/pages/shop/components/ProductFilterBar";

interface ProductToolbarProps {
    filters: ProductFilters;
    isBasicPlan: boolean;
    onCreateClick: () => void;
    onFilterChange: (filters: ProductFilters) => void;
    onOpenGlobalHistory: () => void;
    onResetFilters: () => void;
    onSearchChange: (value: string) => void;
    searchTerm: string;
}

export function ProductToolbar({
    filters,
    isBasicPlan,
    onCreateClick,
    onFilterChange,
    onOpenGlobalHistory,
    onResetFilters,
    onSearchChange,
    searchTerm,
}: ProductToolbarProps) {
    return (
        <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-1 items-center gap-2">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="ຄົ້ນຫາບາໂຄດ ຫຼື  ຊື່ສິນຄ້າ..."
                        className="border-slate-200 bg-slate-50 pl-9"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <ProductFilterBar
                    filters={filters}
                    onFilterChange={onFilterChange}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onResetFilters}
                    className="text-slate-500"
                >
                    <RotateCcw className="mr-2 h-4 w-4" /> ລ້າງຄ່າ
                </Button>
            </div>

            <div className="ml-4 flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={onOpenGlobalHistory}
                    className={`relative h-10 overflow-hidden border-slate-200 bg-white text-slate-600 ${
                        isBasicPlan
                            ? "cursor-not-allowed opacity-70"
                            : "hover:text-indigo-600"
                    }`}
                >
                    <History size={18} className="mr-2" />
                    <span>ປະຫວັດສາງ</span>
                    {isBasicPlan && (
                        <Crown className="absolute right-1 top-1 h-3 w-3 text-yellow-500" />
                    )}
                </Button>
                <Button
                    onClick={onCreateClick}
                    className="h-10 gap-2 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                >
                    <Plus size={20} /> ເພີ່ມສິນຄ້າ
                </Button>
            </div>
        </div>
    );
}
