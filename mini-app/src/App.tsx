import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Withdraw from "./pages/Withdraw";
import BottomNav from "./components/BottomNav";
import AdminPage from "./pages/Admin";
import InvitationList from "./pages/Referrals";
import { AppProvider } from "./context/UserContext";
import { WithdrawProvider } from "./context/WithdrawContext";
import { AdminWithdrawProvider } from "./context/AdminContext";

const App = () => (
  <Router>
    <AppProvider>
      <WithdrawProvider>
        <AdminWithdrawProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/referrals" element={<InvitationList />} />
          </Routes>
          <BottomNav />
        </AdminWithdrawProvider>
      </WithdrawProvider>
    </AppProvider>
  </Router>
);

export default App;
