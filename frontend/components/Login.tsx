import React, { useState } from 'react';
import { User } from '../types';
import { Leaf, ArrowRight, Zap, Crown, Building2, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { authApi } from '../services/api';

interface Props {
  onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTier, setSelectedTier] = useState<'Free' | 'Pro' | 'Enterprise'>('Free');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!isLogin && !businessName) return;

    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await authApi.login({ email, password });
      } else {
        result = await authApi.register({ businessName, email, password, tier: selectedTier });
      }

      if (result.success) {
        localStorage.setItem('eco_token', result.data.token);
        onLogin({ ...result.data.user, isAuthenticated: true });
}
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    { id: 'Free', label: 'Essential', sub: 'Free', icon: Zap, trial: false },
    { id: 'Pro', label: 'Professional', sub: 'KES 4,500/mo', icon: Crown, trial: true },
    { id: 'Enterprise', label: 'Enterprise', sub: 'KES 45k/mo', icon: Building2, trial: true },
  ];

  return (
    <div className="max-w-xl mx-auto mt-12 p-10 glass-card rounded-[2.5rem] border border-white/10 shadow-2xl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6 relative">
          <Leaf className="w-10 h-10 text-green-500" />
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl -z-10 animate-pulse"></div>
        </div>
        <h1 className="text-4xl font-black mb-2 tracking-tight">EcoScore<span className="text-green-500">.AI</span></h1>
        <p className="text-gray-400 text-lg">SME ESG Compliance SaaS</p>
      </div>

      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-8">
        <button
          type="button"
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
        >
          Register
        </button>
        <button
          type="button"
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
        >
          Sign In
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Business Identity</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-green-500 transition-all font-medium text-white placeholder:text-gray-700"
                placeholder="e.g. Kipchoge Logistics Ltd"
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-green-500 transition-all font-medium text-white placeholder:text-gray-700"
              placeholder="finance@kipchoge.co.ke"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-green-500 transition-all font-medium text-white placeholder:text-gray-700"
              placeholder={isLogin ? 'Enter your password' : 'Min. 6 characters'}
              required
              minLength={6}
            />
          </div>
        </div>

        {!isLogin && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500">Select Subscription Tier</label>
              <span className="text-[10px] font-black text-green-500 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 7-Day Free Trial Included
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id as any)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    selectedTier === tier.id
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {selectedTier === tier.id && (
                    <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-green-500" />
                  )}
                  <tier.icon className={`w-6 h-6 mb-2 ${selectedTier === tier.id ? 'text-green-500' : 'text-gray-600'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTier === tier.id ? 'text-white' : 'text-gray-500'}`}>
                    {tier.label}
                  </span>
                  <span className="text-[8px] font-bold text-gray-500 mt-1">{tier.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-green-500/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span className="text-lg">{isLogin ? 'Sign In' : 'Activate Free Trial'}</span>
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/10 text-center">
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] leading-relaxed">
          {isLogin ? 'New to EcoScore? Register above.' : 'Setup billing to start your 7-day trial.'}<br/>
          Compliant with CBK ESG Reporting Directives (2026)
        </p>
        <p className="text-[10px] text-gray-700 mt-2">Demo: demo@ecoscore.ai / demo1234</p>
      </div>
    </div>
  );
};

export default Login;