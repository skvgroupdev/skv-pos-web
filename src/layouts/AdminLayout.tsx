import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
    LayoutDashboard,
    Users,
    FileClock,
    Package,
    Settings,
    Store,
    LogOut
} from "lucide-react";

export default function AdminLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const menuItems = [
        { label: "ພາບລວມ", icon: LayoutDashboard, path: "/admin" },
        { label: "ຈັດການພະນັກງານ", icon: Users, path: "/admin/employees" },
        { label: "ປະຫວັດການຂາຍ", icon: FileClock, path: "/admin/sales" },
        { label: "ຈັດການສິນຄ້າ", icon: Package, path: "/admin/products" },
        { label: "ຈັດການໃບບິນ", icon: FileClock, path: "/admin/bills" }, // Reusing FileClock or similar
        { label: "ຈັດການລະບົບ", icon: Settings, path: "/admin/system" },
        { label: "ຈັດການຮ້ານ", icon: Store, path: "/admin/shop" },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar - Dark Professional Theme */}
            <aside className="w-72 bg-[#0f172a] text-white flex flex-col shadow-2xl transition-all duration-300">
                {/* Brand Header */}
                <div className="p-6 flex items-center gap-4 border-b border-white/10 bg-[#020617]">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                        SKV
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-wide leading-tight">SKV POS</h1>
                        <p className="text-xs text-blue-400 font-medium tracking-wider uppercase">Super Admin</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">ເມນູຫຼັກ</p>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? "bg-blue-600 text-white shadow-lg translate-x-1"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
                                    }`}
                            >
                                <item.icon size={22} className={`transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                                <span className="font-medium text-[15px]">{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-white/10 bg-[#020617]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3.5 rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-red-900/20 group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>ອອກຈາກລະບົບ</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                {/* Top Header */}
                <header className="h-20 bg-white border-b flex items-center justify-between px-8 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {menuItems.find(i => i.path === location.pathname)?.label || "ພາບລວມ (Overview)"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* User Profile */}
                        <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-800">{user?.username || "Admin Account"}</p>
                                <div className="flex items-center justify-end gap-1">
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <p className="text-xs text-slate-500 font-medium">Online</p>
                                </div>
                            </div>
                            <div className="h-11 w-11 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-white shadow-md rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                                {user?.username?.[0]?.toUpperCase() || "A"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
