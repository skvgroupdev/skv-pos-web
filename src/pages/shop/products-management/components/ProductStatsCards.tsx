import { AlertTriangle, Box, CreditCard, PackageX, TrendingUp } from "lucide-react";
import type { ProductFilters } from "@/api/products";
import { Card, CardContent } from "@/components/ui/card";
import {
    formatCurrency,
    type ProductStats,
} from "../services/productManagementService";

interface ProductStatsCardsProps {
    stockLevel?: ProductFilters["stockLevel"];
    stats: ProductStats;
    onStockFilterClick: (stockLevel: "low" | "out") => void;
}

export function ProductStatsCards({ stockLevel, stats, onStockFilterClick }: ProductStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                ສິນຄ້າທັງໝົດ
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {stats.totalProducts.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">
                                ຊິ້ນ · {(stats.totalItems || 0).toLocaleString()} ລາຍການ
                            </p>
                        </div>
                        <Box className="h-8 w-8 text-slate-400" aria-hidden="true" />
                    </div>
                </CardContent>
            </Card>

            <button
                type="button"
                aria-pressed={stockLevel === "low"}
                aria-label={stockLevel === "low" ? "ລ້າງຕົວກອງສິນຄ້າເຫຼືອນ້ອຍ" : "ກອງສິນຄ້າເຫຼືອນ້ອຍ"}
                onClick={() => onStockFilterClick("low")}
                className={`rounded-xl border bg-white p-4 text-left shadow-sm transition-colors hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${stockLevel === "low" ? "border-amber-500 bg-amber-50" : "border-slate-200"}`}
            >
                <span className="flex items-center justify-between">
                    <span>
                        <span className="block text-sm font-medium text-slate-500">ສິນຄ້າເຫຼືອນ້ອຍ</span>
                        <span className="mt-1 block text-2xl font-bold text-amber-700">{stats.lowStock.toLocaleString()}</span>
                        <span className="block text-xs text-slate-500">ຍັງມີສິນຄ້າໃນສາງ</span>
                    </span>
                    <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden="true" />
                </span>
            </button>

            <button
                type="button"
                aria-pressed={stockLevel === "out"}
                aria-label={stockLevel === "out" ? "ລ້າງຕົວກອງສິນຄ້າໝົດ" : "ກອງສິນຄ້າໝົດ"}
                onClick={() => onStockFilterClick("out")}
                className={`rounded-xl border bg-white p-4 text-left shadow-sm transition-colors hover:border-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${stockLevel === "out" ? "border-red-500 bg-red-50" : "border-slate-200"}`}
            >
                <span className="flex items-center justify-between">
                    <span>
                        <span className="block text-sm font-medium text-slate-500">ສິນຄ້າໝົດ</span>
                        <span className="mt-1 block text-2xl font-bold text-red-700">{stats.outOfStock.toLocaleString()}</span>
                        <span className="block text-xs text-slate-500">ຈຳນວນໃນສາງ 0 ຫຼື ຕ່ຳກວ່າ</span>
                    </span>
                    <PackageX className="h-8 w-8 text-red-500" aria-hidden="true" />
                </span>
            </button>

            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                ຕົ້ນທຶນລວມ
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {formatCurrency(stats.totalValue)}
                            </p>
                        </div>
                        <CreditCard className="h-8 w-8 text-slate-400" aria-hidden="true" />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                ກຳໄລຄາດຄະເນ
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {formatCurrency(stats.potentialProfit)}
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-slate-400" aria-hidden="true" />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                ຍອດຂາຍຄາດຄະເນ
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {formatCurrency(stats.projectedRevenue)}
                            </p>
                            <p className="text-xs text-slate-500">ຄິດຈາກລາຄາຂາຍສົ່ງ ຫຼື ລາຄາຂາຍຍ່ອຍ</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-slate-400" aria-hidden="true" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
