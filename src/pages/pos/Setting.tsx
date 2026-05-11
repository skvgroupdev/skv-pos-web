import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, Printer, Save, Settings } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import Bill58mm from "./components/bill-templates/Bill58mm";
import Bill80mm from "./components/bill-templates/Bill80mm";
import BillA5 from "./components/bill-templates/BillA5";
import BillA4 from "./components/bill-templates/BillA4";
import type { BillConfig, BillPrintData } from "./components/bill-templates/billPrintUtils";

const PAPER_SIZES: Record<NonNullable<BillConfig["paperSize"]>, { width: string; description: string }> = {
    "58mm": { width: "58mm", description: "58mm" },
    "80mm": { width: "80mm", description: "80mm" },
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

const sampleData: BillPrintData = {
    orderId: "20240123001",
    createdAt: new Date(),
    total: 150000,
    discount: 5000,
    paidAmount: 150000,
    change: 0,
    paymentMethod: "CASH",
    remainingAmount: 0,
    tenantId: {
        shopName: "SKV Store",
        address: "Vientiane, Laos",
        phone: "020 5555 5555",
        logo: null,
        bankQr: null,
    },
    customerId: {
        name: "General Customer",
        phone: "020 1234 5678",
    },
    cashierId: {
        username: "Cashier 01",
    },
    items: [
        { name: "Beer Lao", quantity: 2, price: 15000 },
        { name: "Water", quantity: 5, price: 3000 },
        { name: "Bread", quantity: 3, price: 8000 },
    ],
};

const Setting = () => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [config, setConfig] = useState<BillConfig>(() => createBillConfig("80mm"));

    const handlePrintTest = useReactToPrint({
        contentRef,
        documentTitle: "Test-Bill",
    });

    useEffect(() => {
        const saved = localStorage.getItem("billConfig");
        if (!saved) return;

        try {
            setConfig(normalizeBillConfig(JSON.parse(saved) as Partial<BillConfig>));
        } catch (e) {
            console.error("Failed to load bill config", e);
        }
    }, []);

    const handlePaperSizeChange = (paperSize: NonNullable<BillConfig["paperSize"]>) => {
        setConfig(createBillConfig(paperSize));
    };

    const handleSave = () => {
        const normalizedConfig = normalizeBillConfig(config);
        localStorage.setItem("billConfig", JSON.stringify(normalizedConfig));
        setConfig(normalizedConfig);
        toast.success("Bill settings saved!");
    };

    const renderBillTemplate = () => {
        const templateProps = { data: sampleData, config };

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

    return (
        <div className="h-full w-full overflow-y-auto bg-slate-50 p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
                        <Settings className="h-6 w-6 text-indigo-600" />
                        Bill Settings
                    </h1>
                    <p className="mt-1 text-slate-500">Choose receipt paper size for printing.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <div className="rounded-xl border bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <Settings className="h-5 w-5 text-indigo-600" />
                                Print Format
                            </h3>

                            <div className="mb-6 space-y-3">
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

                            <div className="mt-6 flex gap-4">
                                <Button onClick={() => handlePrintTest()} variant="secondary" className="w-full gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200">
                                    <Printer className="h-4 w-4" />
                                    Print Test
                                </Button>
                                <Button onClick={handleSave} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                                    <Save className="h-4 w-4" />
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Eye className="h-5 w-5 text-indigo-600" />
                            Preview
                        </h3>

                        <div className="max-h-[800px] overflow-auto rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
                            <div style={{ display: "flex", justifyContent: "center" }}>{renderBillTemplate()}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden">
                <div ref={contentRef}>{renderBillTemplate()}</div>
            </div>
        </div>
    );
};

export default Setting;
