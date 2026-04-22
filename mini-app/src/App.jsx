import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Withdraw from "./pages/Withdraw";
import BottomNav from "./components/BottomNav";
import AdminPage from "./pages/Admin";
import InvitationList from "./pages/Referrals";
import { AppProvider } from "./context/UserContext";

const App = () => (
  <Router>
    <AppProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/referrals" element={<InvitationList />} />
      </Routes>
      <BottomNav />
    </AppProvider>
  </Router>
);

export default App;
