import { useState } from "react";
import { motion } from "framer-motion";
import LoadingState from "../components/Loading";
import ErrorState from "../components/Error";
import { publicApi } from "../components/Api";
import { CheckCircle, XCircle } from "lucide-react";
import { useApp } from "../context/UserContext";
import { useWithdraw } from "../context/WithdrawContext";
import type { WithdrawalFormData, banks } from "../types/withdrawal";
import type { MessageState } from "../types/index";
import JoinChannelBlocker from "../components/JoinChannelBlocker";

export default function Withdraw() {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form, setForm] = useState<WithdrawalFormData>({
    account_holder_name: "",
    bank_name: "",
    bank_account: "",
  });
  const { user, loading, error, initApp, channelUsername, withdrawThreshold, referralValue } = useApp();
  const { withdrawalHistory, loading: loadingWithdraw, error: withdrawError, refresh } = useWithdraw()
  const banks: banks[] = ['cbe', 'telebirr', 'abyssinia']


  if (loading) return <LoadingState message="Loading withdraw page" />;
  if (error || !user) return <ErrorState retry={refresh} />;

  const balance = Math.max((user.referral_count - user.claimed_referral_count) * referralValue, 0);
  const progress = Math.min((balance / withdrawThreshold) * 100, 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleWithdraw = async () => {
    if (
      !form.account_holder_name.trim() ||
      !form.bank_name.trim() ||
      !form.bank_account.trim()
    ) {
      setMessage({
        text: "Please fill in all required fields.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      await publicApi.post("/api/withdrawals", {
        user_id: user?.id,
        account_holder_name: form.account_holder_name,
        bank_name: form.bank_name,
        bank_account: form.bank_account,
      });

      setMessage({
        text: "Withdrawal request submitted successfully!",
        type: "success",
      });

      setShowModal(false);
      setForm({ account_holder_name: "", bank_name: "", bank_account: "" });
      setSubmitting(false);
      initApp();

      // reset success message after short delay
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage({
        text: "Error submitting withdrawal request.",
        type: "error",
      });
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
          <span className="font-bold text-white ml-2">
            {balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} BIRR
          </span>
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-[#A259FF] to-[#B388FF]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-gray-400 text-xs mt-1">
          {balance < withdrawThreshold
            ? `${(withdrawThreshold - balance).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} BIRR left to reach minimum withdrawal`
            : "You can withdraw now!"}
        </p>

        {/* Withdraw Button */}
        <button
          className={`w-full py-3 rounded-xl font-bold transition ${balance >= withdrawThreshold
            ? "bg-purple-500 hover:bg-purple-600"
            : "bg-gray-600 cursor-not-allowed"
            }`}
          disabled={balance < withdrawThreshold}
          onClick={() => setShowModal(true)}
        >
          Withdraw Now
        </button>
      </div>


      {/* Withdraw History */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-purple-400">
          Withdraw History
        </h2>

        <div className="space-y-3 min-h-[100px] flex flex-col justify-center">
          {loadingWithdraw ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Fetching history...</p>
            </div>
          ) : withdrawError ? (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center">
              <p className="text-red-400 text-sm mb-2">
                Failed to load history.
              </p>
              <button
                onClick={refresh}
                className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-200 px-3 py-1 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          ) : !withdrawalHistory || withdrawalHistory?.length === 0 ? (
            <p className="text-gray-400 text-center py-6">
              No withdrawal history yet.
            </p>
          ) : (
            withdrawalHistory && withdrawalHistory.map((item) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl shadow-md border border-gray-800/50"
              >
                <div>
                  <p className="text-white font-semibold">
                    {Number(item.requested_amount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} BIRR
                  </p>
                  <p className="text-gray-400 text-xs">
                    {new Date(
                      item.updated_at || item.created_at,
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold ${item.status === "paid"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : item.status === "rejected"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }`}
                >
                  {item.status}
                </span>
              </motion.div>
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
              name="account_holder_name"
              placeholder="Full Name"
              value={form.account_holder_name}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl bg-[#000000] border border-[#5B2EFF] text-white focus:outline-none"
            />
            <select
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl bg-[#000000] border border-[#5B2EFF] text-white focus:outline-none focus:ring-2 focus:ring-[#5B2EFF]"
            >
              <option value="" disabled hidden>
                Select Bank
              </option>
              {banks.map((bank) => (
                <option key={bank} value={bank} className="bg-[#1A1A1A] text-white">
                  {bank}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="bank_account"
              placeholder={form.bank_name === 'telebirr' ? "Phone Number" : "Bank Account"}
              value={form.bank_account}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl bg-[#000000] border border-[#5B2EFF] text-white focus:outline-none"
            />

            {/* Feedback Message */}
            {message.text && (
              <div
                className={`flex items-center gap-2 mb-4 p-3 rounded-xl ${message.type === "success"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
                  }`}
              >
                {message.type === "success" ? (
                  <CheckCircle size={18} />
                ) : (
                  <XCircle size={18} />
                )}
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

      {!user.joined_channel && (
        <JoinChannelBlocker
          channelLink={`https://t.me/${channelUsername}`}
          onReload={initApp}
        />
      )}
    </div>
  );
}
