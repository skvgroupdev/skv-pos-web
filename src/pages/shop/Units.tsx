import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Scale } from "lucide-react";
import { useGetUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";

export default function Units() {
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<any>(null);
    const [name, setName] = useState("");

    // Hooks
    const { data, isLoading } = useGetUnits();
    const createMutation = useCreateUnit();
    const updateMutation = useUpdateUnit();
    const deleteMutation = useDeleteUnit();

    const units = data?.data || [];
    const filteredUnits = units.filter((u: any) =>
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (editingUnit) {
            updateMutation.mutate({ id: editingUnit._id, name }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setName("");
                    setEditingUnit(null);
                }
            });
        } else {
            createMutation.mutate(name, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setName("");
                }
            });
        }
    };

    const handleEdit = (unit: any) => {
        setEditingUnit(unit);
        setName(unit.name);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this unit?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleAddNew = () => {
        setEditingUnit(null);
        setName("");
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-pink-100 rounded-xl">
                        <Scale className="w-8 h-8 text-pink-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">ຈັດການຫົວໜ່ວຍ</h1>
     
                    </div>
                </div>
                <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> ເພີ່ມຫົວໜ່ວຍ
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search units..."
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-[100px]">#</TableHead>
                            <TableHead>ຊື່ຫົວໜ່ວຍ</TableHead>
                            <TableHead className="w-[150px] text-right">ຈັດການ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">Loading...</TableCell>
                            </TableRow>
                        ) : filteredUnits.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-slate-500">No units found</TableCell>
                            </TableRow>
                        ) : (
                            filteredUnits.map((unit: any, index: number) => (
                                <TableRow key={unit._id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell><span className="font-semibold text-slate-700">{unit.name}</span></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(unit)}>
                                                <Pencil className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(unit._id)}>
                                                <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUnit ? "ແກ້ໄຂຫົວໜ່ວຍ" : "ເພີ່ມຫົວໜ່ວຍໃໝ່"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit-name">ຊື່ຫົວໜ່ວຍ</Label>
                            <Input
                                id="unit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ໃສ່ຊື່ຫົວໜ່ວຍ..."
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>ຍົກເລີກ</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">ບັນທຶກ</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
