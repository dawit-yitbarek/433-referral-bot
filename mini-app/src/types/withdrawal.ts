export interface WithdrawalRequest {
    id: number;
    user_id: number;
    name: string;
    requested_referrals: number;
    requested_amount: number;
    bank_name: string;
    bank_account: string;
    phone: string | null;
    status: 'pending' | 'paid' | 'cancelled';
    assigned_to: string;
    created_at: Date;
    processed_at: Date | null;
}

export interface SendWithdrawalData {
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

export interface WithdrawalFormData {
    name: string;
    bank_name: string;
    bank_account: string;
    phone: string;
}