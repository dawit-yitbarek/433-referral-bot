import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { publicApi } from "../components/Api";
import type { WithdrawContextType } from "../types/index";
import type { WithdrawalRequest } from "../types/withdrawal";
import { useApp } from "./UserContext";

const AppContext = createContext<WithdrawContextType | null>(null);

export const WithdrawProvider = ({ children }: { children: ReactNode }) => {
    const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const { user, loading: loadingUser, error: userError } = useApp();

    const loadWithdrawHistory = async () => {

        if (loadingUser) {
            setLoading(true)
            return
        }

        if (userError || !user) {
            setError(true)
            return
        }

        setLoading(true);
        setError(false);
        try {
            if (user.id) {
                const historyRes = await publicApi.get(
                    `/api/withdrawals?user_id=${user.id}`,
                );
                setWithdrawalHistory(historyRes.data.withdrawals);
            }
        } catch (err) {
            console.error("Error loading withdraw history ", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWithdrawHistory();
    }, [user, loadingUser, userError]);

    return (
        <AppContext.Provider
            value={{
                withdrawalHistory,
                loading,
                error,
                refresh: loadWithdrawHistory
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useWithdraw = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useWithdraw must be used within an WithdrawProvider');
    }
    return context;
};
