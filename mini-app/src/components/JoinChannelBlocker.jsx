import { motion } from "framer-motion";
import { FaTelegramPlane } from "react-icons/fa";

export default function JoinChannelBlocker({ channelLink, onReload }) {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[999] flex items-center justify-center">
            {/* Animated floating glow background */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-gradient-to-b from-[#5B2EFF]/20 via-transparent to-[#A259FF]/10 blur-3xl pointer-events-none"
            />

            {/* Center card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 12 }}
                className="relative bg-[#0D0D0D]/90 border border-[#5B2EFF]/40 rounded-3xl p-8 w-[90%] max-w-md shadow-[0_0_30px_rgba(162,89,255,0.25)] text-center"
            >
                {/* Header */}
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#A259FF] to-[#CBA6F7] bg-clip-text text-transparent mb-3">
                    Join Our Channel
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                    You need to join our Telegram channel to continue using this app.
                </p>

                {/* Join button */}
                <motion.a
                    href={channelLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] py-3 rounded-xl text-white font-semibold shadow-[0_0_15px_rgba(162,89,255,0.5)] transition"
                >
                    <FaTelegramPlane className="text-lg" />
                    Join Telegram Channel
                </motion.a>

                {/* Reload button */}
                <motion.button
                    onClick={onReload}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-5 w-full py-3 rounded-xl font-semibold text-[#CBA6F7] border border-[#5B2EFF]/40 hover:bg-[#1A1A1A] transition-all duration-200"
                >
                    I’ve Joined — Reload
                </motion.button>
            </motion.div>
        </div>
    );
}