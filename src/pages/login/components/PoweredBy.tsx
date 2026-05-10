interface PoweredByProps {
    skvGroupLogoPath: string;
}

export function PoweredBy({ skvGroupLogoPath }: PoweredByProps) {
    return (
        <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                <span>Powered by</span>
                <img
                    src={skvGroupLogoPath}
                    alt="SKV Group"
                    className="h-5 w-auto object-contain"
                />
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
                &copy; {new Date().getFullYear()} SKV POS System.
                ສະຫງວນລິຂະສິດ.
            </p>
        </div>
    );
}
