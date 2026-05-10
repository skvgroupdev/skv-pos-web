import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCarts, addToCart, removeFromCart, removeCart, createCart, updateCartCustomer, updateCartPrices } from "@/api/cart";
import { usePOSStore } from "@/store/usePOSStore";
import { useEffect } from "react";
import { toast } from "sonner";
import type { POSSaleMode } from "@/pages/pos/posSaleMode";

const getCartErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { data?: { error?: string } } }).response;
        return response?.data?.error || fallback;
    }

    return fallback;
};

export const useCart = () => {
    const { activeCartId, setActiveCartId } = usePOSStore();
    
    const query = useQuery({
        queryKey: ['carts'],
        queryFn: getCarts,
        staleTime: 0, 
    });

    // Auto-select cart if none selected or invalid
    useEffect(() => {
        if (query.data && query.data.length > 0) {
            // If no active cart, or active cart not in list, select first
            if (!activeCartId || !query.data.find(c => c._id === activeCartId)) {
                setActiveCartId(query.data[0]._id);
            }
        }
    }, [query.data, activeCartId, setActiveCartId]);

    const activeCart = query.data?.find(c => c._id === activeCartId);

    return {
        ...query,
        carts: query.data || [],
        activeCart,
    };
};

export const useCartMutations = () => {
    const queryClient = useQueryClient();
    const { activeCartId } = usePOSStore();

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['carts'] });

    const addMutation = useMutation({
        mutationFn: ({ productId, quantity, price }: { productId: string, quantity: number, price: number }) => {
            if (!activeCartId) throw new Error("No active cart");
            return addToCart(activeCartId, productId, quantity, price);
        },
        onSuccess: invalidate,
        onError: (error: unknown) => toast.error(getCartErrorMessage(error, "Failed to add item"))
    });

    const removeLineMutation = useMutation({
        mutationFn: (productId: string) => {
            if (!activeCartId) throw new Error("No active cart");
            return removeFromCart(activeCartId, productId);
        },
        onSuccess: invalidate,
        onError: (error: unknown) => toast.error(getCartErrorMessage(error, "Failed to remove item"))
    });

    const removeCartMutation = useMutation({ // Deletes the TAB (clears cart)
        mutationFn: (cartId?: string) => {
             const targetId = cartId || activeCartId;
             if (!targetId) throw new Error("No cart to remove");
             return removeCart(targetId);
        },
        onSuccess: invalidate,
        onError: (error: unknown) => toast.error(getCartErrorMessage(error, "Failed to clear cart"))
    });
    
    const createCartMutation = useMutation({
        mutationFn: createCart,
        onSuccess: (carts) => {
            invalidate();
            // Automatically switch to the newly created cart (last one)
            if (carts && carts.length > 0) {
                const newCart = carts[carts.length - 1];
                usePOSStore.getState().setActiveCartId(newCart._id);
             }
        },
         onError: (error: unknown) => toast.error(getCartErrorMessage(error, "Failed to create cart"))
    });

    const setCustomerMutation = useMutation({
        mutationFn: (customerId: string | null) => {
            if (!activeCartId) throw new Error("No active cart");
            return updateCartCustomer(activeCartId, customerId);
        },
        onSuccess: invalidate,
        onError: (error: unknown) => toast.error(getCartErrorMessage(error, "Failed to set customer"))
    });

    const updateQuantityMutation = useMutation({
        mutationFn: ({ productId, quantity, price, currentQuantity }: { productId: string, quantity: number, price: number, currentQuantity: number }) => {
            if (!activeCartId) throw new Error("No active cart");
            const delta = quantity - currentQuantity;
            if (delta === 0) return Promise.resolve(null);
            return addToCart(activeCartId, productId, delta, price);
        },
        onSuccess: invalidate,
        onError: (error: unknown) => toast.error(getCartErrorMessage(error, "Failed to update quantity"))
    });

    const updatePricesMutation = useMutation({
        mutationFn: (saleMode: POSSaleMode) => {
            if (!activeCartId) throw new Error("No active cart");
            return updateCartPrices(activeCartId, saleMode);
        },
        onSuccess: invalidate,
        onError: (error: unknown) => toast.error(getCartErrorMessage(error, "Failed to update cart prices"))
    });

    return {
        addToCart: addMutation.mutate,
        updateCartItem: updateQuantityMutation.mutate,
        removeFromCart: removeLineMutation.mutate,
        clearCart: removeCartMutation.mutate, // Renamed clearCart to removing the cart tab effectively
        createCart: createCartMutation.mutate,
        removeCart: removeCartMutation.mutate,
        updateCustomer: setCustomerMutation.mutate,
        updateCartPrices: updatePricesMutation.mutate,
        isUpdatingCartPrices: updatePricesMutation.isPending,
        isLoading: addMutation.isPending || removeLineMutation.isPending || removeCartMutation.isPending || createCartMutation.isPending || setCustomerMutation.isPending || updateQuantityMutation.isPending || updatePricesMutation.isPending
    };
};
