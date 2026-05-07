import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";
import { useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useProducts";
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

export default function Categories() {
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [name, setName] = useState("");

    // Hooks
    const { data, isLoading } = useGetCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    // Filtered data (client-side for now as hook might not support full server-side params yet or returns all)
    // Actually useGetCategories in useProducts.ts likely doesn't support params nicely yet based on previous check, 
    // let's double check. It was just `getCategories` in queryFn without params. 
    // Let's implement client-side filtering since categories are usually few.

    const categories = data?.data || [];
    const filteredCategories = categories.filter((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory._id, name }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setName("");
                    setEditingCategory(null);
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

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setName(category.name);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this category?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleAddNew = () => {
        setEditingCategory(null);
        setName("");
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                        <Tag className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">ຈັດການໝວດໝູ່</h1>
    
                    </div>
                </div>
                <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> ເພີ່ມໝວດໝູ່
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search categories..."
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
                            <TableHead>ຊື່ໝວດໝູ່</TableHead>
                            <TableHead className="w-[150px] text-right">ຈັດການ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">Loading...</TableCell>
                            </TableRow>
                        ) : filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-slate-500">No categories found</TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category: any, index: number) => (
                                <TableRow key={category._id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell><span className="font-semibold text-slate-700">{category.name}</span></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                                                <Pencil className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(category._id)}>
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
                        <DialogTitle>{editingCategory ? "ແກ້ໄຂໝວດໝູ່" : "ເພີ່ມໝວດໝູ່ໃໝ່"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">ຊື່ໝວດໝູ່</Label>
                            <Input
                                id="cat-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ໃສ່ຊື່ໝວດໝູ່..."
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
