import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { publicApi } from "../components/Api";

/**
 * UsersPage
 *
 * - Sorting: highest, lowest, latest, oldest
 * - Filtering: users with referrals (referral_count > 0)
 * - Search: local-first, then remote if not found. Search results render separately
 */

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [userError, setUserError] = useState(null);

    // Modal + referrals
    const [selectedUser, setSelectedUser] = useState(null);
    const [referrals, setReferrals] = useState([]);
    const [refLoading, setRefLoading] = useState(false);
    const [refError, setRefError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Search & search results
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Sort & filter
    // sortBy: 'highest' | 'lowest' | 'latest' | 'oldest'
    const [sortBy, setSortBy] = useState("highest");
    const [onlyWithReferrals, setOnlyWithReferrals] = useState(false);

    // small loading animation dots
    const [dotCount, setDotCount] = useState(1);
    useEffect(() => {
        if (!loading && !refLoading && !searching) return;
        const interval = setInterval(() => setDotCount((p) => (p === 3 ? 1 : p + 1)), 400);
        return () => clearInterval(interval);
    }, [loading, refLoading, searching]);

    // keep a ref to avoid duplicate page loads
    const loadingRef = useRef(false);

    // Load users (paginated) — appends to existing users
    const loadUsers = async () => {
        if (!hasMore || loadingRef.current) return;
        setUserError(null);
        setLoading(true);
        loadingRef.current = true;

        try {
            const res = await publicApi.get(`/api/admin/users?page=${page}&limit=${limit}`);
            const incoming = res.data.users || [];
            setUsers((prev) => [...prev, ...incoming]);
            setHasMore(Boolean(res.data.has_more));
            setPage((p) => p + 1);
        } catch (err) {
            console.error("Error loading users:", err);
            setUserError("Failed to load users. Please try again.");
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    };

    // Load referrals for a user and show modal
    const loadReferrals = async (telegramId, user) => {
        setSelectedUser(user);
        setModalOpen(true);
        setRefLoading(true);
        setRefError(null);
        setReferrals([]);

        try {
            const res = await publicApi.get(`/api/admin/referrals?telegram_id=${telegramId}`);
            setReferrals(res.data.referrals || []);
        } catch (err) {
            console.error("Error loading referrals:", err);
            setRefError("Failed to load referrals. Please try again.");
        } finally {
            setRefLoading(false);
        }
    };

    // Search: local-first, if not found then remote
    const handleSearch = async () => {
        const q = (searchQuery || "").trim();
        if (!q) return;
        setSearchResults([]);
        setSearchError(null);

        // first check locally (search by name, username)
        const localMatches = users.filter((u) => {
            const username = (u.username || "").toLowerCase();
            const term = q.toLowerCase();
            return username.includes(term);
        });

        if (localMatches.length > 0) {
            console.log("Local search matches:", localMatches);
            setSearchResults(localMatches);
            return;
        }

        // else query the backend
        setSearching(true);
        try {
            const res = await publicApi.get(`/api/admin/users/search?query=${encodeURIComponent(q)}`);
            const found = res.data.user;
            if (found.length === 0) {
                console.log("Global search matches:", found);
                setSearchError("No user found with this username.");
            } else {
                // keep search results separate from loaded users
                console.log("Global search matches:", found);
                setSearchResults(found);
            }
        } catch (err) {
            console.error("Search error:", err);
            setSearchError("Search failed. Please try again.");
        } finally {
            setSearching(false);
        }
    };

    // Clear search and errors
    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
        setSearchError(null);
        setSearching(false);
    };

    // Sort + filter logic applied to a list before rendering
    const applySortFilter = (list) => {
        let arr = [...list];

        // filter: only users with referrals
        if (onlyWithReferrals) {
            arr = arr.filter((u) => Number(u.referral_count) > 0);
        }

        // sort
        switch (sortBy) {
            case "highest":
                arr.sort((a, b) => Number(b.referral_count || 0) - Number(a.referral_count || 0));
                break;
            case "lowest":
                arr.sort((a, b) => Number(a.referral_count || 0) - Number(b.referral_count || 0));
                break;
            case "latest":
                arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case "oldest":
                arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            default:
                break;
        }
        return arr;
    };

    // init: load first page
    useEffect(() => {
        loadUsers();
    }, []);


    const formatShortDate = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        const opts = { month: "short", day: "2-digit", year: "numeric" };
        return d.toLocaleDateString(undefined, opts).replace(",", "");
    };

    // Rendered lists:
    // - if searchResults.length > 0 => show "Search Results" section (sorted/filtered)
    // - then show loaded users section (sorted/filtered)
    const renderedSearch = searchResults;
    const renderedUsers = applySortFilter(users);

    return (
        <div className="min-h-screen bg-black text-white px-4 pb-20 pt-8 font-poppins">
            {/* Title + controls */}
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-[#A259FF] to-[#CBA6F7] bg-clip-text text-transparent">
                    Users List
                </h1>

                {/* Controls */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    {/* Search */}
                    <div className="flex gap-2 w-full sm:w-auto items-center">
                        {/* Search Input Wrapper */}
                        <div className="relative flex-1 min-w-0">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                                placeholder="Search by username"
                                className="w-full bg-[#1A1A1A] border border-[#5B2EFF]/20 px-4 py-2 pr-10 rounded-xl focus:outline-none"
                            />

                            {/* Clear (X) button inside the input */}
                            {(searchQuery || searchResults.length > 0 || searchError) && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            className="bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] px-4 py-2 rounded-xl font-semibold hover:opacity-90"
                        >
                            {searching ? `Searching${".".repeat(dotCount)}` : "Search"}
                        </button>
                    </div>


                    {/* Sort & Filter */}
                    {searchResults.length === 0 && !searching && !searchError && <div className="flex gap-2 items-center mt-3 sm:mt-0">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
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
                                checked={onlyWithReferrals}
                                onChange={(e) => setOnlyWithReferrals(e.target.checked)}
                                className="accent-[#A259FF] w-4 h-4"
                            />
                            Only users with referrals
                        </label>
                    </div>}
                </div>

                {/* Search error */}
                {searchError && <p className={`${searchError !== "No user found with this username." && "text-red-400"} mt-3`}>{searchError}</p>}
            </div>

            {/* Search Results (if any) */}
            {renderedSearch.length > 0 && (
                <div className="max-w-4xl mx-auto mt-6">
                    <h2 className="text-lg text-[#CBA6F7] font-semibold mb-3">Search Results</h2>
                    <div className="flex flex-col gap-4">
                        {renderedSearch.map((user) => (
                            <motion.div
                                key={`search-${user.id || user.telegram_id}`}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => loadReferrals(user.telegram_id, user)}
                                className="bg-[#1A1A1A] p-4 rounded-3xl border border-[#5B2EFF]/20 shadow-[0_0_15px_rgba(162,89,255,0.1)] flex items-center gap-4 cursor-pointer"
                            >
                                {user.profile_photo ? (
                                    <img src={user.profile_photo} className="w-14 h-14 rounded-full border border-[#5B2EFF]/30" alt={user.name} />
                                ) : (
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-xl">
                                        {user.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}

                                <div className="flex-1">
                                    <p className="text-lg font-semibold text-[#CBA6F7]">{user.name}</p>
                                    <p className="text-sm text-[#BFBFBF]">{user.username && `@${user.username}`}</p>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm text-[#BFBFBF]">Referrals</p>
                                    <p className="text-xl font-bold text-[#A259FF]">{user.referral_count}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatShortDate(user.created_at)}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loaded Users */}
            {searchResults.length === 0 && !searching && !searchError && <div className="max-w-4xl mx-auto mt-6">
                <h2 className="text-lg text-[#CBA6F7] font-semibold mb-3">All Users</h2>

                {users.length === 0 && !loading && !userError && <p className="text-center text-[#808080]">No users found</p>}

                <div className="flex flex-col gap-4">
                    {renderedUsers.map((user) => (
                        <motion.div
                            key={user.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => loadReferrals(user.telegram_id, user)}
                            className="bg-[#1A1A1A] p-4 rounded-3xl border border-[#5B2EFF]/20 shadow-[0_0_15px_rgba(162,89,255,0.1)] flex items-center gap-4 cursor-pointer"
                        >
                            {user.profile_photo ? (
                                <img src={user.profile_photo} className="w-14 h-14 rounded-full border border-[#5B2EFF]/30" alt={user.name} />
                            ) : (
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-xl">
                                    {user.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}

                            <div className="flex-1">
                                <p className="text-lg font-semibold text-[#CBA6F7]">{user.name}</p>
                                <p className="text-sm text-[#BFBFBF]">{user.username && `@${user.username}`}</p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm text-[#BFBFBF]">Referrals</p>
                                <p className="text-xl font-bold text-[#A259FF]">{user.referral_count}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatShortDate(user.created_at)}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Errors */}
                {userError && (
                    <div className="mt-4 text-center text-red-400">
                        <p>{userError}</p>
                    </div>
                )}

                {/* Load More */}
                {hasMore && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={loadUsers}
                            disabled={loading}
                            className="bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] px-6 py-3 rounded-2xl font-semibold shadow-[0_0_20px_rgba(162,89,255,0.4)] hover:opacity-90 transition-all"
                        >
                            {loading ? `Loading${".".repeat(dotCount)}` : "Load More"}
                        </button>
                    </div>
                )}
            </div>}

            {/* Referrals Modal */}
            {modalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center px-4 z-50"
                    onClick={() => setModalOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#111] w-full max-w-2xl rounded-3xl p-6 border border-[#5B2EFF]/20 shadow-[0_0_25px_rgba(162,89,255,0.2)]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#CBA6F7]">Referrals of {selectedUser?.name}</h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-sm text-[#BFBFBF] bg-[#222] px-3 py-1 rounded-xl"
                            >
                                Close
                            </button>
                        </div>

                        {/* referral list */}
                        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
                            {refLoading && <p className="text-center text-[#808080]">Loading referrals{'.'.repeat(dotCount)}</p>}
                            {!refLoading && refError && (
                                <div className="text-center text-red-400">
                                    <p>{refError}</p>
                                    <button
                                        onClick={() => loadReferrals(selectedUser.telegram_id, selectedUser)}
                                        className="mt-2 text-white px-3 py-2">
                                        <RefreshCw size={24} />
                                    </button>
                                </div>
                            )}
                            {!refLoading && !refError && referrals.length === 0 && (
                                <p className="text-center text-[#808080]">No referrals</p>
                            )}

                            {!refLoading && referrals.map((ref) => (
                                <div key={ref.id} className="bg-[#1A1A1A] p-4 rounded-2xl flex items-center gap-4 border border-[#5B2EFF]/20">
                                    {ref.profile_photo ? (
                                        <img src={ref.profile_photo} className="w-12 h-12 rounded-full border border-[#5B2EFF]/30" alt={ref.name} />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-lg">
                                            {ref.name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold text-[#CBA6F7]">{ref.name}</p>
                                        <p className="text-sm text-[#BFBFBF]">{ref.username && `@${ref.username}`}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-[#BFBFBF]">Refs</p>
                                        <p className="text-lg font-bold text-[#A259FF]">{ref.referral_count}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}