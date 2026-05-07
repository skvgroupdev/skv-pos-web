import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
    // LayoutDashboard,
    ShoppingCart,
    // Receipt,
    LogOut,
    User,
    Settings,
    Crown,
    Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logo from "@/assets/skv.jpg";
import { useQuery } from "@tanstack/react-query";
import { getExchangeRates } from "@/api/exchangeRates";
import { getTenant } from "@/api/tenants";
import { menuItems as shopMenuItems } from "@/layouts/ShopLayout";
import { usePOSStore } from "@/store/usePOSStore";
import { useEffect } from "react";
import packageJson from "../../package.json";

export default function POSLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const { setExchangeRates } = usePOSStore();

    // Fetch Tenant Info
    const { data: tenant } = useQuery({
        queryKey: ['tenant'],
        queryFn: getTenant
    });

    // Fetch Exchange Rate
    const { data: latestRate } = useQuery({
        queryKey: ['exchangeRate'],
        queryFn: getExchangeRates,
    });

    useEffect(() => {
        if (latestRate?.data) {
            setExchangeRates(latestRate.data);
        }
    }, [latestRate, setExchangeRates]);

    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const menuItems = [
        { id: 0, label: "ຂາຍຍ່ອຍ", icon: ShoppingCart, path: "/pos" },
        // { id: 1, label: "ຂາຍສົ່ງ", icon: ShoppingCart, path: "/pos/retail" },
        // { id: 2, label: "ລາຍງານ", icon: LayoutDashboard, path: "/pos/dashboard" },
        { id: 3, label: "ຈັດການໃບບິນ", icon: Receipt, path: "/pos/bills" },
        { id: 4, label: "ຈັດການໃບບິນຕິດໜີ້", icon: Receipt, path: "/pos/debt" },
        { id: 5, label: "ການຕັ້ງຄ່າ", icon: Settings, path: "/pos/setting" },
        // { label: "ໃບສະເໜີລາຄາ", icon: FileText, path: "/pos/quotes" },
    ];

    const isAdmin = user?.roles?.includes("SHOP_ADMIN");

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-lao">
            {/* Sidebar POS - Dark Mode - Responsive */}
            <aside className="hidden md:flex md:w-60 lg:w-64 bg-[#1a1f37] text-white flex-col shadow-xl z-20">
                <div className="p-4 lg:p-6 flex items-center gap-2 lg:gap-3 border-b border-white/10">
                    <div className="">
                        <img src={logo} alt="Logo" className="h-8 w-8 lg:h-10 lg:w-10" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-base lg:text-lg tracking-wide truncate">SKV POS</h1>
                        <p className="text-[10px] lg:text-xs text-slate-400 truncate">powerby SKV Group</p>
                        {tenant?.subscriptionPlan && (
                            <div className="mt-1">
                                <span className={cn(
                                    "inline-block px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-semibold uppercase tracking-wider",
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

                <nav className="flex-1 p-3 lg:p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {/* POS Menu */}
                    {menuItems.filter(item => {
                        // Restricted items (e.g., Wholesale) might still need permissions
                        // But we want to enable item 4 (Debt Management) for cashiers as requested
                        const restrictedIds = [1];
                        const isRestricted = restrictedIds.includes(item.id || -1);
                        const hasPermission = tenant?.subscriptionPlan === 'ENTERPRISE' || tenant?.subscriptionPlan === 'PRO';
                        const isLocked = isRestricted && !hasPermission;
                        return !isLocked;
                    }).map((item) => {
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl transition-all duration-200 group relative",
                                    location.pathname === item.path
                                        ? "bg-blue-600 shadow-lg text-white"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4 lg:h-5 lg:w-5 transition-transform group-hover:scale-110", location.pathname === item.path ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                <span className="font-medium text-xs lg:text-sm flex-1 text-left">{item.label}</span>
                            </button>
                        );
                    })}


                    {/* Shop Admin Menu Divider */}
                    {isAdmin && (
                        <>
                            <div className="my-3 lg:my-4 border-t border-white/10 pt-3 lg:pt-4">
                                <p className="px-3 lg:px-4 text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Admin Menu
                                </p>
                                {shopMenuItems.filter(item => item.path !== "/pos").map((item) => {
                                    const isActive = location.pathname === item.path;
                                    const restrictedIds = [3, 4, 5]; // From ShopLayout.tsx
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
                                            className={cn(
                                                "w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg lg:rounded-xl transition-all duration-200 group relative overflow-hidden",
                                                isActive
                                                    ? "bg-indigo-600 text-white shadow-lg"
                                                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                                                isLocked && "opacity-70 cursor-not-allowed hover:bg-transparent"
                                            )}
                                        >
                                            <item.icon className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                            <span className="font-medium text-xs lg:text-sm flex-1">{item.label}</span>
                                            {isActive && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 lg:h-5 bg-white/20 rounded-l-full" />
                                            )}
                                            {isLocked && <Crown className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-500 ml-1" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span className="font-medium text-xs lg:text-sm">ອອກຈາກລະບົບ</span>
                    </button>
                </nav>

                <div className="py-2 border-t border-white/5 text-center">
                    <p className="text-[10px] lg:text-xs text-slate-500">Version {packageJson.version}</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10">
                    <div className="flex items-center gap-2 md:gap-4 overflow-x-auto custom-scrollbar">
                        {/* Exchange Rate Chips */}
                        {latestRate && latestRate?.data.map((rate: any) => (
                            <div key={rate._id} className="flex items-center gap-1.5 md:gap-2 bg-orange-50 text-orange-700 px-2 md:px-4 py-1.5 md:py-2 rounded-full border border-orange-200 shadow-sm flex-shrink-0">
                                <span className="text-xs md:text-sm font-bold font-mono">1 {rate.currency} = {rate.rate.toLocaleString()} LAK</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-xs md:text-sm font-bold text-slate-700">{user?.username || "Cashier"}</p>
                            <p className="text-[10px] md:text-xs text-slate-500">ພະນັກງານຂາຍ</p>
                        </div>
                        <div className="h-8 w-8 md:h-10 md:w-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                            <User className="h-4 w-4 md:h-5 md:w-5 text-slate-600" />
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden p-4 relative">
                    <div className="absolute inset-0 bg-[#f8fafc]"> {/* Background for content */}
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
