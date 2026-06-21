import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    FileText,
    Plus,
    Search,
    Trash2,
    Printer,
    ChevronRight,
    X,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    PackageX,
    Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
    getQuotations,
    createQuotation,
    updateQuotation,
    updateQuotationStatus,
    deleteQuotation,
    type Quotation,
} from "@/api/quotations";
import type { Product } from "@/api/products";
import { printQuotation } from "./components/QuotationPrintTemplate";
import { QuotationProductSearch } from "./components/QuotationProductSearch";

// ─── constants ─────────────────────────────────────────────────────────────────
const STATUS_META: Record<
    string,
    { label: string; color: string; icon: React.ElementType }
> = {
    DRAFT:    { label: "ຮ່າງ",     color: "bg-slate-100 text-slate-600 border-slate-200",    icon: FileText },
    SENT:     { label: "ສົ່ງແລ້ວ",  color: "bg-blue-50 text-blue-700 border-blue-200",        icon: Clock },
    ACCEPTED: { label: "ຍອມຮັບ",   color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
    REJECTED: { label: "ປະຕິເສດ",  color: "bg-rose-50 text-rose-700 border-rose-200",         icon: XCircle },
    EXPIRED:  { label: "ໝົດອາຍຸ",  color: "bg-amber-50 text-amber-700 border-amber-200",      icon: AlertCircle },
};

const ALL_STATUSES = ["ALL", "DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

const DEFAULT_TERMS =
    "1. ໃບສະເໜີລາຄານີ້ມີຜົນໃຊ້ຕາມວັນທີລະບຸ\n" +
    "2. ລາຄາຍັງບໍ່ລວມຄ່າຂົນສົ່ງ ຫຼື ອາດຈະມີການປ່ຽນແປງ\n" +
    "3. ກະລຸນາຢືນຢັນຄຳສັ່ງຊື້ທາງ ໂທລະສັບ ຫຼື ລາຍລັກອັກສອນ";

// ─── types for the form ────────────────────────────────────────────────────────
interface FormItem {
    _key: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discountAmount: number;
}

interface FormState {
    customerName: string;
    customerCompany: string;
    customerPhone: string;
    customerAddress: string;
    customerEmail: string;
    validUntil: string;
    discountAmount: number;
    taxRate: number;
    note: string;
    terms: string;
    items: FormItem[];
}

function emptyForm(): FormState {
    return {
        customerName:    "",
        customerCompany: "",
        customerPhone:   "",
        customerAddress: "",
        customerEmail:   "",
        validUntil:      "",
        discountAmount:  0,
        taxRate:         0,
        note:            "",
        terms:           DEFAULT_TERMS,
        items:           [newItem()],
    };
}

function newItem(): FormItem {
    return {
        _key:          Math.random().toString(36).slice(2),
        name:          "",
        description:   "",
        quantity:      1,
        unit:          "",
        unitPrice:     0,
        discountAmount: 0,
    };
}

function formToPayload(f: FormState) {
    const items = f.items
        .filter((i) => i.name.trim())
        .map((i) => ({
            name:           i.name.trim(),
            description:    i.description || undefined,
            quantity:       Number(i.quantity) || 0,
            unit:           i.unit || undefined,
            unitPrice:      Number(i.unitPrice) || 0,
            discountAmount: Number(i.discountAmount) || 0,
        }));

    return {
        customer: {
            name:    f.customerName.trim(),
            company: f.customerCompany || undefined,
            phone:   f.customerPhone || undefined,
            address: f.customerAddress || undefined,
            email:   f.customerEmail || undefined,
        },
        items,
        discountAmount: Number(f.discountAmount) || 0,
        taxRate:        Number(f.taxRate) || 0,
        note:           f.note || undefined,
        terms:          f.terms || undefined,
        validUntil:     f.validUntil || undefined,
    };
}

function quotationToForm(q: Quotation): FormState {
    return {
        customerName:    q.customer.name,
        customerCompany: q.customer.company || "",
        customerPhone:   q.customer.phone || "",
        customerAddress: q.customer.address || "",
        customerEmail:   q.customer.email || "",
        validUntil:      q.validUntil ? q.validUntil.slice(0, 10) : "",
        discountAmount:  q.discountAmount,
        taxRate:         q.taxRate,
        note:            q.note || "",
        terms:           q.terms || DEFAULT_TERMS,
        items:           q.items.length > 0
            ? q.items.map((i) => ({
                _key:          Math.random().toString(36).slice(2),
                name:          i.name,
                description:   i.description || "",
                quantity:      i.quantity,
                unit:          i.unit || "",
                unitPrice:     i.unitPrice,
                discountAmount: i.discountAmount,
              }))
            : [newItem()],
    };
}

// ─── calc subtotal for preview ─────────────────────────────────────────────────
function calcPreview(f: FormState) {
    const itemTotal = f.items.reduce(
        (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0) - (Number(i.discountAmount) || 0),
        0
    );
    const afterDiscount = Math.max(0, itemTotal - (Number(f.discountAmount) || 0));
    const taxAmount = afterDiscount * ((Number(f.taxRate) || 0) / 100);
    return { subtotal: itemTotal, afterDiscount, taxAmount, total: afterDiscount + taxAmount };
}

// ─── format helpers ─────────────────────────────────────────────────────────────
function fmt(n?: number) {
    return `₭${(n || 0).toLocaleString()}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Quotations() {
    const queryClient = useQueryClient();

    const [search,         setSearch]        = useState("");
    const [statusFilter,   setStatusFilter]  = useState("ALL");
    const [selected,       setSelected]      = useState<Quotation | null>(null);
    const [showForm,       setShowForm]      = useState(false);
    const [editTarget,     setEditTarget]    = useState<Quotation | null>(null);
    const [confirmDelete,  setConfirmDelete] = useState<Quotation | null>(null);
    const [form,           setForm]          = useState<FormState>(emptyForm());

    // open form for NEW
    const openNew = () => {
        setEditTarget(null);
        setForm(emptyForm());
        setShowForm(true);
    };

    // open form for EDIT
    const openEdit = (q: Quotation) => {
        setEditTarget(q);
        setForm(quotationToForm(q));
        setShowForm(true);
    };

    // ── queries ────────────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ["quotations", statusFilter, search],
        queryFn: () =>
            getQuotations({
                status: statusFilter === "ALL" ? undefined : statusFilter,
                search: search || undefined,
            }),
    });

    // ── mutations ──────────────────────────────────────────────────────────────
    const createMut = useMutation({
        mutationFn: createQuotation,
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ["quotations"] });
            toast.success(`ສ້າງ ${created.quoteNumber} ສຳເລັດ`);
            setShowForm(false);
            setSelected(created);
        },
        onError: () => toast.error("ສ້າງໃບສະເໜີລາຄາບໍ່ສຳເລັດ"),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            updateQuotation(id, data),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["quotations"] });
            toast.success("ອັບເດດສຳເລັດ");
            setShowForm(false);
            setSelected(updated);
        },
        onError: () => toast.error("ອັບເດດບໍ່ສຳເລັດ"),
    });

    const statusMut = useMutation({
        mutationFn: ({ id, status }: { id: string; status: Quotation["status"] }) =>
            updateQuotationStatus(id, status),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["quotations"] });
            setSelected(updated);
            toast.success("ອັບເດດສະຖານະສຳເລັດ");
        },
        onError: () => toast.error("ອັບເດດສະຖານະບໍ່ສຳເລັດ"),
    });

    const deleteMut = useMutation({
        mutationFn: deleteQuotation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotations"] });
            toast.success("ລຶບສຳເລັດ");
            setConfirmDelete(null);
            if (selected?._id === confirmDelete?._id) setSelected(null);
        },
        onError: () => toast.error("ລຶບບໍ່ສຳເລັດ"),
    });

    // ── form submit ────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        if (!form.customerName.trim()) {
            toast.error("ກະລຸນາໃສ່ຊື່ລູກຄ້າ");
            return;
        }
        const payload = formToPayload(form);
        if (editTarget) {
            updateMut.mutate({ id: editTarget._id, data: payload });
        } else {
            createMut.mutate(payload);
        }
    };

    const preview = calcPreview(form);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-full min-h-screen bg-slate-50/50 font-lao">

            {/* ── LEFT PANEL: list ─────────────────────────────────────────── */}
            <div className={`flex flex-col border-r border-slate-200 bg-white ${selected ? "hidden lg:flex lg:w-80 xl:w-96" : "flex-1"}`}>

                {/* header */}
                <div className="p-5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <h1 className="text-lg font-bold text-slate-900">ໃບສະເໜີລາຄາ</h1>
                        </div>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={openNew}>
                            <Plus className="w-4 h-4" /> ສ້າງໃໝ່
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="ຄົ້ນຫາ ເລກທີ, ຊື່ລູກຄ້າ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* status tabs */}
                <div className="flex gap-1 px-3 py-2 border-b border-slate-100 overflow-x-auto">
                    {ALL_STATUSES.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                statusFilter === s
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                            {s === "ALL" ? "ທັງໝົດ" : STATUS_META[s]?.label}
                        </button>
                    ))}
                </div>

                {/* list */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <p className="text-center text-slate-400 py-10 text-sm">ກຳລັງໂຫຼດ...</p>
                    ) : (data?.items ?? []).length === 0 ? (
                        <div className="text-center py-14">
                            <PackageX className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-400 text-sm">ຍັງບໍ່ມີໃບສະເໜີລາຄາ</p>
                        </div>
                    ) : (
                        (data?.items ?? []).map((q) => {
                            const meta = STATUS_META[q.status] ?? STATUS_META.DRAFT;
                            const StatusIcon = meta.icon;
                            return (
                                <div
                                    key={q._id}
                                    onClick={() => setSelected(q)}
                                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                                        selected?._id === q._id ? "bg-indigo-50/60 border-l-2 border-l-indigo-500" : ""
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-mono font-bold text-indigo-600">{q.quoteNumber}</span>
                                                <Badge variant="outline" className={`text-[10px] px-2 py-0 ${meta.color}`}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {meta.label}
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800 truncate">{q.customer.name}</p>
                                            {q.customer.company && (
                                                <p className="text-[11px] text-slate-400 truncate">{q.customer.company}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-slate-800">{fmt(q.total)}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {format(new Date(q.createdAt), "dd/MM/yy")}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1.5">
                                        {q.items.length} ລາຍການ
                                        {q.validUntil && (
                                            <span className="ml-2">· ໃຊ້ໄດ້ຮອດ {format(new Date(q.validUntil), "dd/MM/yy")}</span>
                                        )}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL: detail ──────────────────────────────────────── */}
            {selected && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <QuotationDetail
                        quotation={selected}
                        onClose={() => setSelected(null)}
                        onEdit={() => openEdit(selected)}
                        onPrint={() => printQuotation(selected)}
                        onDelete={() => setConfirmDelete(selected)}
                        onStatusChange={(status) =>
                            statusMut.mutate({ id: selected._id, status })
                        }
                    />
                </div>
            )}

            {/* ── no selection placeholder ─────────────────────────────────── */}
            {!selected && (data?.items ?? []).length > 0 && (
                <div className="hidden lg:flex flex-1 items-center justify-center text-slate-300">
                    <div className="text-center">
                        <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">ເລືອກໃບສະເໜີລາຄາເພື່ອດູລາຍລະອຽດ</p>
                    </div>
                </div>
            )}

            {/* ── FORM MODAL ───────────────────────────────────────────────── */}
            {showForm && (
                <QuotationFormModal
                    form={form}
                    setForm={setForm}
                    preview={preview}
                    isEdit={!!editTarget}
                    isPending={createMut.isPending || updateMut.isPending}
                    onSubmit={handleSubmit}
                    onClose={() => setShowForm(false)}
                />
            )}

            {/* ── DELETE CONFIRM ───────────────────────────────────────────── */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <Trash2 className="w-10 h-10 mx-auto text-rose-500 mb-3" />
                                <p className="font-semibold text-slate-800">ລຶບ {confirmDelete.quoteNumber}?</p>
                                <p className="text-sm text-slate-500 mt-1">ການດຳເນີນການນີ້ຈະບໍ່ສາມາດຍ້ອນກັບໄດ້</p>
                            </div>
                            <div className="flex gap-2 mt-5">
                                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>
                                    ຍົກເລີກ
                                </Button>
                                <Button
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                                    onClick={() => deleteMut.mutate(confirmDelete._id)}
                                    disabled={deleteMut.isPending}
                                >
                                    ລຶບ
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTATION DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function QuotationDetail({
    quotation: q,
    onClose,
    onEdit,
    onPrint,
    onDelete,
    onStatusChange,
}: {
    quotation: Quotation;
    onClose: () => void;
    onEdit: () => void;
    onPrint: () => void;
    onDelete: () => void;
    onStatusChange: (s: Quotation["status"]) => void;
}) {
    const meta = STATUS_META[q.status] ?? STATUS_META.DRAFT;
    const StatusIcon = meta.icon;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* header bar */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <span className="text-xs font-mono font-bold text-indigo-600">{q.quoteNumber}</span>
                        <Badge variant="outline" className={`ml-2 text-[10px] px-2 py-0 ${meta.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" /> {meta.label}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onEdit}>
                        <Pencil className="w-3.5 h-3.5" /> ແກ້ໄຂ
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={onPrint}>
                        <Printer className="w-3.5 h-3.5" /> Print / PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50" onClick={onDelete}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* meta + customer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="shadow-sm border-slate-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-slate-400">ສະເໜີຫາ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0.5">
                            <p className="font-bold text-slate-800">{q.customer.name}</p>
                            {q.customer.company && <p className="text-sm text-slate-500">{q.customer.company}</p>}
                            {q.customer.phone   && <p className="text-sm text-slate-500">📞 {q.customer.phone}</p>}
                            {q.customer.address && <p className="text-sm text-slate-500">📍 {q.customer.address}</p>}
                            {q.customer.email   && <p className="text-sm text-slate-500">✉ {q.customer.email}</p>}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-slate-400">ລາຍລະອຽດ</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-slate-500">ວັນທີສ້າງ</span>
                                <span className="font-medium">{format(new Date(q.createdAt), "dd/MM/yyyy")}</span>
                            </div>
                            {q.validUntil && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">ໃຊ້ໄດ້ຮອດ</span>
                                    <span className="font-medium">{format(new Date(q.validUntil), "dd/MM/yyyy")}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">ສະຖານະ</span>
                                <select
                                    className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                    value={q.status}
                                    onChange={(e) => onStatusChange(e.target.value as Quotation["status"])}
                                >
                                    {["DRAFT","SENT","ACCEPTED","REJECTED","EXPIRED"].map((s) => (
                                        <option key={s} value={s}>{STATUS_META[s]?.label}</option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* items table */}
                <Card className="shadow-sm border-slate-100 overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                            ລາຍການ ({q.items.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-y border-slate-100">
                                    <tr>
                                        <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">#</th>
                                        <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">ລາຍການ</th>
                                        <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">ຈຳນວນ</th>
                                        <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-widest text-slate-400 font-semibold hidden md:table-cell">ລາຄາ/ຊິ້ນ</th>
                                        <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-widest text-slate-400 font-semibold hidden md:table-cell">ສ່ວນຫຼຸດ</th>
                                        <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">ລວມ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {q.items.map((item, i) => (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                                            <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-800">{item.name}</p>
                                                {item.description && <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>}
                                                {item.unit && <p className="text-[11px] text-slate-400">{item.quantity} {item.unit}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">{item.quantity.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">{fmt(item.unitPrice)}</td>
                                            <td className="px-4 py-3 text-right text-slate-400 hidden md:table-cell">
                                                {item.discountAmount > 0 ? fmt(item.discountAmount) : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* totals */}
                        <div className="flex justify-end p-4">
                            <div className="w-56 space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">ລາຄາລວມ</span>
                                    <span>{fmt(q.subtotal)}</span>
                                </div>
                                {q.discountAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">ສ່ວນຫຼຸດ</span>
                                        <span className="text-rose-600">- {fmt(q.discountAmount)}</span>
                                    </div>
                                )}
                                {q.taxRate > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">ພາສີ ({q.taxRate}%)</span>
                                        <span>{fmt(q.taxAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-1">
                                    <span className="text-slate-800">ລວມທັງໝົດ</span>
                                    <span className="text-indigo-600">{fmt(q.total)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* note & terms */}
                {(q.note || q.terms) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.note && (
                            <Card className="shadow-sm border-slate-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-widest text-slate-400">ໝາຍເຫດ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{q.note}</p>
                                </CardContent>
                            </Card>
                        )}
                        {q.terms && (
                            <Card className="shadow-sm border-slate-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-widest text-slate-400">ເງື່ອນໄຂ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{q.terms}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function QuotationFormModal({
    form,
    setForm,
    preview,
    isEdit,
    isPending,
    onSubmit,
    onClose,
}: {
    form: FormState;
    setForm: React.Dispatch<React.SetStateAction<FormState>>;
    preview: ReturnType<typeof calcPreview>;
    isEdit: boolean;
    isPending: boolean;
    onSubmit: () => void;
    onClose: () => void;
}) {
    const set = (key: keyof FormState, val: any) =>
        setForm((f) => ({ ...f, [key]: val }));

    const setItem = (idx: number, key: keyof FormItem, val: any) =>
        setForm((f) => {
            const items = [...f.items];
            items[idx] = { ...items[idx], [key]: val };
            return { ...f, items };
        });

    const setItemFromProduct = (idx: number, product: Product) =>
        setForm((f) => {
            const items = [...f.items];
            items[idx] = {
                ...items[idx],
                name:           product.name,
                unit:           product.unit || items[idx].unit,
                unitPrice:      product.sellPrice,
                discountAmount: 0,
                description:    [product.brand, product.modelName]
                                    .filter(Boolean)
                                    .join(" · "),
            };
            return { ...f, items };
        });

    const addItem = () =>
        setForm((f) => ({ ...f, items: [...f.items, newItem()] }));

    const removeItem = (idx: number) =>
        setForm((f) => ({
            ...f,
            items: f.items.filter((_, i) => i !== idx),
        }));

    // close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-end">
            <div className="w-full max-w-2xl bg-white flex flex-col shadow-2xl h-full overflow-hidden">

                {/* modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        {isEdit ? "ແກ້ໄຂໃບສະເໜີລາຄາ" : "ສ້າງໃບສະເໜີລາຄາໃໝ່"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* modal body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* customer info */}
                    <section>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">ຂໍ້ມູນລູກຄ້າ</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="block text-xs text-slate-500 mb-1">ຊື່ລູກຄ້າ *</label>
                                <input
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="ຊື່ລູກຄ້າ ຫຼື ຊື່ທ່ານ..."
                                    value={form.customerName}
                                    onChange={(e) => set("customerName", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">ບໍລິສັດ / ຮ້ານ</label>
                                <input
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="ຊື່ບໍລິສັດ..."
                                    value={form.customerCompany}
                                    onChange={(e) => set("customerCompany", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">ເບີໂທ</label>
                                <input
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="020xxxxxxxx"
                                    value={form.customerPhone}
                                    onChange={(e) => set("customerPhone", e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-slate-500 mb-1">ທີ່ຢູ່</label>
                                <input
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="ທີ່ຢູ່..."
                                    value={form.customerAddress}
                                    onChange={(e) => set("customerAddress", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">ອີເມວ</label>
                                <input
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="email@example.com"
                                    value={form.customerEmail}
                                    onChange={(e) => set("customerEmail", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">ໃຊ້ໄດ້ຮອດວັນທີ</label>
                                <input
                                    type="date"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    value={form.validUntil}
                                    onChange={(e) => set("validUntil", e.target.value)}
                                    min={format(new Date(), "yyyy-MM-dd")}
                                />
                            </div>
                        </div>
                    </section>

                    {/* items */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">ລາຍການສິນຄ້າ / ບໍລິການ</p>
                            <button
                                onClick={addItem}
                                className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-700"
                            >
                                <Plus className="w-3.5 h-3.5" /> ເພີ່ມລາຍການ
                            </button>
                        </div>

                        <div className="space-y-2">
                            {/* header labels */}
                            <div className="grid gap-2 text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-1 hidden md:grid"
                                 style={{ gridTemplateColumns: "1fr 80px 60px 90px 80px 28px" }}>
                                <span>ລາຍການ</span>
                                <span className="text-right">ຈຳນວນ</span>
                                <span className="text-center">ຫົວໜ່ວຍ</span>
                                <span className="text-right">ລາຄາ/ຊິ້ນ</span>
                                <span className="text-right">ສ່ວນຫຼຸດ</span>
                                <span></span>
                            </div>

                            {form.items.map((item, idx) => (
                                <div key={item._key} className="grid gap-2 items-start"
                                     style={{ gridTemplateColumns: "1fr 80px 60px 90px 80px 28px" }}>
                                    <div>
                                        <QuotationProductSearch
                                            value={item.name}
                                            onChange={(val) => setItem(idx, "name", val)}
                                            onProductSelect={(product) => setItemFromProduct(idx, product)}
                                        />
                                        <input
                                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-400"
                                            placeholder="ລາຍລະອຽດ (ທາງເລືອກ)"
                                            value={item.description}
                                            onChange={(e) => setItem(idx, "description", e.target.value)}
                                        />
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        value={item.quantity}
                                        onChange={(e) => setItem(idx, "quantity", e.target.value)}
                                    />
                                    <input
                                        className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        placeholder="ຊິ້ນ"
                                        value={item.unit}
                                        onChange={(e) => setItem(idx, "unit", e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        value={item.unitPrice}
                                        onChange={(e) => setItem(idx, "unitPrice", e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        value={item.discountAmount}
                                        onChange={(e) => setItem(idx, "discountAmount", e.target.value)}
                                    />
                                    <button
                                        onClick={() => removeItem(idx)}
                                        disabled={form.items.length <= 1}
                                        className="mt-1.5 p-1.5 text-slate-300 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-rose-50 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* totals */}
                    <section>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">ສ່ວນຫຼຸດ & ພາສີ</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">ສ່ວນຫຼຸດລວມ (₭)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    value={form.discountAmount}
                                    onChange={(e) => set("discountAmount", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">ພາສີ (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    value={form.taxRate}
                                    onChange={(e) => set("taxRate", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* preview total */}
                        <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                            <span className="text-sm text-indigo-700 font-medium">ລວມທັງໝົດ (ຄາດຄະເນ)</span>
                            <span className="text-lg font-bold text-indigo-700">{fmt(preview.total)}</span>
                        </div>
                    </section>

                    {/* note & terms */}
                    <section>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">ໝາຍເຫດ & ເງື່ອນໄຂ</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">ໝາຍເຫດ</label>
                                <textarea
                                    rows={2}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                    placeholder="ໝາຍເຫດຕ່າງໆ..."
                                    value={form.note}
                                    onChange={(e) => set("note", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">ເງື່ອນໄຂ & ຂໍ້ຕົກລົງ</label>
                                <textarea
                                    rows={4}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                    value={form.terms}
                                    onChange={(e) => set("terms", e.target.value)}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* modal footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-white">
                    <span className="text-sm text-slate-500">
                        {form.items.filter((i) => i.name.trim()).length} ລາຍການ · ລວມ <strong className="text-indigo-600">{fmt(preview.total)}</strong>
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>ຍົກເລີກ</Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={onSubmit}
                            disabled={isPending}
                        >
                            <ChevronRight className="w-4 h-4 mr-1" />
                            {isPending ? "ກຳລັງບັນທຶກ..." : isEdit ? "ບັນທຶກ" : "ສ້າງໃບສະເໜີ"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
