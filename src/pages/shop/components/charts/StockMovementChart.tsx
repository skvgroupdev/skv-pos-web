import { Line } from "react-chartjs-2";
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from "chart.js";
import type { StockMovement } from "@/api/reports";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

interface StockMovementChartProps {
    movement: StockMovement[];
}

const formatDateLabel = (date: string) => {
    const [year, month, day] = date.split("-");
    return year && month && day ? `${day}/${month}` : date;
};

export function StockMovementChart({ movement }: StockMovementChartProps) {
    const data: ChartData<"line"> = {
        labels: movement.map((day) => formatDateLabel(day.date)),
        datasets: [
            {
                label: "ສິນຄ້າຂາຍອອກ (ຊິ້ນ)",
                data: movement.map((day) => day.unitsSold),
                borderColor: "#4F46E5",
                backgroundColor: "rgba(79,70,229,0.12)",
                pointBackgroundColor: "#4F46E5",
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.3,
                fill: true,
                yAxisID: "y",
            },
            {
                label: "ຈຳນວນບິນ",
                data: movement.map((day) => day.ordersCount),
                borderColor: "#10B981",
                backgroundColor: "rgba(16,185,129,0.08)",
                pointBackgroundColor: "#10B981",
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.3,
                yAxisID: "orders",
            },
        ],
    };

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
            legend: {
                position: "bottom",
                labels: { boxWidth: 10, boxHeight: 10, color: "#64748B", font: { size: 11 } },
            },
            tooltip: {
                backgroundColor: "#0F172A",
                padding: 10,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: "#94A3B8", font: { size: 10 } },
                border: { display: false },
            },
            y: {
                beginAtZero: true,
                grid: { color: "rgba(226,232,240,0.8)" },
                ticks: { color: "#94A3B8", precision: 0 },
                border: { display: false },
            },
            orders: {
                beginAtZero: true,
                position: "right",
                grid: { display: false },
                ticks: { color: "#94A3B8", precision: 0 },
                border: { display: false },
            },
        },
    };

    return (
        <div className="h-72 w-full" role="img" aria-label="ກຣາຟການເຄື່ອນໄຫວສິນຄ້າແຍກຕາມວັນ">
            <Line data={data} options={options} />
        </div>
    );
}
