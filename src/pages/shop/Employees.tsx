import { useState } from "react";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { type User } from "@/api/users";
import { AlertCircle, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const userRoles = [
    { value: "SHOP_ADMIN", label: "Admin" },
    { value: "CASHIER", label: "ພະນັກງານແຄດ" },
    { value: "STOCK_KEEPER", label: "ສາງສິນຄ້າ" },
] as const;

const minPasswordLength = 7;

interface EmployeeFormData {
    username: string;
    password: string;
    roles: string[];
    phone: string;
    address: string;
}

type EmployeeFormErrors = Partial<Record<"username" | "password" | "roles" | "phone" | "submit", string>>;

function normalizeUsername(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeLoginPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    return /^20\d{8}$/.test(digits) ? digits : "";
}

function validateEmployeeForm(formData: EmployeeFormData, isEditing: boolean): EmployeeFormErrors {
    const errors: EmployeeFormErrors = {};

    if (!normalizeUsername(formData.username)) {
        errors.username = "ກະລຸນາໃສ່ຊື່ຜູ້ໃຊ້";
    }

    if (!normalizeLoginPhone(formData.phone)) {
        errors.phone = "ເບີໂທຕ້ອງເລີ່ມດ້ວຍ 20 ແລະ ມີ 10 ຕົວເລກ";
    }

    if (!formData.roles.length) {
        errors.roles = "ກະລຸນາເລືອກສິດຢ່າງໜ້ອຍ 1 ຢ່າງ";
    }

    if (!isEditing && !formData.password.trim()) {
        errors.password = "ກະລຸນາໃສ່ລະຫັດຜ່ານສຳລັບຜູ້ໃຊ້ໃໝ່";
    } else if (formData.password && !formData.password.trim()) {
        errors.password = "ລະຫັດຜ່ານຕ້ອງບໍ່ເປັນຍະຫວ່າງລ້ວນ";
    } else if (formData.password && formData.password.length < minPasswordLength) {
        errors.password = `ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ ${minPasswordLength} ຕົວ`;
    }

    return errors;
}

function getMutationError(error: unknown) {
    const apiError = error as { response?: { data?: { error?: string } }; message?: string };
    return apiError.response?.data?.error || apiError.message || "ບັນທຶກບໍ່ສຳເລັດ";
}

export default function ShopEmployees() {
    const { user: currentUser } = useAuthStore();
    const [page] = useState(1);
    const { data, isLoading } = useGetUsers(page, 100);
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState<EmployeeFormErrors>({});
    const [formData, setFormData] = useState<EmployeeFormData>({
        username: "",
        password: "",
        roles: [] as string[],
        phone: "",
        address: "",
    });

    const handleEdit = (user: User) => {
        const editableRoles = (user.roles || []).filter((role) => userRoles.some((item) => item.value === role));

        setEditingUser(user);
        setFormData({
            username: user.username,
            password: "",
            roles: editableRoles.length ? editableRoles : ["CASHIER"],
            phone: user.phone || "",
            address: user.address || "",
        });
        setFormErrors({});
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("ທ່ານຕ້ອງການລຶບພະນັກງານຄົນນີ້ບໍ? ບັນຊີນີ້ຈະຖືກລ໋ອກທັນທີ")) {
            deleteUserMutation.mutate(id);
        }
    };

    const handleCreate = () => {
        setEditingUser(null);
        setFormData({
            username: "",
            password: "",
            roles: ["CASHIER"],
            phone: "",
            address: "",
        });
        setFormErrors({});
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleModalOpenChange = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setFormErrors({});
            setShowPassword(false);
        }
    };

    const clearFieldError = (field: keyof EmployeeFormErrors) => {
        setFormErrors((current) => {
            if (!current[field] && !current.submit) return current;
            return { ...current, [field]: undefined, submit: undefined };
        });
    };

    const validateField = (field: keyof EmployeeFormErrors) => {
        const fieldError = validateEmployeeForm(formData, Boolean(editingUser))[field];
        setFormErrors((current) => ({ ...current, [field]: fieldError }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errors = validateEmployeeForm(formData, Boolean(editingUser));
        setFormErrors(errors);
        if (Object.keys(errors).length) {
            return;
        }

        const username = normalizeUsername(formData.username);
        const loginPhone = normalizeLoginPhone(formData.phone);
        const password = formData.password;

        const payload = {
            username,
            name: username,
            roles: formData.roles,
            phone: loginPhone,
            address: formData.address,
            ...(password ? { password } : {}),
        };

        if (editingUser) {
            updateUserMutation.mutate(
                { id: editingUser._id, data: payload },
                {
                    onSuccess: () => {
                        toast.success("ອັບເດດພະນັກງານສຳເລັດ");
                        setIsModalOpen(false);
                    },
                    onError: (error) => {
                        const message = getMutationError(error);
                        setFormErrors({ submit: message });
                        toast.error(message);
                    },
                }
            );
            return;
        }

        createUserMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(`ສ້າງພະນັກງານສຳເລັດ: ${payload.username}`);
                setIsModalOpen(false);
            },
            onError: (error) => {
                const message = getMutationError(error);
                setFormErrors({ submit: message });
                toast.error(message);
            },
        });
    };

    const toggleRole = (role: string) => {
        clearFieldError("roles");
        setFormData((prev) => {
            const roles = prev.roles.includes(role)
                ? prev.roles.filter((item) => item !== role)
                : [...prev.roles, role];

            return { ...prev, roles };
        });
    };

    const isSaving = createUserMutation.isPending || updateUserMutation.isPending;

    return (
        <div className="flex h-full flex-col p-2">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">ພະນັກງານ</h2>
                <Button onClick={handleCreate} className="h-10 bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="mr-2 h-5 w-5" />
                    ເພີ່ມພະນັກງານ
                </Button>
            </div>

            <div className="flex items-center gap-2 rounded-t-lg border-b border-white bg-slate-100 p-2">
                <div className="h-4 w-1 rounded-full bg-green-500" />
                <span className="font-semibold text-slate-600">ລາຍຊື່ພະນັກງານ</span>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#4285F4] text-white">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">ລະຫັດພະນັກງານ</th>
                                <th className="px-4 py-3 text-left font-medium">Username</th>
                                <th className="px-4 py-3 text-left font-medium">ສິດ</th>
                                <th className="px-4 py-3 text-left font-medium">ເບີ Login</th>
                                <th className="px-4 py-3 text-left font-medium">ທີ່ຢູ່</th>
                                <th className="px-4 py-3 text-center font-medium">ຈັດການ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">ກຳລັງໂຫລດ...</td>
                                </tr>
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">ບໍ່ມີຂໍ້ມູນພະນັກງານ</td>
                                </tr>
                            ) : (
                                data?.data?.map((user: User) => (
                                    <tr key={user._id} className="transition-colors hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-700">{user.userid || "-"}</td>
                                        <td className="px-4 py-3 font-mono text-sm text-slate-700">{user.username}</td>
                                        <td className="px-4 py-3">
                                            {user.roles.map((role) => (
                                                <span key={role} className="ms-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold uppercase text-blue-600">
                                                    {role}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm text-slate-600">
                                            <span>{user.phone || "-"}</span>
                                            {!user.loginPhone && (
                                                <span className="ml-2 inline-flex rounded bg-amber-50 px-2 py-0.5 font-sans text-[10px] font-semibold text-amber-700">
                                                    ຕ້ອງແກ້ເບີ Login
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{user.address || "-"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 text-slate-400 transition-colors hover:text-blue-600"
                                                    aria-label="Edit employee"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                {user._id !== currentUser?.id && user.username !== "shopowner" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(user._id)}
                                                        className="p-1.5 text-slate-400 transition-colors hover:text-red-600"
                                                        aria-label="Delete employee"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
                <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0">
                    <DialogHeader className="border-b px-5 py-4 pr-12 text-left sm:px-6">
                        <DialogTitle>{editingUser ? "ແກ້ໄຂພະນັກງານ" : "ເພີ່ມພະນັກງານ"}</DialogTitle>
                        <DialogDescription>
                            ກຳນົດຂໍ້ມູນ Login ແລະ ສິດການໃຊ້ງານຂອງພະນັກງານ
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                            {formErrors.submit && (
                                <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{formErrors.submit}</span>
                                </div>
                            )}

                            <fieldset className="space-y-4">
                                <legend className="text-sm font-semibold text-slate-900">ຂໍ້ມູນເຂົ້າລະບົບ</legend>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="min-w-0 space-y-2">
                                        <Label htmlFor="username">ຊື່ຜູ້ໃຊ້ *</Label>
                                        <Input
                                            id="username"
                                            value={formData.username}
                                            onChange={(e) => {
                                                clearFieldError("username");
                                                setFormData((current) => ({ ...current, username: e.target.value.replace(/\s+/g, "") }));
                                            }}
                                            onBlur={() => validateField("username")}
                                            placeholder="username"
                                            autoComplete="off"
                                            aria-invalid={Boolean(formErrors.username)}
                                            aria-describedby={formErrors.username ? "username-error" : "username-help"}
                                        />
                                        {formErrors.username ? (
                                            <p id="username-error" role="alert" className="text-xs font-medium text-red-600">{formErrors.username}</p>
                                        ) : (
                                            <p id="username-help" className="text-xs text-slate-500">ບໍ່ມີຍະຫວ່າງ ແລະ ບໍ່ຊ້ຳກັນພາຍໃນຮ້ານ</p>
                                        )}
                                    </div>

                                    <div className="min-w-0 space-y-2">
                                        <Label htmlFor="phone">ເບີໂທ Login *</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            inputMode="numeric"
                                            value={formData.phone}
                                            onChange={(e) => {
                                                clearFieldError("phone");
                                                const phone = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                setFormData((current) => ({ ...current, phone }));
                                            }}
                                            onBlur={() => validateField("phone")}
                                            placeholder="20xxxxxxxx"
                                            autoComplete="tel"
                                            maxLength={10}
                                            aria-invalid={Boolean(formErrors.phone)}
                                            aria-describedby={formErrors.phone ? "phone-error" : "phone-help"}
                                        />
                                        {formErrors.phone ? (
                                            <p id="phone-error" role="alert" className="text-xs font-medium text-red-600">{formErrors.phone}</p>
                                        ) : (
                                            <p id="phone-help" className="text-xs text-slate-500">ໃຊ້ 20 ຕາມດ້ວຍເລກ 8 ຕົວ ເຊັ່ນ 2055512345</p>
                                        )}
                                    </div>

                                    <div className="min-w-0 space-y-2 sm:col-span-2">
                                        <Label htmlFor="password">
                                            ລະຫັດຜ່ານ {!editingUser && "*"}
                                            {editingUser && <span className="font-normal text-slate-500"> (ວ່າງໄວ້ຖ້າບໍ່ປ່ຽນ)</span>}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={(e) => {
                                                    clearFieldError("password");
                                                    setFormData((current) => ({ ...current, password: e.target.value }));
                                                }}
                                                onBlur={() => validateField("password")}
                                                placeholder="ຢ່າງໜ້ອຍ 7 ຕົວ"
                                                autoComplete="new-password"
                                                className="pr-11"
                                                aria-invalid={Boolean(formErrors.password)}
                                                aria-describedby={formErrors.password ? "password-error" : "password-help"}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full w-10 text-slate-500 hover:bg-transparent"
                                                onClick={() => setShowPassword((visible) => !visible)}
                                                aria-label={showPassword ? "ເຊື່ອງລະຫັດຜ່ານ" : "ສະແດງລະຫັດຜ່ານ"}
                                            >
                                                {showPassword ? <EyeOff /> : <Eye />}
                                            </Button>
                                        </div>
                                        {formErrors.password ? (
                                            <p id="password-error" role="alert" className="text-xs font-medium text-red-600">{formErrors.password}</p>
                                        ) : (
                                            <p id="password-help" className="text-xs text-slate-500">ຕ້ອງມີຢ່າງໜ້ອຍ 7 ຕົວອັກສອນ</p>
                                        )}
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset className="space-y-2">
                                <legend className="text-sm font-semibold text-slate-900">ສິດການໃຊ້ງານ *</legend>
                                <div
                                    className={`grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-3 ${formErrors.roles ? "border-red-400" : "border-slate-200"}`}
                                    aria-describedby={formErrors.roles ? "roles-error" : undefined}
                                >
                                    {userRoles.map((role) => (
                                        <div key={role.value} className="flex min-h-9 items-center gap-2">
                                            <Checkbox
                                                id={role.value}
                                                checked={formData.roles.includes(role.value)}
                                                onCheckedChange={() => toggleRole(role.value)}
                                            />
                                            <Label htmlFor={role.value} className="cursor-pointer font-normal">
                                                {role.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {formErrors.roles && (
                                    <p id="roles-error" role="alert" className="text-xs font-medium text-red-600">{formErrors.roles}</p>
                                )}
                            </fieldset>

                            <div className="space-y-2">
                                <Label htmlFor="address">ທີ່ຢູ່ <span className="font-normal text-slate-500">(ບໍ່ບັງຄັບ)</span></Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData((current) => ({ ...current, address: e.target.value }))}
                                    placeholder="ບ້ານ, ເມືອງ, ແຂວງ"
                                    autoComplete="street-address"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t bg-slate-50 px-5 py-4 sm:px-6">
                            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => handleModalOpenChange(false)} disabled={isSaving}>
                                ຍົກເລີກ
                            </Button>
                            <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto" disabled={isSaving}>
                                {isSaving && <Loader2 className="animate-spin" />}
                                {isSaving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
