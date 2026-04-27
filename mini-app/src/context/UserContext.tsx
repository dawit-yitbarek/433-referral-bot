import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { publicApi } from "../components/Api";
import type { User, UserSyncResponse } from "../types/user";
import type { LeaderboardResponse, LeaderboardData } from "../types/leaderboard";
import type { AppContextType } from "../types/index";
import type { TelegramWebApp } from "../types/telegram"

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({
    topThree: [],
    others: [],
    currentUser: null,
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initApp = async () => {
    setLoading(true);
    try {
      const tg = (window as any).Telegram?.WebApp as TelegramWebApp | undefined;
      const telegramUser = tg?.initDataUnsafe?.user;
      if (!telegramUser) throw new Error("Telegram data missing");

      const { id, first_name, username } = telegramUser;
      username && setUsername(username)

      const [syncRes, adminRes, leaderboardRes] = await Promise.all([
        publicApi.post<UserSyncResponse>("/api/user/sync", { id, name: first_name }),
        publicApi.get(`/api/admin/check-admin?username=${username}`),
        publicApi.get<LeaderboardResponse>(`/api/leaderboard?user_id=${id}`),
      ]);

      // Set User & Roles
      setUser(syncRes.data.user);
      const superAdminStr = import.meta.env.VITE_SUPER_ADMIN || '';
      const superAdmins = superAdminStr.split(',').map((username: string) => username.trim());
      const isSuper = username && superAdmins.includes(username)
      setIsSuperAdmin(isSuper);
      setIsAdmin(isSuper || !!adminRes.data?.isAdmin);

      // Set Leaderboard
      const { topTen, currentUser } = leaderboardRes.data;
      setLeaderboard({
        topThree: topTen.slice(0, 3),
        others: topTen.slice(3, 10),
        currentUser: currentUser,
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
        username,
        leaderboard,
        isAdmin,
        isSuperAdmin,
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
