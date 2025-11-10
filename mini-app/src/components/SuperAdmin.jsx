import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Trash2, UserPlus, XCircle } from "lucide-react";
import { publicApi } from "../components/Api";
import LoadingState from "../components/Loading";
import ErrorState from "../components/Error";

export default function SuperAdmin() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("pending");
    const [alert, setAlert] = useState(null);
    const [newAdmin, setNewAdmin] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [deletingAdmin, setDeletingAdmin] = useState(false);

    // ✅ Fetch all withdrawals and admins
    const fetchData = async () => {
        setLoading(true);
        try {
            const [wRes, aRes] = await Promise.all([
                publicApi.get("/api/admin/withdrawals"),
                publicApi.get("/api/admin"),
            ]);

            setWithdrawals(wRes.data.withdrawals);
            setAdmins(aRes.data.admins);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    // ✅ Add new admin
    const handleAddAdmin = async () => {
        if (!newAdmin.trim()) return;
        setAddingAdmin(true)
        try {
            const username = newAdmin.trim()
            await publicApi.post(`/api/admin/add?username=${username}`);
            setNewAdmin("");
            showAlert("success", "Admin added successfully!");
            setAdmins((prev) => [...prev, { username }]);
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed to add admin.");
        } finally {
            setAddingAdmin(false)
        }
    };

    // ✅ Delete admin with confirmation
    const handleDeleteAdmin = async (username) => {
        setDeletingAdmin(true)
        try {
            await publicApi.delete(`/api/admin/delete?username=${username}`);
            showAlert("success", "Admin removed successfully!");
            setConfirmDelete(null);
            setAdmins((prev) => prev.filter((a) => a.username !== username));
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed to delete admin.");
        } finally {
            setDeletingAdmin(false)
        }
    };

    // ✅ Alerts
    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 4000);
    };

    if (loading) return <LoadingState message="Loading admin dashboard..." />;
    if (error) return <ErrorState retry={fetchData} />;

    // ✅ Filter withdrawals by tab
    const filtered = withdrawals
        .filter((w) => w.status === activeTab)
        .sort((a, b) => {
            if (activeTab === "pending") {
                // Ascending (oldest first, latest last)
                return new Date(a.created_at) - new Date(b.created_at);
            } else {
                // Descending (latest first)
                return new Date(b.processed_at) - new Date(a.processed_at);
            }
        });

    return (
        <div className="min-h-screen bg-black text-white pb-28 px-4 font-sans relative overflow-hidden pt-6">
            {/* ✅ Floating alert */}
            <AnimatePresence>
                {alert && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="fixed top-4 inset-x-0 z-50 flex justify-center"
                    >
                        <div
                            className={`${alert.type === "success"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                                } flex items-center gap-2 mb-4 p-3 rounded-xl`}
                        >
                            {alert.type === "success" ? <CheckCircle /> : <XCircle />}
                            {alert.message}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <h1 className="text-3xl font-bold text-purple-400 text-center mb-6">
                Super Admin Dashboard
            </h1>

            {/* 🔹 Tabs */}
            <div className="flex justify-center gap-6 mb-8">
                {["pending", "paid"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`capitalize px-6 py-2 rounded-xl font-semibold transition ${activeTab === tab
                            ? "bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] text-white"
                            : "bg-[#1A1A1A] text-gray-400 hover:text-white"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* 🔹 Withdrawals list */}
            {filtered.length === 0 ? (
                <p className="text-gray-400 text-center">
                    No {activeTab} withdrawal requests found.
                </p>
            ) : (
                <div className="space-y-4">
                    {filtered.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#1A1A1A] p-4 rounded-2xl shadow-md"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-lg text-white">
                                        {Number(item.requested_amount).toFixed(2)} BIRR
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        {item.name} | {item.bank_name} | {item.bank_account}
                                    </p>
                                    {item.phone && (
                                        <p className="text-gray-400 text-sm">
                                            Phone: {item.phone}
                                        </p>
                                    )}
                                    <p className="text-gray-500 text-xs mt-1">
                                        Requested: {new Date(item.created_at).toLocaleString(
                                            "en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            }
                                        )}
                                    </p>
                                    {item.processed_at && (
                                        <p className="text-gray-500 text-xs">
                                            Processed: {new Date(item.processed_at).toLocaleString(
                                            "en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            }
                                        )}
                                        </p>
                                    )}
                                    <p className="text-gray-500 text-xs">
                                        Assigned To: {item.assigned_to}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* 🔹 Admin management */}
            <div className="mt-12 border-t border-[#5B2EFF]/30 pt-6">
                <h2 className="text-2xl font-semibold text-purple-400 mb-4 text-center">
                    Manage Admins
                </h2>

                <div className="flex items-center gap-2 justify-center mb-6">
                    <input
                        type="text"
                        placeholder="Enter username(without @)"
                        value={newAdmin}
                        onChange={(e) => setNewAdmin(e.target.value)}
                        className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xl focus:outline-none border border-[#5B2EFF]/40 focus:border-[#A259FF] w-60"
                    />
                    <button
                        disabled={!newAdmin || addingAdmin}
                        onClick={handleAddAdmin}
                        className="bg-gradient-to-r from-[#A259FF] to-[#5B2EFF] px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition"
                    >
                        {addingAdmin ? "Adding..." : <><UserPlus className="w-4 h-4" /> Add </>}
                    </button>
                </div>

                {/* Current Admins */}
                <div className="space-y-3 max-w-md mx-auto">
                    {admins.length === 0 ? (
                        <p className="text-gray-400 text-center">No admins added yet.</p>
                    ) : (
                        admins.map((admin) => (
                            <div
                                key={admin.username}
                                className="bg-[#1A1A1A] flex justify-between items-center p-3 rounded-xl"
                            >
                                <p className="text-white font-medium">@{admin.username}</p>
                                <button
                                    onClick={() => setConfirmDelete(admin.username)}
                                    className="text-red-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 🔹 Delete confirmation popup */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-[#1A1A1A] p-6 rounded-2xl shadow-lg text-center w-[90%] max-w-sm"
                        >
                            <h3 className="text-lg font-semibold mb-2 text-white">
                                Remove Admin
                            </h3>
                            <p className="text-gray-400 mb-4">
                                Are you sure you want to remove <b>@{confirmDelete}</b>?
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    disabled={deletingAdmin}
                                    onClick={() => handleDeleteAdmin(confirmDelete)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold"
                                >
                                    {deletingAdmin ? "Removing..." : "Yes, Remove"}
                                </button>
                                <button
                                    disabled={deletingAdmin}
                                    onClick={() => setConfirmDelete(null)}
                                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}