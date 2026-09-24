import type { User } from "../types/user"

export interface LeaderboardData {
    topThree: User[];
    others: User[];
    currentUser: User | null;
    isUserInTopTen: boolean;
}

export interface LeaderboardResponse {
    topTen: User[];
    currentUser: User;
    channelUsername: string;
    botUsername: string;
    withdrawThreshold: number;
    referralValue: number;
}