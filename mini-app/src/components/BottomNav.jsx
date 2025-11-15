import { useEffect, useState } from "react";
import { FaHome, FaWallet, FaTrophy, FaUserShield } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { publicApi } from "../components/Api";

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isReferralPage, setIsReferralPage] = useState(false);

    useEffect(() => {
        const checkAdminRole = async () => {
            try {
                const tg = window.Telegram?.WebApp;
                const username = tg?.initDataUnsafe?.user?.username;

                if (!username) return;

                // ✅ Check if Super Admin
                const superAdmin = import.meta.env.VITE_SUPER_ADMIN?.trim();
                if (superAdmin && username === superAdmin) {
                    setIsAdmin(true);
                    return;
                }

                // ✅ Not super admin → Check with backend if admin
                const res = await publicApi.get(`/api/admin/check-admin?username=${username}`);
                if (res.data?.isAdmin) {
                    setIsAdmin(true);
                }
            } catch (err) {
                console.error("❌ Error checking admin role:", err.message);
            }
        };

        checkAdminRole();
    }, []);

    // ✅ Check if the current page is `/referrals`
    useEffect(() => {
        if (location.pathname === "/referrals") {
            setIsReferralPage(true);
        } else {
            setIsReferralPage(false);
        }
    }, [location.pathname]);

    // Prevent rendering of BottomNav if it's the referrals page
    if (isReferralPage) return null;

    // ✅ Base navigation items
    const navItems = [
        { icon: <FaHome />, label: "Dashboard", path: "/" },
        { icon: <FaTrophy />, label: "Leaderboard", path: "/leaderboard" },
        { icon: <FaWallet />, label: "Withdraw", path: "/withdraw" },
    ];

    // ✅ Add admin page if user is admin or super admin
    if (isAdmin) {
        navItems.push({
            icon: <FaUserShield />,
            label: "Admin",
            path: "/admin",
        });
    }

    return (
        <div className="fixed bottom-0 left-0 w-full bg-[#0D0D0D]/95 backdrop-blur-lg border-t border-[#5B2EFF]/30 flex justify-around py-3 shadow-[0_-4px_20px_rgba(162,89,255,0.15)] z-50">
            {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                    <motion.div
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        whileTap={{ scale: 0.9 }}
                        className={`flex flex-col items-center cursor-pointer text-xs font-medium transition-all duration-200 ${active
                            ? "text-[#CBA6F7]"
                            : "text-[#BFBFBF] hover:text-[#A259FF]"
                            }`}
                    >
                        <motion.div
                            animate={{
                                scale: active ? 1.2 : 1,
                                color: active ? "#CBA6F7" : "#BFBFBF",
                            }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className={`text-lg ${active
                                ? "drop-shadow-[0_0_10px_rgba(162,89,255,0.7)]"
                                : "drop-shadow-none"
                                }`}
                        >
                            {item.icon}
                        </motion.div>
                        <span className="mt-1">{item.label}</span>
                        {
                            active && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="h-[3px] w-6 rounded-full bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] mt-1 shadow-[0_0_8px_rgba(162,89,255,0.6)]"
                                />
                            )
                        }
                    </motion.div >
                );
            })}
        </div >
    );
}