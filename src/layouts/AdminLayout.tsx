import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
    CreditCard,
    FileClock,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    PanelLeftClose,
    PanelLeftOpen,
    Receipt,
    Scale,
    ShoppingCart,
    Store,
    Tag,
    Users,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTenant } from "@/api/tenants";
import packageJson from "../../package.json";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const sidebarLogoPath = "/logo/logo-no-bg.png";

type AdminRole = "SHOP_ADMIN" | "CASHIER" | "STOCK_KEEPER" | "SALES" | "SUPER_ADMIN";

type AdminMenuItem = {
    label: string;
    icon: typeof LayoutDashboard;
    path: string;
    roles: AdminRole[];
};

type AdminMenuGroup = {
    label: string;
    items: AdminMenuItem[];
};

const menuGroups: AdminMenuGroup[] = [
    {
        label: "Sales",
        items: [
            { label: "POS", icon: ShoppingCart, path: "/pos", roles: ["SHOP_ADMIN", "CASHIER", "SUPER_ADMIN"] },
            { label: "ໃບບິນ", icon: Receipt, path: "/admin/bills", roles: ["SHOP_ADMIN", "SUPER_ADMIN"] },
            { label: "ການຂາຍ", icon: FileClock, path: "/admin/sales", roles: ["SALES"] },
            { label: "ໃບສະເໜີລາຄາ",   icon: FileText,   path: "/admin/quotations",  roles: ["SHOP_ADMIN", "STOCK_KEEPER", "SUPER_ADMIN"] },
            { label: "ໜີ້ສິນ",           icon: CreditCard, path: "/admin/debts",       roles: ["SHOP_ADMIN", "SUPER_ADMIN"] },
        ],
    },
    {
        label: "Inventory",
        items: [
            { label: "ສິນຄ້າ", icon: Package, path: "/admin/products", roles: ["SHOP_ADMIN", "STOCK_KEEPER", "SUPER_ADMIN"] },
            { label: "ໝວດໝູ່", icon: Tag, path: "/admin/categories", roles: ["SHOP_ADMIN", "STOCK_KEEPER", "SUPER_ADMIN"] },
            { label: "ຫົວໜ່ວຍ", icon: Scale, path: "/admin/units", roles: ["SHOP_ADMIN", "STOCK_KEEPER", "SUPER_ADMIN"] },
        ],
    },
    {
        label: "Management",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, path: "/admin", roles: ["SHOP_ADMIN", "SUPER_ADMIN"] },
            { label: "ລູກຄ້າ", icon: Users, path: "/admin/customers", roles: ["SHOP_ADMIN", "SUPER_ADMIN"] },
            { label: "ພະນັກງານ", icon: Users, path: "/admin/employees", roles: ["SHOP_ADMIN", "SUPER_ADMIN"] },
            { label: "ຕັ້ງຄ່າຮ້ານ", icon: Store, path: "/admin/shop", roles: ["SHOP_ADMIN", "SUPER_ADMIN"] },
        ],
    },
];

function hasAnyRole(userRoles: string[] | undefined, allowedRoles: AdminRole[]) {
    if (!userRoles) return false;
    if (userRoles.includes("SUPER_ADMIN")) return true;
    return allowedRoles.some((role) => userRoles.includes(role));
}

function roleLabel(roles: string[] | undefined) {
    if (!roles?.length) return "ຜູ້ໃຊ້";
    if (roles.includes("SHOP_ADMIN")) return "ຜູ້ຈັດການຮ້ານ";
    if (roles.includes("STOCK_KEEPER")) return "ພະນັກງານຄັງ";
    if (roles.includes("SALES")) return "ພະນັກງານຂາຍ";
    if (roles.includes("CASHIER")) return "ແຄດຊຽນ";
    if (roles.includes("SUPER_ADMIN")) return "ຜູ້ດູແລລະບົບ";
    return roles[0];
}

function CollapsedMenuLabel({ label }: { label: string }) {
    return (
        <span className="pointer-events-none absolute left-full top-1/2 z-40 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {label}
        </span>
    );
}

export default function AdminLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const storedValue = localStorage.getItem("adminSidebarCollapsed");
        return storedValue === null ? true : storedValue === "true";
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [sidebarTooltip, setSidebarTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

    const { data: tenant } = useQuery({
        queryKey: ["tenant"],
        queryFn: getTenant,
    });

    useEffect(() => {
        localStorage.setItem("adminSidebarCollapsed", String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    const visibleGroups = useMemo(() => {
        return menuGroups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => hasAnyRole(user?.roles, item.roles)),
            }))
            .filter((group) => group.items.length > 0);
    }, [user?.roles]);

    const flatMenuItems = visibleGroups.flatMap((group) => group.items);
    const currentMenuItem = flatMenuItems.find((item) => {
        if (item.path === "/admin") return location.pathname === "/admin";
        return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    });

    const handleLogout = () => {
        setIsMobileSidebarOpen(false);
        logout();
        navigate("/login");
    };

    const handleNavigate = (path: string) => {
        setIsMobileSidebarOpen(false);
        navigate(path);
    };

    const toggleSidebarCollapsed = () => {
        setIsSidebarCollapsed((value) => {
            const nextValue = !value;
            if (!nextValue) setSidebarTooltip(null);
            return nextValue;
        });
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

    const hideSidebarTooltip = () => setSidebarTooltip(null);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100 font-lao">
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
                    <div className="shrink-0 rounded-md bg-white p-1">
                        <img src={sidebarLogoPath} alt="SKV POS Logo" className="h-8 w-8 object-contain" loading="lazy" />
                    </div>
                    <div className={cn("min-w-0 flex-1", isSidebarCollapsed && "hidden")}>
                        <h1 className="truncate text-base font-bold tracking-wide">SKV POS</h1>
                        <p className="truncate text-[10px] text-slate-400">ສູນຈັດການ</p>
                        {tenant?.subscriptionPlan && (
                            <div className="mt-1">
                                <span className={cn(
                                    "inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider lg:text-[10px]",
                                    tenant.subscriptionPlan === "ENTERPRISE"
                                        ? "border border-purple-400/30 bg-purple-500/20 text-purple-300"
                                        : tenant.subscriptionPlan === "PRO"
                                            ? "border border-blue-400/30 bg-blue-500/20 text-blue-300"
                                            : "border border-slate-400/30 bg-slate-500/20 text-slate-300"
                                )}>
                                    {tenant.subscriptionPlan}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={toggleSidebarCollapsed}
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
                    "custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-2",
                    !isSidebarCollapsed && "lg:p-3"
                )}>
                    {visibleGroups.map((group) => (
                        <div key={group.label} className="space-y-1">
                            <p className={cn(
                                "px-2 text-[10px] font-bold uppercase tracking-wide text-slate-500",
                                isSidebarCollapsed && "sr-only"
                            )}>
                                {group.label}
                            </p>
                            {group.items.map((item) => {
                                const isActive = item.path === "/admin"
                                    ? location.pathname === "/admin"
                                    : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

                                return (
                                    <button
                                        key={item.path}
                                        type="button"
                                        onClick={() => handleNavigate(item.path)}
                                        title={item.label}
                                        onMouseEnter={showSidebarTooltip(item.label)}
                                        onMouseMove={showSidebarTooltip(item.label)}
                                        onMouseLeave={hideSidebarTooltip}
                                        className={cn(
                                            "group relative flex w-full items-center rounded-lg py-2 transition-all duration-200",
                                            isSidebarCollapsed ? "justify-center px-2" : "gap-2 px-3",
                                            isActive
                                                ? "bg-indigo-600 text-white shadow-lg"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                        <span className={cn("min-w-0 flex-1 truncate text-left text-xs font-medium lg:text-sm", isSidebarCollapsed && "hidden")}>{item.label}</span>
                                        {isActive && <div className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-l-full bg-white/20" />}
                                        {isSidebarCollapsed && <CollapsedMenuLabel label={item.label} />}
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                </nav>

                <div className="border-t border-white/5 py-2 text-center">
                    <p className="text-[10px] text-slate-500 lg:text-xs">
                        {isSidebarCollapsed ? `v${packageJson.version}` : `Version ${packageJson.version}`}
                    </p>
                </div>
            </aside>

            <div
                className={cn(
                    "fixed inset-0 z-30 bg-slate-950/50 transition-opacity md:hidden",
                    isMobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-hidden="true"
            />

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-3rem))] flex-col overflow-hidden bg-[#1a1f37] text-white shadow-2xl transition-transform duration-300 md:hidden",
                    isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
                aria-label="Admin navigation"
            >
                <div className="relative flex items-center gap-2 border-b border-white/10 p-3">
                    <div className="shrink-0 rounded-md bg-white p-1">
                        <img src={sidebarLogoPath} alt="SKV POS Logo" className="h-8 w-8 object-contain" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-base font-bold tracking-wide">SKV POS</h1>
                        <p className="truncate text-[10px] text-slate-400">ສູນຈັດການ</p>
                        {tenant?.subscriptionPlan && (
                            <div className="mt-1">
                                <span className={cn(
                                    "inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                                    tenant.subscriptionPlan === "ENTERPRISE"
                                        ? "border border-purple-400/30 bg-purple-500/20 text-purple-300"
                                        : tenant.subscriptionPlan === "PRO"
                                            ? "border border-blue-400/30 bg-blue-500/20 text-blue-300"
                                            : "border border-slate-400/30 bg-slate-500/20 text-slate-300"
                                )}>
                                    {tenant.subscriptionPlan}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Close admin menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-2">
                    {visibleGroups.map((group) => (
                        <div key={group.label} className="space-y-1">
                            <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                {group.label}
                            </p>
                            {group.items.map((item) => {
                                const isActive = item.path === "/admin"
                                    ? location.pathname === "/admin"
                                    : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

                                return (
                                    <button
                                        key={item.path}
                                        type="button"
                                        onClick={() => handleNavigate(item.path)}
                                        className={cn(
                                            "group relative flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200",
                                            isActive
                                                ? "bg-indigo-600 text-white shadow-lg"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                        <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">{item.label}</span>
                                        {isActive && <div className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-l-full bg-white/20" />}
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                </nav>

                <div className="border-t border-white/5 py-2 text-center">
                    <p className="text-[10px] text-slate-500">Version {packageJson.version}</p>
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

            <main className="relative flex flex-1 flex-col overflow-hidden">
                <header className="z-10 flex h-12 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm md:px-4">
                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 md:hidden"
                            aria-label="Open admin menu"
                            aria-expanded={isMobileSidebarOpen}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="min-w-0">
                            <h2 className="truncate text-sm font-black text-slate-900 md:text-base">
                                {currentMenuItem?.label || "ສູນຈັດການ"}
                            </h2>
                            <p className="truncate text-[10px] font-medium text-slate-500 md:text-xs">
                            {tenant?.shopName || "SKV POS"} · {roleLabel(user?.roles)}
                            </p>
                        </div>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-100 md:gap-3"
                            >
                                <div className="hidden text-right md:block">
                                    <p className="text-xs font-bold text-slate-700 md:text-sm">{user?.username || "ຜູ້ດູແລ"}</p>
                                    <p className="text-[10px] text-slate-500 md:text-xs">{roleLabel(user?.roles)}</p>
                                </div>
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-sm font-black text-indigo-700 shadow-sm">
                                    {user?.username?.[0]?.toUpperCase() || "ຜ"}
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-64 p-2">
                            <div className="border-b border-slate-100 px-2 py-2">
                                <p className="text-sm font-bold text-slate-900">{user?.username || "ຜູ້ດູແລ"}</p>
                                <p className="text-xs text-slate-500">{roleLabel(user?.roles)}</p>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>ອອກຈາກລະບົບ</span>
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </header>

                <div className="flex-1 overflow-auto bg-[#f8fafc] p-2 custom-scrollbar md:p-4">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
