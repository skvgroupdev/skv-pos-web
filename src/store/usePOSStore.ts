import { create } from 'zustand';

export interface IExchangeRate {
    _id: string;
    currency: string;
    rate: number;
    isBase: boolean;
}

type POSSaleMode = "retail" | "wholesale";

interface POSState {
    exchangeRates: IExchangeRate[];
    activeCartId: string | null;
    saleMode: POSSaleMode;
    isSaleModeSyncing: boolean;
    setExchangeRates: (rates: IExchangeRate[]) => void;
    setActiveCartId: (id: string) => void;
    setSaleMode: (mode: POSSaleMode) => void;
    setSaleModeSyncing: (isSyncing: boolean) => void;
}

export const usePOSStore = create<POSState>((set) => ({
    exchangeRates: [],
    activeCartId: null,
    saleMode: localStorage.getItem("posSaleMode") === "wholesale" ? "wholesale" : "retail",
    isSaleModeSyncing: false,
    setExchangeRates: (rates) => set({ exchangeRates: rates }),
    setActiveCartId: (id) => set({ activeCartId: id }),
    setSaleMode: (mode) => {
        localStorage.setItem("posSaleMode", mode);
        set({ saleMode: mode });
    },
    setSaleModeSyncing: (isSyncing) => set({ isSaleModeSyncing: isSyncing }),
}));
