import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { type ProductFilters } from "@/api/products";
import { useGetCategories, useGetUnits } from "@/hooks/useProducts";
import { useEffect, useState } from "react";

interface ProductFilterBarProps {
    filters: ProductFilters;
    onFilterChange: (filters: ProductFilters) => void;
}

export function ProductFilterBar({ filters, onFilterChange }: ProductFilterBarProps) {
    const { data: categories } = useGetCategories();
    const { data: units } = useGetUnits();
    const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);
    const [isOpen, setIsOpen] = useState(false);

    // Sync local state when prop changes
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleApply = () => {
        onFilterChange(localFilters);
        setIsOpen(false);
    };

    const handleClear = () => {
        const cleared: ProductFilters = {
            category: "all",
            unit: "all",
            status: "all",
            stockLevel: "all",
            minPrice: undefined,
            maxPrice: undefined,
            catalogNo: undefined,
            catalogCode: undefined,
            catalogPage: undefined,
            catalogNumber: undefined
        };
        onFilterChange(cleared);
        setLocalFilters(cleared);
        setIsOpen(false);
    };

    const removeFilter = (key: keyof ProductFilters) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        // Handle special values
        if (key === 'category') newFilters.category = "all";
        if (key === 'unit') newFilters.unit = "all";
        if (key === 'status') newFilters.status = "all";
        if (key === 'stockLevel') newFilters.stockLevel = "all";

        onFilterChange(newFilters);
    };

    const activeFilterCount = Object.keys(filters).filter(k => {
        const val = filters[k as keyof ProductFilters];
        return val && val !== "all" && val !== undefined;
    }).length;

    return (
        <div className="flex flex-wrap items-center gap-2 ">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={`gap-2 border-dashed ${activeFilterCount > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "text-slate-600"}`}>
                        <Filter className="h-4 w-4" />
                        ຕົວກອງ
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="bg-indigo-200 text-indigo-800 ml-1 rounded-full px-1.5 h-5 min-w-5 flex items-center justify-center text-[10px]">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] h-[500px] overflow-y-auto p-4" align="start">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-slate-900">ປະເພດສິນຄ້າ</h4>
                            <Select
                                value={localFilters.category || "all"}
                                onValueChange={(v) => setLocalFilters(prev => ({ ...prev, category: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="ປະເພດສິນຄ້າ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ທັງໝົດ</SelectItem>
                                    {categories?.data?.map((c: any) => (
                                        <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-slate-900">ຫົວໜ່ວຍ</h4>
                            <Select
                                value={localFilters.unit || "all"}
                                onValueChange={(v) => setLocalFilters(prev => ({ ...prev, unit: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="ຫົວໜ່ວຍ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ທັງໝົດ</SelectItem>
                                    {units?.data?.map((u: any) => (
                                        <SelectItem key={u._id} value={u.name}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-slate-900">ຊ່ວງລາຄາ</h4>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={localFilters.minPrice || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                                    className="h-8"
                                />
                                <span className="text-slate-400">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={localFilters.maxPrice || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                                    className="h-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-slate-900">ຄົ້ນຫາ Catalog</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="No"
                                    value={localFilters.catalogNo || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, catalogNo: e.target.value || undefined }))}
                                    className="h-8"
                                />
                                <Input
                                    placeholder="Code"
                                    value={localFilters.catalogCode || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, catalogCode: e.target.value || undefined }))}
                                    className="h-8"
                                />
                                <Input
                                    placeholder="Page"
                                    value={localFilters.catalogPage || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, catalogPage: e.target.value || undefined }))}
                                    className="h-8"
                                />
                                <Input
                                    placeholder="Number"
                                    value={localFilters.catalogNumber || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, catalogNumber: e.target.value || undefined }))}
                                    className="h-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-slate-900">ຈຳນວນສິນຄ້າ</h4>
                            <div className="flex flex-wrap gap-2">
                                {['all', 'low', 'out'].map((status) => (
                                    <div
                                        key={status}
                                        onClick={() => setLocalFilters(prev => ({ ...prev, stockLevel: status }))}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${(localFilters.stockLevel || 'all') === status
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                            }`}
                                    >
                                        {status === 'all' ? 'ທັງໝົດ' : status === 'low' ? 'ເຫຼື ອນ້ອຍ' : 'ໝົດແລ້ວ'}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-slate-900">ສະຖານະ</h4>
                            <Select
                                value={localFilters.status || "all"}
                                onValueChange={(v) => setLocalFilters(prev => ({ ...prev, status: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="ສະຖານະ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ທັງໝົດ</SelectItem>
                                    <SelectItem value="active">ຂາຍ</SelectItem>
                                    <SelectItem value="inactive">ຢຸດຂາຍ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-2 flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={handleClear}>ລ້າງ</Button>
                            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleApply}>ຄົ້ນຫາ</Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Active Filters display */}
            <div className="flex flex-wrap gap-2">
                {filters.category && filters.category !== "all" && (
                    <Badge variant="outline" className="bg-white pl-2 pr-1 py-1 h-8 gap-1 border-slate-200 font-normal">
                        ປະເພດສິນຄ້າ: {filters.category}
                        <div role="button" onClick={() => removeFilter('category')} className="hover:bg-slate-100 rounded-full p-0.5">
                            <X className="h-3 w-3 text-slate-500" />
                        </div>
                    </Badge>
                )}
                {filters.unit && filters.unit !== "all" && (
                    <Badge variant="outline" className="bg-white pl-2 pr-1 py-1 h-8 gap-1 border-slate-200 font-normal">
                        ຫົວໜ່ວຍ: {filters.unit}
                        <div role="button" onClick={() => removeFilter('unit')} className="hover:bg-slate-100 rounded-full p-0.5">
                            <X className="h-3 w-3 text-slate-500" />
                        </div>
                    </Badge>
                )}
                {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                    <Badge variant="outline" className="bg-white pl-2 pr-1 py-1 h-8 gap-1 border-slate-200 font-normal">
                        ລາຄາ: {filters.minPrice || 0} - {filters.maxPrice || '∞'}
                        <div role="button" onClick={() => {
                            const newFilters = { ...filters };
                            delete newFilters.minPrice;
                            delete newFilters.maxPrice;
                            onFilterChange(newFilters);
                        }} className="hover:bg-slate-100 rounded-full p-0.5">
                            <X className="h-3 w-3 text-slate-500" />
                        </div>
                    </Badge>
                )}
                {/* Catalog Active Filter Badges */}
                {filters.catalogNo && (
                    <Badge variant="outline" className="bg-white pl-2 pr-1 py-1 h-8 gap-1 border-slate-200 font-normal">
                        Cat No: {filters.catalogNo}
                        <div role="button" onClick={() => removeFilter('catalogNo')} className="hover:bg-slate-100 rounded-full p-0.5">
                            <X className="h-3 w-3 text-slate-500" />
                        </div>
                    </Badge>
                )}
                {filters.catalogCode && (
                    <Badge variant="outline" className="bg-white pl-2 pr-1 py-1 h-8 gap-1 border-slate-200 font-normal">
                        Cat Code: {filters.catalogCode}
                        <div role="button" onClick={() => removeFilter('catalogCode')} className="hover:bg-slate-100 rounded-full p-0.5">
                            <X className="h-3 w-3 text-slate-500" />
                        </div>
                    </Badge>
                )}
                {filters.catalogPage && (
                    <Badge variant="outline" className="bg-white pl-2 pr-1 py-1 h-8 gap-1 border-slate-200 font-normal">
                        Cat Page: {filters.catalogPage}
                        <div role="button" onClick={() => removeFilter('catalogPage')} className="hover:bg-slate-100 rounded-full p-0.5">
                            <X className="h-3 w-3 text-slate-500" />
                        </div>
                    </Badge>
                )}
                {filters.catalogNumber && (
                    <Badge variant="outline" className="bg-white pl-2 pr-1 py-1 h-8 gap-1 border-slate-200 font-normal">
                        Cat Number: {filters.catalogNumber}
                        <div role="button" onClick={() => removeFilter('catalogNumber')} className="hover:bg-slate-100 rounded-full p-0.5">
                            <X className="h-3 w-3 text-slate-500" />
                        </div>
                    </Badge>
                )}

                {filters.stockLevel && filters.stockLevel !== "all" && (
                    <Badge variant="outline" className="bg-white pl-2 pr-1 py-1 h-8 gap-1 border-slate-200 font-normal">
                        ຈຳນວນສິນຄ້າ: {filters.stockLevel === 'low' ? 'ເຫຼື ອນ້ອຍ' : 'ໝົດແລ້ວ'}
                        <div role="button" onClick={() => removeFilter('stockLevel')} className="hover:bg-slate-100 rounded-full p-0.5">
                            <X className="h-3 w-3 text-slate-500" />
                        </div>
                    </Badge>
                )}
                {filters.status && filters.status !== "all" && (
                    <Badge variant="outline" className="bg-white pl-2 pr-1 py-1 h-8 gap-1 border-slate-200 font-normal">
                        ສະຖານະ: {filters.status}
                        <div role="button" onClick={() => removeFilter('status')} className="hover:bg-slate-100 rounded-full p-0.5">
                            <X className="h-3 w-3 text-slate-500" />
                        </div>
                    </Badge>
                )}
            </div>
        </div>
    );
}
