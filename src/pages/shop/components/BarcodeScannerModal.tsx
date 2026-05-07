import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBarcodeScanned: (barcode: string, keepOpen?: boolean) => void;
    isLoading?: boolean;
}

export function BarcodeScannerModal({ isOpen, onClose, onBarcodeScanned, isLoading }: BarcodeScannerModalProps) {
    const [barcode, setBarcode] = useState("");
    const [keepOpen, setKeepOpen] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setBarcode("");
            // Auto-focus input
            setTimeout(() => document.getElementById("barcode-scanner-input")?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (barcode.trim()) {
            onBarcodeScanned(barcode.trim(), keepOpen);
        }
    };

    // Layout-independent key mapping (Same as POS Grid)
    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow control keys (backspace, enter, tab, etc.)
        if (e.key === 'Enter') return; // Let form submit handle it
        if (e.key === 'Backspace') return;
        if (e.key === 'Tab') return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // Map physical keys to characters (Layout Independent)
        let char = '';
        const code = e.code;

        if (code.startsWith('Digit')) {
            char = code.replace('Digit', '');
        } else if (code.startsWith('Key')) {
            char = code.replace('Key', '').toLowerCase();
        } else if (code === 'Minus') char = '-';
        else if (code === 'Equal') char = '=';

        // Numpad support
        else if (code.startsWith('Numpad') && code.length === 7) {
            char = code.replace('Numpad', '');
        }

        if (char) {
            e.preventDefault();
            setBarcode(prev => prev + char);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>ສະແກນ ບາໂຄດ</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                id="barcode-scanner-input"
                                placeholder="Scan barcode here..."
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                className="pl-9"
                                autoComplete="off"
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" disabled={!barcode.trim() || isLoading}>
                            {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "ໄປ"}
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2 justify-center">
                        <Checkbox id="keep-open" checked={keepOpen} onCheckedChange={(c) => setKeepOpen(!!c)} />
                        <Label htmlFor="keep-open" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            ຄົ້ນຕໍ່ເນື່ອງ
                        </Label>
                    </div>
                    <p className="text-sm text-slate-500 text-center">
                        ຄົ້ນຫາເພື່ອກວດສອບ
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}
