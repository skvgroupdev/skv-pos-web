import api from "./axios";

export interface ExchangeRate {
    _id: string;
    currency: string;
    rate: number;
    isBase: boolean;
    updatedAt: string;
}

export const getExchangeRates = async () => {
    const response = await api.get("/exchange-rates");
    return response.data;
};

export const updateExchangeRate = async (currency: string, rate: number) => {
    const response = await api.post("/exchange-rates", { currency, rate });
    return response.data;
};
