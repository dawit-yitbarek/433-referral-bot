import BottomNav from '../components/BottomNav';

export default function Withdraw() {
    const balance = 0; // Current balance
    const minWithdraw = 50; // Minimum required to withdraw

    // Template withdrawal history
    const history = [
        { id: 1, amount: 5, status: "Paid", date: "2025-11-01" },
        { id: 2, amount: 10, status: "Pending", date: "2025-11-03" },
        { id: 3, amount: 7.5, status: "Paid", date: "2025-11-05" },
        { id: 4, amount: 3, status: "Pending", date: "2025-11-06" },
    ];

    // Progress toward minimum withdraw
    const progress = Math.min((balance / minWithdraw) * 100, 100);

    return (
        <div className="min-h-screen bg-[#000000] text-white pb-20 pt- px-4 font-sans relative overflow-hidden">
            <h1 className="text-3xl font-bold mt-6 mb-6 text-purple-400">Withdraw</h1>

            {/* Balance & Withdraw Button */}
            <div className="bg-[#1A1A1A] p-6 rounded-2xl shadow-lg space-y-4">
                <p className="text-gray-400 text-sm">
                    Your Balance:
                    <span className="font-bold text-white ml-2">{balance.toFixed(2)} $</span>
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
                        ? `${(minWithdraw - balance).toFixed(2)} $ left to reach minimum withdrawal`
                        : "You can withdraw now!"}
                </p>

                {/* Withdraw Button */}
                <button
                    className={`w-full py-3 rounded-xl font-bold transition ${balance >= minWithdraw
                        ? "bg-purple-500 hover:bg-purple-600"
                        : "bg-gray-600 cursor-not-allowed"
                        }`}
                    disabled={balance < minWithdraw}
                >
                    Withdraw Now
                </button>
            </div>

            {/* Withdraw History */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-purple-400">Withdraw History</h2>
                <div className="space-y-3">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl shadow-md"
                        >
                            <div>
                                <p className="text-white font-semibold">{item.amount.toFixed(2)} $</p>
                                <p className="text-gray-400 text-sm">{item.date}</p>
                            </div>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === "Paid"
                                    ? "bg-green-500 text-black"
                                    : "bg-yellow-500 text-black"
                                    }`}
                            >
                                {item.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}