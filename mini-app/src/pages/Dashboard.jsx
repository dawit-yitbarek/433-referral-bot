import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { FaCopy } from "react-icons/fa";
import { motion } from "framer-motion";
import ErrorState from "../components/Error";
import LoadingState from "../components/Loading";
import { publicApi } from '../components/Api';
import JoinChannelBlocker from '../components/JoinChannelBlocker';

const withdrawThreshold = Number(import.meta.env.VITE_WITHDRAW_THRESHOLD);
const referralPoint = Number(import.meta.env.VITE_REFERRAL_POINT);

export default function Dashboard() {
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0)
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    setLoading(true)

    const loadUser = async () => {
      try {
        if (!tg || !tg.initDataUnsafe?.user) {
          throw new Error("Telegram WebApp user data not found");
        }

        const telegramUser = tg.initDataUnsafe.user;
        const userId = telegramUser.id;
        const name = telegramUser.first_name;

        // Send user info to backend
        const res = await publicApi.post("/api/user/sync", { id: userId, name });
        setUser(res.data.user);
      } catch (err) {
        console.error("❌ Error loading user:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [refresh]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://t.me/Geldearn_Bot?start=${user.telegram_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const progress = Math.min(((user.unclaimed_referrals * referralPoint) / withdrawThreshold) * 100, 100);

  if (loading) {
    return <LoadingState message={"Loading your dashboard"} />
  }

  if (error) {
    return <ErrorState retry={() => setRefresh(prev => prev + 1)} />
  }


  return (
    <div className="min-h-screen bg-[#000000] text-white pb-28 px-4 font-poppins relative overflow-hidden">
      {/* Glowing gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/30 via-transparent to-[#000]/80 pointer-events-none"></div>

      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mt-8 text-center bg-gradient-to-r from-[#A259FF] to-[#CBA6F7] bg-clip-text text-transparent"
      >
        Welcome, {user.name}
      </motion.h1>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-[#1A1A1A] rounded-3xl p-6 border border-[#5B2EFF]/20 shadow-[0_0_25px_rgba(162,89,255,0.15)] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B2EFF]/10 to-transparent"></div>
        <p className="text-[#BFBFBF] mb-2 text-center font-medium">Your Balance</p>
        <h2 className="text-5xl font-bold text-center text-[#A259FF] tracking-wide">
          {(user.unclaimed_referrals * referralPoint).toFixed(2)} BIRR
        </h2>
        <p className="mt-2 text-sm text-center text-[#808080]">
          Withdraw at <span className="text-[#CBA6F7] font-semibold">{withdrawThreshold} BIRR</span>
        </p>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-[#0D0D0D] rounded-full mt-5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
            className="h-3 rounded-full bg-gradient-to-r from-[#A259FF] via-[#B388FF] to-[#5B2EFF] shadow-[0_0_20px_#A259FF]"
          ></motion.div>
        </div>
        <p className="mt-3 text-xs text-center text-[#BFBFBF]">
          {progress.toFixed(1)}% of goal reached
        </p>
      </motion.div>

      {/* Referral Link Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-[#1A1A1A] rounded-3xl p-6 border border-[#5B2EFF]/20 shadow-[0_0_25px_rgba(91,46,255,0.15)]"
      >
        <p className="text-sm font-semibold text-[#BFBFBF] mb-2">Your Referral Link</p>
        <div className="flex items-center gap-4 justify-between bg-[#0D0D0D] rounded-2xl p-3 border border-[#5B2EFF]/30">
          <span className="text-xs md:text-sm break-all text-[#CBA6F7]">
            {`https://t.me/Geldearn_Bot?start=${user.telegram_id}`}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] hover:opacity-90 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            <FaCopy /> {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </motion.div>

      {/* Withdraw Button */}
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => navigate("/withdraw")}
        className={`w-full mt-8 py-4 rounded-3xl font-semibold text-white ${user.unclaimed_referrals * referralPoint >= withdrawThreshold
          ? "bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] shadow-[0_0_30px_rgba(162,89,255,0.5)] hover:opacity-90"
          : "bg-[#0D0D0D] border border-[#1A1A1A] text-[#808080] cursor-not-allowed"
          } transition-all duration-300`}
        disabled={user.unclaimed_referrals * referralPoint < withdrawThreshold}
      >
        {user.unclaimed_referrals * referralPoint >= withdrawThreshold
          ? "Withdraw Now"
          : "Keep Referring to Withdraw"}
      </motion.button>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-[#1A1A1A] p-4 rounded-3xl text-center border border-[#5B2EFF]/20 shadow-[0_0_15px_rgba(162,89,255,0.1)]">
          <p className="text-sm text-[#BFBFBF]">Total Referrals</p>
          <p className="text-2xl font-bold text-[#CBA6F7]">{user.total_referrals}</p>
        </div>
        <div className="bg-[#1A1A1A] p-4 rounded-3xl text-center border border-[#5B2EFF]/20 shadow-[0_0_15px_rgba(162,89,255,0.1)]">
          <p className="text-sm text-[#BFBFBF]">Referral Earnings</p>
          <p className="text-2xl font-bold text-[#A259FF]">
            {(user.claimed_referrals * referralPoint).toFixed(2)} BIRR
          </p>
        </div>
      </div>

      {!user.hasJoined && (
        <JoinChannelBlocker
          channelLink="https://t.me/Sport_433et"
          onReload={() => setRefresh(prev => prev + 1)}
        />
      )}
    </div>
  );
}