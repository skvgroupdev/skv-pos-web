import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Save, Printer } from "lucide-react";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import Bill58mm from "./bill-templates/Bill58mm";
import Bill80mm from "./bill-templates/Bill80mm";
import BillA5 from "./bill-templates/BillA5";
import BillA4 from "./bill-templates/BillA4";
import type { BillConfig, BillPrintData } from "./bill-templates/billPrintUtils";

interface BillSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const PAPER_SIZES: Record<NonNullable<BillConfig["paperSize"]>, { width: string; description: string }> = {
    "58mm": { width: "58mm", description: "58mm Thermal" },
    "80mm": { width: "80mm", description: "80mm Thermal" },
    A4: { width: "210mm", description: "A4" },
    A5: { width: "148mm", description: "A5" },
};

const createBillConfig = (paperSize: NonNullable<BillConfig["paperSize"]>): BillConfig => {
    const is58mm = paperSize === "58mm";

    return {
        paperSize,
        showLogo: !is58mm,
        showQR: !is58mm,
        showNotes: true,
        fontSize: "medium",
    };
};

const normalizeBillConfig = (config?: Partial<BillConfig>): BillConfig => {
    return createBillConfig(config?.paperSize || "80mm");
};

const SAMPLE_QR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="SKV QR">
  <rect width="120" height="120" fill="#fff"/>
  <rect x="8" y="8" width="32" height="32" fill="#fff" stroke="#000" stroke-width="4"/>
  <rect x="16" y="16" width="16" height="16" fill="#000"/>
  <rect x="80" y="8" width="32" height="32" fill="#fff" stroke="#000" stroke-width="4"/>
  <rect x="88" y="16" width="16" height="16" fill="#000"/>
  <rect x="8" y="80" width="32" height="32" fill="#fff" stroke="#000" stroke-width="4"/>
  <rect x="16" y="88" width="16" height="16" fill="#000"/>
  <rect x="52" y="16" width="8" height="8" fill="#000"/>
  <rect x="60" y="16" width="8" height="8" fill="#000"/>
  <rect x="68" y="16" width="8" height="8" fill="#000"/>
  <rect x="52" y="24" width="8" height="8" fill="#000"/>
  <rect x="76" y="24" width="8" height="8" fill="#000"/>
  <rect x="48" y="40" width="8" height="8" fill="#000"/>
  <rect x="64" y="40" width="8" height="8" fill="#000"/>
  <rect x="72" y="40" width="8" height="8" fill="#000"/>
  <rect x="88" y="48" width="8" height="8" fill="#000"/>
  <rect x="56" y="56" width="8" height="8" fill="#000"/>
  <rect x="72" y="56" width="8" height="8" fill="#000"/>
  <rect x="96" y="56" width="8" height="8" fill="#000"/>
  <rect x="48" y="64" width="8" height="8" fill="#000"/>
  <rect x="56" y="72" width="8" height="8" fill="#000"/>
  <rect x="72" y="72" width="8" height="8" fill="#000"/>
  <rect x="88" y="72" width="8" height="8" fill="#000"/>
  <rect x="48" y="88" width="8" height="8" fill="#000"/>
  <rect x="64" y="88" width="8" height="8" fill="#000"/>
  <rect x="80" y="88" width="8" height="8" fill="#000"/>
  <text x="60" y="112" text-anchor="middle" font-size="9" font-family="Arial, sans-serif" fill="#000">SKV QR</text>
</svg>
`.trim();

const TEST_BILL_DATA: BillPrintData = {
    orderId: "TEST-0001",
    createdAt: new Date().toISOString(),
    cashierId: { username: "Admin" },
    customerId: { name: "Test Customer", phone: "020 12345678", address: "Vientiane" },
    items: [
        { name: "Test product 1", quantity: 2, price: 15000 },
        { name: "Test product 2", quantity: 1, price: 20000 },
    ],
    total: 50000,
    discount: 0,
    paidAmount: 50000,
    change: 0,
    remainingAmount: 0,
    paymentMethod: "CASH",
    tenantId: {
        shopName: "Test Shop",
        address: "Vientiane, Laos",
        phone: "020 12345678",
        logo: "/logo/logo-no-bg.png",
        bankQr: SAMPLE_QR_SVG,
    },
};

export default function BillSettings({ isOpen, onClose }: BillSettingsProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [config, setConfig] = useState<BillConfig>(() => {
        const saved = localStorage.getItem("billConfig");
        if (saved) {
            try {
                return normalizeBillConfig(JSON.parse(saved) as Partial<BillConfig>);
            } catch (e) {
                console.error("Failed to load bill config", e);
            }
        }

        return createBillConfig("80mm");
    });

    const handlePrintTest = useReactToPrint({
        contentRef,
        documentTitle: "Test-Bill",
    });

    const renderBillTemplate = () => {
        const templateProps = { data: TEST_BILL_DATA, config };

        switch (config.paperSize) {
            case "58mm":
                return <Bill58mm {...templateProps} />;
            case "80mm":
                return <Bill80mm {...templateProps} />;
            case "A5":
                return <BillA5 {...templateProps} />;
            case "A4":
                return <BillA4 {...templateProps} />;
            default:
                return <Bill80mm {...templateProps} />;
        }
    };

    const handlePaperSizeChange = (paperSize: NonNullable<BillConfig["paperSize"]>) => {
        setConfig(createBillConfig(paperSize));
    };

    const handleSave = () => {
        const normalizedConfig = normalizeBillConfig(config);
        localStorage.setItem("billConfig", JSON.stringify(normalizedConfig));
        setConfig(normalizedConfig);
        toast.success("Bill settings saved!");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-indigo-600" />
                        Bill Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 space-y-6 overflow-y-auto py-4 pr-2">
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Paper size</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(PAPER_SIZES).map(([key, value]) => {
                                const paperSize = key as NonNullable<BillConfig["paperSize"]>;
                                const isSelected = config.paperSize === paperSize;

                                return (
                                    <button
                                        key={paperSize}
                                        type="button"
                                        onClick={() => handlePaperSizeChange(paperSize)}
                                        className={`rounded-lg border-2 p-4 text-left transition-all ${isSelected
                                            ? "border-indigo-600 bg-indigo-50"
                                            : "border-slate-200 hover:border-slate-300"
                                            }`}
                                    >
                                        <div className="font-semibold">{value.description}</div>
                                        <div className="mt-1 text-xs text-slate-500">Width: {value.width}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
                        58mm uses text-only receipt mode. Logo and QR are disabled automatically.
                    </div>
                </div>

                <div className="flex shrink-0 justify-between border-t pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => handlePrintTest()} className="gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200">
                            <Printer className="h-4 w-4" />
                            Print Test
                        </Button>
                        <Button onClick={handleSave} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </div>

                <div className="hidden">
                    <div ref={contentRef}>{renderBillTemplate()}</div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
