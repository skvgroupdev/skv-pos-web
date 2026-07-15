import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getGlobalTransactions, type InventoryTransaction } from "@/api/products";
import { Loader2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface InventoryHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InventoryHistoryModal({ isOpen, onClose }: InventoryHistoryModalProps) {
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        type: "ALL"
    });

    const fetchTransactions = () => {
        setLoading(true);
        getGlobalTransactions(filters)
            .then(setTransactions)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (isOpen) {
            fetchTransactions();
        }
    }, [isOpen]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "IN_PURCHASE":
            case "IN_RETURN":
            case "VOID_RETURN":
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
            case "VOID_RETURN": return "ຍົກເລີກຄືນ stock";
            case "OUT_SALE": return "ຂາຍ";
            case "OUT_DAMAGE": return "ເສຍຫາຍ";
            case "ADJUST": return "ແກ້ໄຂ";
            default: return type;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 text-slate-900 bg-white">
                <DialogHeader className="p-4 border-b bg-slate-50">
                    <DialogTitle className="flex items-center gap-2">
                        <HistoryIcon className="h-5 w-5 text-indigo-600" />
                        ປະຫວັດການເຄື່ອນໄຫວສາງ
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 border-b bg-white flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">ປະເພດ</label>
                            <Select
                                value={filters.type}
                                onValueChange={(val) => handleFilterChange("type", val)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="ປະເພດ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">ທັງໝົດ</SelectItem>
                                    <SelectItem value="IN_PURCHASE">ຊື້ເຂົ້າ</SelectItem>
                                    <SelectItem value="OUT_SALE">ຂາຍອອກ</SelectItem>
                                    <SelectItem value="ADJUST">ປັບປຸງ</SelectItem>
                                    <SelectItem value="OUT_DAMAGE">ເສຍຫາຍ</SelectItem>
                                    <SelectItem value="IN_RETURN">ຮັບຄືນ</SelectItem>
                                    <SelectItem value="VOID_RETURN">ຄືນ stock ຈາກຍົກເລີກບິນ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">ວັນທີເລີ່ມຕົ້ນ</label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">ວັນທີສິ້ນສຸດ</label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                    <Button onClick={fetchTransactions} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
                        <Filter className="h-4 w-4 mr-2" />
                        ຄົ້ນຫາ
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-lg bg-slate-50">
                            ບໍ່ມີຂໍ້ມູນປະຫວັດການເຄື່ອນໄຫວ
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">ວັນທີ</th>
                                        <th className="px-4 py-3">ສິນຄ້າ </th>
                                        <th className="px-4 py-3">ບາໂຄດ</th>
                                        <th className="px-4 py-3">ປະເພດ</th>
                                        <th className="px-4 py-3 text-right">ຈຳນວນ</th>
                                        <th className="px-4 py-3 text-right">ຕົ້ນທຶນ</th>
                                        <th className="px-4 py-3">ໝາຍເຫດ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                {format(new Date(tx.date), "dd/MM/yyyy HH:mm")}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {/* @ts-ignore */}
                                                {tx.productId?.name || "Unknown Product"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                                {/* @ts-ignore */}
                                                {tx.productId?.barcode || "-"}
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

function HistoryIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    )
}
