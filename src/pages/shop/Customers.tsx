import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, getCustomerStats, getOrders, createCustomer, updateCustomer, deleteCustomer } from "@/api/pos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Phone, History, ShoppingBag, DollarSign, Wallet, Eye, User as UserIcon, MapPin, Plus, Edit, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// Component for Stats Card
const StatCard = ({ label, value, icon: Icon, colorClass, subValue }: any) => (
    <div className={cn("p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between", colorClass)}>
        <div>
            <p className="text-sm font-medium opacity-70 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subValue && <p className="text-xs opacity-60">{subValue}</p>}
        </div>
        <div className={cn("p-3 rounded-full opacity-10 bg-black")}>
            <Icon size={24} />
        </div>
    </div>
);

export default function ShopCustomers() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [orderToView, setOrderToView] = useState<any>(null);

    // CRUD States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "", address: "" });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // 1. Fetch Customers
    const { data: customers } = useQuery({
        queryKey: ['customers', search],
        queryFn: () => getCustomers(search)
    });

    // 2. Fetch Customer Stats (Only when selected)
    const { data: stats } = useQuery({
        queryKey: ['customer-stats', selectedCustomer?._id],
        queryFn: () => getCustomerStats(selectedCustomer._id),
        enabled: !!selectedCustomer
    });

    // 3. Fetch Customer Orders (History)
    const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['customer-orders', selectedCustomer?._id],
        queryFn: () => getOrders({ customerId: selectedCustomer._id, limit: 100 }), // Recent 100 orders
        enabled: !!selectedCustomer
    });

    const orderList = Array.isArray(ordersData) ? ordersData : (ordersData?.data || []);

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsFormOpen(false);
            setFormData({ name: "", phone: "", address: "" });
            toast.success("ເພີ່ມລູກຄ້າສຳເລັດ");
        },
        onError: (err: any) => toast.error(err.response?.data?.error || "Failed to create customer")
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateCustomer(selectedCustomer._id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setSelectedCustomer(data); // Update local view
            setIsFormOpen(false);
            setFormData({ name: "", phone: "", address: "" });
            toast.success("ອັບເດດຂໍ້ມູນສຳເລັດ");
        },
        onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update customer")
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteCustomer(selectedCustomer._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setSelectedCustomer(null);
            setIsDeleteDialogOpen(false);
            toast.success("ລຶບລູກຄ້າສຳເລັດ");
        },
        onError: (err: any) => toast.error(err.response?.data?.error || "Failed to delete customer")
    });

    // --- Handlers ---
    const handleAddClick = () => {
        setIsEditing(false);
        setFormData({ name: "", phone: "", address: "" });
        setIsFormOpen(true);
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setFormData({
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
            address: selectedCustomer.address || ""
        });
        setIsFormOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.phone) return toast.error("Please fill Name and Phone");

        if (isEditing) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    // Calculate total items bought (optional fun stat)
    // const totalItems = orders?.reduce((acc: number, order: any) => acc + order.items.length, 0) || 0;

    return (
        <div className="h-full flex flex-col p-6 space-y-6 font-lao bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">ຈັດການລູກຄ້າ</h1>
                    <p className="text-slate-500">ເບິ່ງປະຫວັດການຊື້, ຍອດຊື້ສະສົມ ແລະ ຂໍ້ມູນໜີ້ສິນ</p>
                </div>
                <Button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> ເພີ່ມລູກຄ້າໃໝ່ 
                </Button>
            </div>

            <div className="flex gap-6 h-[calc(100vh-140px)] overflow-hidden">
                {/* LEFT: Customer List */}
                <div className="w-1/3 flex flex-col space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="ຄົ້ນຫາຊື່ ຫຼື ເບີໂທ..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {customers?.length === 0 ? (
                            <div className="text-center p-8 text-slate-400">ບໍ່ພົບລູກຄ້າ</div>
                        ) : (
                            customers?.map((customer: any) => (
                                <div
                                    key={customer._id}
                                    onClick={() => setSelectedCustomer(customer)}
                                    className={cn(
                                        "p-4 rounded-xl cursor-pointer border transition-all hover:shadow-md",
                                        selectedCustomer?._id === customer._id
                                            ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200"
                                            : "bg-white border-slate-100 hover:border-indigo-100"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                {customer.name[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{customer.name}</p>
                                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {customer.phone}
                                                </p>
                                            </div>
                                        </div>
                                        {customer.totalDebt > 0 && (
                                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                ຕິດໜີ້
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Details Panel */}
                <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {!selectedCustomer ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <div className="p-6 bg-slate-50 rounded-full">
                                <UserIcon className="h-12 w-12" />
                            </div>
                            <p>ເລືອກລູກຄ້າເພື່ອເບິ່ງລາຍລະອຽດ</p>
                        </div>
                    ) : (
                        <>
                            {/* Profile Header */}
                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
                                        {selectedCustomer.name[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{selectedCustomer.name}</h2>
                                        <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                            <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {selectedCustomer.phone}</span>
                                            {selectedCustomer.address && (
                                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedCustomer.address}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleEditClick}>
                                        <Edit className="h-4 w-4 mr-2" /> ແກ້ໄຂ
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setIsDeleteDialogOpen(true)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-6 mb-6">
                                <StatCard
                                    label="ຍອດຊື້ສະສົມ"
                                    value={stats?.totalSpend?.toLocaleString() || "0"}
                                    icon={DollarSign}
                                    colorClass="text-green-600 border-green-100 bg-green-50/50"
                                    subValue={`${stats?.totalOrders || 0} ຄັ້ງ (Orders)`}
                                />
                                <StatCard
                                    label="ໜີ້ສິນປັດຈຸບັນ"
                                    value={selectedCustomer.totalDebt.toLocaleString()}
                                    icon={Wallet}
                                    colorClass={selectedCustomer.totalDebt > 0 ? "text-red-600 border-red-100 bg-red-50/50" : "text-green-600 border-slate-100"}
                                />
                                <StatCard
                                    label="ສະຖານະ"
                                    value={selectedCustomer.totalDebt > 0 ? "ມີໜີ້ຄ້າງ" : "ປົກກະຕິ"}
                                    icon={ShoppingBag}
                                    colorClass="text-slate-600 border-slate-100"
                                />
                            </div>

                            {/* Orders List */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <History className="h-5 w-5" /> ປະຫວັດການຊື້
                                </h3>

                                <div className="flex-1 overflow-y-auto border rounded-xl">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b sticky top-0">
                                            <tr>
                                                <th className="p-3">ເລກບິນ</th>
                                                <th className="p-3">ວັນທີ</th>
                                                <th className="p-3">ສິນຄ້າ</th>
                                                <th className="p-3 text-right">ຍອດລວມ</th>
                                                <th className="p-3">ສະຖານະ</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {isLoadingOrders ? (
                                                <tr><td colSpan={6} className="p-6 text-center text-slate-400">Loading...</td></tr>
                                            ) : orderList.length === 0 ? (
                                                <tr><td colSpan={6} className="p-6 text-center text-slate-400">ບໍ່ມີປະຫວັດການສັ່ງຊື້</td></tr>
                                            ) : (
                                                orderList.map((order: any) => (
                                                    <tr key={order._id} className="hover:bg-slate-50">
                                                        <td className="p-3 font-mono font-bold text-slate-700">#{order.orderId}</td>
                                                        <td className="p-3 text-slate-500">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</td>
                                                        <td className="p-3">{order.items.length} ຢ່າງ ({order.items.reduce((s: number, i: any) => s + i.quantity, 0)} ຫນ່ວຍ)</td>
                                                        <td className="p-3 text-right font-bold font-mono">{order.total.toLocaleString()}</td>
                                                        <td className="p-3">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                                                order.paymentStatus === 'PAID' ? "bg-green-50 text-green-600 border-green-100" :
                                                                    order.paymentStatus === 'PARTIAL' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                                                        "bg-red-50 text-red-600 border-red-100"
                                                            )}>
                                                                {order.paymentStatus}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setOrderToView(order)}
                                                            >
                                                                <Eye className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* View Details Modal */}
            <Dialog open={!!orderToView} onOpenChange={(open) => !open && setOrderToView(null)}>
                <DialogContent className="max-w-lg font-lao">
                    <DialogHeader>
                        <DialogTitle>ລາຍລະອຽດບິນ #{orderToView?.orderId}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto mt-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-slate-500">
                                    <th className="text-left py-2 font-medium">ລາຍການ (Item)</th>
                                    <th className="text-center py-2 font-medium">ຈຳນວນ</th>
                                    <th className="text-right py-2 font-medium">ລາຄາ</th>
                                    <th className="text-right py-2 font-medium">ລວມ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderToView?.items.map((item: any) => (
                                    <tr key={item._id} className="border-b border-slate-50 last:border-0">
                                        <td className="py-3 font-medium text-slate-700">{item.name}</td>
                                        <td className="text-center py-3 text-slate-500">{item.quantity}</td>
                                        <td className="text-right py-3 text-slate-500">{item.price.toLocaleString()}</td>
                                        <td className="text-right py-3 font-mono">{(item.price * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td colSpan={3} className="text-right py-2 font-bold text-slate-600 pr-4">ລວມທັງໝົດ:</td>
                                    <td className="text-right py-2 font-black font-mono">{orderToView?.total.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="text-right py-2 font-bold text-slate-500 pr-4">ຈ່າຍດ້ວຍ:</td>
                                    <td className="text-right py-2">{orderToView?.paymentMethod}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button className="w-full" onClick={() => setOrderToView(null)}>ປິດ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create/Edit Form Modal */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="font-lao">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "ແກ້ໄຂຂໍ້ມູນລູກຄ້າ" : "ເພີ່ມລູກຄ້າໃໝ່"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>ຊື່ລູກຄ້າ (Name)</Label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="ຊື່..." />
                        </div>
                        <div className="space-y-2">
                            <Label>ເບີໂທ (Phone)</Label>
                            <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="020..." />
                        </div>
                        <div className="space-y-2">
                            <Label>ທີ່ຢູ່ (Address)</Label>
                            <Textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="ທີ່ຢູ່..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>ຍົກເລີກ</Button>
                        <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                            <Save className="w-4 h-4 mr-2" /> ບັນທຶກ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="font-lao">
                    <DialogHeader>
                        <DialogTitle>ຢືນຢັນການລຶບ?</DialogTitle>
                        <DialogDescription>
                            ທ່ານຕ້ອງການລຶບລູກຄ້າ <b>{selectedCustomer?.name}</b> ແທ້ບໍ? <br />
                            <span className="text-red-500 text-xs">ໝາຍເຫດ: ບໍ່ສາມາດລຶບໄດ້ຫາກມີປະຫວັດການສັ່ງຊື້</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>ຍົກເລີກ</Button>
                        <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                            ລຶບລູກຄ້າ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
