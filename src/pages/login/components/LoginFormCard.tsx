import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PoweredBy } from "./PoweredBy";

interface LoginFormCardProps {
    canSubmit: boolean;
    error: string;
    handleLogin: (e: FormEvent) => void;
    isLoading: boolean;
    logoPath: string;
    password: string;
    setPassword: (password: string) => void;
    setUsername: (username: string) => void;
    skvGroupLogoPath: string;
    username: string;
}

export function LoginFormCard({
    canSubmit,
    error,
    handleLogin,
    isLoading,
    logoPath,
    password,
    setPassword,
    setUsername,
    skvGroupLogoPath,
    username,
}: LoginFormCardProps) {
    return (
        <motion.main
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-md"
        >
            <div className="mb-8 flex justify-center lg:hidden">
                <img
                    src={logoPath}
                    alt="SKV POS Logo"
                    className="h-28 w-28 rounded-lg object-cover shadow-md"
                />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
                <div className="mb-8">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                        <ShieldCheck className="h-4 w-4 text-cyan-700" />
                        Secure access
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                        ເຂົ້າສູ່ລະບົບ
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        ປ້ອນຂໍ້ມູນບັນຊີເພື່ອເຂົ້າໃຊ້ງານລະບົບ POS
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <Label
                            htmlFor="username"
                            className="font-semibold text-slate-700"
                        >
                            ຊື່ຜູ້ໃຊ້
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="username"
                                placeholder="ປ້ອນຊື່ຜູ້ໃຊ້"
                                className="h-12 rounded-md border-slate-300 bg-white pl-10 text-base font-medium focus-visible:ring-cyan-700"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                                autoComplete="username"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="password"
                            className="font-semibold text-slate-700"
                        >
                            ລະຫັດຜ່ານ
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="ປ້ອນລະຫັດຜ່ານ"
                                className="h-12 rounded-md border-slate-300 bg-white pl-10 text-base font-medium focus-visible:ring-cyan-700"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                autoComplete="current-password"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="h-12 w-full rounded-md bg-cyan-700 text-base font-bold text-white shadow-lg shadow-cyan-900/15 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={!canSubmit}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ກຳລັງກວດສອບ...
                            </>
                        ) : (
                            "ເຂົ້າສູ່ລະບົບ"
                        )}
                    </Button>
                </form>

                <PoweredBy skvGroupLogoPath={skvGroupLogoPath} />
            </div>
        </motion.main>
    );
}
