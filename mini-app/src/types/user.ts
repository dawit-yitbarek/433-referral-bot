export interface Admin {
    id: number;
    username: string;
}

export interface User {
    id: number;
    telegram_id: number;
    first_name: string;
    last_name: string | null;
    username: string | null;
    profile_photo: string | null;
    referred_by: number;
    joined_channel: boolean;
    reward_status: 'none' | 'awarded' | 'revoked';
    referral_count: number;
    claimed_referral_count: number;
    created_at: Date;
    updated_at: Date;
}

export interface UserSyncResponse {
    user: User;
}