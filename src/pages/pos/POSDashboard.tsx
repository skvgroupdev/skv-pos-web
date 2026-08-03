import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { LayoutDashboard, RefreshCcw } from "lucide-react";

import { getShopSummary, type DateRangeParams } from "@/api/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { OverviewTab } from "@/pages/shop/components/OverviewTab";
import { useAuthStore } from "@/store/useAuthStore";

const getInitialDates = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const fallback = { start: today, end: today };
    const saved = localStorage.getItem("pos-dashboard-customDates");

    if (!saved) return fallback;

    try {
        const parsed = JSON.parse(saved) as Partial<typeof fallback>;
        if (parsed.start && parsed.end) return { start: parsed.start, end: parsed.end };
    } catch {
        // Ignore invalid localStorage values.
    }

    return fallback;
};

const formatCurrency = (val?: number) => `₭${(val || 0).toLocaleString("lo-LA")}`;

export default function POSDashboard() {
    const { user } = useAuthStore();
    const cashierId = user?.id || user?._id || "";
    const [customDates, setCustomDates] = useState(getInitialDates);
    const [saleMode, setSaleMode] = useState<"ALL" | "retail" | "wholesale">(() => {
        const saved = localStorage.getItem("pos-dashboard-saleMode");
        return saved === "retail" || saved === "wholesale" ? saved : "ALL";
    });

    useEffect(() => {
        localStorage.setItem("pos-dashboard-customDates", JSON.stringify(customDates));
    }, [customDates]);

    useEffect(() => {
        localStorage.setItem("pos-dashboard-saleMode", saleMode);
    }, [saleMode]);

    const getDates = () => {
        if (customDates.start && customDates.end) {
            const startDate = new Date(`${customDates.start}T00:00:00.000`);
            const endDate = new Date(`${customDates.end}T23:59:59.999`);
            if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
                return { startDate, endDate };
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { startDate: today, endDate: new Date() };
    };

    const { startDate, endDate } = getDates();
    const queryParams: DateRangeParams = {
        startDate,
        endDate,
        cashierId,
        saleMode: saleMode === "ALL" ? undefined : saleMode,
    };

    const {
        data: summary,
        isError,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["pos-dashboard-summary", customDates, saleMode, cashierId],
        queryFn: () => getShopSummary(queryParams),
        enabled: !!cashierId,
    });

    return (
        <div className="h-full min-h-0 overflow-y-auto bg-slate-50/50 p-4 font-lao md:p-6">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                            <LayoutDashboard className="h-6 w-6 text-indigo-600" />
                            Dashboard ຍອດຂາຍ
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            ສະຫຼຸບສະເພາະຍອດຂາຍຂອງແຄດຊຽນ
                            {user?.username ? ` — ${user.username}` : ""}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <Select
                            value={saleMode}
                            onValueChange={(value: "ALL" | "retail" | "wholesale") => setSaleMode(value)}
                        >
                            <SelectTrigger className="w-full bg-white md:w-[170px]" aria-label="ປະເພດການຂາຍ">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">ທຸກປະເພດການຂາຍ</SelectItem>
                                <SelectItem value="retail">ຂາຍຍ່ອຍ</SelectItem>
                                <SelectItem value="wholesale">ຂາຍສົ່ງ</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="rounded-lg bg-white shadow-sm">
                            <DateRangePicker
                                date={{
                                    from: new Date(customDates.start),
                                    to: new Date(customDates.end),
                                }}
                                onSelect={(range) => {
                                    if (!range?.from) return;
                                    setCustomDates({
                                        start: format(range.from, "yyyy-MM-dd"),
                                        end: range.to
                                            ? format(range.to, "yyyy-MM-dd")
                                            : format(range.from, "yyyy-MM-dd"),
                                    });
                                }}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-200 bg-white text-indigo-600 hover:bg-slate-50"
                            onClick={() => {
                                const today = format(new Date(), "yyyy-MM-dd");
                                setCustomDates({ start: today, end: today });
                            }}
                        >
                            ມື້ນີ້
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-200 bg-white"
                            onClick={() => refetch()}
                            disabled={isFetching || !cashierId}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            ໂຫຼດໃໝ່
                        </Button>
                    </div>
                </div>

                {!cashierId && (
                    <Card className="border-amber-200 bg-amber-50 text-amber-800">
                        <CardContent className="p-4 text-sm">
                            ບໍ່ພົບລະຫັດແຄດຊຽນ. ກະລຸນາ logout ແລ້ວ login ໃໝ່.
                        </CardContent>
                    </Card>
                )}

                {isError && (
                    <Card className="border-rose-200 bg-rose-50 text-rose-700">
                        <CardContent className="p-4 text-sm">
                            ໂຫຼດຂໍ້ມູນ Dashboard ບໍ່ສຳເລັດ. ກວດ API /reports/summary ຫຼືລອງໂຫຼດໃໝ່.
                        </CardContent>
                    </Card>
                )}

                <OverviewTab
                    summary={summary}
                    formatCurrency={formatCurrency}
                    subscriptionPlan={user?.subscriptionPlan}
                    showLocks={false}
                    showSensitiveData={false}
                    showPaymentMethods
                />
            </div>
        </div>
    );
}
