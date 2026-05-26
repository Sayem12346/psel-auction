import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/public/HomePage';
import LivePage from './pages/public/LivePage';
import PlayersPage from './pages/public/PlayersPage';
import TeamsPage from './pages/public/TeamsPage';
import OwnerLogin from './pages/public/OwnerLogin';
import OwnerDashboard from './pages/public/OwnerDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AuctionControl from './pages/admin/AuctionControl';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/auction" element={<AuctionControl />} />
      </Routes>
    </Router>
  );
}

export default App;
