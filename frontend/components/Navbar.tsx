import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';
import { LayoutDashboard, LineChart, Landmark, LogOut, Leaf, Sparkles, Coins, CreditCard } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<Props> = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analysis', label: 'Analysis', icon: LineChart },
    { path: '/advisor', label: 'AI Advisor', icon: Sparkles },
    { path: '/marketplace', label: 'Green Funds', icon: Landmark },
    { path: '/carbon', label: 'Carbon Trade', icon: Coins },
  ];

  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <Leaf className="w-8 h-8 text-green-500 group-hover:rotate-12 transition-transform" />
          <span className="text-xl font-bold tracking-tighter">
            EcoScore<span className="text-green-500">.AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 text-sm font-medium transition-all hover:text-green-500 ${
                location.pathname === item.path ? 'text-green-500' : 'text-gray-400'
              }`}
            >
              <item.icon className={`w-4 h-4 ${location.pathname === item.path ? 'animate-pulse' : ''}`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/pricing"
            className="hidden lg:flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full hover:bg-green-500/20 transition-all border border-green-500/20"
          >
            <CreditCard className="w-3 h-3" />
            <span>Manage Plan</span>
          </Link>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-white font-bold tracking-tight">{user.businessName}</p>
            <p className="text-[9px] text-green-500 uppercase tracking-widest font-black">
              {user.tier} · EcoScore {user.ecoScore ?? '—'}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-white/5 px-4 py-2 flex items-center justify-between overflow-x-auto gap-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center space-y-0.5 text-[9px] font-black uppercase tracking-widest shrink-0 transition-colors ${
              location.pathname === item.path ? 'text-green-500' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;