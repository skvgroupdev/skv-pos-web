import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, User } from "lucide-react";
import skvLogo from "@/assets/skv.jpg";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useNavigate } from "react-router-dom";
import { ENVIRONMENT } from "@/lib/constant";
import packageJson from "../../package.json";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user && user.roles) {
            const roles = user.roles;
            if (roles.includes("SUPER_ADMIN")) {
                navigate("/admin");
            } else if (roles.includes("SHOP_ADMIN")) {
                navigate("/shop");
            } else if (roles.includes("CASHIER")) {
                navigate("/pos");
            } else if (roles.includes("STOCK_KEEPER")) {
                navigate("/stock");
            } else if (roles.includes("SALES")) {
                navigate("/sales");
            }
        }
    }, [user, navigate]);

    const loginMutation = useLogin();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate(
            { username, password },
            {
                onSuccess: (data) => {
                    // Navigate based on role
                    const roles = data.user.roles;

                    if (roles.includes("SUPER_ADMIN")) {
                        navigate("/admin");
                    } else if (roles.includes("SHOP_ADMIN")) {
                        navigate("/shop");
                    } else if (roles.includes("CASHIER")) {
                        navigate("/pos");
                    } else if (roles.includes("STOCK_KEEPER")) {
                        navigate("/stock");
                    } else if (roles.includes("SALES")) {
                        navigate("/sales");
                    } else {
                        // Default fallback
                        navigate("/login");
                        alert("ບໍ່ພົບສິດການນຳໃຊ້ສຳລັບຜູ້ໃຊ້ນີ້");
                    }
                },
            }
        );
    };

    const isLoading = loginMutation.isPending;
    const error = loginMutation.error
        ? (loginMutation.error as any).response?.data?.error || "ການເຂົ້າສູ່ລະບົບຜິດພາດ"
        : "";

    return (
        <div className="flex h-screen w-full bg-gray-50">
            {/* Left Panel - Professional Gradient & Glassmorphism */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black lg:flex"
            >
                <div className="relative flex flex-col items-center justify-center p-10">
                    {/* Glass Container */}
                    <div className="rounded-2xl bg-white/10 p-12 backdrop-blur-md shadow-2xl border border-white/10">
                        <img
                            src={skvLogo}
                            alt="SKV Logo"
                            className="max-w-[300px] object-contain drop-shadow-lg"
                        />
                    </div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mt-8 text-3xl font-bold text-white tracking-wide"
                    >
                        ລະບົບ POS ມືອາຊີບ
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="mt-2 text-slate-400"
                    >
                        ຈັດການທຸລະກິດຂອງທ່ານຢ່າງງ່າຍດາຍ ແລະ ມີປະສິດທິພາບ
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="mt-2 text-slate-400"
                    >
                        {ENVIRONMENT === "development" ? "ທົດລອງ" : ""} V{packageJson.version}
                    </motion.p>
                </div>

            </motion.div>

            {/* Right Panel - Login Form */}
            <div className="flex w-full items-center justify-center lg:w-1/2 p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[450px]"
                >
                    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm">
                        <CardHeader className="text-center space-y-2 pb-8">
                            <CardTitle className="text-4xl font-extrabold tracking-tight text-slate-900">
                                ເຂົ້າສູ່ລະບົບ
                            </CardTitle>
                            <CardDescription className="text-base text-slate-500 font-medium">
                                ກະລຸນາປ້ອນຂໍ້ມູນເພື່ອເຂົ້າໃຊ້ງານ
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-6">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100 text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-slate-700 font-bold">ຊື່ຜູ້ໃຊ້</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="username"
                                            placeholder="ປ້ອນຊື່ຜູ້ໃຊ້ຂອງທ່ານ"
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-medium"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-slate-700 font-bold">ລະຫັດຜ່ານ</Label>
                                        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                            ລືມລະຫັດຜ່ານ?
                                        </a>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-medium"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            ກຳລັງເຂົ້າສູ່ລະບົບ...
                                        </>
                                    ) : (
                                        "ເຂົ້າສູ່ລະບົບ"
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="mt-8 text-center text-sm text-slate-400">
                        &copy; {new Date().getFullYear()} SKV POS System. ສະຫງວນລິຂະສິດ.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
