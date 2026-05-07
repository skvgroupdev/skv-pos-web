import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: number;
    subtext?: string;
    colorClass: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, subtext, colorClass }: StatCardProps) => (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
            </div>
            {(trend || subtext) && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                    {trend && (
                        <span className={`flex items-center font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {Math.abs(trend)}%
                        </span>
                    )}
                    <span className="text-slate-400">{subtext}</span>
                </div>
            )}
        </CardContent>
    </Card>
);
