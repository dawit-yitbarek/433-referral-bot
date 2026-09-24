import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { publicApi } from "../components/Api";
import type { AdminWithdrawContextType } from "../types/index";
import type { WithdrawalRequest } from "../types/withdrawal";
import { useApp } from "./UserContext";

const AppContext = createContext<AdminWithdrawContextType | null>(null);

export const AdminWithdrawProvider = ({ children }: { children: ReactNode }) => {
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const { user, loading: loadingUser, error: userError } = useApp();

    const fetchWithdrawalRequests = async () => {

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
            if (user.telegram_id) {
                const withdrawalRes = await publicApi.get(
                    `/api/withdrawals/admin?telegram_id=${user.telegram_id}`,
                );
                setWithdrawalRequests(withdrawalRes.data.withdrawals);
            }
        } catch (err) {
            console.error("Error loading admin withdrawals ", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawalRequests();
    }, [user, loadingUser, userError]);

    return (
        <AppContext.Provider
            value={{
                withdrawalRequests,
                setWithdrawalRequests,
                user,
                loading,
                error,
                refresh: fetchWithdrawalRequests
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAdminWithdraw = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAdminWithdraw must be used within an AdminWithdrawProvider');
    }
    return context;
};