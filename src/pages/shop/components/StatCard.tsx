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
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-4 xl:p-5">
            {/* Left accent bar */}
            <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full ${a.bar}`} />

            <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                    <p className="mb-1.5 break-words text-[10px] font-semibold uppercase leading-snug tracking-wide text-slate-400 sm:text-[11px] xl:tracking-widest">
                        {title}
                    </p>
                    <p className="break-words text-lg font-bold leading-tight text-slate-900 sm:text-xl lg:text-[clamp(1.05rem,1.35vw,1.5rem)]">
                        {value}
                    </p>
                    {subtext && (
                        <p className={`mt-2 break-words text-[11px] font-medium leading-snug sm:text-xs ${a.sub}`}>{subtext}</p>
                    )}
                </div>
                <div className="shrink-0 mt-0.5">
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${a.icon}`} />
                </div>
            </div>
        </div>
    );
};
