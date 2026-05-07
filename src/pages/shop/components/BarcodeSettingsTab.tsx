import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Printer } from "lucide-react";
import { toast } from "sonner";

export function BarcodeSettingsTab() {
    // --- State for Barcode Settings ---
    const [barcodeSettings, setBarcodeSettings] = useState({
        paperSize: "XP_365B_80x40",
        paperWidth: 80,
        paperHeight: 40,
        rows: 10,
        columns: 2,
        marginTop: 2,
        marginBottom: 2,
        marginLeft: 2,
        marginRight: 2,
        gapX: 2,
        gapY: 2,
        labelWidth: 60,
        labelHeight: 25,
        barcodeWidth: 2,
        barcodeHeight: 40,
        fontSize: 10,
        showPrice: true,
        showName: true,
        barcodeType: "CODE128",
        orientation: "portrait",
        isContinuous: true,
    });

    // Load Barcode Settings from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem("barcodeSettings");
        if (saved) {
            try {
                setBarcodeSettings(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load barcode settings", e);
            }
        }
    }, []);

    const handleBarcodeSave = () => {
        localStorage.setItem("barcodeSettings", JSON.stringify(barcodeSettings));
        toast.success("Barcode settings saved!");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border max-w-4xl">
            <h3 className="text-lg font-semibold mb-6 text-slate-700 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                ຕັ້ງຄ່າການພິມບາໂຄດ (Barcode Print Settings)
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Paper Settings */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700 border-b pb-2">ຂະໜາດເຈ້ຍ (Paper Size)</h4>
                    <div className="space-y-2">
                        <Label>ປະເພດເຈ້ຍ</Label>
                        <select
                            value={barcodeSettings.paperSize}
                            onChange={e => {
                                const sizes: any = {
                                    A4: { width: 210, height: 297 },
                                    LETTER: { width: 215.9, height: 279.4 },
                                    XP_365B_80x40: { width: 80, height: 40 },
                                    LABEL_80x40: { width: 80, height: 40 },
                                    LABEL_100x50: { width: 100, height: 50 },
                                    LABEL_100x100: { width: 100, height: 100 },
                                    CONTINUOUS_80: { width: 80, height: 1000 },
                                    CUSTOM: { width: 100, height: 100 },
                                };
                                const size = sizes[e.target.value] || { width: 100, height: 100 };
                                setBarcodeSettings({ 
                                    ...barcodeSettings, 
                                    paperSize: e.target.value, 
                                    ...size,
                                    isContinuous: e.target.value.includes("CONTINUOUS")
                                });
                            }}
                            className="w-full h-9 px-3 border rounded-md"
                        >
                            <option value="A4">A4 (210x297mm)</option>
                            <option value="LETTER">Letter (8.5x11 in)</option>
                            <option value="XP_365B_80x40">XP-365B (80x40mm)</option>
                            <option value="LABEL_80x40">Label 80x40mm</option>
                            <option value="LABEL_100x50">Label 100x50mm</option>
                            <option value="LABEL_100x100">Label 100x100mm</option>
                            <option value="CONTINUOUS_80">Continuous 80mm</option>
                            <option value="CUSTOM">Custom Size</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>ກວ້າງ (mm)</Label>
                            <Input type="number" value={barcodeSettings.paperWidth} onChange={e => setBarcodeSettings({ ...barcodeSettings, paperWidth: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ສູງ (mm)</Label>
                            <Input type="number" value={barcodeSettings.paperHeight} onChange={e => setBarcodeSettings({ ...barcodeSettings, paperHeight: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>

                {/* Layout Settings */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700 border-b pb-2">ຈຳນວນແຖວ/ຖັນ (Layout)</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>ແຖວ (Rows)</Label>
                            <Input type="number" min={1} value={barcodeSettings.rows} onChange={e => setBarcodeSettings({ ...barcodeSettings, rows: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ຖັນ (Columns)</Label>
                            <Input type="number" min={1} value={barcodeSettings.columns} onChange={e => setBarcodeSettings({ ...barcodeSettings, columns: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>ກວ້າງສະຕິກເກີ (mm)</Label>
                            <Input type="number" value={barcodeSettings.labelWidth} onChange={e => setBarcodeSettings({ ...barcodeSettings, labelWidth: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ສູງສະຕິກເກີ (mm)</Label>
                            <Input type="number" value={barcodeSettings.labelHeight} onChange={e => setBarcodeSettings({ ...barcodeSettings, labelHeight: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>

                {/* Margins */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700 border-b pb-2">ຂອບເຈ້ຍ (Margins - mm)</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>ເທິງ</Label>
                            <Input type="number" value={barcodeSettings.marginTop} onChange={e => setBarcodeSettings({ ...barcodeSettings, marginTop: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ລຸ່ມ</Label>
                            <Input type="number" value={barcodeSettings.marginBottom} onChange={e => setBarcodeSettings({ ...barcodeSettings, marginBottom: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ຊ້າຍ</Label>
                            <Input type="number" value={barcodeSettings.marginLeft} onChange={e => setBarcodeSettings({ ...barcodeSettings, marginLeft: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ຂວາ</Label>
                            <Input type="number" value={barcodeSettings.marginRight} onChange={e => setBarcodeSettings({ ...barcodeSettings, marginRight: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>ຊ່ອງຫ່າງ X (mm)</Label>
                            <Input type="number" value={barcodeSettings.gapX} onChange={e => setBarcodeSettings({ ...barcodeSettings, gapX: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ຊ່ອງຫ່າງ Y (mm)</Label>
                            <Input type="number" value={barcodeSettings.gapY} onChange={e => setBarcodeSettings({ ...barcodeSettings, gapY: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>

                {/* Barcode Settings */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700 border-b pb-2">ຕັ້ງຄ່າບາໂຄດ (Barcode)</h4>
                    <div className="space-y-2">
                        <Label>ປະເພດບາໂຄດ</Label>
                        <select
                            value={barcodeSettings.barcodeType}
                            onChange={e => setBarcodeSettings({ ...barcodeSettings, barcodeType: e.target.value })}
                            className="w-full h-9 px-3 border rounded-md"
                        >
                            <option value="CODE128">CODE128</option>
                            <option value="EAN13">EAN13</option>
                            <option value="EAN8">EAN8</option>
                            <option value="UPC">UPC</option>
                            <option value="CODE39">CODE39</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label>ຄວາມກວ້າງ</Label>
                            <Input type="number" step="0.1" value={barcodeSettings.barcodeWidth} onChange={e => setBarcodeSettings({ ...barcodeSettings, barcodeWidth: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ຄວາມສູງ</Label>
                            <Input type="number" value={barcodeSettings.barcodeHeight} onChange={e => setBarcodeSettings({ ...barcodeSettings, barcodeHeight: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Font Size</Label>
                            <Input type="number" value={barcodeSettings.fontSize} onChange={e => setBarcodeSettings({ ...barcodeSettings, fontSize: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={barcodeSettings.showName} onChange={e => setBarcodeSettings({ ...barcodeSettings, showName: e.target.checked })} className="h-4 w-4" />
                            <span className="text-sm">ສະແດງຊື່ສິນຄ້າ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={barcodeSettings.showPrice} onChange={e => setBarcodeSettings({ ...barcodeSettings, showPrice: e.target.checked })} className="h-4 w-4" />
                            <span className="text-sm">ສະແດງລາຄາ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={barcodeSettings.isContinuous} onChange={e => setBarcodeSettings({ ...barcodeSettings, isContinuous: e.target.checked })} className="h-4 w-4" />
                            <span className="text-sm">Fit to Content (Continuous)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t">
                <Button onClick={handleBarcodeSave} className="bg-indigo-600 hover:bg-indigo-700 min-w-[200px]">
                    <Save className="w-4 h-4 mr-2" /> ບັນທຶກການຕັ້ງຄ່າ (Save Settings)
                </Button>
            </div>
        </div>
    );
}
