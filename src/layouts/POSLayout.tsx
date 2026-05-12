import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
    LayoutDashboard,
    ShoppingCart,
    LogOut,
    User,
    Users,
    Package,
    Tag,
    Scale,
    Store,
    Settings,
    Crown,
    Receipt,
    PanelLeftClose,
    PanelLeftOpen,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getExchangeRates, type ExchangeRate } from "@/api/exchangeRates";
import { getTenant } from "@/api/tenants";
import { usePOSStore } from "@/store/usePOSStore";
import { useEffect, useState, type MouseEvent } from "react";
import packageJson from "../../package.json";
import { saleModeConfig, type POSSaleMode } from "@/pages/pos/posSaleMode";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const sidebarLogoPath = "/logo/logo-no-bg.png";

const adminMenuItems = [
    { id: 1, label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { id: 2, label: "Sales History", icon: Receipt, path: "/admin/sales" },
    { id: 3, label: "Debts", icon: Receipt, path: "/admin/debts" },
    { id: 4, label: "Customers", icon: Users, path: "/admin/customers" },
    { id: 5, label: "Employees", icon: Users, path: "/admin/employees" },
    { id: 6, label: "Products", icon: Package, path: "/admin/products" },
    { id: 7, label: "Categories", icon: Tag, path: "/admin/categories" },
    { id: 8, label: "Units", icon: Scale, path: "/admin/units" },
    { id: 9, label: "Reports", icon: LayoutDashboard, path: "/admin/reports" },
    { id: 10, label: "Shop Settings", icon: Store, path: "/admin/shop" },
    { id: 11, label: "System Settings", icon: Settings, path: "/admin/system" },
];

function CollapsedMenuLabel({ label }: { label: string }) {
    return (
        <span className="pointer-events-none absolute left-full top-1/2 z-40 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {label}
        </span>
    );
}

export default function POSLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const storedValue = localStorage.getItem("posSidebarCollapsed");
        return storedValue === null ? true : storedValue === "true";
    });
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [sidebarTooltip, setSidebarTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

    const { setExchangeRates, saleMode, setSaleMode, isSaleModeSyncing } = usePOSStore();

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

    useEffect(() => {
        localStorage.setItem("posSidebarCollapsed", String(isSidebarCollapsed));
        if (!isSidebarCollapsed) {
            setSidebarTooltip(null);
        }
    }, [isSidebarCollapsed]);

    const location = useLocation();
    const exchangeRates = (latestRate?.data || []) as ExchangeRate[];

    const handleLogout = () => {
        setIsLogoutDialogOpen(false);
        logout();
        navigate("/login");
    };

    const showSidebarTooltip = (label: string) => (event: MouseEvent<HTMLElement>) => {
        if (!isSidebarCollapsed) return;

        const rect = event.currentTarget.getBoundingClientRect();
        setSidebarTooltip({
            label,
            x: rect.right + 8,
            y: rect.top + rect.height / 2,
        });
    };

    const hideSidebarTooltip = () => {
        setSidebarTooltip(null);
    };

    const saleMenuItems: { id: number; label: string; mode: POSSaleMode; icon: typeof ShoppingCart }[] = [
        { id: 0, label: "ຂາຍຍ່ອຍ", mode: "retail", icon: ShoppingCart },
        { id: 1, label: "ຂາຍສົ່ງ", mode: "wholesale", icon: ShoppingCart },
    ];

    const menuItems = [
        // { id: 2, label: "ລາຍງານ", icon: LayoutDashboard, path: "/pos/dashboard" },
        { id: 3, label: "ຈັດການໃບບິນ", icon: Receipt, path: "/pos/bills" },
        { id: 4, label: "ຈັດການໃບບິນຕິດໜີ້", icon: Receipt, path: "/pos/debt" },
        { id: 5, label: "ການຕັ້ງຄ່າ", icon: Settings, path: "/pos/setting" },
        // { label: "ໃບສະເໜີລາຄາ", icon: FileText, path: "/pos/quotes" },
    ];

    const isAdmin = user?.roles?.includes("SHOP_ADMIN");
    const hasPlanPermission = tenant?.subscriptionPlan === 'ENTERPRISE' || tenant?.subscriptionPlan === 'PRO';
    const handleAdminNavigate = (item: typeof adminMenuItems[number]) => {
        const restrictedIds = [3, 4, 5];
        const isLocked = restrictedIds.includes(item.id || -1) && !hasPlanPermission;

        if (isLocked) {
            toast.error("Upgrade Plan Required", {
                description: "ກະລຸນາອັບເກຣດແພັກເກດເພື່ອໃຊ້ງານຟັງຊັນນີ້ (PRO/ENTERPRISE)"
            });
            return;
        }

        navigate(item.path);
    };

    return (
        <>
        <div className="flex h-screen overflow-hidden bg-slate-100 font-lao">
            {/* Sidebar POS - Dark Mode - Responsive */}
            <aside
                className={cn(
                    "z-20 hidden flex-col overflow-visible bg-[#1a1f37] text-white shadow-xl transition-all duration-300 md:flex",
                    isSidebarCollapsed ? "md:w-20" : "md:w-60 lg:w-64"
                )}
            >
                <div className={cn(
                    "relative flex items-center gap-2 border-b border-white/10 p-3 lg:gap-3",
                    isSidebarCollapsed && "justify-center px-3"
                )}>
                    <div className="shrink-0 bg-white p-1 rounded-md">
                        <img src={sidebarLogoPath} alt="SKV POS Logo" className="h-8 w-8 object-contain" loading="lazy" />
                    </div>
                    <div className={cn("min-w-0 flex-1", isSidebarCollapsed && "hidden")}>
                        <h1 className="truncate text-base font-bold tracking-wide">SKV POS</h1>
                        <p className="truncate text-[10px] text-slate-400">powerby SKV Group</p>
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
                    <button
                        type="button"
                        onClick={() => setIsSidebarCollapsed((value) => !value)}
                        className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white",
                            isSidebarCollapsed && "absolute -right-4 top-3 border border-white/10 bg-[#1a1f37] shadow"
                        )}
                        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </button>
                </div>

                <nav className={cn(
                    "custom-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-2",
                    !isSidebarCollapsed && "lg:p-3"
                )}>
                    {saleMenuItems.map((item) => {
                        const itemTheme = saleModeConfig[item.mode];
                        const isActive = location.pathname === "/pos" && saleMode === item.mode;

                        return (
                            <button
                                key={item.mode}
                                onClick={() => {
                                    setSaleMode(item.mode);
                                    navigate("/pos");
                                    setIsSidebarCollapsed(true);
                                }}
                                disabled={isSaleModeSyncing}
                                title={item.label}
                                onMouseEnter={showSidebarTooltip(item.label)}
                                onMouseMove={showSidebarTooltip(item.label)}
                                onMouseLeave={hideSidebarTooltip}
                                className={cn(
                                    "group relative flex w-full items-center rounded-lg py-2 transition-all duration-200 disabled:cursor-wait disabled:opacity-70",
                                    isSidebarCollapsed ? "justify-center px-2" : "gap-2 px-3",
                                    isActive ? itemTheme.sidebarActive : itemTheme.sidebarIdle
                                )}
                            >
                                <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                <span className={cn("flex-1 text-left text-xs font-medium lg:text-sm", isSidebarCollapsed && "hidden")}>{item.label}</span>
                                {isSidebarCollapsed && <CollapsedMenuLabel label={item.label} />}
                            </button>
                        );
                    })}

                    <div className="my-2 border-t border-white/10 pt-2">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path);
                                        setIsSidebarCollapsed(true);
                                    }}
                                    title={item.label}
                                    onMouseEnter={showSidebarTooltip(item.label)}
                                    onMouseMove={showSidebarTooltip(item.label)}
                                    onMouseLeave={hideSidebarTooltip}
                                    className={cn(
                                        "group relative flex w-full items-center rounded-lg py-2 transition-all duration-200",
                                        isSidebarCollapsed ? "justify-center px-2" : "gap-2 px-3",
                                        isActive
                                            ? "bg-slate-700 text-white shadow-lg"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                    <span className={cn("flex-1 text-left text-xs font-medium lg:text-sm", isSidebarCollapsed && "hidden")}>{item.label}</span>
                                    {isSidebarCollapsed && <CollapsedMenuLabel label={item.label} />}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsLogoutDialogOpen(true)}
                        onMouseEnter={showSidebarTooltip("Logout")}
                        onMouseMove={showSidebarTooltip("Logout")}
                        onMouseLeave={hideSidebarTooltip}
                        title="ອອກຈາກລະບົບ"
                        className={cn(
                            "group relative mt-auto flex w-full items-center rounded-lg border-t border-white/10 py-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300",
                            isSidebarCollapsed ? "justify-center px-2" : "gap-2 px-3"
                        )}
                    >
                        <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span className={cn("text-xs font-medium lg:text-sm", isSidebarCollapsed && "hidden")}>ອອກຈາກລະບົບ</span>
                        {isSidebarCollapsed && <CollapsedMenuLabel label="ອອກຈາກລະບົບ" />}
                    </button>
                </nav>

                <div className="py-2 border-t border-white/5 text-center">
                    <p className="text-[10px] lg:text-xs text-slate-500">
                        {isSidebarCollapsed ? `v${packageJson.version}` : `Version ${packageJson.version}`}
                    </p>
                </div>
            </aside>

            {sidebarTooltip && (
                <div
                    className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg"
                    style={{ left: sidebarTooltip.x, top: sidebarTooltip.y }}
                >
                    {sidebarTooltip.label}
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="z-10 flex h-12 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm md:px-4">
                    <div className="flex items-center gap-2 md:gap-4 overflow-x-auto custom-scrollbar">
                        <div className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 shadow-sm",
                            saleMode === "wholesale"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-sky-200 bg-sky-50 text-sky-700"
                        )}>
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span className="text-xs font-black">{saleModeConfig[saleMode].label}</span>
                        </div>
                        {/* Exchange Rate Chips */}
                        {exchangeRates.map((rate) => (
                            <div key={rate._id} className="flex shrink-0 items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-orange-700 shadow-sm">
                                <span className="text-xs md:text-sm font-bold font-mono">1 {rate.currency} = {rate.rate.toLocaleString()} LAK</span>
                            </div>
                        ))}
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-100 md:gap-3">
                                <div className="hidden text-right md:block">
                                    <p className="text-xs font-bold text-slate-700 md:text-sm">{user?.username || "Cashier"}</p>
                                    <p className="text-[10px] text-slate-500 md:text-xs">{isAdmin ? "Shop Admin" : "ພະນັກງານຂາຍ"}</p>
                                </div>
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm",
                                    isAdmin
                                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                        : "border-slate-200 bg-slate-100 text-slate-600"
                                )}>
                                    <User className="h-4 w-4" />
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 p-2">
                            <div className="border-b border-slate-100 px-2 py-2">
                                <p className="text-sm font-bold text-slate-900">{user?.username || "Cashier"}</p>
                                <p className="text-xs text-slate-500">{isAdmin ? "Admin Menu" : "POS User"}</p>
                            </div>

                            {isAdmin && (
                                <div className="py-2">
                                    <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        Admin
                                    </p>
                                    <div className="max-h-72 space-y-1 overflow-y-auto">
                                        {adminMenuItems.map((item) => {
                                            const isActive = location.pathname === item.path;
                                            const restrictedIds = [3, 4, 5];
                                            const isLocked = restrictedIds.includes(item.id || -1) && !hasPlanPermission;

                                            return (
                                                <button
                                                    key={item.path}
                                                    onClick={() => handleAdminNavigate(item)}
                                                    className={cn(
                                                        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                                                        isActive
                                                            ? "bg-indigo-50 font-bold text-indigo-700"
                                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                                        isLocked && "opacity-70"
                                                    )}
                                                >
                                                    <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-700" : "text-slate-400")} />
                                                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                                    {isLocked && <Crown className="h-3.5 w-3.5 shrink-0 text-yellow-500" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-slate-100 pt-2">
                                <button
                                    onClick={() => setIsLogoutDialogOpen(true)}
                                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>ອອກຈາກລະບົບ</span>
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </header>

                {/* Content Area */}
                <div className="relative flex-1 overflow-hidden p-2">
                    <div className="absolute inset-0 bg-[#f8fafc]"> {/* Background for content */}
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
            <DialogContent className="max-w-md border-slate-200 bg-white p-0 font-lao shadow-2xl">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <DialogHeader className="space-y-3 text-left">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black text-slate-900">Confirm Logout</DialogTitle>
                            <DialogDescription className="mt-1 text-sm text-slate-500">
                                ຕ້ອງການອອກຈາກລະບົບ POS ຫຼືບໍ່?
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                </div>
                <DialogFooter className="gap-2 px-5 py-4 sm:space-x-0">
                    <button
                        type="button"
                        onClick={() => setIsLogoutDialogOpen(false)}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                    >
                        Logout
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
