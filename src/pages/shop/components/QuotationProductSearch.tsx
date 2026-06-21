import { useState, useRef, useEffect } from "react";
import { Search, Barcode, Package } from "lucide-react";
import { searchProducts, type Product } from "@/api/products";

interface Props {
    value: string;
    onChange: (val: string) => void;
    onProductSelect: (product: Product) => void;
    autoFocus?: boolean;
}

export function QuotationProductSearch({ value, onChange, onProductSelect, autoFocus }: Props) {
    const [results, setResults]         = useState<Product[]>([]);
    const [open, setOpen]               = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const [loading, setLoading]         = useState(false);

    const inputRef     = useRef<HTMLInputElement>(null);
    const dropdownRef  = useRef<HTMLDivElement>(null);
    const debounceRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastKeyMs    = useRef<number>(0);
    // always-current copy of value so async callbacks read the latest
    const valueRef     = useRef(value);
    useEffect(() => { valueRef.current = value; }, [value]);

    // ── search ──────────────────────────────────────────────────────────────
    const runSearch = async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed) { setResults([]); setOpen(false); return; }
        setLoading(true);
        try {
            const data: Product[] = await searchProducts(trimmed);
            const list = data.slice(0, 8);
            setResults(list);
            setHighlighted(0);

            // barcode / sku exact match → auto-select silently
            const exact = list.find(
                (p) => p.barcode === trimmed || p.sku === trimmed
            );
            if (exact) {
                selectProduct(exact);
                return;
            }
            // single result → auto-select
            if (list.length === 1) {
                selectProduct(list[0]);
                return;
            }
            setOpen(list.length > 0);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // ── select ──────────────────────────────────────────────────────────────
    const selectProduct = (product: Product) => {
        onProductSelect(product);
        onChange(product.name);
        setOpen(false);
        setResults([]);
    };

    // ── input handlers ───────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        clearTimeout(debounceRef.current);
        if (!e.target.value.trim()) { setResults([]); setOpen(false); return; }
        debounceRef.current = setTimeout(() => runSearch(e.target.value), 300);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const now = Date.now();
        lastKeyMs.current = now;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, results.length - 1));
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
            return;
        }
        if (e.key === "Escape") {
            setOpen(false);
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            clearTimeout(debounceRef.current);

            // dropdown is open — select highlighted row
            if (open && results[highlighted]) {
                selectProduct(results[highlighted]);
                return;
            }

            // barcode scanner: rapid chars then Enter (gap < 80 ms)
            // OR: user pressed Enter to trigger manual search
            runSearch(valueRef.current);
            return;
        }

        // Hardware barcode scanners send chars rapidly (gap < 50 ms) then Enter.
        // lastKeyMs tracking above is enough — no extra handling needed here.
    };

    // close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                !dropdownRef.current?.contains(e.target as Node) &&
                !inputRef.current?.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative">
            {/* ── input ─────────────────────────────────────────────────── */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                    ref={inputRef}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    className="w-full pl-8 pr-7 border border-slate-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow"
                    placeholder="ຊື່ສິນຄ້າ, ບາໂຄດ, SKU..."
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (results.length > 0) setOpen(true); }}
                />
                {loading && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                )}
                {!loading && value && (
                    <Barcode className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300 pointer-events-none" />
                )}
            </div>

            {/* ── dropdown ──────────────────────────────────────────────── */}
            {open && results.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
                    style={{ minWidth: 280 }}
                >
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                            ຜົນການຄົ້ນຫາ ({results.length})
                        </span>
                        <span className="text-[10px] text-slate-400">↑↓ Enter ເລືອກ</span>
                    </div>

                    {results.map((p, i) => (
                        <div
                            key={p._id}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                i === highlighted ? "bg-indigo-50" : "hover:bg-slate-50"
                            }`}
                            onMouseEnter={() => setHighlighted(i)}
                            onMouseDown={(e) => { e.preventDefault(); selectProduct(p); }}
                        >
                            {/* thumbnail */}
                            <div className="w-9 h-9 rounded-lg border border-slate-100 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                                {p.imageVariants?.[0]?.small || p.images?.[0] ? (
                                    <img
                                        src={p.imageVariants?.[0]?.small ?? p.images?.[0]}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Package className="w-4 h-4 text-slate-300" />
                                )}
                            </div>

                            {/* name + meta */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                                <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                                    {p.barcode && (
                                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                            <Barcode className="w-2.5 h-2.5" />
                                            {p.barcode}
                                        </span>
                                    )}
                                    {p.sku && (
                                        <span className="text-[10px] text-slate-400">
                                            SKU: {p.sku}
                                        </span>
                                    )}
                                    <span className={`text-[10px] font-medium ${p.stock <= 0 ? "text-rose-500" : "text-slate-400"}`}>
                                        Stock: {p.stock} {p.unit}
                                    </span>
                                </div>
                            </div>

                            {/* price */}
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-indigo-600">
                                    ₭{p.sellPrice.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-slate-400">/ {p.unit}</p>
                            </div>
                        </div>
                    ))}

                    <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50">
                        <p className="text-[10px] text-slate-400 text-center">
                            ກົດ Enter ຫຼື ສະແກນ barcode ເພື່ອເລືອກ
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

