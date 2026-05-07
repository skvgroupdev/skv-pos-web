import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExchangeRates, updateExchangeRate, type ExchangeRate } from "@/api/exchangeRates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RatesTab() {
    const queryClient = useQueryClient();

    // --- Exchange Rates Query ---
    const { data: ratesData, isLoading: isLoadingRates } = useQuery({
        queryKey: ["exchangeRates"],
        queryFn: getExchangeRates,
    });

    const updateRateMutation = useMutation({
        mutationFn: ({ currency, rate }: { currency: string; rate: number }) => updateExchangeRate(currency, rate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exchangeRates"] });
            toast.success("Exchange rate updated!");
        },
        onError: () => toast.error("Failed to update rate")
    });

    // --- State for Exchange Rates ---
    const [rates, setRates] = useState<{ [key: string]: number }>({});

    const handleRateChange = (currency: string, value: string) => {
        setRates(prev => ({ ...prev, [currency]: parseFloat(value) }));
    };

    const handleRateSave = (currency: string) => {
        const rate = rates[currency];
        const existingRate = ratesData?.data?.find((r: ExchangeRate) => r.currency === currency)?.rate;

        // Use state rate if changed, else existing
        const finalRate = rate !== undefined ? rate : existingRate;

        if (finalRate) {
            updateRateMutation.mutate({ currency, rate: finalRate });
        }
    };

    const displayRates = ratesData?.data || [];
    const currencies = ["THB", "USD", "VND"];

    if (isLoadingRates) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">ອັດຕາແລກປ່ຽນ</h3>
            <p className="text-sm text-slate-500 mb-6">ສະກຸນຫຼັກ: <strong>LAK</strong></p>

            <div className="grid gap-6">
                {currencies.map(currency => {
                    const existingRate = displayRates.find((r: ExchangeRate) => r.currency === currency);
                    const currentRate = rates[currency] !== undefined ? rates[currency] : (existingRate?.rate || 0);

                    return (
                        <div key={currency} className="flex items-end gap-4">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor={`rate-${currency}`}>1 {currency} = ? LAK</Label>
                                <Input
                                    id={`rate-${currency}`}
                                    type="number"
                                    value={currentRate}
                                    onChange={(e) => handleRateChange(currency, e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => handleRateSave(currency)}
                                disabled={updateRateMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {updateRateMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
