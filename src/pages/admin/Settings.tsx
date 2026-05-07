import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenant, updateTenant } from "@/api/tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, CreditCard, Save } from "lucide-react";

export default function Settings() {
    const queryClient = useQueryClient();
    const { data: tenant, isLoading } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });

    const [formData, setFormData] = useState({
        shopName: "",
        phone: "",
        address: "",
        logo: "",
        bankName: "",
        bankAccount: "",
        bankQr: ""
    });

    useEffect(() => {
        if (tenant) {
            setFormData({
                shopName: tenant.shopName || tenant.name || "",
                phone: tenant.phone || "",
                address: tenant.address || "",
                logo: tenant.logo || "",
                bankName: tenant.bankName || "",
                bankAccount: tenant.bankAccount || "",
                bankQr: tenant.bankQr || ""
            });
        }
    }, [tenant]);

    const updateMutation = useMutation({
        mutationFn: updateTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant'] });
            alert("ບັນທຶກຂໍ້ມູນສຳເລັດ (Saved Successfully)");
        },
        onError: (err: any) => {
            alert("ເກີດຂໍ້ຜິດພາດ (Error): " + err.message);
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto font-lao space-y-6">
            <h1 className="text-2xl font-bold mb-6">ຕັ້ງຄ່າຮ້ານ (Shop Settings)</h1>

            <div className="grid gap-6">
                {/* Shop Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" /> ຂໍ້ມູນຮ້ານ (Shop Info)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ຊື່ຮ້ານ (Shop Name)</Label>
                                <Input name="shopName" value={formData.shopName} onChange={handleChange} placeholder="ຊື່ຮ້ານຂອງທ່ານ..." />
                            </div>
                            <div className="space-y-2">
                                <Label>ເບີໂທ (Phone)</Label>
                                <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="020..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>ທີ່ຢູ່ (Address)</Label>
                            <Input name="address" value={formData.address} onChange={handleChange} placeholder="ບ້ານ, ເມືອງ..." />
                        </div>
                        <div className="space-y-2">
                            <Label>ໂລໂກ້ URL (Logo Image URL)</Label>
                            <div className="flex gap-2">
                                <Input name="logo" value={formData.logo} onChange={handleChange} placeholder="https://..." />
                                {formData.logo && <img src={formData.logo} alt="Logo Preview" className="h-10 w-10 object-cover rounded border" />}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" /> ຂໍ້ມູນບັນຊີທະນາຄານ (Bank Info)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ຊື່ທະນາຄານ (Bank Name)</Label>
                                <Input name="bankName" value={formData.bankName} onChange={handleChange} placeholder="BCEL / LDB..." />
                            </div>
                            <div className="space-y-2">
                                <Label>ເລກບັນຊີ (Account Number)</Label>
                                <Input name="bankAccount" value={formData.bankAccount} onChange={handleChange} placeholder="xxxx-xxxx..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>QR Code URL (ສໍາລັບຮັບເງິນ)</Label>
                            <div className="flex gap-2">
                                <Input name="bankQr" value={formData.bankQr} onChange={handleChange} placeholder="https://..." />
                                {formData.bankQr && <img src={formData.bankQr} alt="QR Preview" className="h-10 w-10 object-cover rounded border" />}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 min-w-[150px]" disabled={updateMutation.isPending}>
                        <Save className="mr-2 h-4 w-4" /> ບັນທຶກ (Save Changes)
                    </Button>
                </div>
            </div>
        </div>
    );
}
