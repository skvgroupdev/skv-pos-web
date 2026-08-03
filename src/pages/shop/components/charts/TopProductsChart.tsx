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

interface Product {
    productId: string;
    name: string;
    abcClass: string;
    totalRevenue: number;
    totalSold: number;
    stockStatus: string;
}

interface Props {
    products: Product[];
}

const ABC_COLOR: Record<string, string> = {
    A: "rgba(79,70,229,0.9)",
    B: "rgba(129,140,248,0.75)",
    C: "rgba(199,210,254,0.85)",
};

export function TopProductsChart({ products }: Props) {
    const top10 = products.slice(0, 10);

    const data: ChartData<"bar"> = {
        labels: top10.map((p) =>
            p.name.length > 22 ? p.name.slice(0, 20) + "…" : p.name
        ),
        datasets: [
            {
                data: top10.map((p) => p.totalSold),
                backgroundColor: top10.map((p) =>
                    p.stockStatus === "low" ? "rgba(239,68,68,0.85)" : (ABC_COLOR[p.abcClass] ?? ABC_COLOR.C)
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
                    label: (ctx) =>
                        `  ${ctx.parsed.x?.toLocaleString()} ຊິ້ນ`,
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
