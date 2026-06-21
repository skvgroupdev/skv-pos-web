import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { type User } from "@/api/users";
import { getTenant } from "@/api/tenants";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Dialog,
    DialogContent,
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

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6}$/;

function normalizeUsernamePart(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9._-]/g, "");
}

export default function ShopEmployees() {
    const { user: currentUser } = useAuthStore();
    const [page] = useState(1);
    const { data, isLoading } = useGetUsers(page, 100);
    const { data: tenant } = useQuery({
        queryKey: ["tenant"],
        queryFn: getTenant,
    });
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        usernameSuffix: "",
        password: "",
        roles: [] as string[],
        phone: "",
        address: "",
    });

    const tenantUsernamePrefix = `${normalizeUsernamePart(tenant?.shopName || tenant?.name || "shop") || "shop"}_`;

    const getUsernameSuffix = (username: string) => {
        return username.startsWith(tenantUsernamePrefix)
            ? username.slice(tenantUsernamePrefix.length)
            : username;
    };

    const handleEdit = (user: User) => {
        const editableRoles = (user.roles || []).filter((role) => userRoles.some((item) => item.value === role));

        setEditingUser(user);
        setFormData({
            usernameSuffix: getUsernameSuffix(user.username),
            password: "",
            roles: editableRoles.length ? editableRoles : ["CASHIER"],
            phone: user.phone || "",
            address: user.address || "",
        });
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
            usernameSuffix: "",
            password: "",
            roles: ["CASHIER"],
            phone: "",
            address: "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const usernameSuffix = normalizeUsernamePart(formData.usernameSuffix);
        const password = formData.password.trim();

        if (!usernameSuffix) {
            alert("ກະລຸນາໃສ່ຊື່ຜູ້ໃຊ້");
            return;
        }

        if (!formData.roles.length) {
            alert("ກະລຸນາເລືອກສິດຢ່າງໜ້ອຍ 1 ຢ່າງ");
            return;
        }

        if (password && !passwordPattern.test(password)) {
            alert("ລະຫັດຜ່ານຕ້ອງມີ 6 ຕົວ ແລະ ປະກອບດ້ວຍຕົວໜັງສື + ຕົວເລກ");
            return;
        }

        if (!editingUser && !password) {
            alert("ກະລຸນາໃສ່ລະຫັດຜ່ານສຳລັບຜູ້ໃຊ້ໃໝ່");
            return;
        }

        const payload = {
            username: `${tenantUsernamePrefix}${usernameSuffix}`,
            name: usernameSuffix,
            roles: formData.roles,
            phone: formData.phone,
            address: formData.address,
            ...(password ? { password } : {}),
        };

        if (editingUser) {
            updateUserMutation.mutate(
                { id: editingUser._id, data: payload },
                { onSuccess: () => setIsModalOpen(false) }
            );
            return;
        }

        createUserMutation.mutate(payload, {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    const toggleRole = (role: string) => {
        setFormData((prev) => {
            const roles = prev.roles.includes(role)
                ? prev.roles.filter((item) => item !== role)
                : [...prev.roles, role];

            return { ...prev, roles };
        });
    };

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
                                <th className="px-4 py-3 text-left font-medium">ລະຫັດ</th>
                                <th className="px-4 py-3 text-left font-medium">ຊື່ຜູ້ໃຊ້</th>
                                <th className="px-4 py-3 text-left font-medium">ສິດ</th>
                                <th className="px-4 py-3 text-left font-medium">ເບີໂທ</th>
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
                                        <td className="px-4 py-3 text-slate-600">{user.username}</td>
                                        <td className="px-4 py-3">
                                            {user.roles.map((role) => (
                                                <span key={role} className="ms-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold uppercase text-blue-600">
                                                    {role}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm text-slate-600">{user.phone || "-"}</td>
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "ແກ້ໄຂພະນັກງານ" : "ເພີ່ມພະນັກງານ"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="username">ຊື່ຜູ້ໃຊ້</Label>
                                <div className="flex overflow-hidden rounded-md border border-input bg-white">
                                    <span className="flex items-center border-r bg-slate-50 px-3 text-sm font-medium text-slate-500">
                                        {tenantUsernamePrefix}
                                    </span>
                                    <Input
                                        id="username"
                                        value={formData.usernameSuffix}
                                        onChange={(e) => setFormData({ ...formData, usernameSuffix: e.target.value.replace(/\s+/g, "") })}
                                        required
                                        placeholder="name"
                                        className="border-0 focus-visible:ring-0"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">ລະຫັດຜ່ານ {editingUser && "(ຖ້າຕ້ອງການປ່ຽນ)"}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    minLength={6}
                                    maxLength={6}
                                    pattern="(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6}"
                                    placeholder="a1b2c3"
                                />
                                <p className="text-xs text-slate-500">ຕ້ອງມີ 6 ຕົວ ປະກອບດ້ວຍຕົວໜັງສື + ຕົວເລກ ເຊັ່ນ: a1b2c3</p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>ສິດການໃຊ້ງານ</Label>
                            <div className="grid grid-cols-2 gap-2 rounded-md border p-3 md:grid-cols-3">
                                {userRoles.map((role) => (
                                    <div key={role.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={role.value}
                                            checked={formData.roles.includes(role.value)}
                                            onCheckedChange={() => toggleRole(role.value)}
                                        />
                                        <label
                                            htmlFor={role.value}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {role.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">ເບີໂທ</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="020 xxxx xxxx"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">ທີ່ຢູ່</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="ບ້ານ, ເມືອງ, ແຂວງ"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                ຍົກເລີກ
                            </Button>
                            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                                ບັນທຶກ
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
