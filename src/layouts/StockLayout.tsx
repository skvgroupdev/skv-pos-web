import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";

export default function StockLayout() {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-orange-50">
            <header className="bg-orange-600 text-white p-4 flex justify-between">
                <h1 className="font-bold">ຈັດການສາງສິນຄ້າ (Inventory)</h1>
                <Button onClick={() => { logout(); navigate('/login'); }} variant="ghost" className="text-white hover:bg-orange-700">ອອກຈາກລະບົບ</Button>
            </header>
            <div className="p-6">
                <Outlet />
            </div>
        </div>
    );
}
