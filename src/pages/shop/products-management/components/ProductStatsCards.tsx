import { AlertTriangle, Box, CreditCard, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    formatCurrency,
    type ProductStats,
} from "../services/productManagementService";

interface ProductStatsCardsProps {
    stats: ProductStats;
}

export function ProductStatsCards({ stats }: ProductStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                ສິນຄ້າທັງໝົດ
                            </p>
                            <p className="mt-1 text-2xl font-bold text-indigo-600">
                                {stats.totalProducts.toLocaleString()}
                            </p>
                        </div>
                        <Box className="h-10 w-10 text-indigo-500 opacity-20" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                ສິນຄ້າໃກ້ໝົດ
                            </p>
                            <p className="mt-1 text-2xl font-bold text-red-600">
                                {stats.lowStock.toLocaleString()}
                            </p>
                        </div>
                        <AlertTriangle className="h-10 w-10 text-red-500 opacity-20" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                ມູນຄ່າສິນຄ້າລວມ
                            </p>
                            <p className="mt-1 text-2xl font-bold text-emerald-600">
                                {formatCurrency(stats.totalValue)}
                            </p>
                        </div>
                        <CreditCard className="h-10 w-10 text-emerald-500 opacity-20" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                ກຳໄລຄາດໝາຍ
                            </p>
                            <p className="mt-1 text-2xl font-bold text-blue-600">
                                {formatCurrency(stats.potentialProfit)}
                            </p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-blue-500 opacity-20" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
