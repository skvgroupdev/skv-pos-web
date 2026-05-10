import { useQuery } from "@tanstack/react-query";
import { getTenant } from "@/api/tenants";
import { Loader2, Store, CreditCard, Printer, Crown, Lock } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RatesTab } from "./components/RatesTab";
import { ShopInfoTab } from "./components/ShopInfoTab";
import { BarcodeSettingsTab } from "./components/BarcodeSettingsTab";

export default function Settings() {
    // --- Tenant Query ---
    const { data: tenantData, isLoading: isLoadingTenant } = useQuery({
        queryKey: ["tenant"],
        queryFn: getTenant,
    });

    if (isLoadingTenant) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    const isBasic = tenantData?.subscriptionPlan === 'BASIC';

    const handleRatesClick = (e: React.MouseEvent) => {
        if (isBasic) {
            e.preventDefault();
            toast.error("Upgrade Plan Required", {
                description: "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນນີ້ (PRO/ENTERPRISE)"
            });
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <Tabs defaultValue="shop" className="space-y-6">
                <TabsList className="bg-white border p-1 h-12">
                    <TabsTrigger value="shop" className="gap-2 px-6">
                        <Store className="w-4 h-4" /> ຂໍ້ມູນຮ້ານ
                    </TabsTrigger>
                    <TabsTrigger
                        value="rates"
                        className={`gap-2 px-6 ${isBasic ? 'opacity-70' : ''}`}
                        onClick={handleRatesClick}
                    >
                        <CreditCard className="w-4 h-4" /> ອັດຕາແລກປ່ຽນ
                        {isBasic && <Crown className="w-3 h-3 text-yellow-500 ml-1" />}
                    </TabsTrigger>
                    <TabsTrigger value="barcode" className="gap-2 px-6">
                        <Printer className="w-4 h-4" /> ການພິມບາໂຄດ
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="shop">
                    <ShopInfoTab />
                </TabsContent>

                <TabsContent value="rates">
                    {isBasic ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                                <Crown className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Upgrade to PRO</h3>
                            <p className="text-slate-500 text-center max-w-sm mb-6">
                                Exchange rates management is available on PRO and ENTERPRISE plans.
                            </p>
                            <Button variant="outline" className="gap-2">
                                <Lock className="w-4 h-4" /> View Plans
                            </Button>
                        </div>
                    ) : (
                        <RatesTab />
                    )}
                </TabsContent>

                <TabsContent value="barcode">
                    <BarcodeSettingsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
