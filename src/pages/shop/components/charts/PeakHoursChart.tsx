import { useRef, useEffect } from "react";
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

interface Props {
    hourlyBreakdown: { hour: number; orders: number; sales: number }[];
}

export function PeakHoursChart({ hourlyBreakdown }: Props) {
    const chartRef = useRef<ChartJS<"bar"> | null>(null);

    const hours = Array.from({ length: 24 }, (_, i) => {
        const found = hourlyBreakdown.find((h) => h.hour === i);
        return { hour: i, orders: found?.orders || 0 };
    });

    const maxOrders = Math.max(...hours.map((h) => h.orders), 1);
    const peakHour = hours.reduce((best, h) => (h.orders > best.orders ? h : best), hours[0]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;
        const ctx = chart.ctx;

        const bgColors = hours.map(({ hour, orders }) => {
            if (orders === 0) return "rgba(226,232,240,0.5)";
            if (hour === peakHour.hour) {
                const grad = ctx.createLinearGradient(0, 0, 0, 200);
                grad.addColorStop(0, "rgba(79,70,229,1)");
                grad.addColorStop(1, "rgba(99,102,241,0.6)");
                return grad;
            }
            const grad = ctx.createLinearGradient(0, 0, 0, 200);
            grad.addColorStop(0, "rgba(165,180,252,0.8)");
            grad.addColorStop(1, "rgba(199,210,254,0.4)");
            return grad;
        });

        chart.data.datasets[0].backgroundColor = bgColors as any;
        chart.update("none");
    }, [hourlyBreakdown]);

    const data: ChartData<"bar"> = {
        labels: hours.map(({ hour }) => `${hour}`),
        datasets: [
            {
                data: hours.map((h) => h.orders),
                backgroundColor: hours.map(({ orders }) =>
                    orders === 0 ? "rgba(226,232,240,0.5)" : "rgba(165,180,252,0.7)"
                ),
                borderRadius: 5,
                borderSkipped: false,
            },
        ],
    };

    const options: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
            tooltip: {
                callbacks: {
                    title: (items) => `${items[0].label}:00`,
                    label: (ctx) => `  ${ctx.parsed.y} ບິນ`,
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
                grid: { display: false },
                ticks: {
                    font: { size: 10 },
                    color: "#CBD5E1",
                    maxRotation: 0,
                    callback: (_, i) => (i % 3 === 0 ? `${i}h` : ""),
                },
                border: { display: false },
            },
            y: {
                grid: { color: "rgba(226,232,240,0.6)", lineWidth: 1 },
                ticks: { font: { size: 10 }, color: "#CBD5E1", precision: 0 },
                border: { display: false },
                max: Math.ceil(maxOrders * 1.25) || 5,
            },
        },
    };

    return (
        <div className="h-44 w-full">
            <Bar ref={chartRef} data={data} options={options} />
        </div>
    );
}
