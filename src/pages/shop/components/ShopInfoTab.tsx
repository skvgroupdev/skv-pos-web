import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenant, updateTenant } from "@/api/tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Store, CreditCard } from "lucide-react";
import { toast } from "sonner";

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

    // Sync Tenant Data to Form
    useEffect(() => {
        if (tenantData) {
            setShopForm({
                shopName: tenantData.shopName || "",
                address: tenantData.address || "",
                phone: tenantData.phone || "",
                bankName: tenantData.bankName || "",
                bankAccount: tenantData.bankAccount || "",
                bankQr: tenantData.bankQr || "",
                logo: tenantData.logo || ""
            });
        }
    }, [tenantData]);

    const handleShopSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateTenantMutation.mutate(shopForm);
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
                        <span>QR Code</span>
                        {shopForm.bankQr && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Preview Available</span>}
                    </Label>
                    <Textarea
                        value={shopForm.bankQr}
                        onChange={e => setShopForm({ ...shopForm, bankQr: e.target.value })}
                        placeholder="<svg>...</svg>"
                        className="font-mono text-xs h-24"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                        <span>Logo</span>
                        {shopForm.logo && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Preview Available</span>}
                    </Label>
                    <Textarea
                        value={shopForm.logo}
                        onChange={e => setShopForm({ ...shopForm, logo: e.target.value })}
                        placeholder="<svg>...</svg>"
                        className="font-mono text-xs h-24"
                    />
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
