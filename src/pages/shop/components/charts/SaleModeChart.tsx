import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    type ChartData,
    type ChartOptions,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SaleModeBreakdown {
    mode: string;
    totalSales: number;
    totalOrders: number;
    totalProfit: number;
    avgOrderValue: number;
}

interface Props {
    breakdownBySaleMode: SaleModeBreakdown[];
    formatCurrency: (val?: number) => string;
}

export function SaleModeChart({ breakdownBySaleMode, formatCurrency }: Props) {
    const retail    = breakdownBySaleMode.find((b) => b.mode === "retail");
    const wholesale = breakdownBySaleMode.find((b) => b.mode === "wholesale");

    const data: ChartData<"bar"> = {
        labels: ["ຍອດຂາຍ", "ກຳໄລ"],
        datasets: [
            {
                label: "ຂາຍຍ່ອຍ",
                data: [retail?.totalSales || 0, retail?.totalProfit || 0],
                backgroundColor: "rgba(79,70,229,0.85)",
                borderColor: "rgba(79,70,229,1)",
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false,
            },
            {
                label: "ຂາຍສົ່ງ",
                data: [wholesale?.totalSales || 0, wholesale?.totalProfit || 0],
                backgroundColor: "rgba(129,140,248,0.6)",
                borderColor: "rgba(129,140,248,1)",
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    };

    const options: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (ctx) =>
                        `  ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? undefined)}`,
                },
                backgroundColor: "#0F172A",
                titleColor: "#94A3B8",
                bodyColor: "#F1F5F9",
                padding: 10,
                cornerRadius: 8,
                boxWidth: 8,
                boxHeight: 8,
            },
            legend: {
                position: "top",
                align: "end",
                labels: {
                    font: { size: 11 },
                    color: "#64748B",
                    usePointStyle: true,
                    pointStyleWidth: 8,
                    padding: 16,
                    boxHeight: 8,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 12 }, color: "#475569", padding: 6 },
                border: { display: false },
            },
            y: {
                grid: { color: "rgba(226,232,240,0.8)", lineWidth: 1 },
                ticks: {
                    font: { size: 10 },
                    color: "#CBD5E1",
                    callback: (val) => {
                        const n = Number(val);
                        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
                        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
                        return n.toLocaleString();
                    },
                },
                border: { display: false },
            },
        },
    };

    return (
        <div className="h-52 w-full">
            <Bar data={data} options={options} />
        </div>
    );
}
