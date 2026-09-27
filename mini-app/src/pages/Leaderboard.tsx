import LoadingState from "../components/Loading";
import ErrorState from "../components/Error";
import { useApp } from "../context/UserContext";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import JoinChannelBlocker from "../components/JoinChannelBlocker";

export default function Leaderboard() {
  const { user, loading, error, leaderboard, initApp, channelUsername } = useApp();
  const { topThree, others, currentUser, isUserInTopTen } = leaderboard;

  if (loading) return <LoadingState message="Loading Leaderboard" />;
  if (error || !user) return <ErrorState retry={initApp} />;

  const telegram_id = user.telegram_id

  return (
    <div className="min-h-screen pb-28 w-full bg-[#000000] text-white font-sans">
      <main className="px-4 py-10 flex flex-col items-center gap-10">
        {/* Header */}
        <header className="w-full max-w-3xl text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#A259FF] to-[#B388FF] drop-shadow-lg">
            Leaderboard
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Track top referrers and see how you rank! Invite friends and climb
            the leaderboard.
          </p>
        </header>

        {/* Top 3 Users */}
        <section className="w-full max-w-5xl mx-auto mt-4 px-2">
          <div className="grid grid-cols-3 gap-3 place-items-center">
            {/* 2nd place */}
            {topThree[1] && (
              <article
                key={topThree[1].telegram_id}
                className={`flex flex-col items-center bg-[#1a1a2e] w-full py-3 rounded-xl
                        ${String(topThree[1].telegram_id) === String(telegram_id) ? "ring-2 ring-purple-500" : ""}`}
              >
                <Avatar className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-[#5B2EFF]">
                  <AvatarImage
                    src={topThree[1].profile_photo || ""}
                    alt={topThree[1].first_name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-lg">
                    {topThree[1].first_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <p className="text-white text-sm font-semibold truncate max-w-[80px] text-center">
                  {topThree[1].first_name}
                </p>
                <p className="text-yellow-400 text-lg font-bold">
                  {topThree[1].referral_count.toLocaleString()} rfs
                </p>
                <p className="text-gray-400 text-xs mt-1">2nd</p>
              </article>
            )}

            {/* 1st place */}
            {topThree[0] && (
              <article
                key={topThree[0].telegram_id}
                className={`flex flex-col items-center bg-[#1a1a2e] w-full py-4 rounded-xl transform -translate-y-3
                    ${String(topThree[0].telegram_id) === String(telegram_id) ? "ring-2 ring-purple-500 shadow-[0_0_12px_rgba(162,89,255,0.3)]" : ""}`}
              >
                <Avatar className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-[#5B2EFF]">
                  <AvatarImage
                    src={topThree[0].profile_photo || ""}
                    alt={topThree[0].first_name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-lg">
                    {topThree[0].first_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <p className="text-white text-base font-bold truncate max-w-[90px] text-center">
                  {topThree[0].first_name}
                </p>
                <p className="text-yellow-400 text-xl font-bold">
                  {topThree[0].referral_count.toLocaleString()} rfs
                </p>
                <p className="text-gray-300 text-sm mt-1">1st</p>
              </article>
            )}

            {/* 3rd place */}
            {topThree[2] && (
              <article
                key={topThree[2].telegram_id}
                className={`flex flex-col items-center bg-[#1a1a2e] w-full py-3 rounded-xl
                ${String(topThree[2].telegram_id) === String(telegram_id) ? "ring-2 ring-purple-500" : ""}`}
              >
                <Avatar className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-[#A259FF]">
                  <AvatarImage
                    src={topThree[2].profile_photo || ""}
                    alt={topThree[2].first_name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-lg">
                    {topThree[2].first_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <p className="text-white text-sm font-semibold truncate max-w-[80px] text-center">
                  {topThree[2].first_name}
                </p>
                <p className="text-yellow-400 text-lg font-bold">
                  {topThree[2].referral_count.toLocaleString()} rfs
                </p>
                <p className="text-gray-400 text-xs mt-1">3rd</p>
              </article>
            )}
          </div>
        </section>

        {/* 4–10 Users */}
        <section className="bg-[#1a1a2e] w-full max-w-6xl rounded-xl py-4 divide-y divide-[#292947] px-2">
          {others.map((user, index) => (
            <article
              key={user.telegram_id}
              className={`flex justify-between items-center px-2 sm:px-6 py-4 text-sm sm:text-base rounded-lg transition-all duration-200

`}
            >
              <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                <span className="text-gray-400 w-5 sm:w-6 text-right">
                  {index + 4}
                </span>
                <Avatar className="w-9 h-9 sm:w-10 sm:h-10 rounded-full">
                  <AvatarImage src={user.profile_photo || ""} alt={user.first_name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-lg">
                    {user.first_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-white truncate flex items-center gap-1">
                  {user.first_name}
                  {String(user.telegram_id) === String(telegram_id) && (
                    <span className="text-xs text-purple-400 font-semibold">
                      (You)
                    </span>
                  )}
                </span>
              </div>
              <div className="text-gray-300 font-semibold text-right">
                {user.referral_count.toLocaleString()} rfs
              </div>
            </article>
          ))}
        </section>

        {/* Separate Current User */}
        {(currentUser && !isUserInTopTen) && (
          <section className="bg-[#1a1a2e] w-full max-w-6xl rounded-xl px-4 sm:px-6 py-6 relative mt-4">
            <div className="absolute -top-3 left-6 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
              Your Info
            </div>
            <div className="flex justify-between items-center text-sm sm:text-base flex-wrap gap-y-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="w-10 h-10 sm:w-11 sm:h-11 rounded-full">
                  <AvatarImage
                    src={currentUser.profile_photo || ""}
                    alt={currentUser.first_name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-lg">
                    {currentUser.first_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white font-semibold truncate">
                    {currentUser.first_name}
                  </div>
                </div>
              </div>
              <div className="text-purple-400 font-bold text-base sm:text-lg text-right">
                {currentUser.referral_count?.toLocaleString()} rfs
              </div>
            </div>
          </section>
        )}
      </main>

      {!user.joined_channel && (
        <JoinChannelBlocker
          channelLink={`https://t.me/${channelUsername}`}
          onReload={initApp}
        />
      )}
    </div>
  );
}
