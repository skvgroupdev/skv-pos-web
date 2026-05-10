import { useState } from "react";
import { Trash2, Search, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { NumericInput } from "@/components/NumericInput";
import { CreatableSelect } from "@/components/CreatableSelect";
import { Textarea } from "@/components/ui/textarea";
import type { CreateProductDto } from "@/api/products";
import { useGetUnits, useGetCategories, useCreateUnit, useCreateCategory } from "@/hooks/useProducts";
import { uploadProductImage } from "@/api/products";
import { usePOSStore } from "@/store/usePOSStore";

interface ProductFormProps {
    initialData?: CreateProductDto;
    onSubmit: (data: CreateProductDto) => void;
    onCancel: () => void;
    isEditing?: boolean;
    isLoading?: boolean;
}

interface ProductOptionSource {
    name: string;
}

const formattedNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

const priceWarningClass = "border-amber-500 bg-amber-50 text-amber-800 focus:border-amber-600 focus:ring-amber-200";

export function ProductForm({ initialData, onSubmit }: ProductFormProps) {
    const exchangeRates = usePOSStore((state) => state.exchangeRates);
    const { data: unitsData } = useGetUnits();
    const { data: categoriesData } = useGetCategories();
    const createUnitMutation = useCreateUnit();
    const createCategoryMutation = useCreateCategory();
    const [isImageUploading, setIsImageUploading] = useState(false);

    const [formData, setFormData] = useState<CreateProductDto>(initialData || {
        name: "",
        category: "",
        costPrice: 0,
        costCurrency: "LAK",
        sellPrice: 0,
        wholesalePrice: 0,
        stock: 0,
        unit: "",
        barcode: "",
        brand: "",
        modelName: "",
        status: "active",
        description: "",
        supplier: "",
        sku: "",
        catalog: {
            No: "",
            code: "",
            page: "",
            number: ""
        },
        images: []
    });

    const handleCreateCategory = (name: string) => {
        createCategoryMutation.mutate(name, {
            onSuccess: () => {
                setFormData(prev => ({ ...prev, category: name }));
            }
        });
    }

    const handleCreateUnit = (name: string) => {
        createUnitMutation.mutate(name, {
            onSuccess: () => {
                setFormData(prev => ({ ...prev, unit: name }));
            }
        });
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isImageUploading) {
            alert("Please wait for the product image upload to finish");
            return;
        }
        // Basic validation
        if (!formData.category) { alert("Please select a category"); return; }
        if (!formData.unit) { alert("Please select a unit"); return; }
        onSubmit(formData);
    };

    const handleProductImageChange = async (file?: File) => {
        if (!file) return;

        const maxSizeInBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            alert("Image size must be less than 5MB");
            return;
        }

        setIsImageUploading(true);
        try {
            const result = await uploadProductImage(file);
            setFormData((prev) => ({
                ...prev,
                images: [result.images.original],
                imageVariants: [result.images],
            }));
        } catch (error) {
            alert("Failed to upload image");
            console.error(error);
        } finally {
            setIsImageUploading(false);
        }
    };

    // Sort options: If we have a selected value, move it to top. Otherwise sort alphabetically.
    const sortOptions = (options: { value: string, label: string }[], selectedValue?: string) => {
        if (!options) return [];
        return [...options].sort((a, b) => {
            if (a.value === selectedValue) return -1;
            if (b.value === selectedValue) return 1;
            return a.label.localeCompare(b.label);
        });
    };

    const categoryOptions = sortOptions(
        categoriesData?.data?.map((category: ProductOptionSource) => ({
            value: category.name,
            label: category.name,
        })) || [],
        formData.category
    );
    const unitOptions = sortOptions(
        unitsData?.data?.map((unit: ProductOptionSource) => ({
            value: unit.name,
            label: unit.name,
        })) || [],
        formData.unit
    );
    const costRate = exchangeRates.find(r => r.currency === formData.costCurrency)?.rate || 0;
    const costPriceInLak = formData.costCurrency === "LAK" ? formData.costPrice : formData.costPrice * costRate;
    const wholesalePrice = formData.wholesalePrice || 0;
    const isSellPriceLow = costPriceInLak > 0 && formData.sellPrice > 0 && formData.sellPrice < costPriceInLak;
    const isWholesalePriceWarning = wholesalePrice > 0 && (
        (costPriceInLak > 0 && wholesalePrice < costPriceInLak) ||
        (formData.sellPrice > 0 && wholesalePrice > formData.sellPrice)
    );

    // Get User Subscription Plan
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isProOrEnterprise = ['PRO', 'ENTERPRISE'].includes(user.subscriptionPlan);

    return (
        <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="h-4 w-1 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-slate-700">ຂໍ້ມູນພື້ນຖານ</h3>
                </div>
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6 md:col-span-4 space-y-2">
                        <Label htmlFor="barcode">ບາໂຄດ</Label>
                        <Input id="barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan/Type barcode" className="font-mono bg-slate-50" />
                    </div>
                    <div className="col-span-12 md:col-span-8 space-y-2">
                        <Label htmlFor="name">ຊື່ສິນຄ້າ <span className="text-red-500">*</span></Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter product name..." className="border-slate-300 focus:border-indigo-500" />
                    </div>

                    <div className="col-span-6 md:col-span-4 space-y-2">
                        <Label htmlFor="category">ໝວດໝູ່ <span className="text-red-500">*</span></Label>
                        <CreatableSelect items={categoryOptions} value={formData.category || ""} onValueChange={(val) => setFormData({ ...formData, category: val })} onCreate={handleCreateCategory} placeholder="ເລືອກປະເພດ" />
                    </div>
                    <div className="col-span-6 md:col-span-4 space-y-2">
                        <Label htmlFor="unit">ຫົວໜ່ວຍ <span className="text-red-500">*</span></Label>
                        <CreatableSelect items={unitOptions} value={formData.unit || ""} onValueChange={(val) => setFormData({ ...formData, unit: val })} onCreate={handleCreateUnit} placeholder="ເລືອກຫົວໜ່ວຍ" />
                    </div>
                    {/* <div className="col-span-6 md:col-span-4 space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Stock Keeping Unit" className="font-mono" />
                    </div> */}
                </div>
            </div>
            {/* Section 3: Pricing & Inventory */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="h-4 w-1 bg-green-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-slate-700">ລາຄາ ແລະ ສາງ</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="costPrice">ຕົ້ນທຶນ</Label>
                                <div className="flex gap-2">
                                    <NumericInput formatThousands className="flex-1" id="costPrice" value={formData.costPrice} onValueChange={(val) => setFormData({ ...formData, costPrice: val })} />
                                    {/* <Select disabled value={formData.costCurrency} onValueChange={(val) => setFormData({ ...formData, costCurrency: val })}>
                                        <SelectTrigger className="w-24 bg-slate-50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LAK">LAK</SelectItem>
                                            <SelectItem value="THB">THB</SelectItem>
                                            <SelectItem value="VND">VND</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="CNY">CNY</SelectItem>
                                        </SelectContent>
                                    </Select> */}
                                </div>
                                {formData.costCurrency !== 'LAK' && (
                                    <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                                        <span>≈ {
                                            (() => {
                                                return formattedNumber(costPriceInLak);
                                            })()
                                        } LAK</span>
                                        <span className="text-[10px] bg-slate-100 px-1 rounded">Base Cost</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sellPrice">ລາຄາຂາຍ</Label>
                                <NumericInput formatThousands id="sellPrice" value={formData.sellPrice} onValueChange={(val) => setFormData({ ...formData, sellPrice: val })} required className={isSellPriceLow ? priceWarningClass : "border-green-300 font-bold text-green-700 focus:border-green-500"} />
                                {isSellPriceLow && (
                                    <p className="text-xs text-amber-700">ລາຄາຂາຍຕ່ຳກວ່າຕົ້ນທຶນ</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wholesalePrice">ລາຄາຂາຍສົ່ງ</Label>
                                <NumericInput formatThousands id="wholesalePrice" value={wholesalePrice} onValueChange={(val) => setFormData({ ...formData, wholesalePrice: val })} className={isWholesalePriceWarning ? priceWarningClass : ""} />
                                {isWholesalePriceWarning && (
                                    <p className="text-xs text-amber-700">ກວດລາຄາຂາຍສົ່ງອີກຄັ້ງ</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stock">ຈຳນວນໃນສາງ</Label>
                                <NumericInput id="stock" value={formData.stock} onValueChange={(val) => setFormData({ ...formData, stock: val })} className="bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minStock">ເຕືອນຂັ້ນຕ່ຳ</Label>
                                <NumericInput id="minStock" value={formData.minStock || 0} onValueChange={(val) => setFormData({ ...formData, minStock: val })} />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="status">ສະຖານະ</Label>
                                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as "active" | "inactive" })}>
                                    <SelectTrigger className={formData.status === 'active' ? 'border-green-500 text-green-700 bg-green-50' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">ພ້ອມຂາຍ</SelectItem>
                                        <SelectItem value="inactive">ຢຸດຂາຍ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Section 2: Catalog Information */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-slate-700">ຂໍ້ມູນ Catalog</h3>
                    {!isProOrEnterprise && (
                        <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock size={12} /> PRO / ENTERPRISE
                        </span>
                    )}
                </div>
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100 relative ${!isProOrEnterprise ? 'opacity-60 pointer-events-none select-none' : ''}`}>
                    <div className="space-y-2">
                        <Label htmlFor="cat_no" className="text-blue-900">Catalog No.</Label>
                        <Input disabled={!isProOrEnterprise} id="cat_no" value={formData.catalog?.No || ""} onChange={(e) => setFormData({ ...formData, catalog: { ...formData.catalog, No: e.target.value } })} placeholder="e.g. A1" className="border-blue-200 focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cat_code" className="text-blue-900">Code</Label>
                        <Input disabled={!isProOrEnterprise} id="cat_code" value={formData.catalog?.code || ""} onChange={(e) => setFormData({ ...formData, catalog: { ...formData.catalog, code: e.target.value } })} placeholder="e.g. C-123" className="border-blue-200 focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cat_page" className="text-blue-900">Page</Label>
                        <Input disabled={!isProOrEnterprise} id="cat_page" value={formData.catalog?.page || ""} onChange={(e) => setFormData({ ...formData, catalog: { ...formData.catalog, page: e.target.value } })} placeholder="e.g. 15" className="border-blue-200 focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cat_number" className="text-blue-900">Number</Label>
                        <Input disabled={!isProOrEnterprise} id="cat_number" value={formData.catalog?.number || ""} onChange={(e) => setFormData({ ...formData, catalog: { ...formData.catalog, number: e.target.value } })} placeholder="e.g. 5" className="border-blue-200 focus:border-blue-500" />
                    </div>
                </div>
            </div>

            {/* Section 4: Additional Details */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="h-4 w-1 bg-orange-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-slate-700">ຂໍ້ມູນເພີ່ມເຕີມ</h3>
                    {!isProOrEnterprise && (
                        <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock size={12} /> PRO / ENTERPRISE
                        </span>
                    )}
                </div>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!isProOrEnterprise ? 'opacity-60 pointer-events-none select-none' : ''}`}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brand">ຍີ່ຫໍ້ (Brand)</Label>
                                <Input disabled={!isProOrEnterprise} id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model">ລຸ້ນ (Model)</Label>
                                <Input disabled={!isProOrEnterprise} id="model" value={formData.modelName} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="supplier">ຜູ້ສະໜອງ (Supplier)</Label>
                                <Input disabled={!isProOrEnterprise} id="supplier" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">ລາຍລະອຽດເພີ່ມເຕີມ</Label>
                            <Textarea disabled={!isProOrEnterprise} id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-24 resize-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>ຮູບພາບສິນຄ້າ</Label>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 transition-all min-h-[220px] text-center">
                            {formData.images?.[0] ? (
                                <div className="relative w-full h-full flex flex-col items-center">
                                    <img src={formData.imageVariants?.[0]?.medium || formData.images[0]} alt="Preview" className="max-h-48 object-contain rounded mb-2 shadow-sm" />
                                    <Button disabled={isImageUploading} type="button" variant="destructive" size="sm" onClick={() => setFormData({ ...formData, images: [], imageVariants: [] })} className="mt-2 h-8">
                                        <Trash2 size={16} className="mr-2" /> ລົບຮູບ
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 w-full">
                                    <div className="p-3 bg-slate-200 rounded-full mb-2">
                                        <Search size={24} className="text-slate-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">ເລືອກຮູບພາບສິນຄ້າ</p>
                                    <p className="text-xs text-slate-400">JPG, PNG, WEBP (Max 5MB)</p>
                                    <Input
                                        disabled={isImageUploading}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="image-upload"
                                        onChange={(e) => handleProductImageChange(e.target.files?.[0])}
                                    />
                                    <Button disabled={isImageUploading} type="button" variant="outline" size="sm" onClick={() => document.getElementById('image-upload')?.click()}>
                                        {isImageUploading ? "ກຳລັງອັບໂຫຼດ..." : "ເພີ່ມຮູບພາບສິນຄ້າ"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
