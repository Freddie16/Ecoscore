import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Analysis from './components/Analysis';
import Marketplace from './components/Marketplace';
import Advisor from './components/Advisor';
import CarbonMarketplace from './components/CarbonMarketplace';
import Pricing from './components/Pricing';
import { User } from './types';
import { authApi } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('eco_token');
      if (token) {
        try {
          const res = await authApi.me();
          if (res.success) {
            setUser({ ...res.data, isAuthenticated: true });
          } else {
            localStorage.removeItem('eco_token');
          }
        } catch (err) {
          // Token invalid or expired
          localStorage.removeItem('eco_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('eco_token');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-black text-white selection:bg-green-500/30">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main className="container mx-auto px-4 py-8 overflow-y-auto">
          <Routes>
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/analysis" element={user ? <Analysis user={user} /> : <Navigate to="/login" />} />
            <Route path="/advisor" element={user ? <Advisor /> : <Navigate to="/login" />} />
            <Route path="/marketplace" element={user ? <Marketplace user={user} /> : <Navigate to="/login" />} />
            <Route path="/carbon" element={user ? <CarbonMarketplace /> : <Navigate to="/login" />} />
            <Route path="/pricing" element={user ? <Pricing user={user} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;