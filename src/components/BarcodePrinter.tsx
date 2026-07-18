import { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Package, Save } from "lucide-react";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";
import type { Product } from "@/api/products";

interface BarcodePrinterProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
}

interface PrintSettings {
    settingsVersion: number;
    paperSize: string;
    paperWidth: number;
    paperHeight: number;
    rows: number;
    columns: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    gapX: number;
    gapY: number;
    labelWidth: number;
    labelHeight: number;
    barcodeWidth: number;
    barcodeHeight: number;
    fontSize: number;
    showPrice: boolean;
    showName: boolean;
    barcodeType: string;
    orientation: 'portrait' | 'landscape';
    isContinuous: boolean;
}

const A4_BARCODE_SETTINGS: PrintSettings = {
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

const PAPER_PRESETS: Record<string, Partial<PrintSettings>> = {
    A4: A4_BARCODE_SETTINGS,
    LETTER: { paperSize: "LETTER", paperWidth: 215.9, paperHeight: 279.4, rows: 10, columns: 4, isContinuous: false },
    XP_365B_80x40: { paperSize: "XP_365B_80x40", paperWidth: 80, paperHeight: 40, rows: 1, columns: 1, marginTop: 2, marginBottom: 2, marginLeft: 2, marginRight: 2, gapX: 0, gapY: 0, labelWidth: 76, labelHeight: 36, isContinuous: true },
    LABEL_80x40: { paperSize: "LABEL_80x40", paperWidth: 80, paperHeight: 40, rows: 1, columns: 1, marginTop: 2, marginBottom: 2, marginLeft: 2, marginRight: 2, gapX: 0, gapY: 0, labelWidth: 76, labelHeight: 36, isContinuous: false },
    LABEL_100x50: { paperSize: "LABEL_100x50", paperWidth: 100, paperHeight: 50, rows: 1, columns: 1, marginTop: 2, marginBottom: 2, marginLeft: 2, marginRight: 2, gapX: 0, gapY: 0, labelWidth: 96, labelHeight: 46, isContinuous: false },
    LABEL_100x100: { paperSize: "LABEL_100x100", paperWidth: 100, paperHeight: 100, rows: 1, columns: 1, marginTop: 3, marginBottom: 3, marginLeft: 3, marginRight: 3, gapX: 0, gapY: 0, labelWidth: 94, labelHeight: 94, isContinuous: false },
    CONTINUOUS_80: { paperSize: "CONTINUOUS_80", paperWidth: 80, paperHeight: 1000, rows: 1, columns: 1, marginTop: 2, marginBottom: 2, marginLeft: 2, marginRight: 2, gapX: 0, gapY: 2, labelWidth: 76, labelHeight: 36, isContinuous: true },
    CUSTOM: { paperSize: "CUSTOM", paperWidth: 100, paperHeight: 100, rows: 1, columns: 1, isContinuous: false },
};

const readSavedBarcodeSettings = (): PrintSettings => {
    const saved = localStorage.getItem("barcodeSettings");
    if (!saved) return A4_BARCODE_SETTINGS;

    try {
        const parsed = JSON.parse(saved);
        if (parsed.settingsVersion !== A4_BARCODE_SETTINGS.settingsVersion) {
            return A4_BARCODE_SETTINGS;
        }

        return { ...A4_BARCODE_SETTINGS, ...parsed };
    } catch (e) {
        console.error("Failed to load barcode settings", e);
        return A4_BARCODE_SETTINGS;
    }
};

export function BarcodePrinter({ isOpen, onClose, products }: BarcodePrinterProps) {
    const [settings, setSettings] = useState<PrintSettings>(readSavedBarcodeSettings);

    const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());

    const handleQuantityChange = (productId: string, quantity: number) => {
        const newMap = new Map(selectedProducts);
        newMap.set(productId, Math.max(0, quantity || 0));
        setSelectedProducts(newMap);
    };

    const generateBarcodes = () => {
        const items: Array<{ product: Product; quantity: number }> = [];
        products.forEach((product) => {
            const qty = selectedProducts.has(product._id) ? selectedProducts.get(product._id) || 0 : 1;
            if (product && product.barcode && qty > 0) {
                items.push({ product, quantity: qty });
            }
        });
        return items;
    };

    const handlePrint = () => {
        if (!barcodeItems.length) {
            toast.error("ກະລຸນາເລືອກສິນຄ້າທີ່ມີບາໂຄດກ່ອນພິມ");
            return;
        }

        toast.info("ກຳລັງກຽມພິມ...", { duration: 1000 });
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const handleSaveSettings = () => {
        localStorage.setItem("barcodeSettings", JSON.stringify(settings));
        toast.success("ບັນທຶກການຕັ້ງຄ່າສຳເລັດ");
    };

    const barcodeItems = generateBarcodes();
    const totalLabels = barcodeItems.reduce((sum, item) => sum + item.quantity, 0);
    const applyPaperPreset = (paperSize: string) => {
        setSettings({
            ...settings,
            ...PAPER_PRESETS[paperSize],
            paperSize,
        });
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-indigo-600" />
                        ພິມບາໂຄດ A4
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex gap-4 p-6">
                    {/* Left Panel */}
                    <div className="w-96 flex flex-col gap-4">
                        <Tabs defaultValue="products" className="flex-1 flex flex-col overflow-hidden">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="products">ສິນຄ້າ ({products.length})</TabsTrigger>
                                <TabsTrigger value="settings">ຕັ້ງຄ່າ</TabsTrigger>
                            </TabsList>

                            {/* Products Tab */}
                            <TabsContent value="products" className="flex-1 overflow-y-auto mt-2 border rounded-lg bg-white p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        ເລືອກສິນຄ້າ
                                    </h3>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        {totalLabels} ດວງ
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {products.map(product => (
                                        <div key={product._id} className="flex items-center gap-3 p-2 bg-slate-50 rounded border">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{product.name}</div>
                                                <div className="text-xs text-slate-500">{product.barcode || "ບໍ່ມີບາໂຄດ"}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs">ຈຳນວນ:</Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    disabled={!product.barcode}
                                                    value={selectedProducts.has(product._id) ? selectedProducts.get(product._id) ?? 0 : product.barcode ? 1 : 0}
                                                    onChange={e => handleQuantityChange(product._id, Number(e.target.value))}
                                                    className="w-16 h-8 text-xs p-1 text-center"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings" className="flex-1 overflow-y-auto mt-2 border rounded-lg bg-white p-4 space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-2 border-b pb-2">
                                        <h4 className="font-semibold text-slate-700 text-sm">ຂະໜາດເຈ້ຍ</h4>
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setSettings(A4_BARCODE_SETTINGS)}>
                                            ໃຊ້ A4
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">ປະເພດເຈ້ຍ</Label>
                                        <div className="flex gap-2">
                                            <select
                                                value={settings.paperSize}
                                                onChange={e => applyPaperPreset(e.target.value)}
                                                className="flex-1 h-8 px-2 text-sm border rounded-md"
                                            >
                                                <option value="A4">A4 - 40 ດວງ/ໜ້າ</option>
                                                <option value="LETTER">Letter</option>
                                                <option value="XP_365B_80x40">XP-365B 80x40mm</option>
                                                <option value="LABEL_80x40">ສະຕິກເກີ 80x40mm</option>
                                                <option value="LABEL_100x50">ສະຕິກເກີ 100x50mm</option>
                                                <option value="LABEL_100x100">ສະຕິກເກີ 100x100mm</option>
                                                <option value="CONTINUOUS_80">ເຈ້ຍຕໍ່ເນື່ອງ 80mm</option>
                                                <option value="CUSTOM">ກຳນົດເອງ</option>
                                            </select>
                                            <select
                                                value={settings.orientation}
                                                onChange={e => setSettings({ ...settings, orientation: e.target.value as 'portrait' | 'landscape' })}
                                                className="w-28 h-8 px-2 text-sm border rounded-md"
                                            >
                                                <option value="portrait">ແນວຕັ້ງ</option>
                                                <option value="landscape">ແນວນອນ</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">ກວ້າງ (mm)</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.paperWidth} onChange={e => setSettings({ ...settings, paperWidth: Number(e.target.value) })} />
                                        </div>
                                        {!settings.paperSize.includes("CONTINUOUS") && (
                                            <div className="space-y-1">
                                                <Label className="text-xs">ສູງ (mm)</Label>
                                                <Input className="h-8 text-sm" type="number" value={settings.paperHeight} onChange={e => setSettings({ ...settings, paperHeight: Number(e.target.value) })} />
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="font-semibold text-slate-700 text-sm border-b pb-2 pt-2">ຈຳນວນດວງຕໍ່ໜ້າ</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">ແຖວ</Label>
                                            <Input className="h-8 text-sm" type="number" min={1} value={settings.rows} onChange={e => setSettings({ ...settings, rows: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ຖັນ</Label>
                                            <Input className="h-8 text-sm" type="number" min={1} value={settings.columns} onChange={e => setSettings({ ...settings, columns: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ກວ້າງດວງ (mm)</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.labelWidth} onChange={e => setSettings({ ...settings, labelWidth: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ສູງດວງ (mm)</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.labelHeight} onChange={e => setSettings({ ...settings, labelHeight: Number(e.target.value) })} />
                                        </div>
                                    </div>

                                    <h4 className="font-semibold text-slate-700 text-sm border-b pb-2 pt-2">ຂອບເຈ້ຍ (mm)</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">ເທິງ</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.marginTop} onChange={e => setSettings({ ...settings, marginTop: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ລຸ່ມ</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.marginBottom} onChange={e => setSettings({ ...settings, marginBottom: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ຊ້າຍ</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.marginLeft} onChange={e => setSettings({ ...settings, marginLeft: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ຂວາ</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.marginRight} onChange={e => setSettings({ ...settings, marginRight: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">ຫ່າງຊ້າຍ-ຂວາ</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.gapX} onChange={e => setSettings({ ...settings, gapX: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ຫ່າງເທິງ-ລຸ່ມ</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.gapY} onChange={e => setSettings({ ...settings, gapY: Number(e.target.value) })} />
                                        </div>
                                    </div>

                                    <h4 className="font-semibold text-slate-700 text-sm border-b pb-2 pt-2">ບາໂຄດ</h4>
                                    <div className="space-y-2">
                                        <Label className="text-xs">ປະເພດບາໂຄດ</Label>
                                        <select
                                            value={settings.barcodeType}
                                            onChange={e => setSettings({ ...settings, barcodeType: e.target.value })}
                                            className="w-full h-8 px-2 text-sm border rounded-md"
                                        >
                                            <option value="CODE128">CODE128</option>
                                            <option value="EAN13">EAN13</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">ຄວາມກວ້າງ</Label>
                                            <Input className="h-8 text-sm" type="number" step="0.1" value={settings.barcodeWidth} onChange={e => setSettings({ ...settings, barcodeWidth: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ຄວາມສູງ</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.barcodeHeight} onChange={e => setSettings({ ...settings, barcodeHeight: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={settings.showName} onChange={e => setSettings({ ...settings, showName: e.target.checked })} className="h-4 w-4" />
                                            <span className="text-xs">ສະແດງຊື່</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={settings.showPrice} onChange={e => setSettings({ ...settings, showPrice: e.target.checked })} className="h-4 w-4" />
                                            <span className="text-xs">ສະແດງລາຄາ</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={settings.isContinuous} onChange={e => setSettings({ ...settings, isContinuous: e.target.checked })} className="h-4 w-4" />
                                            <span className="text-xs">ເຈ້ຍຕໍ່ເນື່ອງ</span>
                                        </label>
                                    </div>

                                    <Button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 h-9 text-sm mt-4">
                                        <Save className="w-4 h-4 mr-2" /> ບັນທຶກຄ່າພິມ
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right: Preview */}
                    <div className="flex-1 overflow-y-auto bg-slate-100 rounded-lg p-4 flex justify-center">
                        <BarcodePreview
                            items={barcodeItems}
                            settings={settings}
                        />
                    </div>
                </div>

                <div className="border-t p-4 flex justify-between bg-white">
                    <Button variant="outline" onClick={onClose}>
                        ປິດ
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} disabled={!barcodeItems.length} className="bg-indigo-600 hover:bg-indigo-700 gap-2 disabled:bg-slate-300">
                            <Printer className="w-4 h-4" />
                            ພິມ A4 ({totalLabels} ດວງ)
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Preview Component
const BarcodePreview = ({ items, settings }: { items: Array<{ product: Product; quantity: number }>, settings: PrintSettings }) => {
    const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

    const allLabels = useMemo(() => {
        const labels: Array<{ product: Product; key: string }> = [];
        items.forEach(({ product, quantity }) => {
            for (let i = 0; i < quantity; i++) {
                labels.push({ product, key: `${product._id}-${i}` });
            }
        });

        return labels;
    }, [items]);

    useEffect(() => {
        allLabels.forEach(({ product, key }) => {
            const canvas = canvasRefs.current.get(key);
            if (!canvas || !product.barcode) return;

            try {
                JsBarcode(canvas, product.barcode, {
                    format: settings.barcodeType,
                    width: settings.barcodeWidth,
                    height: settings.barcodeHeight,
                    fontSize: settings.fontSize,
                    displayValue: true,
                });
            } catch (error) {
                console.error("Barcode generation error:", error);
            }
        });
    }, [allLabels, settings]);

    const labelsPerPage = settings.isContinuous ? 999999 : settings.rows * settings.columns;
    const pages: Array<Array<{ product: Product; key: string }>> = [];
    for (let i = 0; i < allLabels.length; i += labelsPerPage) {
        pages.push(allLabels.slice(i, i + labelsPerPage));
    }

    if (!pages.length) {
        pages.push([]);
    }

    let printWidth = settings.paperWidth;
    let printHeight = settings.paperHeight;

    if (!settings.isContinuous) {
        if ((settings.orientation === "portrait" && printWidth > printHeight) ||
            (settings.orientation === "landscape" && printWidth < printHeight)) {
            const temp = printWidth;
            printWidth = printHeight;
            printHeight = temp;
        }
    }

    return (
        <div className="barcode-print-area">
            <style>{`
                @media print {
                    @page {
                        size: ${printWidth}mm ${printHeight}mm;
                        margin: 0 !important;
                    }
                    html, body { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        overflow: hidden;
                        width: ${printWidth}mm;
                        height: ${printHeight}mm;
                    }
                    body * { visibility: hidden; }
                    .barcode-print-area, .barcode-print-area * { visibility: visible; }
                    .barcode-print-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: ${printWidth}mm;
                    }
                    .page-break { page-break-after: always; }
                }
            `}</style>

            {pages.map((pageLabels, pageIndex) => (
                <div
                    key={pageIndex}
                    className="page-break"
                    style={{
                        width: `${printWidth}mm`,
                        height: `${printHeight}mm`,
                        padding: `${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom}mm ${settings.marginLeft}mm`,
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${settings.columns}, ${settings.labelWidth}mm)`,
                            justifyContent: 'start',
                            gap: `${settings.gapY}mm ${settings.gapX}mm`,
                        }}
                    >
                        {pageLabels.map(({ product, key }) => (
                            <div
                                key={key}
                                style={{
                                    width: `${settings.labelWidth}mm`,
                                    height: `${settings.labelHeight}mm`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '2mm',
                                    boxSizing: 'border-box',
                                }}
                            >
                                {settings.showName && (
                                    <div style={{
                                        fontSize: `${settings.fontSize - 2}px`,
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        marginBottom: '1mm',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        width: '100%',
                                    }}>
                                        {product.name}
                                    </div>
                                )}
                                <canvas
                                    ref={el => {
                                        if (el) canvasRefs.current.set(key, el);
                                        else canvasRefs.current.delete(key);
                                    }}
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                                {settings.showPrice && (
                                    <div style={{
                                        fontSize: `${settings.fontSize}px`,
                                        fontWeight: 'bold',
                                        marginTop: '1mm',
                                        color: '#059669',
                                    }}>
                                        {product.sellPrice.toLocaleString()}₭
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
