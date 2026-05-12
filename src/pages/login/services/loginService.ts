export const loginLogoPath = "/logo/logo-no-bg.png";
export const skvGroupLogoPath = "/logo/skv-logo.png";

export const getHomePath = (roles: string[]) => {
    if (roles.includes("SUPER_ADMIN")) return "/admin";
    if (roles.includes("SHOP_ADMIN")) return "/admin";
    if (roles.includes("STOCK_KEEPER")) return "/admin/products";
    if (roles.includes("SALES")) return "/admin/sales";
    if (roles.includes("CASHIER")) return "/pos";

    return "";
};

export const getLoginErrorMessage = (error: unknown) => {
    const loginError = error as { response?: { data?: { error?: string } } };

    return loginError.response?.data?.error || "ການເຂົ້າສູ່ລະບົບຜິດພາດ";
};
