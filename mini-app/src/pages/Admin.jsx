import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { publicApi } from "../components/Api";
import LoadingState from "../components/Loading";
import ErrorState from "../components/Error";

export default function AdminPage() {
    const [adminUsername, setAdminUsername] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [alert, setAlert] = useState();

    // ✅ Fetch withdrawals
    const fetchWithdrawals = async (username) => {
        setLoading(true);
        try {
            const res = await publicApi.get(`/api/withdrawals/admin?username=${username}`);
            setWithdrawals(res.data.withdrawals);
            setError(null);
        } catch (err) {
            console.error("Error fetching withdrawals:", err);
            setError("Failed to fetch withdrawals.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Initialize admin from Telegram WebApp
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        const username = tg?.initDataUnsafe?.user?.username;

        if (!username) {
            setError("Telegram WebApp user not found.");
            setLoading(false);
            return;
        }

        setAdminUsername(username);
        fetchWithdrawals(username);
    }, []);

    // ✅ Handle withdrawal processing
    const handleProcess = async (id, user_Id) => {
        if (processingId === id) return;
        setProcessingId(id);

        try {
            await publicApi.post("/api/withdrawals/process", { id, user_Id });
            setWithdrawals((prev) => prev.filter((w) => w.id !== id));
            showAlert("success");
        } catch (err) {
            console.error("Error processing withdrawal:", err);
            showAlert("error");
        } finally {
            setProcessingId(null);
        }
    };

    // ✅ Alert displayer
    const showAlert = (type) => {
        setAlert(type);
        setTimeout(() => setAlert(), 4000); // Hide after 4s
    };

    if (loading) return <LoadingState message="Loading assigned withdrawals..." />;
    if (error) return <ErrorState retry={() => fetchWithdrawals(adminUsername)} />;

    return (
        <div className={`min-h-screen bg-[#000000] text-white pb-28 px-4 font-sans relative overflow-hidden ${alert ? "pt-16" : "pt-6"}`}>
            {/* ✅ Floating alert */}
            <AnimatePresence>
                {alert && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`fixed top-4 inset-x-0 z-50 flex justify-center`}
                    >
                        {
                            alert === "success" ? (
                                <div className="bg-green-500/20 text-green-400 flex items-center gap-2 mb-4 p-3 rounded-xl ">
                                    <CheckCircle /> Withdrawal marked as paid successfully!
                                </div>
                            ) : (
                                <div className="bg-red-500/20 text-red-400 flex items-center gap-2 mb-4 p-3 rounded-xl ">
                                    <XCircle /> Failed to mark as paid. Please try again.
                                </div>
                            )}
                    </motion.div>
                )}
            </AnimatePresence>


            <h1 className="text-3xl font-bold mt-6 mb-6 text-purple-400 text-center">
                Pending Withdrawals
            </h1>

            {
                withdrawals.length === 0 ? (
                    <p className="text-gray-400 text-center mt-10">
                        No pending withdrawals assigned to you.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {withdrawals.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-[#1A1A1A] p-4 rounded-2xl shadow-md flex justify-between items-center"
                            >
                                <div>
                                    <p className="text-white font-semibold">

                                        David, [11/9/2025 1:56 PM]
                                        {Number(item.requested_amount).toFixed(2)} BIRR
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        {item.name} | {item.bank_name} | {item.bank_account}
                                    </p>
                                    {item.phone && (
                                        <p className="text-gray-400 text-sm">Phone: {item.phone}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleProcess(item.id, item.user_id)}
                                    disabled={processingId === item.id}
                                    className={`px-4 py-2 rounded-xl font-bold transition ${processingId === item.id
                                        ? "bg-gray-600 cursor-not-allowed"
                                        : "bg-green-500 hover:bg-green-600"
                                        }`}
                                >
                                    {processingId === item.id ? "Processing..." : "Mark as Paid"}
                                </button>
                            </motion.div>
                        ))
                        }
                    </div >
                )
            }
        </div >
    );
}