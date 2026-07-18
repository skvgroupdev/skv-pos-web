import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Printer } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_BARCODE_SETTINGS = {
    settingsVersion: 2,
    paperSize: "A4",
    paperWidth: 210,
    paperHeight: 297,
    rows: 10,
    columns: 4,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 12,
    marginRight: 12,
    gapX: 2,
    gapY: 3,
    labelWidth: 45,
    labelHeight: 25,
    barcodeWidth: 1.3,
    barcodeHeight: 34,
    fontSize: 10,
    showPrice: true,
    showName: true,
    barcodeType: "CODE128",
    orientation: "portrait",
    isContinuous: false,
};

type BarcodeSettings = typeof DEFAULT_BARCODE_SETTINGS;

const PAPER_PRESETS: Record<string, Partial<BarcodeSettings>> = {
    A4: DEFAULT_BARCODE_SETTINGS,
    LETTER: { paperWidth: 215.9, paperHeight: 279.4 },
    XP_365B_80x40: { paperWidth: 80, paperHeight: 40, rows: 1, columns: 1, marginTop: 2, marginBottom: 2, marginLeft: 2, marginRight: 2, gapX: 0, gapY: 0, labelWidth: 76, labelHeight: 36 },
    LABEL_80x40: { paperWidth: 80, paperHeight: 40, rows: 1, columns: 1, marginTop: 2, marginBottom: 2, marginLeft: 2, marginRight: 2, gapX: 0, gapY: 0, labelWidth: 76, labelHeight: 36 },
    LABEL_100x50: { paperWidth: 100, paperHeight: 50, rows: 1, columns: 1, marginTop: 2, marginBottom: 2, marginLeft: 2, marginRight: 2, gapX: 0, gapY: 0, labelWidth: 96, labelHeight: 46 },
    LABEL_100x100: { paperWidth: 100, paperHeight: 100, rows: 1, columns: 1, marginTop: 3, marginBottom: 3, marginLeft: 3, marginRight: 3, gapX: 0, gapY: 0, labelWidth: 94, labelHeight: 94 },
    CONTINUOUS_80: { paperWidth: 80, paperHeight: 1000, rows: 1, columns: 1, marginTop: 2, marginBottom: 2, marginLeft: 2, marginRight: 2, gapX: 0, gapY: 2, labelWidth: 76, labelHeight: 36 },
    CUSTOM: { paperWidth: 100, paperHeight: 100, rows: 1, columns: 1 },
};

const readSavedBarcodeSettings = (): BarcodeSettings => {
    const saved = localStorage.getItem("barcodeSettings");
    if (!saved) return DEFAULT_BARCODE_SETTINGS;

    try {
        const parsed = JSON.parse(saved);
        if (parsed.settingsVersion !== DEFAULT_BARCODE_SETTINGS.settingsVersion) {
            return DEFAULT_BARCODE_SETTINGS;
        }

        return { ...DEFAULT_BARCODE_SETTINGS, ...parsed };
    } catch (e) {
        console.error("Failed to load barcode settings", e);
        return DEFAULT_BARCODE_SETTINGS;
    }
};

export function BarcodeSettingsTab() {
    const [barcodeSettings, setBarcodeSettings] = useState<BarcodeSettings>(readSavedBarcodeSettings);

    const handleBarcodeSave = () => {
        localStorage.setItem("barcodeSettings", JSON.stringify(barcodeSettings));
        toast.success("ບັນທຶກການຕັ້ງຄ່າບາໂຄດແລ້ວ");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border max-w-4xl">
            <h3 className="text-lg font-semibold mb-6 text-slate-700 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                ຕັ້ງຄ່າການພິມບາໂຄດ
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Paper Settings */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700 border-b pb-2">ຂະໜາດເຈ້ຍ</h4>
                    <div className="space-y-2">
                        <Label>ປະເພດເຈ້ຍ</Label>
                        <select
                            value={barcodeSettings.paperSize}
                            onChange={e => {
                                setBarcodeSettings({ 
                                    ...barcodeSettings, 
                                    paperSize: e.target.value, 
                                    ...(PAPER_PRESETS[e.target.value] || PAPER_PRESETS.CUSTOM),
                                    isContinuous: e.target.value.includes("CONTINUOUS")
                                });
                            }}
                            className="w-full h-9 px-3 border rounded-md"
                        >
                            <option value="A4">A4 - 40 ດວງ/ໜ້າ</option>
                            <option value="LETTER">Letter (8.5x11 in)</option>
                            <option value="XP_365B_80x40">XP-365B (80x40mm)</option>
                            <option value="LABEL_80x40">ສະຕິກເກີ 80x40mm</option>
                            <option value="LABEL_100x50">ສະຕິກເກີ 100x50mm</option>
                            <option value="LABEL_100x100">ສະຕິກເກີ 100x100mm</option>
                            <option value="CONTINUOUS_80">ເຈ້ຍຕໍ່ເນື່ອງ 80mm</option>
                            <option value="CUSTOM">ກຳນົດເອງ</option>
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
                    <h4 className="font-semibold text-slate-700 border-b pb-2">ຈຳນວນດວງຕໍ່ໜ້າ</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>ແຖວ</Label>
                            <Input type="number" min={1} value={barcodeSettings.rows} onChange={e => setBarcodeSettings({ ...barcodeSettings, rows: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ຖັນ</Label>
                            <Input type="number" min={1} value={barcodeSettings.columns} onChange={e => setBarcodeSettings({ ...barcodeSettings, columns: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>ກວ້າງດວງ (mm)</Label>
                            <Input type="number" value={barcodeSettings.labelWidth} onChange={e => setBarcodeSettings({ ...barcodeSettings, labelWidth: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>ສູງດວງ (mm)</Label>
                            <Input type="number" value={barcodeSettings.labelHeight} onChange={e => setBarcodeSettings({ ...barcodeSettings, labelHeight: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>

                {/* Margins */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700 border-b pb-2">ຂອບເຈ້ຍ (mm)</h4>
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
                            <Label>ຂະໜາດຕົວໜັງສື</Label>
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
                            <span className="text-sm">ເຈ້ຍຕໍ່ເນື່ອງ</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t">
                <Button onClick={handleBarcodeSave} className="bg-indigo-600 hover:bg-indigo-700 min-w-[200px]">
                    <Save className="w-4 h-4 mr-2" /> ບັນທຶກຄ່າພິມ
                </Button>
            </div>
        </div>
    );
}
