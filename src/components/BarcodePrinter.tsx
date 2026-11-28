import { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Package, Save } from "lucide-react";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";
import { useReactToPrint } from "react-to-print";
import type { Product } from "@/api/products";

interface BarcodePrinterProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
}

interface PrintSettings {
    settingsVersion: number;
    columns: 1 | 3;
    paperWidth: number;
    marginLeft: number;
    marginRight: number;
    marginTop: number;
    marginBottom: number;
    gapX: number;
    gapY: number;
    labelWidth: number;
    labelHeight: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    barWidth: number;
    barHeight: number;
    barcodeFontSize: number;
    nameFontSize: number;
    priceFontSize: number;
    showPrice: boolean;
    showName: boolean;
    showBarcodeText: boolean;
    orientation: "portrait" | "landscape";
}

const PRESETS = [
    { columns: 1, labelWidth: 50, labelHeight: 40, paperWidth: 52, marginLeft: 1, marginRight: 1, name: "1 ແຖວ — 50 × 40 mm (ເຈ້ຍ 52 mm)" },
    { columns: 1, labelWidth: 40, labelHeight: 30, paperWidth: 42, marginLeft: 1, marginRight: 1, name: "1 ແຖວ — 40 × 30 mm (ເຈ້ຍ 42 mm)" },
    { columns: 3, labelWidth: 32, labelHeight: 25, paperWidth: 100, marginLeft: 0, marginRight: 0, name: "3 ແຖວ — 32 × 25 mm (ເຈ້ຍ 100 mm)" },
] as const;

const DEFAULT_SETTINGS: PrintSettings = {
    settingsVersion: 5,
    columns: 1,
    paperWidth: 52,
    marginLeft: 1,
    marginRight: 1,
    marginTop: 2,
    marginBottom: 2,
    gapX: 2,
    gapY: 2,
    labelWidth: 50,
    labelHeight: 40,
    paddingTop: 0.5,
    paddingRight: 0.5,
    paddingBottom: 0.5,
    paddingLeft: 0.5,
    barWidth: 1,
    barHeight: 32,
    barcodeFontSize: 11,
    nameFontSize: 9,
    priceFontSize: 10,
    showPrice: true,
    showName: true,
    showBarcodeText: true,
    orientation: "landscape",
};

const validSettings = ({ columns, paperWidth, labelWidth, labelHeight, gapX, gapY, marginLeft, marginRight, marginTop, marginBottom,
    paddingTop, paddingRight, paddingBottom, paddingLeft, barWidth, barHeight, barcodeFontSize, nameFontSize, priceFontSize }: PrintSettings) =>
    (columns === 1 || columns === 3) && labelWidth > 0 && labelHeight > 0 &&
    barWidth > 0 && barHeight > 0 && barcodeFontSize > 0 && nameFontSize > 0 && priceFontSize > 0 &&
    [paperWidth, labelWidth, labelHeight, gapX, gapY, marginLeft, marginRight, marginTop, marginBottom,
        paddingTop, paddingRight, paddingBottom, paddingLeft, barWidth, barHeight, barcodeFontSize, nameFontSize, priceFontSize]
        .every(value => Number.isFinite(value) && value >= 0) &&
    marginLeft + columns * labelWidth + (columns - 1) * gapX + marginRight <= paperWidth &&
    paddingLeft + paddingRight < labelWidth && paddingTop + paddingBottom < labelHeight;

const paperHeight = (settings: PrintSettings) =>
    settings.marginTop + settings.labelHeight + settings.marginBottom + settings.gapY;

const readSavedBarcodeSettings = (): PrintSettings => {
    const saved = localStorage.getItem("barcodePrinterSettings");
    if (!saved) return DEFAULT_SETTINGS;

    try {
        const parsed = JSON.parse(saved);
        if (parsed.settingsVersion !== DEFAULT_SETTINGS.settingsVersion) {
            return DEFAULT_SETTINGS;
        }

        const settings = { ...DEFAULT_SETTINGS, ...parsed };
        return validSettings(settings) && (settings.orientation === "portrait" || settings.orientation === "landscape") ? settings : DEFAULT_SETTINGS;
    } catch (e) {
        console.error("Failed to load barcode settings", e);
        return DEFAULT_SETTINGS;
    }
};

export function BarcodePrinter({ isOpen, onClose, products }: BarcodePrinterProps) {
    const [settings, setSettings] = useState<PrintSettings>(readSavedBarcodeSettings);
    const printRef = useRef<HTMLDivElement>(null);

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

        if (!validSettings(settings)) {
            toast.error("ກະລຸນາກວດຂະໜາດສະຕິກເກີ, ຂອບ ແລະ padding");
            return;
        }
        const barcodes = printRef.current?.querySelectorAll("svg.barcode");
        if (!barcodes || barcodes.length !== totalLabels || [...barcodes].some(barcode => !barcode.getAttribute("width"))) {
            toast.error("ສ້າງບາໂຄດບໍ່ສຳເລັດ ກະລຸນາກວດລະຫັດສິນຄ້າ");
            return;
        }
        print();
    };

    const print = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Barcode labels",
        pageStyle: `@page { size: ${settings.orientation === "landscape" ? settings.paperWidth : paperHeight(settings)}mm ${settings.orientation === "landscape" ? paperHeight(settings) : settings.paperWidth}mm; margin: 0; }
            html, body { margin: 0; padding: 0; font-family: "Noto Sans Lao", sans-serif; }
            .barcode-page { break-after: page; page-break-after: always; }
            .barcode-page:last-child { break-after: auto; page-break-after: auto; }`,
    });

    const handleSaveSettings = () => {
        if (!validSettings(settings)) {
            toast.error("ກະລຸນາກວດຂະໜາດສະຕິກເກີ, ຂອບ ແລະ padding");
            return;
        }
        localStorage.setItem("barcodePrinterSettings", JSON.stringify(settings));
        toast.success("ບັນທຶກການຕັ້ງຄ່າສຳເລັດ");
    };

    const barcodeItems = generateBarcodes();
    const totalLabels = barcodeItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-indigo-600" />
                        ພິມບາໂຄດ
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
                                <div>
                                    <h4 className="font-semibold text-slate-700 text-sm">ຂະໜາດສະຕິກເກີ</h4>
                                    <p className="text-xs text-slate-500 mt-1">ເລືອກຈຳນວນດວງຕໍ່ແຖວ ແລະ ຂະໜາດສະຕິກເກີ</p>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="barcode-columns" className="text-xs">ຂະໜາດມາດຕະຖານ</Label>
                                    <select id="barcode-columns" value={PRESETS.findIndex(preset => preset.columns === settings.columns && preset.labelWidth === settings.labelWidth && preset.labelHeight === settings.labelHeight && preset.paperWidth === settings.paperWidth)}
                                        onChange={event => {
                                            const { columns, labelWidth, labelHeight, paperWidth, marginLeft, marginRight } = PRESETS[Number(event.target.value)];
                                            setSettings(previous => ({ ...previous, columns, labelWidth, labelHeight, paperWidth, marginLeft, marginRight, gapX: 2 }));
                                        }}
                                        className="w-full h-8 px-2 text-sm border rounded-md">
                                        <option value={-1} disabled>ຂະໜາດທີ່ປັບເອງ</option>
                                        {PRESETS.map((preset, index) => <option key={index} value={index}>{preset.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="barcode-paper-width" className="text-xs">ກວ້າງເຈ້ຍ (mm)</Label>
                                    <Input id="barcode-paper-width" className="h-8 text-sm" type="number" min={1} step="0.1" value={settings.paperWidth}
                                        onChange={event => setSettings({ ...settings, paperWidth: Number(event.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="barcode-orientation" className="text-xs">ທິດທາງການພິມ</Label>
                                    <select id="barcode-orientation" value={settings.orientation}
                                        onChange={event => setSettings({ ...settings, orientation: event.target.value as PrintSettings["orientation"] })}
                                        className="w-full h-8 px-2 text-sm border rounded-md">
                                        <option value="landscape">ແນວນອນ</option>
                                        <option value="portrait">ແນວຕັ້ງ</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="barcode-width" className="text-xs">ກວ້າງດວງ (mm)</Label>
                                        <Input id="barcode-width" className="h-8 text-sm" type="number" min={1} step="0.1" value={settings.labelWidth}
                                            onChange={event => setSettings({ ...settings, labelWidth: Number(event.target.value) })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="barcode-height" className="text-xs">ສູງດວງ (mm)</Label>
                                        <Input id="barcode-height" className="h-8 text-sm" type="number" min={1} step="0.1" value={settings.labelHeight}
                                            onChange={event => setSettings({ ...settings, labelHeight: Number(event.target.value) })} />
                                    </div>
                                </div>
                                <h4 className="font-semibold text-slate-700 text-sm border-b pb-2">ໄລຍະຫ່າງ ແລະ ຂອບເຈ້ຍ</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        ["gapX", "ຫ່າງແນວນອນ"],
                                        ["gapY", "ຫ່າງແນວຕັ້ງ"],
                                        ["marginLeft", "ຂອບຊ້າຍ"],
                                        ["marginRight", "ຂອບຂວາ"],
                                        ["marginTop", "ຂອບເທິງ"],
                                        ["marginBottom", "ຂອບລຸ່ມ"],
                                    ] as const).map(([field, label]) => (
                                        <div key={field} className="space-y-1">
                                            <Label htmlFor={`barcode-${field}`} className="text-xs">{label} (mm)</Label>
                                            <Input id={`barcode-${field}`} className="h-8 text-sm" type="number" min={0} step="0.1" value={settings[field]}
                                                onChange={event => setSettings({ ...settings, [field]: Number(event.target.value) })} />
                                        </div>
                                    ))}
                                </div>
                                <h4 className="font-semibold text-slate-700 text-sm border-b pb-2">ຂອບດ້ານໃນສະຕິກເກີ (Padding)</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        ["paddingTop", "ເທິງ"],
                                        ["paddingRight", "ຂວາ"],
                                        ["paddingBottom", "ລຸ່ມ"],
                                        ["paddingLeft", "ຊ້າຍ"],
                                    ] as const).map(([field, label]) => (
                                        <div key={field} className="space-y-1">
                                            <Label htmlFor={`barcode-${field}`} className="text-xs">{label} (mm)</Label>
                                            <Input id={`barcode-${field}`} className="h-8 text-sm" type="number" min={0} step="0.1" value={settings[field]}
                                                onChange={event => setSettings({ ...settings, [field]: Number(event.target.value) })} />
                                        </div>
                                    ))}
                                </div>
                                <h4 className="font-semibold text-slate-700 text-sm border-b pb-2">ຂະໜາດບາໂຄດ ແລະ ຕົວໜັງສື</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        ["barWidth", "ຄວາມກວ້າງແທ່ງ", "px", 0.1],
                                        ["barHeight", "ຄວາມສູງແທ່ງ", "px", 1],
                                        ["barcodeFontSize", "ເລກບາໂຄດ", "px", 1],
                                        ["nameFontSize", "ຊື່ສິນຄ້າ", "px", 1],
                                        ["priceFontSize", "ລາຄາ", "px", 1],
                                    ] as const).map(([field, label, unit, step]) => (
                                        <div key={field} className="space-y-1">
                                            <Label htmlFor={`barcode-${field}`} className="text-xs">{label} ({unit})</Label>
                                            <Input id={`barcode-${field}`} className="h-8 text-sm" type="number" min={step} step={step} value={settings[field]}
                                                onChange={event => setSettings({ ...settings, [field]: Number(event.target.value) })} />
                                        </div>
                                    ))}
                                </div>
                                <h4 className="font-semibold text-slate-700 text-sm border-b pb-2">ສະແດງໃນສະຕິກເກີ</h4>
                                <div className="flex flex-wrap gap-4">
                                    {([
                                        ["showName", "ຊື່ສິນຄ້າ"],
                                        ["showPrice", "ລາຄາ"],
                                        ["showBarcodeText", "ເລກບາໂຄດ"],
                                    ] as const).map(([field, text]) => (
                                        <label key={field} className="flex items-center gap-2 cursor-pointer text-xs">
                                            <input type="checkbox" checked={settings[field]}
                                                onChange={event => setSettings({ ...settings, [field]: event.target.checked })} className="h-4 w-4" />
                                            {text}
                                        </label>
                                    ))}
                                </div>
                                <Button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 h-9 text-sm">
                                    <Save className="w-4 h-4 mr-2" /> ບັນທຶກຄ່າພິມ
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right: Preview */}
                    <div className="flex-1 overflow-y-auto bg-slate-100 rounded-lg p-4 flex justify-center">
                        <BarcodePreview
                            items={barcodeItems}
                            settings={settings}
                            printRef={printRef}
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
                            ພິມ ({totalLabels} ດວງ)
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// The same rows are used for the on-screen preview and the isolated print iframe.
const BarcodePreview = ({ items, settings, printRef }: {
    items: Array<{ product: Product; quantity: number }>;
    settings: PrintSettings;
    printRef: React.RefObject<HTMLDivElement | null>;
}) => {
    const barcodeRefs = useRef<Map<string, SVGSVGElement>>(new Map());
    const labels = useMemo(() => items.flatMap(({ product, quantity }) =>
        Array.from({ length: quantity }, (_, index) => ({ product, key: `${product._id}-${index}` }))
    ), [items]);

    useEffect(() => {
        labels.forEach(({ product, key }) => {
            const barcode = barcodeRefs.current.get(key);
            if (!barcode || !product.barcode) return;
            try {
                JsBarcode(barcode, product.barcode, {
                    format: "CODE128",
                    width: settings.barWidth,
                    height: settings.barHeight,
                    fontSize: settings.barcodeFontSize,
                    margin: 0,
                    displayValue: settings.showBarcodeText,
                });
            } catch (error) {
                console.error("Barcode generation error", error);
                barcode.removeAttribute("width");
            }
        });
    }, [labels, settings.barWidth, settings.barHeight, settings.barcodeFontSize, settings.showBarcodeText]);

    const rows = Array.from({ length: Math.ceil(labels.length / settings.columns) }, (_, index) =>
        labels.slice(index * settings.columns, (index + 1) * settings.columns));

    return (
        <div ref={printRef} style={{ width: `${settings.orientation === "landscape" ? settings.paperWidth : paperHeight(settings)}mm`, color: "#000", fontFamily: '"Noto Sans Lao", sans-serif' }}>
            {rows.map((row, index) => (
                <div key={index} className="barcode-page" style={{
                    width: `${settings.orientation === "landscape" ? settings.paperWidth : paperHeight(settings)}mm`,
                    height: `${settings.orientation === "landscape" ? paperHeight(settings) : settings.paperWidth}mm`,
                    overflow: "hidden",
                }}>
                    <div className="barcode-row" style={{
                        width: `${settings.paperWidth}mm`, height: `${paperHeight(settings)}mm`,
                        display: "flex", alignItems: "stretch", justifyContent: "flex-start",
                        gap: `${settings.gapX}mm`, backgroundColor: "white", overflow: "hidden",
                        padding: `${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom + settings.gapY}mm ${settings.marginLeft}mm`, boxSizing: "border-box",
                        transform: settings.orientation === "portrait" ? "rotate(90deg) translateY(-100%)" : undefined,
                        transformOrigin: "top left",
                    }}>
                        {row.map(({ product, key }) => (
                            <div key={key} style={{
                                width: `${settings.labelWidth}mm`, height: `${settings.labelHeight}mm`, flex: "none",
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                padding: `${settings.paddingTop}mm ${settings.paddingRight}mm ${settings.paddingBottom}mm ${settings.paddingLeft}mm`, boxSizing: "border-box", overflow: "hidden",
                            }}>
                                {settings.showName && <div style={{ width: "100%", textAlign: "center", fontWeight: 700, fontSize: `${settings.nameFontSize}px`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>}
                                <svg className="barcode" ref={element => {
                                    if (element) barcodeRefs.current.set(key, element);
                                    else barcodeRefs.current.delete(key);
                                }} style={{ maxWidth: "100%", maxHeight: "100%", minHeight: 0, objectFit: "contain" }} />
                                {settings.showPrice && <div style={{ width: "100%", textAlign: "center", fontWeight: 700, fontSize: `${settings.priceFontSize}px`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.sellPrice.toLocaleString()}₭</div>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
