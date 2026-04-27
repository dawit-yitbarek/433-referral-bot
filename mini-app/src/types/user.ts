export interface Admin {
    id: number;
    username: string;
}

export interface User {
    id: number;
    telegram_id: number;
    name: string;
    profile_photo: string | null;
    total_referrals: number;
    claimed_referrals: number;
    unclaimed_referrals: number;
    hasJoined: boolean;
}

export interface UserSyncResponse {
    user: User;
}