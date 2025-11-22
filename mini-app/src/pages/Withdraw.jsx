import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LoadingState from "../components/Loading";
import ErrorState from "../components/Error";
import { publicApi } from "../components/Api";
import { CheckCircle, XCircle } from "lucide-react";

export default function Withdraw() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [withdrawHistory, setWithdrawHistory] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [message, setMessage] = useState({ text: "", type: "" });

    const [form, setForm] = useState({
        name: "",
        bank_name: "",
        bank_account: "",
        phone: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const minWithdraw = Number(import.meta.env.VITE_WITHDRAW_THRESHOLD);
    const referralPoint = Number(import.meta.env.VITE_REFERRAL_POINT);

    // Load user and withdrawal history
    useEffect(() => {
        const loadUserData = async () => {
            setLoading(true)
            try {
                const tg = window.Telegram?.WebApp;
                if (!tg?.initDataUnsafe?.user) throw new Error("Telegram WebApp user data not found");

                const telegramId = tg.initDataUnsafe.user.id;
                const name = tg.initDataUnsafe.user.first_name;

                const res = await publicApi.post("/api/user/sync", { id: telegramId, name });
                setUser(res.data.user);

                const historyRes = await publicApi.get(`/api/withdrawals?user_id=${res.data.user.id}`);
                setWithdrawHistory(historyRes.data.withdrawals);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [refresh]);

    if (loading) return <LoadingState message="Loading withdraw page..." />;
    if (error) return <ErrorState retry={() => setRefresh((prev) => prev + 1)} />;

    const balance = parseFloat(user.unclaimed_referrals * referralPoint);
    const progress = Math.min((balance / minWithdraw) * 100, 100);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleWithdraw = async () => {
        if (!form.name.trim() || !form.bank_name.trim() || !form.bank_account.trim()) {
            setMessage({ text: "Please fill in all required fields.", type: "error" });
            return;
        }

        setSubmitting(true);
        setMessage({ text: "", type: "" });

        try {
            await publicApi.post("/api/withdrawals", {
                user_id: user.id,
                name: form.name,
                bank_name: form.bank_name,
                bank_account: form.bank_account,
                phone: form.phone,
            });

            setMessage({ text: "Withdrawal request submitted successfully!", type: "success" });

            // Auto-refresh after short delay
            setTimeout(() => {
                setShowModal(false);
                setForm({ name: "", bank_name: "", bank_account: "", phone: "" });
                setMessage({ text: "", type: "" })
                setSubmitting(false);
                setRefresh((prev) => prev + 1);
            }, 2000);
        } catch (err) {
            console.error(err);
            setMessage({ text: "Error submitting withdrawal request.", type: "error" });
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white pb-28 px-4 font-sans relative overflow-hidden">
            <h1 className="text-3xl font-bold mt-6 mb-6 text-purple-400">Withdraw</h1>

            {/* Balance Card */}
            <div className="bg-[#1A1A1A] p-6 rounded-2xl shadow-lg space-y-4">
                <p className="text-gray-400 text-sm">
                    Your Balance:
                    <span className="font-bold text-white ml-2">{balance.toFixed(2)} BIRR</span>
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                        className="h-4 rounded-full bg-gradient-to-r from-[#A259FF] to-[#B388FF]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                    {balance < minWithdraw
                        ? `${(minWithdraw - balance).toFixed(2)} BIRR left to reach minimum withdrawal`
                        : "You can withdraw now!"}
                </p>

                {/* Withdraw Button */}
                <button
                    className={`w-full py-3 rounded-xl font-bold transition ${balance >= minWithdraw
                        ? "bg-purple-500 hover:bg-purple-600"
                        : "bg-gray-600 cursor-not-allowed"
                        }`}
                    disabled={balance < minWithdraw}
                    onClick={() => setShowModal(true)}
                >
                    Withdraw Now
                </button>
            </div>

            {/* Withdraw History */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-purple-400">Withdraw History</h2>
                <div className="space-y-3">
                    {withdrawHistory.length === 0 ? (
                        <p className="text-gray-400 text-center">No withdrawal history yet.</p>
                    ) : (
                        withdrawHistory.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl shadow-md"
                            >
                                <div>
                                    <p className="text-white font-semibold">
                                        {Number(item.requested_amount).toFixed(2)} BIRR
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        {new Date(item.processed_at || item.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === "paid"
                                        ? "bg-green-500 text-black"
                                        : "bg-yellow-500 text-black"
                                        }`}
                                >
                                    {item.status === "paid" ? "Paid" : "Pending"}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1A1A1A] p-6 rounded-3xl w-full max-w-md space-y-4"
                    >
                        <h2 className="text-xl font-bold text-purple-400 text-center">
                            Withdraw Details
                        </h2>

                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-[#000000] border border-[#5B2EFF] text-white focus:outline-none"
                        />
                        <input
                            type="text"
                            name="bank_name"
                            placeholder="Bank Name"
                            value={form.bank_name}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-[#000000] border border-[#5B2EFF] text-white focus:outline-none"
                        />
                        <input
                            type="text"
                            name="bank_account"
                            placeholder="Bank Account"
                            value={form.bank_account}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-[#000000] border border-[#5B2EFF] text-white focus:outline-none"
                        />
                        <input
                            type="text"
                            name="phone"
                            placeholder="Phone (Optional)"
                            value={form.phone}
                            onChange={handleChange}
                            className="w-full p-3 rounded-xl bg-[#000000] border border-[#5B2EFF] text-white focus:outline-none"
                        />

                        {/* Feedback Message */}
                        {message.text && (
                            <div
                                className={`flex items-center gap-2 mb-4 p-3 rounded-xl ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                    }`}
                            >
                                {message.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                <span className="text-sm">{message.text}</span>
                            </div>
                        )}

                        <div className="flex justify-between mt-4">
                            <button
                                className="px-4 py-2 rounded-xl bg-gray-600 hover:bg-gray-700"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 font-bold ${submitting ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                disabled={submitting}
                                onClick={handleWithdraw}
                            >
                                {submitting ? "Submitting..." : "Confirm"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}