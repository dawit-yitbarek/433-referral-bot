import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Withdraw from './pages/Withdraw';
import BottomNav from './components/BottomNav';
import AdminPage from './pages/Admin';
import InvitationList from './pages/Referrals';
const AppContent = () => {


  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/referrals" element={<InvitationList />} />
      </Routes>
      {/* <BottomNav /> */}
    </>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;