import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Customer {
    customerId?: string;
    name: string;
    totalSpent: number;
    rfm?: { segment: string };
}

interface Props {
    customers: Customer[];
    formatCurrency: (val?: number) => string;
}

const SEGMENT_COLOR: Record<string, string> = {
    VIP:      "rgba(79,70,229,0.95)",
    Loyal:    "rgba(99,102,241,0.85)",
    Regular:  "rgba(129,140,248,0.75)",
    "At Risk":"rgba(251,191,36,0.8)",
    Lost:     "rgba(248,113,113,0.75)",
};

export function TopSpendersChart({ customers, formatCurrency }: Props) {
    const top10 = customers.slice(0, 10);

    const data: ChartData<"bar"> = {
        labels: top10.map((c) =>
            c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name
        ),
        datasets: [
            {
                data: top10.map((c) => c.totalSpent),
                backgroundColor: top10.map(
                    (c) => SEGMENT_COLOR[c.rfm?.segment ?? ""] ?? SEGMENT_COLOR.Regular
                ),
                borderRadius: 4,
                borderSkipped: false,
            },
        ],
    };

    const options: ChartOptions<"bar"> = {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (ctx) => `  ${formatCurrency(ctx.parsed.x ?? undefined)}`,
                },
                backgroundColor: "#0F172A",
                titleColor: "#94A3B8",
                bodyColor: "#F1F5F9",
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
            },
            legend: { display: false },
        },
        scales: {
            x: {
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
            y: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: "#475569", padding: 4 },
                border: { display: false },
            },
        },
    };

    return (
        <div className="h-72 w-full">
            <Bar data={data} options={options} />
        </div>
    );
}
