import { motion } from "framer-motion";

export default function LoadingState({message}){
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#000000] text-white font-poppins relative overflow-hidden">
      {/* Glowing background animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#0D0D0D] to-[#000000] animate-pulse-slow"></div>

      {/* Animated dots */}
      <div className="flex space-x-3">
        {[...Array(3)].map((_, idx) => (
          <motion.div
            key={idx}
            className="w-5 h-5 rounded-full bg-gradient-to-r from-[#A259FF] via-[#B388FF] to-[#5B2EFF]"
            animate={{
              y: ["0%", "-50%", "0%"],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: idx * 0.2,
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <motion.p
        className="mt-6 text-lg text-[#CBA6F7] font-semibold tracking-wide"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        {message}
      </motion.p>

      {/* Optional subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#5B2EFF]/10 to-transparent pointer-events-none"></div>
    </div>
  );
}