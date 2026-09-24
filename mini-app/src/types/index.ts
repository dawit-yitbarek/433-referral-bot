import type { User } from "./user";
import type { LeaderboardData } from "./leaderboard";
import type { WithdrawalRequest } from "./withdrawal";
import type { Dispatch, SetStateAction } from 'react';

export interface AdminCheckResponse {
    isAdmin: boolean;
}

export interface MessageState {
    text: string;
    type: 'success' | 'error' | 'reject_success' | 'approve_success' | '';
}

export interface AppContextType {
    user: User | null;
    channelUsername: string
    botUsername: string
    withdrawThreshold: number;
    referralValue: number;
    leaderboard: LeaderboardData;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    initApp: () => Promise<void>;
}

export interface WithdrawContextType {
    withdrawalHistory: WithdrawalRequest[] | null;
    loading: boolean;
    error: boolean;
    refresh: () => Promise<void>;
}

export interface AdminWithdrawContextType {
    withdrawalRequests: WithdrawalRequest[] | null;
    setWithdrawalRequests: Dispatch<SetStateAction<WithdrawalRequest[]>>;
    loading: boolean;
    error: boolean;
    user: User | null;
    refresh: () => Promise<void>;
}

export interface ImportMetaEnv {
    VITE_BACKEND_URL: string;
}

export interface ImportMeta {
    env: ImportMetaEnv;
}