import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    subtext?: string;
    accent?: "indigo" | "emerald" | "rose" | "amber" | "slate";
    trend?: number;
}

const accentMap = {
    indigo: { bar: "bg-indigo-500", icon: "text-indigo-400", sub: "text-indigo-500" },
    emerald: { bar: "bg-emerald-500", icon: "text-emerald-400", sub: "text-emerald-600" },
    rose: { bar: "bg-rose-500", icon: "text-rose-400", sub: "text-rose-500" },
    amber: { bar: "bg-amber-500", icon: "text-amber-500", sub: "text-amber-600" },
    slate: { bar: "bg-slate-400", icon: "text-slate-400", sub: "text-slate-500" },
};

export const StatCard = ({ title, value, icon: Icon, subtext, accent = "indigo" }: StatCardProps) => {
    const a = accentMap[accent];

    return (
        <div className="relative bg-white rounded-lg border border-slate-200 p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Left accent bar */}
            <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full ${a.bar}`} />

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 leading-none truncate">
                        {value}
                    </p>
                    {subtext && (
                        <p className={`text-xs mt-2 font-medium ${a.sub}`}>{subtext}</p>
                    )}
                </div>
                <div className="shrink-0 mt-0.5">
                    <Icon className={`w-5 h-5 ${a.icon}`} />
                </div>
            </div>
        </div>
    );
};
