import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, createCustomer, type Customer } from "@/api/pos";
import { Search, User, Phone } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomerSelectionModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

export function CustomerSelectionModal({ open, onClose, onSelect }: CustomerSelectionModalProps) {
    const [search, setSearch] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // New Customer State
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newAddress, setNewAddress] = useState("");

    const queryClient = useQueryClient();
    const { data: customers, isLoading } = useQuery({
        queryKey: ['customers', search],
        queryFn: () => getCustomers(search),
        enabled: open && !isCreating
    });

    const createCustomerMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: (newCustomer) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            onSelect(newCustomer);
            onClose();
        },
        onError: (err: any) => {
            alert("Failed to create customer: " + err.response?.data?.error);
        }
    });

    const handleCreate = () => {
        if (!newName || !newPhone) return;
        createCustomerMutation.mutate({
            name: newName,
            phone: newPhone,
            address: newAddress
        });
    };

    const resetForm = () => {
        setIsCreating(false);
        setNewName("");
        setNewPhone("");
        setNewAddress("");
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md font-lao">
                <DialogHeader>
                    <DialogTitle>{isCreating ? "ເພີ່ມລູກຄ້າໃໝ່ (New Customer)" : "ເລືອກລູກຄ້າ (Select Customer)"}</DialogTitle>
                </DialogHeader>

                {isCreating ? (
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>ຊື່ລູກຄ້າ*</Label>
                            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter name" />
                        </div>
                        <div className="space-y-2">
                            <Label>ເບີໂທ*</Label>
                            <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="020 xxxx xxxx" />
                        </div>
                        <div className="space-y-2">
                            <Label>ທີ່ຢູ່</Label>
                            <Input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Village, District..." />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleCreate} disabled={createCustomerMutation.isPending}>
                                ບັນທຶກ
                            </Button>
                            <Button variant="outline" onClick={resetForm}>
                                ຍົກເລີກ
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="ຄົ້ນຫາຊື່ ຫຼື ເບີໂທ..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs text-slate-500">ລາຍການລູກຄ້າ</span>
                            <Button variant="ghost" size="sm" className="text-blue-600 h-auto p-0 hover:bg-transparent hover:underline" onClick={() => setIsCreating(true)}>
                                + ເພີ່ມລູກຄ້າໃໝ່
                            </Button>
                        </div>

                        <ScrollArea className="h-[300px] -mx-2 px-2">
                            {isLoading ? (
                                <div className="text-center py-8 text-slate-400">Loading...</div>
                            ) : customers?.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <p>ບໍ່ພົບຂໍ້ມູນ</p>
                                    <Button variant="link" onClick={() => setIsCreating(true)}>ເພີ່ມລູກຄ້າໃໝ່</Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {customers?.map((cust: any) => (
                                        <div
                                            key={cust._id}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                                            onClick={() => { onSelect(cust); onClose(); }}
                                        >
                                            <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 truncate">{cust.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {cust.phone}</span>
                                                    {cust.totalDebt > 0 && (
                                                        <span className="text-red-500 font-medium bg-red-50 px-1 rounded">
                                                            ຕິດໜີ້: {cust.totalDebt.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
