export interface User {
    id: number;
    telegram_id: number;
    first_name: string;
    last_name: string | null;
    username: string | null;
    profile_photo: string | null;
    referred_by: number | null;
    joined_channel: boolean;
    reward_status: 'none' | 'awarded' | 'revoked'
    referral_count: number;
    claimed_referral_count: number;
    created_at: Date;
    updated_at: Date;
}

export interface Admin {
    id: number;
    username: string;
}

export interface WithdrawalRequest {
    id: number;
    user_id: number;
    admin_telegram_id: number;
    referrals_claimed: number;
    point_rate: number;
    requested_amount: number;
    bank_name: string;
    bank_account: string;
    account_holder_name: string;
    status: 'pending' | 'paid' | 'rejected';
    created_at: Date;
    updated_at: Date;
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
    account_holder_name: string;
    bank_name: string;
    bank_account: string;
}

export interface SendWithdrawalResponse {
    message: string;
    request: WithdrawalRequest;
}