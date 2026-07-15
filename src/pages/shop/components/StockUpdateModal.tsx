import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { NumericInput } from "@/components/NumericInput";
import type { Product } from "@/api/products";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface StockUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onConfirm: (productId: string, adjustment: number, type: string, note: string) => void;
    onCancel?: () => void;
    onEdit?: (product: Product) => void;
}

export function StockUpdateModal({ isOpen, onClose, product, onConfirm, onCancel, onEdit }: StockUpdateModalProps) {
    const [amount, setAmount] = useState(0);
    const [type, setType] = useState("IN_PURCHASE");
    const [note, setNote] = useState("");

    useEffect(() => {
        if (isOpen) {
            setAmount(0);
            setType("IN_PURCHASE");
            setNote("");
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (product && amount > 0) {
            // Determine sign based on type
            let adjustment = amount;
            if (["OUT_DAMAGE"].includes(type)) {
                adjustment = -amount;
            }
            // ADJUST can be +/- but usually we treat "Add Stock" as IN and "Reduce Stock" implies OUT. 
            // If user selects ADJUST, we might assume positive adjustment unless we add a specific toggle?
            // Let's assume ADJUST follows the sign of the amount. 
            // BUT wait, IN/OUT clearly define direction. ADJUST is ambiguous.
            // If user wants to reduce stock via ADJUST, they should probably pick a type that implies reduction or enter negative?
            // The `NumericInput` usually handles positive numbers. 
            // Let's force valid types:
            // IN_PURCHASE (+), IN_RETURN (+), OUT_SALE (-), OUT_DAMAGE (-), ADJUST (+/-?)
            // For simplicity, let's say ADJUST is + (Increase) and maybe add "ADJUST_DOWN" or just let user pick OUT_DAMAGE/SALE.
            // Or better: Let's explicitly show the operation.

            onConfirm(product._id, adjustment, type, note);
        }
    };

    if (!product) return null;

    const isReduction = ["OUT_DAMAGE"].includes(type);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle> ຈັດການສະຕັອກ</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-slate-800">{product.name}</h4>
                        <p className="text-slate-500 text-sm">ບາໂຄດ: {product.barcode}</p>
                        <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
                            <span className="text-slate-600">ຈຳນວນປັດຈຸບັນ:</span>
                            <span className="font-bold text-slate-800">{product.stock} {product.unit}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">ປະເພດ</label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IN_PURCHASE">ຊື້ເຂົ້າ</SelectItem>
                                    <SelectItem value="OUT_DAMAGE">ເສຍຫາຍ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">ຈຳນວນ</label>
                            <NumericInput
                                value={amount}
                                onValueChange={setAmount}
                                className={`text-center font-bold text-lg ${isReduction ? "text-red-600" : "text-green-600"}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">ໝາຍເຫດ *</label>
                        <Input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="..."
                        />
                    </div>

                    <div className="flex justify-between items-center text-sm p-2 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                        <span>ຈຳນວນໃໝ່:</span>
                        <span className="font-bold text-lg">
                            {product.stock + (isReduction ? -amount : amount)} {product.unit}
                        </span>
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between w-full">
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button variant="outline" onClick={() => onEdit(product)} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                ແກ້ໄຂຂໍ້ມູນ
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel || onClose}>ຍົກເລີກ</Button>
                        <Button onClick={handleConfirm} disabled={amount <= 0 || !note.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                            ຍືນຢັນ
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
