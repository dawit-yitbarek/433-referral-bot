import type { User } from "../types/user";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";


interface UserCardProps {
    user: User;
    onClick?: () => void;
    isClickable?: boolean;
}

const formatShortDate = (iso?: string | Date) => {
    if (!iso) return "";
    const d = new Date(iso);
    const opts = { month: "short", day: "2-digit", year: "numeric" } as const;
    return d.toLocaleDateString(undefined, opts).replace(",", "");
};

export function UserCard({ user, onClick, isClickable = false }: UserCardProps) {
    return (
        <motion.div
            whileTap={isClickable ? { scale: 0.98 } : undefined}
            onClick={isClickable ? onClick : undefined}
            className={`bg-[#1A1A1A] p-4 rounded-3xl border border-[#5B2EFF]/20 shadow-[0_0_15px_rgba(162,89,255,0.1)] flex items-center gap-4 ${isClickable ? "cursor-pointer" : ""
                }`}
        >
            <Avatar className="w-14 h-14 rounded-full border border-[#5B2EFF]/30">
                <AvatarImage src={user.profile_photo || ""} alt={user.first_name} />
                <AvatarFallback className="bg-gradient-to-br from-[#5B2EFF] to-[#A259FF] text-white font-bold text-lg">
                    {user.first_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1">
                <p className="text-lg font-semibold text-[#CBA6F7]">
                    {user.first_name}
                </p>
                {user.username && (
                    <a
                        href={`https://t.me/${user.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-[#BFBFBF] hover:text-[#A259FF] hover:underline transition-colors inline-block"
                    >
                        @{user.username}
                    </a>
                )}
            </div>

            <div className="text-right">
                <p className="text-sm text-[#BFBFBF]">Referrals</p>
                <p className="text-xl font-bold text-[#A259FF]">
                    {user.referral_count ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {formatShortDate(user.created_at)}
                </p>
            </div>
        </motion.div>
    );
}