import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CreditCard, Loader2, ReceiptText, ShoppingBag, UserRound } from "lucide-react";
import { getDebtOrderDetails } from "@/api/debt";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DebtOrderDetailDialogProps {
    orderId: string | null;
    onClose: () => void;
}

const money = (value?: number) => `${(value || 0).toLocaleString()} ₭`;
const methodLabel: Record<string, string> = {
    CASH: "ເງິນສົດ",
    TRANSFER: "ເງິນໂອນ",
    DEBT: "ຕິດໜີ້",
};
const saleModeLabel: Record<string, string> = {
    retail: "ຂາຍຍ່ອຍ",
    wholesale: "ຂາຍສົ່ງ",
};

export function DebtOrderDetailDialog({ orderId, onClose }: DebtOrderDetailDialogProps) {
    const { data: order, isLoading } = useQuery({
        queryKey: ["debt-order-detail", orderId],
        queryFn: () => getDebtOrderDetails(orderId!),
        enabled: !!orderId,
    });
    const subtotal = order?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

    return (
        <Dialog open={!!orderId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] min-w-0 max-w-5xl overflow-y-auto p-0 sm:w-full">
                <DialogHeader className="sticky top-0 border-b bg-white px-5 py-4 pr-12">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                        <ReceiptText className="h-5 w-5 text-indigo-600" />
                        <DialogTitle className="break-words">ລາຍລະອຽດບິນ {order?.orderId ? `#${order.orderId}` : ""}</DialogTitle>
                        {order && (
                            <Badge className={order.status === "CANCELLED" ? "bg-rose-100 text-rose-700" : order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                                {order.status === "CANCELLED" ? "ຍົກເລີກແລ້ວ" : order.paymentStatus === "PAID" ? "ຊຳລະແລ້ວ" : "ຍັງຄ້າງ"}
                            </Badge>
                        )}
                    </div>
                    <DialogDescription className="text-left">{order ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm") : ""}</DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>
                ) : order ? (
                    <div className="min-w-0 space-y-6 px-5 py-5">
                        <section className="grid gap-4 border-b pb-5 md:grid-cols-2">
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><UserRound className="h-4 w-4 text-indigo-600" />ລູກຄ້າ</h3>
                                <div className="grid gap-2 text-sm sm:grid-cols-2">
                                    <Detail label="ຊື່" value={order.customerId?.name || "-"} />
                                    <Detail label="ເບີໂທ" value={order.customerId?.phone || "-"} />
                                    <Detail label="ທີ່ຢູ່" value={order.customerId?.address || "-"} />
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><UserRound className="h-4 w-4 text-sky-600" />ຜູ້ຂາຍ</h3>
                                <div className="grid gap-2 text-sm sm:grid-cols-2">
                                    <Detail label="ຊື່ຜູ້ໃຊ້" value={order.cashierId?.username || "-"} />
                                    <Detail label="ລະຫັດ" value={order.cashierId?.employeeCode || "-"} />
                                </div>
                            </div>
                        </section>

                        <section className="min-w-0">
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><ShoppingBag className="h-4 w-4 text-indigo-600" />ລາຍການສິນຄ້າ ({order.items.length})</h3>
                            <div className="max-w-full overflow-x-auto border">
                                <table className="w-full min-w-[680px] text-sm">
                                    <thead className="border-b bg-slate-50 text-slate-500"><tr><th className="w-12 p-3 text-center">#</th><th className="p-3 text-left">ສິນຄ້າ</th><th className="p-3 text-right">ລາຄາ/ໜ່ວຍ</th><th className="p-3 text-right">ຈຳນວນ</th><th className="p-3 text-right">ລວມ</th></tr></thead>
                                    <tbody className="divide-y">{order.items.map((item, index) => <tr key={`${item.product}-${index}`}><td className="p-3 text-center text-slate-400">{index + 1}</td><td className="p-3 font-medium">{item.name}</td><td className="p-3 text-right">{money(item.price)}</td><td className="p-3 text-right">{item.quantity.toLocaleString()}</td><td className="p-3 text-right font-semibold">{money(item.price * item.quantity)}</td></tr>)}</tbody>
                                    <tfoot className="border-t-2 bg-slate-50"><tr><td colSpan={4} className="p-3 text-right text-slate-500">ລວມສິນຄ້າ</td><td className="p-3 text-right font-semibold">{money(subtotal)}</td></tr>{order.discount > 0 ? <tr><td colSpan={4} className="p-3 text-right text-rose-600">ສ່ວນຫຼຸດ</td><td className="p-3 text-right font-semibold text-rose-600">-{money(order.discount)}</td></tr> : null}<tr><td colSpan={4} className="p-3 text-right font-bold">ຍອດບິນສຸດທິ</td><td className="p-3 text-right text-lg font-bold text-indigo-700">{money(order.total)}</td></tr></tfoot>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><CreditCard className="h-4 w-4 text-emerald-600" />ສະຫຼຸບການຊຳລະ</h3>
                            <div className="grid gap-3 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Detail label="ປະເພດການຂາຍ" value={saleModeLabel[order.saleMode || ""] || "-"} />
                                <Detail label="ຊ່ອງທາງໃນບິນ" value={methodLabel[order.paymentMethod] || order.paymentMethod} />
                                <Detail label="ຍອດບິນ" value={money(order.total)} />
                                <Detail label="ຊຳລະສະສົມ" value={money(order.paidAmount)} tone="green" />
                                <Detail label="ຍອດຄ້າງ" value={money(order.remainingAmount)} tone={order.remainingAmount > 0 ? "red" : undefined} />
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="flex h-64 items-center justify-center text-slate-400">ບໍ່ພົບຂໍ້ມູນບິນ</div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Detail({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" }) {
    const toneClass = tone === "green" ? "text-emerald-700" : tone === "red" ? "text-rose-700" : "text-slate-900";
    return <div><div className="text-xs text-slate-500">{label}</div><div className={`mt-1 break-words font-semibold ${toneClass}`}>{value}</div></div>;
}
