export interface TelegramUser {
    id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
}

export interface TelegramWebApp {
    initDataUnsafe: {
        user?: TelegramUser;
    };
}