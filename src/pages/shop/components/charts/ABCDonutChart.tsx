import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip);

interface Props {
    products: { abcClass: string }[];
}

export function ABCDonutChart({ products }: Props) {
    const aCount = products.filter((p) => p.abcClass === "A").length;
    const bCount = products.filter((p) => p.abcClass === "B").length;
    const cCount = products.filter((p) => p.abcClass === "C").length;
    const total = products.length || 1;

    const data: ChartData<"doughnut"> = {
        labels: ["Class A", "Class B", "Class C"],
        datasets: [
            {
                data: [aCount, bCount, cCount],
                backgroundColor: [
                    "rgba(79,70,229,0.9)",
                    "rgba(129,140,248,0.8)",
                    "rgba(199,210,254,0.95)",
                ],
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
                        return `  ${val} ລາຍການ  (${pct}%)`;
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

    const classes = [
        { cls: "A", count: aCount, label: "ສິນຄ້າຊັ້ນນຳ",  color: "rgba(79,70,229,0.9)"   },
        { cls: "B", count: bCount, label: "ສິນຄ້າປານກາງ", color: "rgba(129,140,248,0.8)"  },
        { cls: "C", count: cCount, label: "ສິນຄ້າຂາຍຊ້າ", color: "rgba(199,210,254,0.95)" },
    ];

    return (
        <div className="flex items-center gap-6 w-full">
            <div className="relative shrink-0" style={{ width: 104, height: 104 }}>
                <Doughnut data={data} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">ລາຍການ</p>
                    <p className="text-sm font-bold text-slate-800">{products.length}</p>
                </div>
            </div>

            <div className="flex flex-col gap-2.5 flex-1">
                {classes.map(({ cls, count, label, color }) => {
                    const pct = products.length > 0 ? ((count / products.length) * 100).toFixed(0) : "0";
                    return (
                        <div key={cls} className="flex items-center gap-2">
                            <div
                                className="shrink-0 h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-slate-500 flex-1 truncate">
                                <span className="font-semibold text-slate-700">{cls}</span>
                                {" · "}{label}
                            </span>
                            <span className="text-xs font-bold text-slate-700 tabular-nums">
                                {count}
                            </span>
                            <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">
                                {pct}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
