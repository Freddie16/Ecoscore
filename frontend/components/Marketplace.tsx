import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Landmark, ArrowUpRight, ShieldCheck, Globe, Loader2 } from 'lucide-react';
import { marketplaceApi } from '../services/api';

interface Props { user: User; }

const Marketplace: React.FC<Props> = ({ user }) => {
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedFunds, setAppliedFunds] = useState<Set<string>>(new Set());

  const userScore = user.ecoScore ?? 82;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fundsRes, appsRes] = await Promise.all([
          marketplaceApi.getFunds(),
          marketplaceApi.getApplications(),
        ]);
        setFunds(fundsRes.data);
        const applied = new Set<string>(appsRes.data.map((a: any) => a.fundId?.toString() || a.fundId));
        setAppliedFunds(applied);
      } catch (err) {
        console.error('Failed to fetch marketplace data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApply = async (fundId: string) => {
    setApplying(fundId);
    try {
      await marketplaceApi.applyToFund(fundId);
      setAppliedFunds(prev => new Set([...prev, fundId]));
      alert('Application submitted successfully! We will review your EcoScore and get back to you.');
    } catch (err: any) {
      alert(err.message || 'Application failed');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Green Fund Marketplace</h1>
        <p className="text-gray-400">Match with capital based on your ESG performance. These funds use EcoScore data for rapid underwriting.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Verification Status</p>
          <p className="text-xl font-bold">Eco-Verified</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
            <Globe className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Global Standards</p>
          <p className="text-xl font-bold">IFRS Compliant</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center border-green-500/50 green-glow">
          <p className="text-xs text-green-500 uppercase tracking-widest font-bold mb-1">Your EcoScore</p>
          <p className="text-4xl font-black">{userScore}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Matching Funds for {user.businessName}</h2>
          {funds.map((fund) => {
            const isEligible = userScore >= fund.minEcoScore;
            const hasApplied = appliedFunds.has(fund._id);
            const isApplying = applying === fund._id;

            return (
              <div
                key={fund._id}
                className={`glass-card p-6 rounded-2xl border transition-all flex flex-col md:flex-row items-center gap-6 ${
                  isEligible ? 'border-white/10 hover:border-green-500/40' : 'opacity-60 border-white/5 grayscale pointer-events-none'
                }`}
              >
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <Landmark className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-xl font-bold">{fund.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-400">{fund.provider}</span>
                    {fund.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        fund.category === 'Grant' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>{fund.category}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 max-w-2xl">{fund.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-4 text-center md:text-right shrink-0">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Max Funding</p>
                    <p className="font-bold">{fund.maxFunding}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Interest Rate</p>
                    <p className="text-green-500 font-bold">{fund.interestRate}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  {isEligible ? (
                    hasApplied ? (
                      <div className="text-xs text-green-500 font-bold px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        ✓ Applied
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(fund._id)}
                        disabled={isApplying}
                        className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-green-500 transition-colors flex items-center space-x-2 disabled:opacity-50"
                      >
                        {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            <span>Apply Now</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <div className="text-xs text-red-400 font-bold px-4 py-2 bg-red-400/10 rounded-lg">
                      Requires EcoScore {fund.minEcoScore}+
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Marketplace;