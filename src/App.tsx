import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "sonner";
import Login from './pages/login/Login';
import { RoleRoute } from './components/auth/RoleRoute';
import { useAuthStore } from "@/store/useAuthStore";

// Layouts
import AdminLayout from './layouts/AdminLayout';
import POSLayout from './layouts/POSLayout';

// Pages
// Pages
import POS from "./pages/pos/POS";
import DebtManager from "./pages/pos/DebtManagerNew";
import BillManager from "./pages/pos/BillManager";
import POSDashboard from "./pages/pos/POSDashboard";
import POSSetting from "./pages/pos/Setting";
// Lazy load Shop pages
const ShopDashboard = lazy(() => import("./pages/shop/Dashboard"));
const ShopProducts = lazy(() => import("./pages/shop/products-management"));
const ShopSales = lazy(() => import("./pages/shop/Sales"));
const ShopReports = lazy(() => import("./pages/shop/Reports"));
const ShopEmployees = lazy(() => import("./pages/shop/Employees"));
const ShopSettings = lazy(() => import("./pages/shop/Settings"));
const ShopDebts = lazy(() => import("./pages/shop/DebtsNew"));
const ShopCustomers = lazy(() => import("./pages/shop/Customers"));
const ShopCategories = lazy(() => import("./pages/shop/Categories"));
const ShopUnits = lazy(() => import("./pages/shop/Units"));
const ShopQuotations = lazy(() => import("./pages/shop/Quotations"));
const AdminBills = lazy(() => import("./pages/shop/AdminBills"));

const queryClient = new QueryClient();

function hasRouteRole(roles: string[] | undefined, allowedRoles: string[]) {
    if (!roles) return false;
    if (roles.includes("SUPER_ADMIN")) return true;
    return roles.some((role) => allowedRoles.includes(role));
}

function RoleElement({ allowedRoles, children }: { allowedRoles: string[]; children: ReactElement }) {
    const { user } = useAuthStore();

    if (!hasRouteRole(user?.roles, allowedRoles)) {
        if (hasRouteRole(user?.roles, ["STOCK_KEEPER"])) return <Navigate to="/admin/products" replace />;
        if (hasRouteRole(user?.roles, ["SALES"])) return <Navigate to="/admin/sales" replace />;
        return <Navigate to="/pos" replace />;
    }

    return children;
}

function AdminIndex() {
    const { user } = useAuthStore();

    if (hasRouteRole(user?.roles, ["SHOP_ADMIN", "SUPER_ADMIN"])) {
        return <ShopDashboard />;
    }

    if (hasRouteRole(user?.roles, ["SALES"])) {
        return <Navigate to="/admin/sales" replace />;
    }

    return <Navigate to="/admin/products" replace />;
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Toaster position="top-right" richColors />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* ADMIN / INVENTORY Routes */}
                    <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'SHOP_ADMIN', 'STOCK_KEEPER', 'SALES']} />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminIndex />} />
                            <Route path="products" element={<RoleElement allowedRoles={['SHOP_ADMIN', 'STOCK_KEEPER']}><ShopProducts /></RoleElement>} />
                            <Route path="categories" element={<RoleElement allowedRoles={['SHOP_ADMIN', 'STOCK_KEEPER']}><ShopCategories /></RoleElement>} />
                            <Route path="units" element={<RoleElement allowedRoles={['SHOP_ADMIN', 'STOCK_KEEPER']}><ShopUnits /></RoleElement>} />
                            <Route path="bills" element={<RoleElement allowedRoles={['SHOP_ADMIN']}><AdminBills /></RoleElement>} />
                            <Route path="quotations" element={<RoleElement allowedRoles={['SHOP_ADMIN', 'STOCK_KEEPER']}><ShopQuotations /></RoleElement>} />
                            <Route path="sales" element={<RoleElement allowedRoles={['SHOP_ADMIN', 'SALES']}><ShopSales /></RoleElement>} />
                            <Route path="debts" element={<RoleElement allowedRoles={['SHOP_ADMIN']}><ShopDebts /></RoleElement>} />
                            <Route path="customers" element={<RoleElement allowedRoles={['SHOP_ADMIN']}><ShopCustomers /></RoleElement>} />
                            <Route path="reports" element={<RoleElement allowedRoles={['SHOP_ADMIN']}><ShopReports /></RoleElement>} />
                            <Route path="employees" element={<RoleElement allowedRoles={['SHOP_ADMIN']}><ShopEmployees /></RoleElement>} />
                            <Route path="shop" element={<RoleElement allowedRoles={['SHOP_ADMIN']}><ShopSettings /></RoleElement>} />
                            <Route path="system" element={<RoleElement allowedRoles={['SHOP_ADMIN']}><ShopSettings /></RoleElement>} />
                        </Route>
                    </Route>

                    {/* CASHIER Routes */}
                    <Route element={<RoleRoute allowedRoles={['CASHIER', 'SHOP_ADMIN']} />}>
                        <Route path="/pos" element={<POSLayout />}>
                            <Route index element={<POS />} />
                            <Route path="dashboard" element={<POSDashboard />} />
                            <Route path="debt" element={<DebtManager />} />
                            <Route path="bills" element={<BillManager />} />
                            <Route path="setting" element={<POSSetting />} />
                            {/* Add other sub-routes as needed */}
                        </Route>
                    </Route>

                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
