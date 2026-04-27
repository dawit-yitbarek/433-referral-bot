export interface ReferralUser {
    id: number;
    telegram_id: number;
    name: string;
    username: string | null;
    profile_photo: string | null;
    joined_telegram: boolean;
    referral_count: number;
    created_at: string;
}

export interface ReferralsPageState {
    users: ReferralUser[];
    page: number;
    limit: number;
    hasMore: boolean;
    loading: boolean;
    userError: string | null;
    totalUsers: number | null;
    selectedUser: ReferralUser | null;
    referrals: ReferralUser[];
    refLoading: boolean;
    refError: string | null;
    modalOpen: boolean;
    searchQuery: string;
    searchResults: ReferralUser[];
    searching: boolean;
    searchError: string | null;
    sortBy: 'highest' | 'lowest' | 'latest' | 'oldest';
    onlyWithReferrals: boolean;
    dotCount: number;
}