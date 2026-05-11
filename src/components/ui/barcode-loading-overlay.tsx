import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface BarcodeLoadingOverlayProps {
    open: boolean;
    title?: string;
    description?: string;
    className?: string;
}

const barcodeBars = [20, 34, 26, 40, 16, 30, 22, 38, 18, 28, 24, 36];

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
            <style>{`
                @keyframes barcode-scanline {
                    0% { transform: translateX(-110%); opacity: 0; }
                    15% { opacity: 1; }
                    50% { opacity: 1; }
                    100% { transform: translateX(110%); opacity: 0; }
                }
            `}</style>

            <div className="w-[min(92vw,420px)] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/80">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <div className="flex items-end gap-1">
                            {barcodeBars.map((height, index) => (
                                <span
                                    key={index}
                                    className="w-0.5 rounded-full bg-slate-950/90"
                                    style={{
                                        height: `${height}px`,
                                        opacity: 0.7 + (index % 3) * 0.1,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">
                            Processing
                        </p>
                        <h3 className="mt-1 text-lg font-black text-slate-950">{title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="relative overflow-hidden rounded-xl bg-white px-4 py-5">
                        <div className="flex items-end justify-center gap-1.5">
                            {barcodeBars.map((height, index) => (
                                <span
                                    key={index}
                                    className={cn(
                                        "w-2 rounded-full bg-slate-950",
                                        index % 2 === 0 ? "opacity-85" : "opacity-65"
                                    )}
                                    style={{
                                        height: `${height + (index % 4) * 4}px`,
                                        animation: `pulse 1.2s ease-in-out ${index * 0.08}s infinite`,
                                    }}
                                />
                            ))}
                        </div>

                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                                style={{
                                    animation: "barcode-scanline 1.4s ease-in-out infinite",
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                        SKV POS
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>
            </div>
        </div>,
        document.body
    );
}
