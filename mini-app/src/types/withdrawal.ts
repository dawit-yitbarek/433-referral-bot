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
    status: 'pending' | 'paid' | 'rejected',
    created_at: Date;
    updated_at: Date;
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
    account_holder_name: string;
    bank_name: banks | "";
    bank_account: string;
}

export type banks = 'cbe' | 'telebirr' | 'abyssinia'