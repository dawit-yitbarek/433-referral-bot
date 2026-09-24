import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Copy, Check, X } from "lucide-react";
import { publicApi } from "../components/Api";
import LoadingState from "../components/Loading";
import ErrorState from "../components/Error";
import type { MessageState } from "../types/index";
import { useAdminWithdraw } from "../context/AdminContext";
import type { WithdrawalRequest } from "../types/withdrawal";


interface selectedItemType {
    request: WithdrawalRequest;
    type: 'reject' | 'approve'
}

export default function AdminPage() {
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [alert, setAlert] = useState<MessageState["type"] | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Rejection modal state
    const [selectedItem, setSelectedItem] = useState<selectedItemType | null>(null)
    const [rejectionReason, setRejectionReason] = useState("");

    const { user, error, loading, withdrawalRequests, setWithdrawalRequests, refresh } = useAdminWithdraw();

    if (loading) return <LoadingState message="Loading admin data..." />;
    if (error || !user) return <ErrorState retry={() => refresh()} />;

    // Trigger floating alert
    const showAlert = (type: MessageState["type"]) => {
        setAlert(type);
        setTimeout(() => setAlert(null), 4000);
    };

    // Process approval or rejection
    const handleProcess = async (
        payout_id: number,
        action: "approve" | "reject",
        reason?: string
    ) => {
        if (processingId === payout_id) return;
        setProcessingId(payout_id);

        try {
            await publicApi.post("/api/withdrawals/process", {
                payout_id,
                admin_telegram_id: user.telegram_id,
                action,
                rejection_reason: reason || undefined,
            });

            // Remove processed request from state list
            setWithdrawalRequests((prev) => prev.filter((w) => w.id !== payout_id));
            showAlert(action === "approve" ? "approve_success" : "reject_success");
        } catch (err) {
            console.error(`Error processing withdrawal (${action}):`, err);
            showAlert("error");
        } finally {
            setProcessingId(null);
            setSelectedItem(null);
            setRejectionReason("");
        }
    };

    // Copy bank account to clipboard
    const handleCopy = async (id: number, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div
            className={`min-h-screen bg-[#000000] text-white pb-28 px-4 font-sans relative overflow-hidden ${alert ? "pt-16" : "pt-6"
                }`}
        >
            {/* Floating Alert Notifications */}
            <AnimatePresence>
                {alert && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="fixed top-4 inset-x-0 z-50 flex justify-center px-4"
                    >
                        {["approve_success", "reject_success"].includes(alert) && (
                            <div className="bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-2 p-3 rounded-xl shadow-lg">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                {`${alert === "approve_success" ?
                                    "Withdrawal marked as paid and user notified!"
                                    : "Withdrawal rejected and referrals refunded!"}`
                                }
                            </div>
                        )}

                        {alert === "error" && (
                            <div className="bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-2 p-3 rounded-xl shadow-lg">
                                <XCircle className="w-5 h-5 flex-shrink-0" /> Failed to process request. Please try again.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <h1 className="text-3xl font-bold mt-6 mb-6 text-purple-400 text-center">
                Pending Withdrawals
            </h1>

            {!withdrawalRequests || withdrawalRequests.length === 0 ? (
                <p className="text-gray-400 text-center mt-10">
                    No pending withdrawals assigned to you.
                </p>
            ) : (
                <div className="space-y-4">
                    {withdrawalRequests.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#1A1A1A] p-4 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5"
                        >
                            {/* Left Column: Payout Info */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-bold text-lg">
                                        {Number(item.requested_amount).toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })} ETB
                                    </p>
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30">
                                        {item.referrals_claimed} refs
                                    </span>
                                </div>

                                <p className="text-gray-300 text-sm font-medium">
                                    Account Holder: <span className="text-white">{item.account_holder_name}</span>
                                </p>

                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                    <span>{item.bank_name}</span> |{" "}
                                    <span className="font-mono text-gray-200">{item.bank_account}</span>
                                    <button
                                        onClick={() => handleCopy(item.id, item.bank_account)}
                                        className="text-gray-400 hover:text-[#A259FF] transition p-1"
                                        title="Copy Account Number"
                                    >
                                        {copiedId === item.id ? (
                                            <Check className="w-4 h-4 text-green-400 transition-transform duration-300" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </p>
                            </div>

                            {/* Right Column: Action Buttons */}
                            <div className="flex items-center gap-2 self-end md:self-auto">
                                <button
                                    onClick={() =>
                                        setSelectedItem({ request: item, type: "reject" })
                                    }
                                    disabled={processingId == item.id}
                                    className={`px-4 py-2 rounded-xl font-bold transition text-sm ${processingId == item.id
                                        ? "bg-gray-600 cursor-not-allowed"
                                        : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"}`}
                                >
                                    Reject
                                </button>

                                <button
                                    onClick={() =>
                                        setSelectedItem({ request: item, type: "approve" })
                                    }
                                    disabled={processingId == item.id}
                                    className={`px-4 py-2 rounded-xl font-bold transition text-sm ${processingId == item.id
                                        ? "bg-gray-600 cursor-not-allowed"
                                        : "bg-green-500 hover:bg-green-600 text-black"
                                        }`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Selected item Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 max-w-md w-full relative shadow-xl"
                        >
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-xl font-bold text-white mb-2">
                                {selectedItem.type === 'reject' ? 'Reject Payout' : 'Approve Payout'}
                            </h2>
                            <p className="text-gray-400 text-sm mb-4">
                                {selectedItem.type === 'reject' ? (
                                    <>
                                        Rejecting payout for{' '}
                                        <span className="text-white font-semibold">
                                            {selectedItem.request.account_holder_name}
                                        </span>
                                        . This will refund their claimed referrals back to their balance.
                                    </>
                                ) : (
                                    <>
                                        Approving payout for{' '}
                                        <span className="text-white font-semibold">
                                            {selectedItem.request.account_holder_name}
                                        </span>
                                        .
                                    </>
                                )}
                            </p>

                            {selectedItem.type === "reject" && <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Reason for rejection (optional, e.g. Incorrect account name)"
                                rows={3}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 mb-4 resize-none"
                            />}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleProcess(selectedItem.request.id, selectedItem.type, rejectionReason)}
                                    disabled={processingId === selectedItem.request.id}
                                    className={`flex-1 py-2.5 rounded-xl font-semibold transition text-sm disabled:opacity-50 
                                        ${selectedItem.type === "approve" ? "bg-green-500 hover:bg-green-600 text-black" :
                                            "bg-red-500 hover:bg-red-600 text-white"}
                                            `}
                                >
                                    {processingId === selectedItem.request.id ? "Confirming..." : "Confirm"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}