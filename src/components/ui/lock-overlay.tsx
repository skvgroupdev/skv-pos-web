
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockOverlayProps {
    title: string;
    description?: string;
    showUpgradeBadge?: boolean;
    className?: string;
}

export const LockOverlay = ({ title, description, showUpgradeBadge = false, className }: LockOverlayProps) => {
    return (
        <div className={cn("absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-300 rounded-xl", className)}>
            <div className="bg-slate-100 p-3 rounded-full mb-3">
                <Lock className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-700 mb-1">{title}</h3>
            {description && (
                <p className="text-xs text-slate-500 max-w-[200px] mb-3">{description}</p>
            )}
            {showUpgradeBadge && (
                <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">
                    Upgrade Plan
                </div>
            )}
        </div>
    );
};
