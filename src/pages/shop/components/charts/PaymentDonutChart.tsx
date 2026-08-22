import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip);

interface MethodBreakdown {
    method: string;
    totalReceived: number;
    transactionCount: number;
}

interface Props {
    breakdownByMethod: MethodBreakdown[];
    formatCurrency: (val?: number) => string;
}

const METHOD_META: Record<string, { label: string; color: string; text: string }> = {
    CASH:     { label: "ເງິນສົດ",  color: "rgba(79,70,229,0.9)",  text: "#4F46E5" },
    TRANSFER: { label: "ເງິນໂອນ", color: "rgba(129,140,248,0.8)", text: "#818CF8" },
};

export function PaymentDonutChart({ breakdownByMethod, formatCurrency }: Props) {
    const methods = ["CASH", "TRANSFER"];
    const values = methods.map(
        (m) => breakdownByMethod.find((b) => b.method === m)?.totalReceived || 0
    );
    const chartValues = values.map((value) => Math.max(0, value));
    const chartTotal = chartValues.reduce((s, v) => s + v, 0);
    const netTotal = values.reduce((s, v) => s + v, 0);

    const data: ChartData<"doughnut"> = {
        labels: methods.map((m) => METHOD_META[m].label),
        datasets: [
            {
                data: chartValues,
                backgroundColor: methods.map((m) => METHOD_META[m].color),
                borderColor: "#FFFFFF",
                borderWidth: 3,
                hoverOffset: 6,
            },
        ],
    };

    const options: ChartOptions<"doughnut"> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        animation: { duration: 600 },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const val = ctx.parsed;
                        const pct = chartTotal > 0 ? ((val / chartTotal) * 100).toFixed(1) : "0";
                        return `  ${formatCurrency(val)}  (${pct}%)`;
                    },
                },
                backgroundColor: "#0F172A",
                titleColor: "#94A3B8",
                bodyColor: "#F1F5F9",
                padding: 10,
                cornerRadius: 8,
                displayColors: true,
                boxWidth: 8,
                boxHeight: 8,
            },
            legend: { display: false },
        },
    };

    return (
        <div className="flex items-center gap-6 w-full">
            {/* Donut */}
            <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                <Doughnut data={data} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">ລວມ</p>
                    <p className="text-xs font-bold text-slate-800 leading-tight text-center px-1">
                        {formatCurrency(netTotal)}
                    </p>
                </div>
            </div>

            {/* Legend with values */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                {methods.map((m) => {
                    const val = breakdownByMethod.find((b) => b.method === m)?.totalReceived || 0;
                    const chartVal = Math.max(0, val);
                    const pct = chartTotal > 0 ? ((chartVal / chartTotal) * 100).toFixed(0) : "0";
                    const meta = METHOD_META[m];
                    return (
                        <div key={m} className="flex items-center gap-2 min-w-0">
                            <div
                                className="shrink-0 h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: meta.color }}
                            />
                            <span className="text-xs text-slate-500 flex-1 truncate">{meta.label}</span>
                            <span className="text-xs font-bold text-slate-800 tabular-nums shrink-0">
                                {pct}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
