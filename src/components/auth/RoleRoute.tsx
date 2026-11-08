import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

interface RoleRouteProps {
    allowedRoles: string[];
    requiredScope?: "TENANT" | "PLATFORM";
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, requiredScope = "TENANT" }) => {
    const { user, token } = useAuthStore();

    // 1. Check if authenticated
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if ((user.scope || "TENANT") !== requiredScope) {
        return <Navigate to={requiredScope === "PLATFORM" ? "/login" : "/superadmin"} replace />;
    }

    const hasPermission = user.roles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-gray-600">You do not have permission to view this page.</p>
                <button onClick={() => window.history.back()} className="mt-4 text-blue-500 underline">
                    Go Back
                </button>
            </div>
        );
    }

    return <Outlet />;
};
