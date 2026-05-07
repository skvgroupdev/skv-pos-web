import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, createProduct, updateProduct, deleteProduct, type CreateProductDto, type UpdateProductDto, type ProductFilters } from "../api/products";
import { getUnits } from "../api/units";
import { getCategories } from "../api/categories";

// Products
export const useGetProducts = (page = 1, limit = 10, search?: string, filters?: ProductFilters & { sort?: string }) => {
  return useQuery({
    queryKey: ["products", page, limit, search, filters],
    queryFn: () => getProducts(page, limit, search, filters),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductDto) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      import("sonner").then(({ toast }) => toast.success("Product created successfully"));
    },
    onError: () => {
        import("sonner").then(({ toast }) => toast.error("Failed to create product"));
    }
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      import("sonner").then(({ toast }) => toast.success("Product updated successfully"));
    },
    onError: () => {
        import("sonner").then(({ toast }) => toast.error("Failed to update product"));
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      import("sonner").then(({ toast }) => toast.success("Product deleted successfully"));
    },
    onError: () => {
        import("sonner").then(({ toast }) => toast.error("Failed to delete product"));
    }
  });
};

// Units
export const useGetUnits = () => {
    return useQuery({
        queryKey: ["units"],
        queryFn: getUnits,
    });
};

// Categories
export const useGetCategories = () => {
    return useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) =>  import("../api/categories").then(mod => mod.createCategory(name)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};

export const useCreateUnit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => import("../api/units").then(mod => mod.createUnit(name)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
        },
    });
};

export const useTouchCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => import("../api/categories").then(mod => mod.touchCategory(name)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => import("../api/categories").then(mod => mod.updateCategory(id, name)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            import("sonner").then(({ toast }) => toast.success("Category updated successfully"));
        },
        onError: () => {
            import("sonner").then(({ toast }) => toast.error("Failed to update category"));
        }
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => import("../api/categories").then(mod => mod.deleteCategory(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            import("sonner").then(({ toast }) => toast.success("Category deleted successfully"));
        },
        onError: () => {
            import("sonner").then(({ toast }) => toast.error("Failed to delete category"));
        }
    });
};

export const useTouchUnit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => import("../api/units").then(mod => mod.touchUnit(name)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
        },
    });
};

export const useUpdateUnit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => import("../api/units").then(mod => mod.updateUnit(id, name)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            import("sonner").then(({ toast }) => toast.success("Unit updated successfully"));
        },
        onError: () => {
            import("sonner").then(({ toast }) => toast.error("Failed to update unit"));
        }
    });
};

export const useDeleteUnit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => import("../api/units").then(mod => mod.deleteUnit(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            import("sonner").then(({ toast }) => toast.success("Unit deleted successfully"));
        },
        onError: () => {
            import("sonner").then(({ toast }) => toast.error("Failed to delete unit"));
        }
    });
};
