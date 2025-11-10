import React, { useState, useEffect, use } from "react";
import LoadingState from "../components/Loading";
import ErrorState from "../components/Error";
import { publicApi } from "../components/Api";

export default function Leaderboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [topThree, setTopThree] = useState([]);
    const [others, setOthers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [telegramId, setTelegramId] = useState(null)

    useEffect(() => {
        const loadLeaderboard = async () => {
            // const tg = window.Telegram?.WebApp;
            setLoading(true);

            try {
                // if (!tg || !tg.initDataUnsafe?.user) {
                //     throw new Error("Telegram WebApp user data not found");
                // }

                // const telegramUser = tg.initDataUnsafe.user;
                // const userId = telegramUser.id;
                const userId = 6828578175
                setTelegramId(userId);
                const res = await publicApi.get(`/api/leaderboard?user_id=${userId}`);
                const { topTen, currentUser } = res.data;
                setTopThree(topTen.slice(0, 3));
                setOthers(topTen.slice(3, 10));
                setCurrentUser(currentUser);
            } catch (err) {
                console.error("❌ Error loading leaderboard:", err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadLeaderboard();
    }, [refresh]);

    if (loading) return <LoadingState message="Loading Leaderboard..." />;
    if (error) return <ErrorState retry={() => setRefresh(prev => prev + 1)} />;

    return (
        <div className="min-h-screen pb-28 w-full bg-[#000000] text-white font-sans">
            <main className="px-4 py-10 flex flex-col items-center gap-10">
                {/* Header */}
                <header className="w-full max-w-3xl text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#A259FF] to-[#B388FF] drop-shadow-lg">
                        Leaderboard
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm sm:text-base">
                        Track top referrers and see how you rank! Invite friends and climb the leaderboard.
                    </p>
                </header>

                {/* Top 3 Users */}
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl px-2">
                    {topThree.map((user) => (
                        <article
                            key={Number(user.telegram_id)}
                            className={`w-full h-64 rounded-xl flex flex-col items-center justify-center px-4 py-6 bg-[#1a1a2e] text-center
                    ${Number(user.rank) === 1 ? "sm:col-span-2 md:col-span-1 order-1" : "order-2"}
                    ${Number(user.telegram_id) === telegramId ? "ring-2 ring-[#A259FF] shadow-[0_0_15px_rgba(162,89,255,0.3)]" : ""}`}
                        >
                            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-4 border-[#5B2EFF]">
                                {user.profile_photo ? (
                                    <img
                                        src={user.profile_photo}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-xl">
                                        {user.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>
                            <div className="font-bold text-white text-base sm:text-lg truncate flex items-center justify-center gap-1">
                                {user.name}
                                {Number(user.telegram_id) === telegramId && (
                                    <span className="text-xs text-purple-400 font-semibold">(You)</span>
                                )}
                            </div>
                            <div className="text-yellow-400 text-xl sm:text-2xl font-bold">
                                {user.referral_count.toLocaleString()} rfs
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                                {(Number(user.rank)) === 1 ? "1st" : (Number(user.rank)) === 2 ? "2nd" : "3rd"}
                            </div>
                        </article>
                    ))}
                </section>

                {/* 4–10 Users */}
                <section className="bg-[#1a1a2e] w-full max-w-6xl rounded-xl py-4 divide-y divide-[#292947] px-2">
                    {others.map((user) => (
                        <article
                            key={user.telegram_id}
                            className={`flex justify-between items-center px-2 sm:px-6 py-4 text-sm sm:text-base rounded-lg transition-all duration-200

${Number(user.telegram_id) === telegramId ? "ring-2 ring-[#A259FF] bg-[#2a2a3e]" : ""}`}
                        >
                            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                <span className="text-gray-400 w-5 sm:w-6 text-right">{user.rank}</span>
                                {user.profile_photo ? (
                                    <img
                                        src={user.profile_photo}
                                        alt={user.name}
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-xl">
                                        {user.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}
                                <span className="font-semibold text-white truncate flex items-center gap-1">
                                    {user.name}
                                    {Number(user.telegram_id) === telegramId && (
                                        <span className="text-xs text-purple-400 font-semibold">(You)</span>
                                    )}
                                </span>
                            </div>
                            <div className="text-gray-300 font-semibold text-right">
                                {user.referral_count.toLocaleString()} rfs
                            </div>
                        </article>
                    ))}
                </section>

                {/* Separate Current User (if not in Top 10) */}
                {currentUser && (
                    <section className="bg-[#1a1a2e] w-full max-w-6xl rounded-xl px-4 sm:px-6 py-6 relative mt-4">
                        <div className="absolute -top-3 left-6 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                            Your Rank
                        </div>
                        <div className="flex justify-between items-center text-sm sm:text-base flex-wrap gap-y-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <span className="bg-purple-700 text-purple-300 text-xs px-3 py-1 rounded-full font-bold">
                                    #{currentUser.rank}
                                </span>
                                {currentUser.profile_photo ? (
                                    <img
                                        src={currentUser.profile_photo}
                                        alt={currentUser.name}
                                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full"
                                    />
                                ) : (
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-xl">
                                        {currentUser.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}
                                <div>
                                    <div className="text-white font-semibold truncate">{currentUser.name}</div>
                                </div>
                            </div>
                            <div className="text-purple-400 font-bold text-base sm:text-lg text-right">
                                {currentUser.referral_count?.toLocaleString()} rfs
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div >
    );
}