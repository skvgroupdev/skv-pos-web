import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface BarcodeLoadingOverlayProps {
    open: boolean;
    title?: string;
    description?: string;
    className?: string;
}

export function BarcodeLoadingOverlay({
    open,
    title = "ກຳລັງບັນທຶກບິນ",
    description = "ກະລຸນາລໍຖ້າສັກຄູ່",
    className,
}: BarcodeLoadingOverlayProps) {
    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-[90] flex items-center justify-center bg-white/75 px-4 py-6 backdrop-blur-sm",
                className
            )}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="w-[min(92vw,360px)] rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-200/80">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                    <div
                        className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"
                        aria-hidden="true"
                    />
                </div>

                <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600">
                        Processing
                    </p>
                    <h3 className="mt-1 text-base font-bold text-slate-950">{title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
                </div>

                <div className="mt-5 h-px bg-slate-100" />

                <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                    SKV POS
                </div>
            </div>
        </div>,
        document.body
    );
}
