import { useState, useRef } from "react";
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

interface BillSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface BillConfig {
    paperSize: "58mm" | "80mm" | "A5" | "A4";
    showLogo: boolean;
    showQR: boolean;
    showNotes: boolean;
    fontSize: "small" | "medium" | "large";
}

const PAPER_SIZES = {
    "58mm": { width: "58mm", description: "58mm (Optimized for Thermal)" },
    "80mm": { width: "80mm", description: "80mm (Thermal)" },
    "A5": { width: "148mm", description: "A5 (148x210mm)" },
    "A4": { width: "210mm", description: "A4 (210x297mm)" },
};

const FONT_SIZES = {
    small: { base: "10px", title: "14px", description: "เล็ก" },
    medium: { base: "12px", title: "18px", description: "กลาง" },
    large: { base: "14px", title: "22px", description: "ใหญ่" },
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

export default function BillSettings({ isOpen, onClose }: BillSettingsProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [config, setConfig] = useState<BillConfig>(() => {
        const saved = localStorage.getItem("billConfig");
        if (saved) {
            try {
                return JSON.parse(saved) as BillConfig;
            } catch (e) {
                console.error("Failed to load bill config", e);
            }
        }

        return {
            paperSize: "80mm",
            showLogo: true,
            showQR: true,
            showNotes: true,
            fontSize: "medium",
        };
    });

    const handlePrintTest = useReactToPrint({
        contentRef: contentRef,
        documentTitle: `Test-Bill`,
    });

    const TEST_BILL_DATA = {
        orderId: "TEST-0001",
        createdAt: new Date().toISOString(),
        cashierId: { username: "Admin" },
        customerId: { name: "ລູກຄ້າທົດສອບ", phone: "020 12345678", address: "ວຽງຈັນ" },
        items: [
            { name: "ສິນຄ້າທົດສອບ 1", quantity: 2, price: 15000 },
            { name: "ສິນຄ້າທົດສອບ 2", quantity: 1, price: 20000 },
        ],
        total: 50000,
        discount: 0,
        paidAmount: 50000,
        change: 0,
        remainingAmount: 0,
        paymentMethod: "CASH",
        tenantId: {
            shopName: "ຮ້ານທົດສອບ (Test Shop)",
            address: "ວຽງຈັນ, ລາວ",
            phone: "020 12345678",
            logo: "/logo/logo-no-bg.png",
            bankQr: SAMPLE_QR_SVG,
        }
    };

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

    const handleSave = () => {
        localStorage.setItem("billConfig", JSON.stringify(config));
        toast.success("Bill settings saved!");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        ການຕັ້ງຄ່າໃບບິນ
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4 overflow-y-auto pr-2 flex-1">
                    {/* Paper Size */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">ຂະໜາດເຈ້ຍ</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(PAPER_SIZES).map(([key, val]) => (
                                <button
                                    key={key}
                                    onClick={() => setConfig({ ...config, paperSize: key as BillConfig["paperSize"] })}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${config.paperSize === key
                                        ? "border-indigo-600 bg-indigo-50"
                                        : "border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    <div className="font-semibold">{val.description}</div>
                                    <div className="text-xs text-slate-500 mt-1">Width: {val.width}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">ຂະໜາດຕົວອັກສອນ (Font Size)</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(FONT_SIZES).map(([key, val]) => (
                                <button
                                    key={key}
                                    onClick={() => setConfig({ ...config, fontSize: key as BillConfig["fontSize"] })}
                                    className={`p-3 border-2 rounded-lg transition-all ${config.fontSize === key
                                        ? "border-indigo-600 bg-indigo-50"
                                        : "border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    <div className="font-semibold">{val.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Display Options */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">ການສະແດງຜົນ (Display Options)</Label>
                        <div className="space-y-2 bg-slate-50 p-4 rounded-lg border">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showLogo}
                                    onChange={(e) => setConfig({ ...config, showLogo: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <span>ສະແດງໂລໂກ້ຮ້ານ (Show Shop Logo)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showQR}
                                    onChange={(e) => setConfig({ ...config, showQR: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <span>ສະແດງ QR Code (Show QR Code)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showNotes}
                                    onChange={(e) => setConfig({ ...config, showNotes: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <span>ສະແດງໝາຍເຫດ (Show Notes)</span>
                            </label>
                        </div>
                    </div>

                    {/* Preview Info */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 shrink-0">
                        <p className="text-sm text-indigo-800">
                            <strong>ໝາຍເຫດ:</strong> ການຕັ້ງຄ່າຈະມີຜົນກັບການພິມບິນທັງໝົດ
                        </p>
                    </div>
                </div>

                <div className="flex justify-between pt-4 border-t shrink-0">
                    <Button variant="outline" onClick={onClose}>
                        ຍົກເລີກ
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => handlePrintTest()} className="gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700">
                            <Printer className="w-4 h-4" />
                            ພິມທົດສອບ (Print Test)
                        </Button>
                        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            <Save className="w-4 h-4" />
                            ບັນທຶກການຕັ້ງຄ່າ
                        </Button>
                    </div>
                </div>

                {/* Hidden wrapper for print test */}
                <div className="hidden">
                    <div ref={contentRef}>
                        {renderBillTemplate()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
