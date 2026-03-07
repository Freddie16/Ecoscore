import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, History, ShieldCheck, ArrowRight, ExternalLink, Loader2, Plus, X, CheckCircle } from 'lucide-react';
import { carbonApi } from '../services/api';

const STANDARDS = ['Gold Standard', 'Verra', 'EcoScore-V', 'Plan Vivo', 'Climate Action Reserve'];

const CarbonMarketplace: React.FC = () => {
  const [credits, setCredits] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ project: '', standard: 'Gold Standard', volume: '', valuePerUnit: '' });

  useEffect(() => { fetchCredits(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

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

  const handleCreate = async () => {
    if (!form.project || !form.volume || !form.valuePerUnit) {
      alert('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await carbonApi.create({
        project: form.project,
        standard: form.standard,
        volume: parseFloat(form.volume),
        valuePerUnit: parseFloat(form.valuePerUnit),
      });
      setShowModal(false);
      setForm({ project: '', standard: 'Gold Standard', volume: '', valuePerUnit: '' });
      await fetchCredits();
      showToast('Carbon credit registered. Pending verification.');
    } catch (err: any) {
      alert(err.message || 'Failed to register credit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (creditId: string) => {
    setActionLoading(creditId + '-verify');
    try {
      await carbonApi.verify(creditId);
      await fetchCredits();
      showToast('Credit verified successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to verify credit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleList = async (creditId: string) => {
    setActionLoading(creditId + '-list');
    try {
      await carbonApi.listOnMarket(creditId);
      await fetchCredits();
      showToast('Credit listed on the carbon market!');
    } catch (err: any) {
      alert(err.message || 'Failed to list credit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSell = async (creditId: string) => {
    if (!confirm('Mark this credit as sold?')) return;
    setActionLoading(creditId + '-sell');
    try {
      await carbonApi.sell(creditId);
      await fetchCredits();
      showToast('Credit marked as sold!');
    } catch (err: any) {
      alert(err.message || 'Failed to mark as sold');
    } finally {
      setActionLoading(null);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'Verified') return 'bg-green-500/10 text-green-500';
    if (status === 'Listed') return 'bg-blue-500/10 text-blue-400';
    if (status === 'Sold') return 'bg-gray-500/10 text-gray-400';
    return 'bg-yellow-500/10 text-yellow-500';
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
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-black font-bold px-6 py-3 rounded-xl shadow-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

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
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-500 text-black text-xs font-black px-4 py-2 rounded-lg hover:bg-green-400 transition-all flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Register Credit</span>
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {credits.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Coins className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="mb-4">No carbon credits yet.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-green-500 text-black text-sm font-black px-6 py-2 rounded-lg hover:bg-green-400 transition-all"
                  >
                    Register Your First Credit
                  </button>
                </div>
              ) : credits.map((credit) => (
                <div key={credit._id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${statusColor(credit.status)}`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">{credit.project}</h3>
                      <p className="text-xs text-gray-500">{credit.standard} • {credit.volume} tCO2e</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Value</p>
                      <p className="font-mono font-bold">KES {(credit.volume * credit.valuePerUnit).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${statusColor(credit.status)}`}>
                        {credit.status}
                      </span>
                      {credit.status === 'Pending' && (
                        <button
                          onClick={() => handleVerify(credit._id)}
                          disabled={actionLoading === credit._id + '-verify'}
                          className="bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-lg hover:bg-yellow-400 transition-all flex items-center space-x-1 disabled:opacity-50"
                        >
                          {actionLoading === credit._id + '-verify' ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Verify</span>}
                        </button>
                      )}
                      {credit.status === 'Verified' && (
                        <button
                          onClick={() => handleList(credit._id)}
                          disabled={actionLoading === credit._id + '-list'}
                          className="bg-white text-black text-xs font-black px-3 py-1 rounded-lg hover:bg-green-500 transition-all flex items-center space-x-1 disabled:opacity-50"
                        >
                          {actionLoading === credit._id + '-list' ? <Loader2 className="w-3 h-3 animate-spin" /> : <><span>List</span><ArrowRight className="w-3 h-3" /></>}
                        </button>
                      )}
                      {credit.status === 'Listed' && (
                        <button
                          onClick={() => handleSell(credit._id)}
                          disabled={actionLoading === credit._id + '-sell'}
                          className="bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-lg hover:bg-blue-400 transition-all flex items-center space-x-1 disabled:opacity-50"
                        >
                          {actionLoading === credit._id + '-sell' ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Mark Sold</span>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/10 to-transparent">
            <h3 className="text-lg font-bold mb-2 flex items-center space-x-2">
              <Coins className="w-5 h-5 text-green-500" />
              <span>How It Works</span>
            </h3>
            <ol className="text-sm text-gray-300 space-y-3 mb-6">
              <li className="flex items-start space-x-2"><span className="text-green-500 font-black">1.</span><span>Register a carbon credit project with volume and value</span></li>
              <li className="flex items-start space-x-2"><span className="text-green-500 font-black">2.</span><span>Click <strong>Verify</strong> to get it EcoScore-certified</span></li>
              <li className="flex items-start space-x-2"><span className="text-green-500 font-black">3.</span><span>Click <strong>List</strong> to put it on the carbon market</span></li>
              <li className="flex items-start space-x-2"><span className="text-green-500 font-black">4.</span><span>Click <strong>Mark Sold</strong> once a buyer is confirmed</span></li>
            </ol>
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-3 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition-all"
            >
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

      {/* Register Credit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="glass-card rounded-2xl border border-white/10 w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Register Carbon Credit</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Solar Transition 2026"
                  value={form.project}
                  onChange={e => setForm({ ...form, project: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Standard</label>
                <select
                  value={form.standard}
                  onChange={e => setForm({ ...form, standard: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                >
                  {STANDARDS.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Volume (tCO2e)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45.2"
                    value={form.volume}
                    onChange={e => setForm({ ...form, volume: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Value / Unit (KES)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={form.valuePerUnit}
                    onChange={e => setForm({ ...form, valuePerUnit: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              {form.volume && form.valuePerUnit && (
                <div className="bg-green-500/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase font-bold">Estimated Total Value</p>
                  <p className="text-2xl font-black text-green-500">
                    KES {(parseFloat(form.volume || '0') * parseFloat(form.valuePerUnit || '0')).toLocaleString()}
                  </p>
                </div>
              )}
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="w-full py-3 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Register & Initiate Verification</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarbonMarketplace;