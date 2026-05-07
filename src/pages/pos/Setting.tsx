import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Save, Eye, Crown, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getTenant } from "@/api/tenants";
import Bill58mm from "./components/bill-templates/Bill58mm";
import Bill80mm from "./components/bill-templates/Bill80mm";
import BillA5 from "./components/bill-templates/BillA5";
import BillA4 from "./components/bill-templates/BillA4";

interface BillConfig {
    paperSize: "58mm" | "80mm" | "A5" | "A4";
    showLogo: boolean;
    showQR: boolean;
    showNotes: boolean;
    fontSize: "small" | "medium" | "large";
}

const PAPER_SIZES = {
    "58mm": { width: "58mm", description: "58mm " },
    "80mm": { width: "80mm", description: "80mm " },
    "A5": { width: "148mm", description: "A5" },
    "A4": { width: "210mm", description: "A4" },
};

const FONT_SIZES = {
    small: { base: "10px", title: "14px", description: "ນ້ອຍ" },
    medium: { base: "12px", title: "18px", description: "ກາງ" },
    large: { base: "14px", title: "22px", description: "ໃຫຍ່" },
};

const Setting = () => {
    // Fetch Tenant Info
    const { data: tenant } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });

    const contentRef = useRef<HTMLDivElement>(null);
    const handlePrintTest = useReactToPrint({
        contentRef: contentRef,
        documentTitle: `Test-Bill`,
    });

    const [config, setConfig] = useState<BillConfig>({
        paperSize: "80mm",
        showLogo: true,
        showQR: true,
        showNotes: true,
        fontSize: "medium",
    });

    useEffect(() => {
        const saved = localStorage.getItem("billConfig");
        if (saved) {
            try {
                setConfig(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load bill config", e);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("billConfig", JSON.stringify(config));
        toast.success("ບັນທຶກການຕັ້ງຄ່າສຳເລັດ!");
    };




    // Sample data for preview
    const sampleData = {
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
            { name: "ເບຍລາວ Beer Lao", quantity: 2, price: 15000 },
            { name: "ນ້ຳດື່ມ Water", quantity: 5, price: 3000 },
            { name: "ຂະໜົມປັງ Bread", quantity: 3, price: 8000 },
        ],
        payments: [],
    };

    // Render appropriate bill template based on paper size
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
        <div className="h-full w-full overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-600" />
                        ການຕັ້ງຄ່າໃບບິນ
                    </h1>
                    <p className="text-slate-500 mt-1">ຕັ້ງຄ່າຮູບແບບການພິມໃບບິນ</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Settings Panel */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-indigo-600" />
                                ການຕັ້ງຄ່າ
                            </h3>

                            {/* Paper Size */}
                            <div className="space-y-3 mb-6">
                                <Label className="text-base font-semibold">ຂະໜາດເຈ້ຍ</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(PAPER_SIZES).map(([key, val]) => {
                                        const restrictedSizes = ["A5", "A4"];
                                        const isRestricted = restrictedSizes.includes(key);
                                        const hasPermission = tenant?.subscriptionPlan === 'ENTERPRISE' || tenant?.subscriptionPlan === 'PRO';
                                        const isLocked = isRestricted && !hasPermission;

                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    if (isLocked) {
                                                        toast.error("Upgrade Plan Required", {
                                                            description: "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນນີ້ (PRO/ENTERPRISE)"
                                                        });
                                                        return;
                                                    }
                                                    setConfig({ ...config, paperSize: key as BillConfig["paperSize"] })
                                                }}
                                                className={`p-4 border-2 rounded-lg text-left transition-all relative ${config.paperSize === key
                                                    ? "border-indigo-600 bg-indigo-50"
                                                    : "border-slate-200 hover:border-slate-300"
                                                    } ${isLocked ? "opacity-70 cursor-not-allowed hover:border-slate-200" : ""}`}
                                            >
                                                <div className="font-semibold flex items-center justify-between">
                                                    {val.description}
                                                    {isLocked && <Crown className="w-4 h-4 text-yellow-500" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="space-y-3 mb-6">
                                <Label className="text-base font-semibold">ຂະໜາດຕົວອັກສອນ</Label>
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
                                            <div className="font-semibold text-center">{val.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Display Options */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">ການສະແດງຜົນ</Label>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.showLogo}
                                            onChange={(e) => setConfig({ ...config, showLogo: e.target.checked })}
                                            className="w-5 h-5"
                                        />
                                        <span>ສະແດງໂລໂກ້ຮ້ານ</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.showQR}
                                            onChange={(e) => setConfig({ ...config, showQR: e.target.checked })}
                                            className="w-5 h-5"
                                        />
                                        <span>ສະແດງ QR Code</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.showNotes}
                                            onChange={(e) => setConfig({ ...config, showNotes: e.target.checked })}
                                            className="w-5 h-5"
                                        />
                                        <span>ສະແດງໝາຍເຫດ</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <Button
                                    onClick={() => handlePrintTest()}
                                    variant="secondary"
                                    className="w-full gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700"
                                >
                                    <Printer className="w-4 h-4" />
                                    ພິມທົດສອບ
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    ບັນທຶກການຕັ້ງຄ່າ
                                </Button>
                            </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <p className="text-sm text-indigo-800">
                                <strong>ໝາຍເຫດ:</strong> ການຕັ້ງຄ່າຈະມີຜົນກັບການພິມບິນທັງໝົດ
                            </p>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-indigo-600" />
                            ຕົວຢ່າງໃບບິນ
                        </h3>

                        <div className="overflow-auto max-h-[800px] border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                {renderBillTemplate()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden wrapper for print test */}
            <div className="hidden">
                <div ref={contentRef}>
                    {renderBillTemplate()}
                </div>
            </div>
        </div>
    );
};

export default Setting;