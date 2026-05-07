import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getProductTransactions, type InventoryTransaction } from "@/api/products";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string | null;
    productName: string;
}

export function ProductHistoryModal({ isOpen, onClose, productId, productName }: ProductHistoryModalProps) {
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && productId) {
            setLoading(true);
            getProductTransactions(productId)
                .then(setTransactions)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, productId]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case "IN_PURCHASE":
            case "IN_RETURN":
                return "bg-green-100 text-green-800";
            case "OUT_SALE":
            case "OUT_DAMAGE":
                return "bg-red-100 text-red-800";
            case "ADJUST":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-slate-100 text-slate-800";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "IN_PURCHASE": return "ຊື້ເຂົ້າ";
            case "IN_RETURN": return "ຮັບຄືນ";
            case "OUT_SALE": return "ຂາຍ";
            case "OUT_DAMAGE": return "ເສຍຫາຍ";
            case "ADJUST": return "ປັບປຸງ";
            default: return type;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>ປະຫວັດສິນຄ້າ: {productName}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            ບໍ່ມີປະຫວັດການເຄື່ອນໄຫວ
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3">ວັນທີ</th>
                                        <th className="px-4 py-3">ປະເພດ</th>
                                        <th className="px-4 py-3 text-right">ຈຳນວນ</th>
                                        <th className="px-4 py-3 text-right">ຕົ້ນທຶນ</th>
                                        <th className="px-4 py-3">ໝາຍເຫດ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-slate-500">
                                                {format(new Date(tx.date), "dd/MM/yyyy HH:mm")}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary" className={`font-normal ${getTypeColor(tx.type)}`}>
                                                    {getTypeLabel(tx.type)}
                                                </Badge>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold ${tx.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                                                {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">
                                                {tx.cost?.toLocaleString() || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={tx.note}>
                                                {tx.note || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
