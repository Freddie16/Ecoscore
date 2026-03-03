import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, History, ShieldCheck, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { carbonApi } from '../services/api';

const CarbonMarketplace: React.FC = () => {
  const [credits, setCredits] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await carbonApi.getAll();
      setCredits(res.data.credits || []);
      setTotalValue(res.data.totalValue || 0);
      setTotalSold(res.data.totalSold || 0);
      setTotalRevenue(res.data.totalRevenue || 0);
    } catch (err) {
      console.error('Failed to fetch carbon credits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleListOnMarket = async (creditId: string) => {
    try {
      await carbonApi.listOnMarket(creditId);
      await fetchCredits();
    } catch (err: any) {
      alert(err.message || 'Failed to list credit');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carbon Asset Monetization</h1>
          <p className="text-gray-400">Convert your verified ESG performance into tradeable carbon credits.</p>
        </div>
        <div className="glass-card px-8 py-4 rounded-2xl border-green-500/30 green-glow flex items-center space-x-6">
          <div className="text-right">
            <p className="text-[10px] uppercase font-black text-green-500 tracking-widest">Tradeable Value</p>
            <p className="text-2xl font-black">KES {totalValue.toLocaleString()}</p>
          </div>
          <Coins className="w-8 h-8 text-green-500" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-xl font-bold">Active Carbon Projects</h2>
              <button className="text-xs font-bold text-green-500 flex items-center space-x-1">
                <span>View Market Trends</span>
                <TrendingUp className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {credits.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Coins className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No carbon credits yet. Complete an ESG audit to generate credits.</p>
                </div>
              ) : credits.map((credit) => (
                <div key={credit._id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      credit.status === 'Verified' ? 'bg-green-500/10 text-green-500' :
                      credit.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-white/10 text-gray-500'
                    }`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">{credit.project}</h3>
                      <p className="text-xs text-gray-500">{credit.standard} • {credit.volume} tCO2e</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Estimated Value</p>
                      <p className="font-mono font-bold">KES {(credit.volume * credit.valuePerUnit).toLocaleString()}</p>
                    </div>
                    {credit.status === 'Verified' ? (
                      <button
                        onClick={() => handleListOnMarket(credit._id)}
                        className="bg-white text-black text-xs font-black px-4 py-2 rounded-lg hover:bg-green-500 transition-all flex items-center space-x-2"
                      >
                        <span>List on Market</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3 py-1 bg-white/5 rounded-full">
                        {credit.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/10 to-transparent">
            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
              <Coins className="w-5 h-5 text-green-500" />
              <span>Yield Optimizer</span>
            </h3>
            <p className="text-sm text-gray-300 mb-6">Our AI identified KES 42,000 in potential credits by optimizing your supply chain logistics in Q3.</p>
            <button className="w-full py-3 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition-all">
              Initiate Verification
            </button>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
              <History className="w-5 h-5 text-blue-500" />
              <span>Recent Settlements</span>
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-400">Total Credits Sold</span>
                <span className="font-bold">{totalSold} t</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-400">Total Revenue Earned</span>
                <span className="font-bold text-green-500">KES {totalRevenue.toLocaleString()}</span>
              </div>
            </div>
            <button className="mt-6 w-full text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center space-x-1 hover:text-white transition-colors">
              <span>Download Tax Invoice</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonMarketplace;