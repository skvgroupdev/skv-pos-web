import { create } from 'zustand';

export interface IExchangeRate {
    _id: string;
    currency: string;
    rate: number;
    isBase: boolean;
}

interface POSState {
    exchangeRates: IExchangeRate[];
    activeCartId: string | null;
    setExchangeRates: (rates: IExchangeRate[]) => void;
    setActiveCartId: (id: string) => void;
}

export const usePOSStore = create<POSState>((set) => ({
    exchangeRates: [],
    activeCartId: null,
    setExchangeRates: (rates) => set({ exchangeRates: rates }),
    setActiveCartId: (id) => set({ activeCartId: id }),
}));
