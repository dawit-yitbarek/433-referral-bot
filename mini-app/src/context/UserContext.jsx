import { createContext, useContext, useState, useEffect } from "react";
import { publicApi } from "../components/Api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState({
    topThree: [],
    others: [],
    currentUser: null,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initApp = async () => {
    setLoading(true);
    try {
      const tg = window.Telegram?.WebApp;
      const telegramUser = tg?.initDataUnsafe?.user;
      if (!telegramUser) throw new Error("Telegram data missing");

      const { id, first_name, username } = telegramUser;

      const [syncRes, adminRes, leaderboardRes] = await Promise.all([
        publicApi.post("/api/user/sync", { id, name: first_name }),
        publicApi.get(`/api/admin/check-admin?username=${username}`),
        publicApi.get(`/api/leaderboard?user_id=${id}`),
      ]);

      // Set User & Roles
      setUser(syncRes.data.user);
      const superAdminEnv = import.meta.env.VITE_SUPER_ADMIN?.trim();
      const isSuper = username === superAdminEnv;
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
      setError(err.message);
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

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} username
 * @property {number} referral_count
 * @returns {{ user: User, leaderboard: Object, isAdmin: boolean, isSuperAdmin: boolean, loading: boolean, error: string, initApp: Function }}
 */

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
