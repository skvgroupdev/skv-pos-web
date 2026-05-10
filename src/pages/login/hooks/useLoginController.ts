import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { getHomePath, getLoginErrorMessage } from "../services/loginService";

export const useLoginController = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const submitLockedRef = useRef(false);
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const loginMutation = useLogin();

    useEffect(() => {
        if (!user?.roles) return;

        const homePath = getHomePath(user.roles);
        if (homePath) {
            navigate(homePath);
        }
    }, [user, navigate]);

    const handleLogin = (e: FormEvent) => {
        e.preventDefault();

        if (submitLockedRef.current || loginMutation.isPending) {
            return;
        }

        const cleanUsername = username.trim();
        if (!cleanUsername || !password) {
            return;
        }

        submitLockedRef.current = true;
        loginMutation.mutate(
            { username: cleanUsername, password },
            {
                onSuccess: (data) => {
                    const homePath = getHomePath(data.user.roles);

                    if (!homePath) {
                        navigate("/login");
                        alert("ບໍ່ພົບສິດການນຳໃຊ້ສຳລັບຜູ້ໃຊ້ນີ້");
                        return;
                    }

                    navigate(homePath);
                },
                onSettled: () => {
                    submitLockedRef.current = false;
                },
            }
        );
    };

    const isLoading = loginMutation.isPending;
    const canSubmit = username.trim().length > 0 && password.length > 0 && !isLoading;
    const error = loginMutation.error
        ? getLoginErrorMessage(loginMutation.error)
        : "";

    return {
        canSubmit,
        error,
        handleLogin,
        isLoading,
        password,
        setPassword,
        setUsername,
        username,
    };
};
