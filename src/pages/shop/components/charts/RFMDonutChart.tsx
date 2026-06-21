import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip);

interface Customer {
    rfm?: { segment: string };
}

interface Props {
    customers: Customer[];
}

type Segment = "VIP" | "Loyal" | "Regular" | "At Risk" | "Lost";

const SEGMENTS: { key: Segment; label: string; color: string; textColor: string }[] = [
    { key: "VIP",      label: "VIP — ລູກຄ້າດີທີ່ສຸດ",    color: "rgba(79,70,229,0.95)",   textColor: "#4F46E5" },
    { key: "Loyal",    label: "Loyal — ຊື້ເລື້ອຍໆ",        color: "rgba(129,140,248,0.85)",  textColor: "#818CF8" },
    { key: "Regular",  label: "Regular — ປົກກະຕິ",         color: "rgba(199,210,254,0.95)",  textColor: "#6366F1" },
    { key: "At Risk",  label: "At Risk — ອາດຈະຫາຍ",        color: "rgba(251,191,36,0.85)",   textColor: "#D97706" },
    { key: "Lost",     label: "Lost — ຫາຍໄປແລ້ວ",          color: "rgba(248,113,113,0.75)",  textColor: "#DC2626" },
];

export function RFMDonutChart({ customers }: Props) {
    const counts = SEGMENTS.map(
        (s) => customers.filter((c) => c.rfm?.segment === s.key).length
    );
    const total = customers.length || 1;

    const data: ChartData<"doughnut"> = {
        labels: SEGMENTS.map((s) => s.key),
        datasets: [
            {
                data: counts,
                backgroundColor: SEGMENTS.map((s) => s.color),
                borderColor: "#FFFFFF",
                borderWidth: 3,
                hoverOffset: 6,
            },
        ],
    };

    const options: ChartOptions<"doughnut"> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        animation: { duration: 600 },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const val = ctx.parsed;
                        const pct = ((val / total) * 100).toFixed(1);
                        return `  ${val} ຄົນ  (${pct}%)`;
                    },
                },
                backgroundColor: "#0F172A",
                titleColor: "#94A3B8",
                bodyColor: "#F1F5F9",
                padding: 10,
                cornerRadius: 8,
                boxWidth: 8,
                boxHeight: 8,
            },
            legend: { display: false },
        },
    };

    return (
        <div className="flex items-center gap-6 w-full">
            <div className="relative shrink-0" style={{ width: 104, height: 104 }}>
                <Doughnut data={data} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">ລູກຄ້າ</p>
                    <p className="text-sm font-bold text-slate-800">{customers.length}</p>
                </div>
            </div>

            <div className="flex flex-col gap-2 flex-1">
                {SEGMENTS.map((s, i) => {
                    const count = counts[i];
                    const pct = customers.length > 0 ? ((count / customers.length) * 100).toFixed(0) : "0";
                    return (
                        <div key={s.key} className="flex items-center gap-2">
                            <div className="shrink-0 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-xs text-slate-500 flex-1 truncate">
                                <span className="font-semibold" style={{ color: s.textColor }}>{s.key}</span>
                                {" · "}{s.label.split("—")[1]?.trim()}
                            </span>
                            <span className="text-xs font-bold text-slate-700 tabular-nums">{count}</span>
                            <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
