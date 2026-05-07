import { useState, useRef, useEffect } from "react";
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

export function BarcodePrinter({ isOpen, onClose, products }: BarcodePrinterProps) {
    const [settings, setSettings] = useState<PrintSettings>({
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

    const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());

    // Load settings from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem("barcodeSettings");
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load barcode settings", e);
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen && products.length > 0) {
            // Initialize with first product selected with quantity 1
            const initial = new Map();
            products.forEach(p => initial.set(p._id, 1));
            setSelectedProducts(initial);
        }
    }, [isOpen, products]);

    const handleQuantityChange = (productId: string, quantity: number) => {
        const newMap = new Map(selectedProducts);
        if (quantity > 0) {
            newMap.set(productId, quantity);
        } else {
            newMap.delete(productId);
        }
        setSelectedProducts(newMap);
    };

    const generateBarcodes = () => {
        const items: Array<{ product: Product; quantity: number }> = [];
        selectedProducts.forEach((qty, productId) => {
            const product = products.find(p => p._id === productId);
            if (product && qty > 0) {
                items.push({ product, quantity: qty });
            }
        });
        return items;
    };

    const handlePrint = () => {
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


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-indigo-600" />
                        ພິມບາໂຄດ (Barcode Printer)
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
                                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    ເລືອກສິນຄ້າ
                                </h3>
                                <div className="space-y-2">
                                    {products.map(product => (
                                        <div key={product._id} className="flex items-center gap-3 p-2 bg-slate-50 rounded border">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{product.name}</div>
                                                <div className="text-xs text-slate-500">{product.barcode}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs">ຈຳນວນ:</Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={selectedProducts.get(product._id) || 0}
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
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h4 className="font-semibold text-slate-700 text-sm">ຂະໜາດເຈ້ຍ (Paper Size)</h4>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleSaveSettings} title="Save">
                                            <Save className="w-4 h-4 text-indigo-600" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">ປະເພດເຈ້ຍ</Label>
                                        <div className="flex gap-2">
                                            <select
                                                value={settings.paperSize}
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
                                                    // If selecting standard size, reset W/H based on selected orientation or default
                                                    let { width, height } = size;
                                                    // Note: We don't swap here immediately because orientation handles the swap in CSS for standard named sizes,
                                                    // but for dimensions we might want to respect the user's input.
                                                    // For now, just set the dimensions.
                                                    setSettings({ 
                                                        ...settings, 
                                                        paperSize: e.target.value, 
                                                        paperWidth: width, 
                                                        paperHeight: height,
                                                        isContinuous: e.target.value.includes("CONTINUOUS")
                                                    });
                                                }}
                                                className="flex-1 h-8 px-2 text-sm border rounded-md"
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
                                            <select
                                                value={settings.orientation}
                                                onChange={e => setSettings({ ...settings, orientation: e.target.value as 'portrait' | 'landscape' })}
                                                className="w-28 h-8 px-2 text-sm border rounded-md"
                                            >
                                                <option value="portrait">Portrait</option>
                                                <option value="landscape">Landscape</option>
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

                                    <h4 className="font-semibold text-slate-700 text-sm border-b pb-2 pt-2">Layout</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">ແຖວ (Rows)</Label>
                                            <Input className="h-8 text-sm" type="number" min={1} value={settings.rows} onChange={e => setSettings({ ...settings, rows: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ຖັນ (Cols)</Label>
                                            <Input className="h-8 text-sm" type="number" min={1} value={settings.columns} onChange={e => setSettings({ ...settings, columns: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">W Label</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.labelWidth} onChange={e => setSettings({ ...settings, labelWidth: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">H Label</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.labelHeight} onChange={e => setSettings({ ...settings, labelHeight: Number(e.target.value) })} />
                                        </div>
                                    </div>

                                    <h4 className="font-semibold text-slate-700 text-sm border-b pb-2 pt-2">Margins (mm)</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Top</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.marginTop} onChange={e => setSettings({ ...settings, marginTop: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Bottom</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.marginBottom} onChange={e => setSettings({ ...settings, marginBottom: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Left</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.marginLeft} onChange={e => setSettings({ ...settings, marginLeft: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Right</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.marginRight} onChange={e => setSettings({ ...settings, marginRight: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Gap X</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.gapX} onChange={e => setSettings({ ...settings, gapX: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Gap Y</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.gapY} onChange={e => setSettings({ ...settings, gapY: Number(e.target.value) })} />
                                        </div>
                                    </div>

                                    <h4 className="font-semibold text-slate-700 text-sm border-b pb-2 pt-2">Barcode</h4>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Type</Label>
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
                                            <Label className="text-xs">Width</Label>
                                            <Input className="h-8 text-sm" type="number" step="0.1" value={settings.barcodeWidth} onChange={e => setSettings({ ...settings, barcodeWidth: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Height</Label>
                                            <Input className="h-8 text-sm" type="number" value={settings.barcodeHeight} onChange={e => setSettings({ ...settings, barcodeHeight: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={settings.showName} onChange={e => setSettings({ ...settings, showName: e.target.checked })} className="h-4 w-4" />
                                            <span className="text-xs">Show Name</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={settings.showPrice} onChange={e => setSettings({ ...settings, showPrice: e.target.checked })} className="h-4 w-4" />
                                            <span className="text-xs">Show Price</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={settings.isContinuous} onChange={e => setSettings({ ...settings, isContinuous: e.target.checked })} className="h-4 w-4" />
                                            <span className="text-xs">Fit to Content (Continuous)</span>
                                        </label>
                                    </div>

                                    <Button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 h-9 text-sm mt-4">
                                        <Save className="w-4 h-4 mr-2" /> ບັນທຶກ (Save)
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
                        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            <Printer className="w-4 h-4" />
                            ພິມ
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

    useEffect(() => {
        // Generate barcodes
        items.forEach(({ product }) => {
            const canvas = canvasRefs.current.get(product._id);
            if (canvas && product.barcode) {
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
            }
        });
    }, [items, settings]);

    // Generate all labels
    const allLabels: Array<{ product: Product; index: number }> = [];
    items.forEach(({ product, quantity }) => {
        for (let i = 0; i < quantity; i++) {
            allLabels.push({ product, index: i });
        }
    });

    const labelsPerPage = settings.isContinuous ? 999999 : (settings.rows * settings.columns);
    const pages: Array<Array<{ product: Product; index: number }>> = [];
    for (let i = 0; i < allLabels.length; i += labelsPerPage) {
        pages.push(allLabels.slice(i, i + labelsPerPage));
    }


    // Determine final dimensions based on orientation preference
    let printWidth = settings.paperWidth;
    let printHeight = settings.paperHeight;

    // For non-standard sizes that are NOT continuous, we might need to swap based on orientation
    if (settings.paperSize !== "A4" && settings.paperSize !== "LETTER" && !settings.isContinuous) {
        if ((settings.orientation === "portrait" && printWidth > printHeight) || 
            (settings.orientation === "landscape" && printWidth < printHeight)) {
            // Swap width and height to match orientation
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
                        height: `${settings.paperHeight}mm`,
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
                        {pageLabels.map(({ product }, idx) => (
                            <div
                                key={`${product._id}-${idx}`}
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
                                        if (el) canvasRefs.current.set(product._id, el);
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
