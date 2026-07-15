import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BarChart3, Receipt, TrendingUp, Wallet } from "lucide-react";
import { getShopSummary } from "@/api/reports";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const money = (value?: number) => `${(value || 0).toLocaleString()} ₭`;
const modeLabel = (mode: string) => mode === "wholesale" ? "ຂາຍສົ່ງ" : "ຂາຍຍ່ອຍ";

export default function ShopReports() {
    const today = format(new Date(), "yyyy-MM-dd");
    const [dates, setDates] = useState({ start: today, end: today });
    const [saleMode, setSaleMode] = useState<"ALL" | "retail" | "wholesale">("ALL");
    const params = useMemo(() => ({
        startDate: new Date(`${dates.start}T00:00:00`),
        endDate: new Date(`${dates.end}T23:59:59.999`),
        saleMode: saleMode === "ALL" ? undefined : saleMode,
    }), [dates, saleMode]);
    const { data: summary, isLoading } = useQuery({
        queryKey: ["sales-report", params],
        queryFn: () => getShopSummary(params),
    });

    return (
        <div className="min-h-screen space-y-5 bg-slate-50 p-4 font-lao md:p-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div><h1 className="flex items-center gap-2 text-2xl font-bold"><BarChart3 className="h-6 w-6 text-indigo-600" />ລາຍງານການຂາຍ</h1><p className="mt-1 text-sm text-slate-500">ແຍກລາຍໄດ້, ກຳໄລ ແລະ ຈຳນວນບິນຕາມປະເພດການຂາຍ</p></div>
                <div className="flex flex-col gap-2 md:flex-row">
                    <Select value={saleMode} onValueChange={(value: "ALL" | "retail" | "wholesale") => setSaleMode(value)}><SelectTrigger className="w-full bg-white md:w-[180px]" aria-label="ປະເພດການຂາຍ"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">ທຸກປະເພດການຂາຍ</SelectItem><SelectItem value="retail">ຂາຍຍ່ອຍ</SelectItem><SelectItem value="wholesale">ຂາຍສົ່ງ</SelectItem></SelectContent></Select>
                    <DateRangePicker date={{ from: new Date(dates.start), to: new Date(dates.end) }} onSelect={(range) => range?.from && setDates({ start: format(range.from, "yyyy-MM-dd"), end: format(range.to || range.from, "yyyy-MM-dd") })} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <ReportMetric label="ຍອດຂາຍ" value={summary?.totalSales} icon={TrendingUp} />
                <ReportMetric label="ກຳໄລ" value={summary?.totalProfit} icon={BarChart3} />
                <ReportMetric label="ເງິນເຂົ້າສຸດທິ" value={summary?.netCashFlow} icon={Wallet} />
                <ReportMetric label="ຈຳນວນບິນ" value={summary?.totalOrders} icon={Receipt} count />
            </div>

            <div className="overflow-hidden border bg-white">
                <div className="border-b p-4"><h2 className="font-bold">ສະຫຼຸບແຍກຕາມປະເພດການຂາຍ</h2></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-3">ປະເພດ</th><th className="p-3 text-right">ຈຳນວນບິນ</th><th className="p-3 text-right">ຍອດຂາຍ</th><th className="p-3 text-right">ຕົ້ນທຶນ</th><th className="p-3 text-right">ກຳໄລ</th><th className="p-3 text-right">ສະເລ່ຍ/ບິນ</th></tr></thead><tbody className="divide-y">{isLoading ? <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading...</td></tr> : !summary?.breakdownBySaleMode.length ? <tr><td colSpan={6} className="p-10 text-center text-slate-400">ບໍ່ພົບຂໍ້ມູນ</td></tr> : summary.breakdownBySaleMode.map((row) => <tr key={row.mode}><td className="p-3 font-semibold">{modeLabel(row.mode)}</td><td className="p-3 text-right">{row.totalOrders.toLocaleString()}</td><td className="p-3 text-right font-bold">{money(row.totalSales)}</td><td className="p-3 text-right">{money(row.totalCost)}</td><td className="p-3 text-right font-bold text-emerald-700">{money(row.totalProfit)}</td><td className="p-3 text-right">{money(row.avgOrderValue)}</td></tr>)}</tbody></table></div>
            </div>
        </div>
    );
}

function ReportMetric({ label, value, icon: Icon, count = false }: { label: string; value?: number; icon: typeof BarChart3; count?: boolean }) {
    return <div className="flex items-center justify-between border-l-4 border-indigo-500 bg-white p-4"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold">{count ? (value || 0).toLocaleString() : money(value)}</p></div><Icon className="h-5 w-5 text-indigo-600" /></div>;
}
