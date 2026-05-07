import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    History,
    Users,
    Receipt,
    Tag,
    Scale,
    Store,
    Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getTenant } from "@/api/tenants";
import { cn } from "@/lib/utils";
import packageJson from "../../package.json";



export const menuItems = [
    { id: 1, label: "ພາບລວມ", icon: LayoutDashboard, path: "/shop" },
    { id: 2, label: "ຈັດການໃບບິນ", icon: History, path: "/shop/sales" },
    { id: 3, label: "ຈັດການລູກໜີ້", icon: Receipt, path: "/shop/debts" },
    { id: 4, label: "ລູກຄ້າ", icon: Users, path: "/shop/customers" },
    { id: 5, label: "ຈັດການພະນັກງານ", icon: Users, path: "/shop/employees" },
    { id: 6, label: "ຈັດການສິນຄ້າ", icon: Package, path: "/shop/products" },
    { id: 7, label: "ໝວດໝູ່", icon: Tag, path: "/shop/categories" },
    { id: 8, label: "ຫົວໜ່ວຍ", icon: Scale, path: "/shop/units" },
    { id: 9, label: "ຂາຍຍ່ອຍ", icon: Store, path: "/pos" },
    { id: 10, label: "ຕັ້ງຄ່າ", icon: Settings, path: "/shop/settings" },
];

export default function ShopLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch tenant info
    const { data: tenant } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar - Dark Professional Theme - Responsive */}
            <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0f172a] text-white flex-col shadow-2xl transition-all duration-300">
                {/* Brand Header */}
                <div className="p-4 lg:p-6 flex flex-col gap-2 border-b border-white/10 bg-[#020617]">
                    <div>
                        <h1 className="font-bold text-base lg:text-lg tracking-wide leading-tight">SKV POS SYSTEM</h1>
                        {tenant?.subscriptionPlan && (
                            <div className="mt-1.5">
                                <span className={cn(
                                    "inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                                    tenant.subscriptionPlan === 'ENTERPRISE' ? "bg-purple-500/20 text-purple-300 border border-purple-400/30" :
                                        tenant.subscriptionPlan === 'PRO' ? "bg-blue-500/20 text-blue-300 border border-blue-400/30" :
                                            "bg-slate-500/20 text-slate-300 border border-slate-400/30"
                                )}>
                                    {tenant.subscriptionPlan}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 lg:p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const restrictedIds = [3, 4, 5];
                        const isRestricted = restrictedIds.includes(item.id || -1);
                        const hasPermission = tenant?.subscriptionPlan === 'ENTERPRISE' || tenant?.subscriptionPlan === 'PRO';
                        const isLocked = isRestricted && !hasPermission;

                        return (
                            <Link
                                key={item.path}
                                to={isLocked ? "#" : item.path}
                                onClick={(e) => {
                                    if (isLocked) {
                                        e.preventDefault();
                                        toast.error("Upgrade Plan Required", {
                                            description: "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນນີ້ (PRO/ENTERPRISE)"
                                        });
                                    }
                                }}
                                className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? "bg-indigo-600 text-white shadow-lg"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    } ${isLocked ? "opacity-70 cursor-not-allowed hover:bg-transparent" : ""}`}
                            >
                                <item.icon size={20} className={`lg:w-[22px] lg:h-[22px] transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                                <span className="font-medium text-sm lg:text-[15px] flex-1">{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 lg:h-8 bg-white/20 rounded-l-full" />
                                )}
                                {isLocked && <Crown className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-500" />}
                            </Link>
                        )
                    })}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 lg:gap-3 w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                    >
                        <LogOut size={18} className="lg:w-5 lg:h-5" />
                        <span className="font-medium text-sm lg:text-base">ອອກຈາກລະບົບ</span>
                    </button>
                </nav>

                {/* Footer / Logout */}
                <div className="py-2 border-t border-white/5 text-center">
                    <p className="text-[10px] lg:text-xs text-slate-500">Version {packageJson.version}</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                {/* Top Header */}
                <header className="h-16 md:h-20 bg-white border-b flex items-center justify-between px-4 md:px-6 lg:px-8 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
                            {menuItems.find(i => i.path === location.pathname)?.label || "ພາບລວມ (Overview)"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        {/* User Profile */}
                        <div className="flex items-center gap-2 md:gap-4 md:pl-6 md:border-l border-slate-100">
                            <div className="text-right hidden lg:block">
                                <p className="text-sm font-bold text-slate-800">{user?.username || "Shop Manager"}</p>
                                <p className="text-xs text-slate-500 font-medium">Shop Admin</p>
                            </div>
                            <div className="h-9 w-9 md:h-10 md:w-10 lg:h-11 lg:w-11 bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-white shadow-md rounded-full flex items-center justify-center text-indigo-700 font-bold text-base md:text-lg">
                                {user?.username?.[0]?.toUpperCase() || "S"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 xl:p-10 custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
