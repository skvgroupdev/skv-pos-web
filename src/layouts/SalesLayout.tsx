import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";

export default function SalesLayout() {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-green-50">
            <header className="bg-green-600 text-white p-4 flex justify-between">
                <h1 className="font-bold">ການຂາຍ (Sales Portal)</h1>
                <Button onClick={() => { logout(); navigate('/login'); }} variant="ghost" className="text-white hover:bg-green-700">ອອກຈາກລະບົບ</Button>
            </header>
            <div className="p-6">
                <Outlet />
            </div>
        </div>
    );
}
