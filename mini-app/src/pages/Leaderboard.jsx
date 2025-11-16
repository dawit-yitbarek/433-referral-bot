import React, { useState, useEffect } from "react";
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
            const tg = window.Telegram?.WebApp;
            setLoading(true);

            try {
                if (!tg || !tg.initDataUnsafe?.user) {
                    throw new Error("Telegram WebApp user data not found");
                }

                const telegramUser = tg.initDataUnsafe.user;
                const userId = telegramUser.id;

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
                <section className="w-full max-w-5xl mx-auto mt-4 px-2">
                    <div className="grid grid-cols-3 gap-3 place-items-center">

                        {/* 2nd place - Left */}
                        {topThree[1] && (
                            <article
                                key={topThree[1].telegram_id}
                                className={`flex flex-col items-center bg-[#1a1a2e] w-full py-3 rounded-xl
                        ${Number(topThree[1].telegram_id) === telegramId ? "ring-2 ring-purple-500" : ""}`}
                            >
                                <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-[#5B2EFF]">
                                    {topThree[1].profile_photo ? (
                                        <img src={topThree[1].profile_photo} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-lg">
                                            {topThree[1].name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <p className="text-white text-sm font-semibold truncate max-w-[80px] text-center">
                                    {topThree[1].name}
                                </p>
                                <p className="text-yellow-400 text-lg font-bold">{topThree[1].referral_count} rfs</p>
                                <p className="text-gray-400 text-xs mt-1">2nd</p>
                            </article>
                        )}

                        {/* 1st place - Center (Higher & Bigger) */}
                        {topThree[0] && (
                            <article
                                key={topThree[0].telegram_id}
                                className={`flex flex-col items-center bg-[#1a1a2e] w-full py-4 rounded-xl transform -translate-y-3
                    ${Number(topThree[0].telegram_id) === telegramId ? "ring-2 ring-purple-500 shadow-[0_0_12px_rgba(162,89,255,0.3)]" : ""}`}
                            >
                                <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-[#5B2EFF]">
                                    {topThree[0].profile_photo ? (
                                        <img src={topThree[0].profile_photo} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-lg">
                                            {topThree[0].name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <p className="text-white text-base font-bold truncate max-w-[90px] text-center">
                                    {topThree[0].name}
                                </p>
                                <p className="text-yellow-400 text-xl font-bold">{topThree[0].referral_count} rfs</p>
                                <p className="text-gray-300 text-sm mt-1">1st</p>
                            </article>
                        )}

                        {/* 3rd place - Right */}
                        {topThree[2] && (
                            <article
                                key={topThree[2].telegram_id}
                                className={`flex flex-col items-center bg-[#1a1a2e] w-full py-3 rounded-xl
                ${Number(topThree[2].telegram_id) === telegramId ? "ring-2 ring-purple-500" : ""}`}
                            >
                                <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-[#A259FF]">
                                    {topThree[2].profile_photo ? (
                                        <img src={topThree[2].profile_photo} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-400 text-white font-bold text-lg">
                                            {topThree[2].name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <p className="text-white text-sm font-semibold truncate max-w-[80px] text-center">
                                    {topThree[2].name}
                                </p>
                                <p className="text-yellow-400 text-lg font-bold">{topThree[2].referral_count} rfs</p>
                                <p className="text-gray-400 text-xs mt-1">3rd</p>
                            </article>
                        )}

                    </div>
                </section >


                {/* 4–10 Users */}
                < section className="bg-[#1a1a2e] w-full max-w-6xl rounded-xl py-4 divide-y divide-[#292947] px-2" >
                    {
                        others.map((user) => (
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
                        ))
                    }
                </section >

                {/* Separate Current User (if not in Top 10) */}
                {
                    currentUser && (
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
                    )
                }
            </main >
        </div >
    );
}