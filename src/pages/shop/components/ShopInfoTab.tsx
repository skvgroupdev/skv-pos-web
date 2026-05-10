import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenant, updateTenant } from "@/api/tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Loader2, QrCode, Save, Store, CreditCard, Upload } from "lucide-react";
import { toast } from "sonner";
import { sanitizeSvgForDisplay } from "@/pages/pos/components/bill-templates/billPrintUtils";

const maxUploadSize = 1024 * 1024;
const maxEmbeddedSvgSize = 300 * 1024;
const svgImageSizeByField = {
    logo: 320,
    bankQr: 360,
} as const;

const renderMediaPreview = (value: string, label: string) => {
    if (!value) {
        return (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
                {label}
            </div>
        );
    }

    if (value.includes("<svg")) {
        return <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: sanitizeSvgForDisplay(value) }} />;
    }

    return <img src={value} alt={label} className="h-full w-full object-contain" crossOrigin="anonymous" />;
};

const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

const readFileAsText = (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
};

const ensureMediaSize = (value: string, label: string) => {
    if (value.length > maxEmbeddedSvgSize) {
        throw new Error(`${label} ໃຫຍ່ເກີນໄປ ກະລຸນາໃຊ້ຮູບທີ່ເບົາກວ່ານີ້`);
    }
};

const loadImage = (src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Cannot read image file"));
        image.src = src;
    });
};

const convertImageFileToSvg = async (file: File, field: "logo" | "bankQr") => {
    if (!file.type.startsWith("image/")) {
        throw new Error("ກະລຸນາເລືອກໄຟລ໌ຮູບພາບ");
    }

    if (file.size > maxUploadSize) {
        throw new Error("ຂະໜາດຮູບຕ້ອງບໍ່ເກີນ 1MB");
    }

    if (file.type === "image/svg+xml") {
        const svg = sanitizeSvgForDisplay(await readFileAsText(file));
        ensureMediaSize(svg, field === "logo" ? "Logo" : "QR Code");
        return svg;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const maxSvgImageSize = svgImageSizeByField[field];
    const scale = Math.min(1, maxSvgImageSize / image.width, maxSvgImageSize / image.height);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Browser cannot convert this image");

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const embeddedImage = canvas.toDataURL("image/png");

    const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
        `<image href="${embeddedImage}" xlink:href="${embeddedImage}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`,
        "</svg>",
    ].join("");

    ensureMediaSize(svg, field === "logo" ? "Logo" : "QR Code");

    return svg;
};

export function ShopInfoTab() {
    const queryClient = useQueryClient();

    // --- Tenant Query ---
    const { data: tenantData, isLoading: isLoadingTenant } = useQuery({
        queryKey: ["tenant"],
        queryFn: getTenant,
    });

    const updateTenantMutation = useMutation({
        mutationFn: updateTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenant"] });
            toast.success("Shop info updated successfully!");
        },
        onError: () => toast.error("Failed to update shop info")
    });

    // --- State for Shop Info ---
    const [shopForm, setShopForm] = useState({
        shopName: "",
        address: "",
        phone: "",
        bankName: "",
        bankAccount: "",
        bankQr: "", // SVG String
        logo: ""    // SVG String
    });
    const [convertingField, setConvertingField] = useState<"logo" | "bankQr" | null>(null);

    // Sync Tenant Data to Form
    useEffect(() => {
        if (!tenantData) return;

        const syncTimer = window.setTimeout(() => {
            setShopForm({
                shopName: tenantData.shopName || "",
                address: tenantData.address || "",
                phone: tenantData.phone || "",
                bankName: tenantData.bankName || "",
                bankAccount: tenantData.bankAccount || "",
                bankQr: tenantData.bankQr || "",
                logo: tenantData.logo || ""
            });
        }, 0);

        return () => window.clearTimeout(syncTimer);
    }, [tenantData]);

    const handleShopSave = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            ensureMediaSize(shopForm.logo, "Logo");
            ensureMediaSize(shopForm.bankQr, "QR Code");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Image is too large");
            return;
        }

        updateTenantMutation.mutate(shopForm);
    };

    const handleImageUpload = async (file: File | undefined, field: "logo" | "bankQr") => {
        if (!file) return;

        try {
            setConvertingField(field);
            const svg = await convertImageFileToSvg(file, field);
            setShopForm((current) => ({ ...current, [field]: svg }));
            toast.success("Image converted to SVG");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to convert image");
        } finally {
            setConvertingField(null);
        }
    };

    if (isLoadingTenant) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    return (
        <form onSubmit={handleShopSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 border-b pb-3">
                    <Store className="w-5 h-5 text-indigo-600" />
                    ຂໍ້ມູນພື້ນຖານ
                </h3>
                <div className="space-y-2">
                    <Label>ຊື່ຮ້ານ</Label>
                    <Input
                        value={shopForm.shopName}
                        onChange={e => setShopForm({ ...shopForm, shopName: e.target.value })}
                        placeholder="SKV Store..."
                    />
                </div>
                <div className="space-y-2">
                    <Label>ທີ່ຢູ່</Label>
                    <Textarea
                        value={shopForm.address}
                        onChange={e => setShopForm({ ...shopForm, address: e.target.value })}
                        placeholder="Vientiane, Laos..."
                    />
                </div>
                <div className="space-y-2">
                    <Label>ເບີໂທ</Label>
                    <Input
                        value={shopForm.phone}
                        onChange={e => setShopForm({ ...shopForm, phone: e.target.value })}
                        placeholder="020 xxxx xxxx"
                    />
                </div>
            </div>

            {/* Bank & Logo */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 border-b pb-3">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    ຂໍ້ມູນການຊຳລະ & ໂລໂກ້
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>ຊື່ທະນາຄານ</Label>
                        <Input
                            value={shopForm.bankName}
                            onChange={e => setShopForm({ ...shopForm, bankName: e.target.value })}
                            placeholder="BCEL"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>ເລກບັນຊີ</Label>
                        <Input
                            value={shopForm.bankAccount}
                            onChange={e => setShopForm({ ...shopForm, bankAccount: e.target.value })}
                            placeholder="xxx-xxx-xxxx"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><QrCode className="h-4 w-4 text-slate-500" /> QR Code</span>
                        {shopForm.bankQr && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Preview Available</span>}
                    </Label>
                    <div className="grid grid-cols-[1fr_96px] gap-3">
                        <div className="space-y-2">
                            <Textarea
                                value={shopForm.bankQr}
                                onChange={e => setShopForm({ ...shopForm, bankQr: e.target.value })}
                                placeholder="<svg>...</svg> or https://..."
                                className="font-mono text-xs h-24"
                            />
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                                {convertingField === "bankQr" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                Upload QR image
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden"
                                    disabled={convertingField !== null}
                                    onChange={(e) => {
                                        handleImageUpload(e.target.files?.[0], "bankQr");
                                        e.currentTarget.value = "";
                                    }}
                                />
                            </label>
                        </div>
                        <div className="h-24 rounded-lg border border-slate-200 bg-slate-50 p-2">
                            {renderMediaPreview(shopForm.bankQr, "QR")}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-slate-500" /> Logo</span>
                        {shopForm.logo && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Preview Available</span>}
                    </Label>
                    <div className="grid grid-cols-[1fr_96px] gap-3">
                        <div className="space-y-2">
                            <Textarea
                                value={shopForm.logo}
                                onChange={e => setShopForm({ ...shopForm, logo: e.target.value })}
                                placeholder="<svg>...</svg> or https://..."
                                className="font-mono text-xs h-24"
                            />
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                                {convertingField === "logo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                Upload logo image
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden"
                                    disabled={convertingField !== null}
                                    onChange={(e) => {
                                        handleImageUpload(e.target.files?.[0], "logo");
                                        e.currentTarget.value = "";
                                    }}
                                />
                            </label>
                        </div>
                        <div className="h-24 rounded-lg border border-slate-200 bg-slate-50 p-2">
                            {renderMediaPreview(shopForm.logo, "Logo")}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Bar (Optional) */}
            <div className="lg:col-span-2 flex justify-end">
                <Button
                    type="submit"
                    size="lg"
                    disabled={updateTenantMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 min-w-[200px]"
                >
                    {updateTenantMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> ອັບເດດ...</>
                    ) : (
                        <><Save className="w-4 h-4 mr-2" /> ອັບເດດ </>
                    )}
                </Button>
            </div>
        </form>
    );
}
