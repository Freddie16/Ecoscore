import React, { useState, useMemo, useEffect } from 'react';
import { User, AnalysisResult, Supplier } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import {
  Upload, FileText, CheckCircle2, ShieldAlert, Cpu, Loader2, Network,
  ChevronRight, AlertTriangle, BarChart3, Download, Plus, X
} from 'lucide-react';
import { suppliersApi, analysisApi } from '../services/api';

interface Props { user: User; }

const Analysis: React.FC<Props> = ({ user }) => {
  const [dataInput, setDataInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [activeTab, setActiveTab] = useState<'audit' | 'supply-chain'>('audit');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', category: '', email: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const res = await suppliersApi.getAll();
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!dataInput) return;
    setAnalyzing(true);
    setError('');
    try {
      const res = await analysisApi.runAudit(dataInput);
      setResults(res.data.results);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await suppliersApi.create({
        name: newSupplier.name,
        category: newSupplier.category,
        email: newSupplier.email,
      });
      setSuppliers([res.data, ...suppliers]);
      setNewSupplier({ name: '', category: '', email: '' });
      setIsAddModalOpen(false);
      alert(`Automated ESG Questionnaire dispatched to ${res.data.email}`);
    } catch (err: any) {
      alert(err.message || 'Failed to add supplier');
    }
  };

  const riskWeights = { Low: 1, Medium: 2.5, High: 5 };

  const supplyChainMetrics = useMemo(() => {
    const analyzed = suppliers.map(s => ({
      ...s,
      weightedRiskScore: s.impact * riskWeights[s.riskLevel],
    }));
    const totalImpact = analyzed.reduce((acc, curr) => acc + curr.impact, 0);
    const avgWeightedScore = analyzed.length
      ? analyzed.reduce((acc, curr) => acc + curr.weightedRiskScore, 0) / analyzed.length
      : 0;
    const highRiskCount = analyzed.filter(s => s.riskLevel === 'High').length;
    const riskDist = [
      { name: 'Low', value: suppliers.filter(s => s.riskLevel === 'Low').length, color: '#22c55e' },
      { name: 'Medium', value: suppliers.filter(s => s.riskLevel === 'Medium').length, color: '#eab308' },
      { name: 'High', value: suppliers.filter(s => s.riskLevel === 'High').length, color: '#ef4444' },
    ].filter(d => d.value > 0);
    return { analyzed, totalImpact, avgWeightedScore, highRiskCount, riskDist };
  }, [suppliers]);

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Risk Level', 'Impact (tCO2e)', 'Weighted Risk Score', 'Questionnaire Status'];
    const rows = supplyChainMetrics.analyzed.map(s => [
      s.name, s.category, s.riskLevel, s.impact,
      s.weightedRiskScore.toFixed(2), s.questionnaireStatus,
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EcoScore_SupplyChain_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ESG AI Gateway</h1>
          <p className="text-gray-400">Deep-dive auditing of financials and supply chains.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'audit' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            SME Audit
          </button>
          <button
            onClick={() => setActiveTab('supply-chain')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'supply-chain' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Scope 3 Supply Chain
          </button>
        </div>
      </div>

      {activeTab === 'audit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col h-full">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-bold">Data Input</h2>
            </div>
            <textarea
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              placeholder="Paste M-Pesa statements or utility summaries..."
              className="flex-grow bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-green-500/50 min-h-[350px] resize-none"
            />
            {error && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || !dataInput}
              className={`mt-4 w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                analyzing ? 'bg-white/10 text-gray-400 animate-pulse' : 'bg-green-500 text-black hover:bg-green-400'
              }`}
            >
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
              <span>{analyzing ? 'Analyzing IFRS Compliance...' : 'Generate EcoScore Audit'}</span>
            </button>
          </div>

          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
            {!results ? (
              <div className="h-full glass-card p-12 rounded-2xl border border-white/10 border-dashed flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-gray-700 mb-4" />
                <h3 className="text-lg font-bold">Waiting for Data</h3>
                <p className="text-gray-500 text-sm">Our model will categorize your spend into ESG buckets.</p>
              </div>
            ) : (
              results.map((res, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-green-500">{res.category}</span>
                    <div className="text-xl font-black">{res.score}<span className="text-[10px] text-gray-500">/100</span></div>
                  </div>
                  <p className="text-sm text-gray-300 mb-4 font-medium italic">"{res.findings}"</p>
                  <div className="space-y-2">
                    {res.recommendations.map((rec, j) => (
                      <div key={j} className="flex items-start space-x-2 text-xs text-gray-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {loadingSuppliers ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/5 to-transparent">
                  <div className="flex items-center space-x-2 text-red-400 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">High Risk Nodes</span>
                  </div>
                  <p className="text-3xl font-black">{supplyChainMetrics.highRiskCount}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Suppliers requiring immediate audit</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-2 text-blue-400 mb-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Avg Weighted Risk</span>
                  </div>
                  <p className="text-3xl font-black">{supplyChainMetrics.avgWeightedScore.toFixed(1)}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Network-wide ESG stability index</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/5 to-transparent">
                  <div className="flex items-center space-x-2 text-green-400 mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Total CO2 Linkage</span>
                  </div>
                  <p className="text-3xl font-black">{supplyChainMetrics.totalImpact.toFixed(1)} <span className="text-sm font-normal text-gray-500">t</span></p>
                  <p className="text-[10px] text-gray-500 mt-1">Aggregated Scope 3 footprint</p>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col justify-center overflow-hidden">
                  <div className="flex items-center space-x-2 text-green-500 mb-2">
                    <Network className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Risk Distribution</span>
                  </div>
                  <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={supplyChainMetrics.riskDist} cx="50%" cy="50%" innerRadius={15} outerRadius={30} paddingAngle={5} dataKey="value">
                          {supplyChainMetrics.riskDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px', padding: '4px' }} itemStyle={{ color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-8 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-500/10 rounded-2xl">
                      <Network className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold italic">Weighted Supplier Analysis</h2>
                      <p className="text-sm text-gray-400">Risk-adjusted impact scores for IFRS S2 compliance.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={exportToCSV} className="flex items-center space-x-2 text-xs font-bold text-gray-300 bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2 text-xs font-bold text-black bg-green-500 px-4 py-2 rounded-lg hover:bg-green-400 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Supplier</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {supplyChainMetrics.analyzed.map((s) => (
                    <div key={s._id || s.id} className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center space-x-6">
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center font-bold text-lg text-gray-500 relative">
                          {s.name[0]}
                          {s.questionnaireStatus === 'Pending' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-black" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold group-hover:text-green-500 transition-colors">{s.name}</h3>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{s.category} • Audit: {s.questionnaireStatus}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-12">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Impact</p>
                          <p className="font-mono text-sm">{s.impact} t</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-green-500/60 uppercase font-bold mb-1">Weighted ESG Risk</p>
                          <p className="text-xl font-black">{s.weightedRiskScore.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {suppliers.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                      <Network className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No suppliers yet. Add your first supplier above.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">New Supplier Intake</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="space-y-6">
              <input
                type="text"
                placeholder="Entity Name"
                value={newSupplier.name}
                onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white"
                required
              />
              <select
                value={newSupplier.category}
                onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white"
                required
              >
                <option value="" disabled>Select Category</option>
                <option value="Logistics">Logistics</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Services">Services</option>
                <option value="Energy">Energy</option>
              </select>
              <input
                type="email"
                placeholder="Email"
                value={newSupplier.email}
                onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white"
                required
              />
              <button type="submit" className="w-full py-4 bg-green-500 text-black font-black rounded-2xl">
                Send Automated Audit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;