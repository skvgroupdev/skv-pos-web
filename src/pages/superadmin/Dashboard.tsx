import { useQuery } from "@tanstack/react-query";
import { getPlatformDashboard } from "@/api/platform";

const stats = [
    { key: "totalTenants", label: "ຮ້ານທັງໝົດ" },
    { key: "activeTenants", label: "ຮ້ານທີ່ໃຊ້ງານ" },
    { key: "groceryTenants", label: "GROCERY" },
    { key: "restaurantTenants", label: "RESTAURANT" },
] as const;

export default function SuperAdminDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ["platform-dashboard"],
        queryFn: getPlatformDashboard,
    });

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-lao text-slate-900 md:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div>
                    <p className="text-sm font-semibold text-indigo-600">SKV POS Platform</p>
                    <h1 className="text-2xl font-black md:text-3xl">ສູນຈັດການ Super Admin</h1>
                    <p className="mt-1 text-sm text-slate-500">ຈັດການຮ້ານ GROCERY ແລະ RESTAURANT</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item) => (
                        <div key={item.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase text-slate-500">{item.label}</p>
                            <p className="mt-2 text-3xl font-black">{isLoading ? "-" : data?.[item.key] ?? 0}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
