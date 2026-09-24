import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { publicApi } from "../components/Api";
import { UserCard } from "../components/UserCard";
import type { ReferralsPageState } from "../types/referral";
import type { User } from "../types/user";


export default function UsersPage() {
  const [state, setState] = useState<ReferralsPageState>({
    users: [],
    page: 1,
    limit: 1,
    hasMore: true,
    loading: false,
    userError: null,
    totalUsers: null,
    selectedUser: null,
    referrals: [],
    refLoading: false,
    refError: null,
    modalOpen: false,
    searchQuery: "",
    searchResults: [],
    searching: false,
    searchError: null,
    sortBy: "highest",
    onlyWithReferrals: false,
    dotCount: 1,
  });

  const updateState = (updates: Partial<ReferralsPageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (!state.loading && !state.refLoading && !state.searching) return;
    const interval = setInterval(
      () =>
        setState((prev) => ({
          ...prev,
          dotCount: prev.dotCount === 3 ? 1 : prev.dotCount + 1,
        })),
      400
    );
    return () => clearInterval(interval);
  }, [state.loading, state.refLoading, state.searching]);

  const loadingRef = useRef(false);

  const loadUsers = async () => {
    if (!state.hasMore || loadingRef.current) return;
    updateState({ userError: null, loading: true });
    loadingRef.current = true;

    try {
      const res = await publicApi.get(
        `/api/admin/users?page=${state.page}&limit=${state.limit}`
      );
      const incoming = res.data.users || [];
      updateState({ users: [...state.users, ...incoming] });
      if (state.page === 1) updateState({ totalUsers: res.data.total_users });
      updateState({ hasMore: Boolean(res.data.has_more) });
      updateState({ page: state.page + 1 });
    } catch (err) {
      console.error("Error loading users:", err);
      updateState({ userError: "Failed to load users. Please try again." });
    } finally {
      updateState({ loading: false });
      loadingRef.current = false;
    }
  };

  const loadReferrals = async (telegramId: number, user: User) => {
    if (user?.referral_count < 1) return;
    updateState({
      selectedUser: user,
      modalOpen: true,
      refLoading: true,
      refError: null,
      referrals: [],
    });

    try {
      const res = await publicApi.get(
        `/api/admin/referrals?telegram_id=${telegramId}`
      );
      updateState({ referrals: res.data.referrals || [] });
    } catch (err) {
      console.error("Error loading referrals:", err);
      updateState({ refError: "Failed to load referrals. Please try again." });
    } finally {
      updateState({ refLoading: false });
    }
  };

  const handleSearch = async () => {
    const q = (state.searchQuery || "").trim().replace("@", "");
    if (!q) return;
    updateState({ searchResults: [], searchError: null });

    const localMatches = state.users.filter((u) => {
      const username = (u.username || "").toLowerCase();
      const term = q.toLowerCase();
      return username.includes(term);
    });

    if (localMatches.length > 0) {
      updateState({ searchResults: localMatches });
      return;
    }

    updateState({ searching: true });
    try {
      const res = await publicApi.get(`/api/admin/users/search?query=${q}`);
      const found = res.data.user;
      if (found.length === 0) {
        updateState({ searchError: "No user found with this username." });
      } else {
        updateState({ searchResults: found });
      }
    } catch (err) {
      console.error("Search error:", err);
      updateState({ searchError: "Search failed. Please try again." });
    } finally {
      updateState({ searching: false });
    }
  };

  const clearSearch = () => {
    updateState({
      searchQuery: "",
      searchResults: [],
      searchError: null,
      searching: false,
    });
  };

  const applySortFilter = (list: User[]) => {
    let arr = [...list];

    if (state.onlyWithReferrals) {
      arr = arr.filter((u) => Number(u.referral_count) > 0);
    }

    switch (state.sortBy) {
      case "highest":
        arr.sort(
          (a, b) =>
            Number(b.referral_count || 0) - Number(a.referral_count || 0)
        );
        break;
      case "lowest":
        arr.sort(
          (a, b) =>
            Number(a.referral_count || 0) - Number(b.referral_count || 0)
        );
        break;
      case "latest":
        arr.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "oldest":
        arr.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      default:
        break;
    }
    return arr;
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const renderedUsers = applySortFilter(state.users);

  return (
    <div className="min-h-screen bg-black text-white px-4 pb-20 pt-8 font-poppins">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-[#A259FF] to-[#CBA6F7] bg-clip-text text-transparent">
          Users List
        </h1>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto items-center">
            <div className="relative flex-1 min-w-0">
              <input
                value={state.searchQuery}
                onChange={(e) => updateState({ searchQuery: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Search by username"
                className="w-full bg-[#1A1A1A] border border-[#5B2EFF]/20 px-4 py-2 pr-10 rounded-xl focus:outline-none"
              />

              {(state.searchQuery ||
                state.searchResults.length > 0 ||
                state.searchError) && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
            </div>

            <button
              onClick={handleSearch}
              disabled={state.searching}
              className="bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] px-4 py-2 rounded-xl font-semibold hover:opacity-90"
            >
              {state.searching
                ? `Searching${".".repeat(state.dotCount)}`
                : "Search"}
            </button>
          </div>

          {state.searchResults.length === 0 &&
            !state.searching &&
            !state.searchError && (
              <div className="flex gap-2 items-center mt-3 sm:mt-0">
                <select
                  value={state.sortBy}
                  onChange={(e) =>
                    updateState({
                      sortBy: e.target.value as ReferralsPageState["sortBy"],
                    })
                  }
                  className="bg-[#1A1A1A] border border-[#5B2EFF]/20 px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value="highest">Highest referrals</option>
                  <option value="lowest">Lowest referrals</option>
                  <option value="latest">Latest joined</option>
                  <option value="oldest">Oldest joined</option>
                </select>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.onlyWithReferrals}
                    onChange={(e) =>
                      updateState({ onlyWithReferrals: e.target.checked })
                    }
                    className="accent-[#A259FF] w-4 h-4"
                  />
                  Only users with referrals
                </label>
              </div>
            )}
        </div>

        {state.searchError && (
          <p
            className={`${state.searchError !== "No user found with this username." &&
              "text-red-400"
              } mt-3`}
          >
            {state.searchError}
          </p>
        )}
      </div>

      {/* Search Results */}
      {state.searchResults.length > 0 && (
        <div className="max-w-4xl mx-auto mt-6">
          <h2 className="text-lg text-[#CBA6F7] font-semibold mb-3">
            Search Results
          </h2>
          <div className="flex flex-col gap-4">
            {state.searchResults.map((user) => (
              <UserCard
                key={`search-${user.id || user.telegram_id}`}
                user={user}
                isClickable={user.referral_count > 0}
                onClick={() => loadReferrals(user.telegram_id, user)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Users */}
      {state.searchResults.length === 0 &&
        !state.searching &&
        !state.searchError && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="flex justify-between">
              <h2 className="text-lg text-[#CBA6F7] font-semibold mb-3">
                All Users
              </h2>
              <p className="text-lg text-[#CBA6F7] font-semibold mb-3">
                Users count{" "}
                {state.totalUsers && `${state.totalUsers.toLocaleString()}`}
              </p>
            </div>

            {state.users.length === 0 &&
              !state.loading &&
              !state.userError && (
                <p className="text-center text-[#808080]">No users found</p>
              )}

            <div className="flex flex-col gap-4">
              {renderedUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isClickable={user.referral_count > 0}
                  onClick={() => loadReferrals(user.telegram_id, user)}
                />
              ))}
            </div>

            {state.userError && (
              <div className="mt-4 text-center text-red-400">
                <p>{state.userError}</p>
              </div>
            )}

            {state.hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadUsers}
                  disabled={state.loading}
                  className="bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] px-6 py-3 rounded-2xl font-semibold shadow-[0_0_20px_rgba(162,89,255,0.4)] hover:opacity-90 transition-all"
                >
                  {state.loading
                    ? `Loading${".".repeat(state.dotCount)}`
                    : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}

      {/* Referrals Modal */}
      {state.modalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center px-4 z-50"
          onClick={() => updateState({ modalOpen: false })}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] w-full max-w-2xl rounded-3xl p-6 border border-[#5B2EFF]/20 shadow-[0_0_25px_rgba(162,89,255,0.2)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#CBA6F7]">
                Referrals of {state.selectedUser?.first_name}
              </h2>
              <button
                onClick={() => updateState({ modalOpen: false })}
                className="text-sm text-[#BFBFBF] bg-[#222] px-3 py-1 rounded-xl"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {state.refLoading && (
                <p className="text-center text-[#808080]">
                  Loading referrals{".".repeat(state.dotCount)}
                </p>
              )}
              {!state.refLoading && state.refError && (
                <div className="text-center text-red-400">
                  <p>{state.refError}</p>
                  <button
                    onClick={() =>
                      state.selectedUser &&
                      loadReferrals(
                        state.selectedUser?.telegram_id,
                        state.selectedUser
                      )
                    }
                    className="mt-2 text-white px-3 py-2"
                  >
                    <RefreshCw size={24} />
                  </button>
                </div>
              )}
              {!state.refLoading &&
                !state.refError &&
                state.referrals.length === 0 && (
                  <p className="text-center text-[#808080]">No referrals</p>
                )}

              {!state.refLoading &&
                state.referrals.map((ref) => (
                  <UserCard key={ref.id} user={ref} />
                ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}