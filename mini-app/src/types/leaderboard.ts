export interface LeaderboardUser {
    telegram_id: number;
    name: string;
    profile_photo: string | null;
    referral_count: number;
    rank: number;
}

export interface LeaderboardData {
    topThree: LeaderboardUser[];
    others: LeaderboardUser[];
    currentUser: LeaderboardUser | null;
}

export interface LeaderboardResponse {
    topTen: LeaderboardUser[];
    currentUser: LeaderboardUser | null;
}