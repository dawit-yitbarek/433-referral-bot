import { motion } from "framer-motion";

export default function ErrorState({retry}){
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#000000] text-white font-poppins relative overflow-hidden px-4">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#0D0D0D] to-[#000000] animate-pulse-slow"></div>

      {/* Content wrapper to ensure z-index above background */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Error icon */}
        <motion.div
          className="w-24 h-24 mb-6 rounded-full bg-gradient-to-r from-[#FF4D6D] via-[#FF6B9C] to-[#FF85B3] flex items-center justify-center shadow-[0_0_30px_rgba(255,77,109,0.5)]"
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>

        {/* Error message */}
        <motion.p
          className="text-center text-[#FF6B9C] text-lg sm:text-xl font-semibold mb-6"
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Oops! Something went wrong.
        </motion.p>

        {/* Retry button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={retry}
          className="px-8 py-3 bg-gradient-to-r from-[#A259FF] via-[#B388FF] to-[#5B2EFF] rounded-3xl text-white font-bold shadow-[0_0_20px_rgba(162,89,255,0.5)] hover:opacity-90 transition relative z-10"
        >
          Retry
        </motion.button>
      </div>
    </div>
  );
}