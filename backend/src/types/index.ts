export interface User {
    id: number;
    telegram_id: number;
    name: string;
    username: string | null;
    profile_photo: string | null;
    referred_by: number | null;
    joined_telegram: boolean;
    claimed_referral_count: number;
    created_at: Date;
}

export interface Admin {
    id: number;
    username: string;
}

export interface WithdrawalRequest {
    id: number;
    user_id: number;
    name: string;
    requested_referrals: number;
    requested_amount: number;
    bank_name: string;
    bank_account: string;
    phone: string | null;
    status: 'pending' | 'paid';
    assigned_to: string;
    created_at: Date;
    processed_at: Date | null;
}

export interface UserDashboardRequest {
    id: number;
    name: string;
}

export interface UserDashboardResponse {
    user: {
        id: number;
        telegram_id: number;
        name: string;
        profile_photo: string | null;
        total_referrals: number;
        claimed_referrals: number;
        unclaimed_referrals: number;
        hasJoined: boolean;
    };
}

export interface LeaderboardUser {
    telegram_id: number;
    name: string;
    profile_photo: string | null;
    referral_count: number;
    rank: number;
}

export interface LeaderboardResponse {
    topTen: LeaderboardUser[];
    currentUser: LeaderboardUser | null;
}

export interface WithdrawalHistoryResponse {
    withdrawals: WithdrawalRequest[];
}

export interface SendWithdrawalRequest {
    user_id: number;
    name: string;
    bank_name: string;
    bank_account: string;
    phone?: string;
}

export interface SendWithdrawalResponse {
    message: string;
    request: WithdrawalRequest;
}

export interface EnvConfig {
    BOT_TOKEN: string;
    WEBAPP_URL: string;
    BACKEND_URL: string;
    DATABASE_URL: string;
    PORT: string;
    CHANNEL_ID: string;
    BOT_USERNAME: string;
    REFERRAL_VALUE: string;
    WITHDRAW_THRESHOLD: string;
}