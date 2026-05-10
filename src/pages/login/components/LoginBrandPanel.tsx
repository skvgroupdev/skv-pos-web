import { motion } from "framer-motion";

interface LoginBrandPanelProps {
    logoPath: string;
    version: string;
}

export function LoginBrandPanel({ logoPath, version }: LoginBrandPanelProps) {
    return (
        <section className="hidden border-r border-slate-200 bg-white lg:flex">
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="flex w-full items-center justify-center p-12"
            >
                <div className="flex max-w-lg flex-col items-center text-center">
                    <motion.div
                        animate={{ y: [0, -10, 0], scale: [1, 1.015, 1] }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="relative h-[390px] w-[390px] overflow-hidden"
                    >
                        <img
                            src={logoPath}
                            alt="SKV POS Logo"
                            className="h-full w-full object-contain drop-shadow-[0_24px_34px_rgba(8,145,178,0.18)]"
                        />
                        <motion.div
                            initial={{ y: -90 }}
                            animate={{ y: 430 }}
                            transition={{
                                duration: 2.4,
                                repeat: Infinity,
                                repeatDelay: 1.4,
                                ease: "easeInOut",
                            }}
                            className="pointer-events-none absolute left-8 right-8 top-0 h-20 bg-gradient-to-b from-transparent via-cyan-300/45 to-transparent blur-sm"
                        />
                        <motion.div
                            initial={{ y: -36 }}
                            animate={{ y: 390 }}
                            transition={{
                                duration: 2.4,
                                repeat: Infinity,
                                repeatDelay: 1.4,
                                ease: "easeInOut",
                            }}
                            className="pointer-events-none absolute left-12 right-12 top-0 h-px bg-cyan-500/70 shadow-[0_0_18px_rgba(8,145,178,0.8)]"
                        />
                    </motion.div>

                    <h1 className="mt-8 text-5xl font-bold tracking-tight text-slate-950">
                        SKV POS
                    </h1>
                    <p className="mt-4 text-2xl font-semibold leading-10 text-slate-700">
                        ລະບົບຈັດການຮ້ານມືອາຊີບ
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-400">
                        V{version}
                    </p>
                </div>
            </motion.div>
        </section>
    );
}
