import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "sonner";
import Login from './pages/Login';
import { RoleRoute } from './components/auth/RoleRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import ShopLayout from './layouts/ShopLayout';
import POSLayout from './layouts/POSLayout';
import StockLayout from './layouts/StockLayout';
import SalesLayout from './layouts/SalesLayout';

// Pages
// Pages
import AdminDashboard from './pages/admin/Dashboard';
import StockDashboard from "./pages/stock/Dashboard";
import SalesDashboard from "./pages/sales/Dashboard";
import POS from "./pages/pos/POS";
import DebtManager from "./pages/pos/DebtManagerNew";
import BillManager from "./pages/pos/BillManager";
import POSDashboard from "./pages/pos/POSDashboard";
import POSSetting from "./pages/pos/Setting";
// Lazy load Shop pages
const ShopDashboard = lazy(() => import("./pages/shop/Dashboard"));
const ShopProducts = lazy(() => import("./pages/shop/Products"));
const ShopSales = lazy(() => import("./pages/shop/Sales"));
const ShopReports = lazy(() => import("./pages/shop/Reports"));
const ShopEmployees = lazy(() => import("./pages/shop/Employees"));
const ShopSettings = lazy(() => import("./pages/shop/Settings"));
const ShopDebts = lazy(() => import("./pages/shop/DebtsNew"));
const ShopCustomers = lazy(() => import("./pages/shop/Customers"));
const ShopCategories = lazy(() => import("./pages/shop/Categories"));
const ShopUnits = lazy(() => import("./pages/shop/Units"));

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Toaster position="top-right" richColors />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* SUPER_ADMIN Routes */}
                    <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'SHOP_ADMIN']} />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                        </Route>
                    </Route>

                    {/* SHOP_ADMIN Routes */}
                    <Route element={<RoleRoute allowedRoles={['SHOP_ADMIN']} />}>
                        <Route path="/shop" element={<ShopLayout />}>
                            <Route index element={<ShopDashboard />} />
                            <Route path="products" element={<ShopProducts />} />
                            <Route path="sales" element={<ShopSales />} />
                            <Route path="debts" element={<ShopDebts />} />
                            <Route path="customers" element={<ShopCustomers />} />
                            <Route path="categories" element={<ShopCategories />} />
                            <Route path="units" element={<ShopUnits />} />
                            <Route path="reports" element={<ShopReports />} />
                            <Route path="employees" element={<ShopEmployees />} />
                            <Route path="settings" element={<ShopSettings />} />
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

                    {/* STOCK_KEEPER Routes */}
                    <Route element={<RoleRoute allowedRoles={['STOCK_KEEPER']} />}>
                        <Route path="/stock" element={<StockLayout />}>
                            <Route index element={<StockDashboard />} />
                        </Route>
                    </Route>

                    {/* SALES Routes */}
                    <Route element={<RoleRoute allowedRoles={['SALES']} />}>
                        <Route path="/sales" element={<SalesLayout />}>
                            <Route index element={<SalesDashboard />} />
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
