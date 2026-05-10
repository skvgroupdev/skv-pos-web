import { LoginBrandPanel } from "./components/LoginBrandPanel";
import { LoginFormCard } from "./components/LoginFormCard";
import { useLoginController } from "./hooks/useLoginController";
import {
    loginLogoPath,
    skvGroupLogoPath,
} from "./services/loginService";
import packageJson from "../../../package.json";

export default function Login() {
    const login = useLoginController();

    return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-950">
            <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
                <LoginBrandPanel
                    logoPath={loginLogoPath}
                    version={packageJson.version}
                />

                <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
                    <LoginFormCard
                        {...login}
                        logoPath={loginLogoPath}
                        skvGroupLogoPath={skvGroupLogoPath}
                    />
                </div>
            </div>
        </div>
    );
}
