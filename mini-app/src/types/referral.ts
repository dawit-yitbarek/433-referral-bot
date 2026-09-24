import type { User } from "./user"

export interface ReferralsPageState {
    users: User[];
    page: number;
    limit: number;
    hasMore: boolean;
    loading: boolean;
    userError: string | null;
    totalUsers: number | null;
    selectedUser: User | null;
    referrals: User[];
    refLoading: boolean;
    refError: string | null;
    modalOpen: boolean;
    searchQuery: string;
    searchResults: User[];
    searching: boolean;
    searchError: string | null;
    sortBy: 'highest' | 'lowest' | 'latest' | 'oldest';
    onlyWithReferrals: boolean;
    dotCount: number;
}