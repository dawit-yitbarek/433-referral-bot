import type { User } from "./user";
import type { LeaderboardData } from "./leaderboard";

export interface AdminCheckResponse {
    isAdmin: boolean;
}

export interface MessageState {
    text: string;
    type: 'success' | 'error' | '';
}

export interface AppContextType {
    user: User | null;
    username: string | null;
    leaderboard: LeaderboardData;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    loading: boolean;
    error: string | null;
    initApp: () => Promise<void>;
}

export interface ImportMetaEnv {
    VITE_BACKEND_URL: string;
    VITE_FRONTEND_URL: string;
    VITE_ADMIN_USERNAME: string;
    VITE_WITHDRAW_THRESHOLD: string;
    VITE_REFERRAL_POINT: string;
    VITE_BOT_USERNAME: string;
    VITE_CHANNEL_USERNAME: string;
    VITE_SUPER_ADMIN?: string;
}

export interface ImportMeta {
    env: ImportMetaEnv;
}