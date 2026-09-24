import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { publicApi } from "../components/Api";
import type { User } from "../types/user";
import type { LeaderboardResponse, LeaderboardData } from "../types/leaderboard";
import type { AppContextType } from "../types/index";
import type { TelegramWebApp } from "../types/telegram"

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({
    topThree: [],
    others: [],
    currentUser: null,
    isUserInTopTen: false
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // App Metadata States
  const [channelUsername, setChannelUsername] = useState<string>("");
  const [botUsername, setBotUsername] = useState<string>("");
  const [withdrawThreshold, setWithdrawThreshold] = useState<number>(0);
  const [referralValue, setReferralValue] = useState<number>(0);

  const initApp = async () => {
    setLoading(true);
    try {
      const tg = (window as any).Telegram?.WebApp as TelegramWebApp | undefined;
      const telegramUser = tg?.initDataUnsafe?.user;
      if (!telegramUser) throw new Error("Telegram data missing");

      const { id } = telegramUser;

      const [adminRes, leaderboardRes] = await Promise.all([
        publicApi.get(`/api/admin/check-admin?telegram_id=${id}`),
        publicApi.get<LeaderboardResponse>(`/api/leaderboard?telegram_id=${id}`),
      ]);

      // Set Leaderboard
      const { topTen, currentUser, channelUsername, botUsername, withdrawThreshold, referralValue } = leaderboardRes.data;

      // Save system configuration state
      setChannelUsername(channelUsername ?? "");
      setBotUsername(botUsername ?? "");
      setWithdrawThreshold(withdrawThreshold ?? 0);
      setReferralValue(referralValue ?? 0);

      // Set User & Roles
      setUser(currentUser);
      setIsAdmin(!!adminRes.data?.isAdmin);
      const isUserInTopTen = topTen.some((user) => String(user.telegram_id) === String(id));

      setLeaderboard({
        topThree: topTen.slice(0, 3),
        others: topTen.slice(3, 10),
        currentUser: currentUser,
        isUserInTopTen
      });

      setError(null);
    } catch (err) {
      console.error("App initialization error:", err instanceof Error ? err.message : String(err));
      setError("Failed to load user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        channelUsername,
        botUsername,
        withdrawThreshold,
        referralValue,
        leaderboard,
        isAdmin,
        loading,
        error,
        initApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
