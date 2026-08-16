import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, Loader2 } from "lucide-react";
import { getDebtTransactions } from "@/api/debt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DebtOrderDetailDialog } from "./DebtOrderDetailDialog";

interface DebtRepaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    startDate: Date;
    endDate: Date;
    saleMode?: "retail" | "wholesale";
}

const money = (value?: number) => `${(value || 0).toLocaleString()} ₭`;
const methodLabel: Record<string, string> = {
    CASH: "ເງິນສົດ",
    TRANSFER: "ເງິນໂອນ",
    MIXED: "ປະສົມ",
    ADJUSTMENT: "ຂໍ້ມູນຈາກລະບົບເກົ່າ",
};

export function DebtRepaymentModal({ open, onOpenChange, startDate, endDate, saleMode }: DebtRepaymentModalProps) {
    const [page, setPage] = useState(1);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const startDateIso = startDate.toISOString();
    const endDateIso = endDate.toISOString();
    const params = useMemo(() => ({
        startDate: startDateIso,
        endDate: endDateIso,
        saleMode,
        page,
        limit: 20,
    }), [endDateIso, page, saleMode, startDateIso]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["dashboard-debt-repayments", params],
        queryFn: () => getDebtTransactions(params),
        enabled: open,
        placeholderData: (previous) => previous,
    });

    return (<>
        <Dialog open={open} onOpenChange={(nextOpen) => {
            if (!nextOpen) {
                setPage(1);
                setSelectedOrderId(null);
            }
            onOpenChange(nextOpen);
        }}>
            <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden p-0">
                <DialogHeader className="border-b px-5 py-4 pr-12">
                    <DialogTitle>ລາຍການຮັບຊຳລະໜີ້</DialogTitle>
                    <DialogDescription>
                        {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between gap-4 border-b bg-emerald-50 px-5 py-3 text-sm">
                    <span className="text-emerald-800">{(data?.analytics.total.count || 0).toLocaleString()} ລາຍການ</span>
                    <strong className="text-base tabular-nums text-emerald-800">{money(data?.analytics.total.totalAmount)}</strong>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[980px] text-sm">
                        <thead className="sticky top-0 z-10 border-b bg-slate-50 text-left text-xs text-slate-500">
                            <tr>
                                <th className="px-4 py-3">ວັນເວລາ</th>
                                <th className="w-16 px-2 py-3 text-center">ບິນ</th>
                                <th className="px-4 py-3">ໃບຮັບ</th>
                                <th className="px-4 py-3">ລູກຄ້າ</th>
                                <th className="px-4 py-3">ເລກບິນ</th>
                                <th className="px-4 py-3">ຊ່ອງທາງ</th>
                                <th className="px-4 py-3">ຜູ້ຮັບ</th>
                                <th className="px-4 py-3 text-right">ຮັບຊຳລະ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr><td colSpan={8} className="h-48 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" /></td></tr>
                            ) : data?.transactions.length ? data.transactions.map((transaction) => (
                                <tr key={transaction._id} className="align-top hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3">{format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}</td>
                                    <td className="px-2 py-2 text-center">{transaction.order?._id ? <Button type="button" size="icon" variant="ghost" onClick={() => setSelectedOrderId(transaction.order!._id)} aria-label={`ເບິ່ງລາຍລະອຽດບິນ ${transaction.order.orderId}`} title="ເບິ່ງລາຍລະອຽດ"><Eye className="h-4 w-4" /></Button> : "-"}</td>
                                    <td className="whitespace-nowrap px-4 py-3 font-mono">#{transaction.receiptNumber || transaction._id.slice(-8)}</td>
                                    <td className="px-4 py-3"><div className="font-medium text-slate-800">{transaction.customer?.name || "-"}</div><div className="text-xs text-slate-400">{transaction.customer?.phone || ""}</div></td>
                                    <td className="px-4 py-3"><div className="font-mono">{transaction.order?.orderId ? `#${transaction.order.orderId}` : "FIFO"}</div>{transaction.order && <div className="mt-1 text-xs text-slate-400">{money(transaction.order.total)}</div>}</td>
                                    <td className="px-4 py-3">{methodLabel[transaction.paymentMethod || ""] || transaction.paymentMethod || "-"}</td>
                                    <td className="px-4 py-3">{transaction.processedBy?.username || "-"}</td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-700">{money(transaction.amount)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={8} className="h-48 text-center text-slate-400">ບໍ່ພົບລາຍການ</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t bg-white px-5 py-3 text-sm">
                    <span className="text-slate-500">{data?.total || 0} ລາຍການ</span>
                    <div className="flex items-center gap-2">
                        {isFetching && !isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-400" />}
                        <Button type="button" size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="ໜ້າກ່ອນ"><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="min-w-20 text-center tabular-nums">{page} / {data?.totalPages || 1}</span>
                        <Button type="button" size="icon" variant="outline" disabled={page >= (data?.totalPages || 1)} onClick={() => setPage((value) => value + 1)} aria-label="ໜ້າຕໍ່ໄປ"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        <DebtOrderDetailDialog orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </>);
}
