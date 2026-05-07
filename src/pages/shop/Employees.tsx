import { useState } from "react";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { type User } from "@/api/users";
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

export default function ShopEmployees() {
    const { user: currentUser } = useAuthStore();
    const [page] = useState(1);
    const { data, isLoading } = useGetUsers(page, 100);
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        userid: "",
        username: "",
        password: "",
        roles: [] as string[],
        phone: "",
        address: "",
        // Removed manual code input to prefer auto-generated userid
    });

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            userid: user.userid,
            username: user.username,
            password: "",
            roles: user.roles || ["CASHIER"],
            phone: user.phone || "",
            address: user.address || "",
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("ທ່ານແນ່ໃຈບໍທີ່ຈະລຶບພະນັກງານນີ້? ການລຶບຈະເຮັດໃຫ້ພະນັກງານບໍ່ສາມາດເຂົ້າລະບົບໄດ້ອີກ. (Are you sure you want to delete this employee? This will block their login.)")) {
            deleteUserMutation.mutate(id);
        }
    };

    const handleCreate = () => {
        setEditingUser(null);
        setFormData({
            userid: "",
            username: "",
            password: "",
            roles: ["CASHIER"],
            phone: "",
            address: "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            userid: formData.userid,
            username: formData.username,
            roles: formData.roles,
            phone: formData.phone,
            address: formData.address,
            ...(formData.password ? { password: formData.password } : {}),
        };

        if (editingUser) {
            updateUserMutation.mutate({ id: editingUser._id, data: payload }, {
                onSuccess: () => setIsModalOpen(false)
            });
        } else {
            if (!formData.password) {
                alert("Password is required for new users");
                return;
            }
            createUserMutation.mutate(payload as any, {
                onSuccess: () => setIsModalOpen(false)
            });
        }
    };

    const toggleRole = (role: string) => {
        setFormData(prev => {
            const roles = prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role];
            return { ...prev, roles };
        });
    };

    return (
        <div className="p-2 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">ຈັດການພະນັກງານ</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleCreate} className="w-32 h-10 bg-blue-600 text-white hover:bg-blue-700 border-none">
                        <span className="flex justify-center items-center gap-2"> <Plus size={20} /> ເພີ່ມພະນັກງານ</span>
                    </Button>
                </div>
            </div>

            <div className="bg-slate-100 p-2 rounded-t-lg border-b border-white flex items-center gap-2">
                <div className="h-4 w-1 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-slate-600">ລາຍຊື່ພະນັກງານ</span>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#4285F4] text-white">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium">ລະຫັດພະນັກງານ</th>
                                <th className="py-3 px-4 text-left font-medium">ຊື່ເຂົ້າລະບົບ</th>
                                <th className="py-3 px-4 text-left font-medium">ໜ້າທີ່</th>
                                <th className="py-3 px-4 text-left font-medium">ເບີໂທ</th>
                                <th className="py-3 px-4 text-left font-medium">ທີ່ຢູ່</th>
                                <th className="py-3 px-4 text-center font-medium">ຈັດການ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-500">ກຳລັງໂຫຼດຂໍ້ມູນ...</td>
                                </tr>
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-500">ບໍ່ມີຂໍ້ມູນພະນັກງານ</td>
                                </tr>
                            ) : (
                                data?.data?.map((user: User) => (
                                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4 text-slate-700 font-medium">{user.userid}</td>
                                        <td className="py-3 px-4 text-slate-600">{user.username}</td>
                                        <td className="py-3 px-4">
                                            {user.roles.map((role: string) => (
                                                <span key={role} className="px-2 py-1 ms-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold uppercase">
                                                    {role}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 font-mono text-sm">{user.phone || "-"}</td>
                                        <td className="py-3 px-4 text-slate-600">{user.address || "-"}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                {user._id !== currentUser?.id && user.username !== "shopowner" && (
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
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
                        <DialogTitle>{editingUser ? "ແກ້ໄຂຂໍ້ມູນພະນັກງານ" : "ເພີ່ມພະນັກງານໃໝ່"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">ລະຫັດພະນັກງານ</Label>
                                <Input id="userid" value={formData.userid} onChange={(e) => setFormData({ ...formData, userid: e.target.value })} required placeholder="username" />
                            </div>

                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">ຊື່ເຂົ້າລະບົບ</Label>
                                <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required placeholder="username" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">ລະຫັດຜ່ານ {editingUser && "(Optional)"}</Label>
                                <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="******" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>ຕຳແໜ່ງ (Roles)</Label>
                            <div className="grid grid-cols-2 gap-2 border p-3 rounded-md">
                                {["SHOP_ADMIN", "CASHIER", "STOCK_KEEPER", "SALES"].map((role) => (
                                    <div key={role} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={role}
                                            checked={formData.roles.includes(role)}
                                            onCheckedChange={() => toggleRole(role)}
                                        />
                                        <label
                                            htmlFor={role}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {role}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">ເບີໂທ</Label>
                            <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="020 xxxx xxxx" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">ທີ່ຢູ່</Label>
                            <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="ບ້ານ, ເມືອງ, ແຂວງ" />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>ຍົກເລີກ</Button>
                            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">ບັນທຶກ</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
