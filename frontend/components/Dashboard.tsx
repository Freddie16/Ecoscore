import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar as RadarArea
} from 'recharts';
import {
  TrendingUp, Award, Zap, Users, ShieldCheck, Activity, Target,
  Coins, Sparkles, ClipboardCheck, Send, Search, CheckCircle2,
  ChevronRight, Calendar, AlertTriangle, Loader2, BarChart2
} from 'lucide-react';
import ComplianceTracker from './ComplianceTracker';
import { dashboardApi, marketplaceApi } from '../services/api';

interface Props { user: User; }

const stages = [
  { name: 'Pre-qualified',         icon: ClipboardCheck },
  { name: 'Application Submitted', icon: Send },
  { name: 'Under Review',          icon: Search },
  { name: 'Funded',                icon: CheckCircle2 },
];

const KPICard: React.FC<{ label: string; current: number | null; target: number; unit: string; inverse?: boolean }> = ({
  label, current, target, unit, inverse = false,
}) => {
  if (current === null) {
    return (
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-[10px] text-gray-600 italic">No data — run an ESG audit</p>
      </div>
    );
  }
  const progress = Math.min((current / target) * 100, 100);
  const onTrack = inverse ? current <= target : current >= target;
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-green-500/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <div>
          <span className="text-sm font-bold text-white">{current}</span>
          <span className="text-[10px] text-gray-500 ml-1">{unit}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-700 ${onTrack ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[9px] text-gray-500 uppercase font-bold">Target: {target}{unit}</span>
        <span className={`text-[9px] font-bold ${onTrack ? 'text-green-500' : 'text-yellow-500'}`}>{onTrack ? 'ON TRACK' : 'ACTION REQUIRED'}</span>
      </div>
    </div>
  );
};

const PipelineCard: React.FC<{ app: any }> = ({ app }) => {
  const currentStageIndex = stages.findIndex(s => s.name === app.stage);
  const date = app.lastUpdated || app.updatedAt;
  return (
    <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-green-500/30 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-bold text-lg text-white">{app.fundName || app.fund}</h4>
          <p className="text-green-500 font-mono text-sm">{app.amount}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Last Update</p>
          <p className="text-xs text-gray-300">{date ? new Date(date).toLocaleDateString() : '—'}</p>
        </div>
      </div>
      <div className="relative pt-2 pb-8">
        <div className="absolute top-4 left-0 w-full h-0.5 bg-white/5" />
        <div className="flex justify-between relative z-10">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'bg-green-500 text-black scale-110' : isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-700'}`}>
                  <stage.icon className="w-4 h-4" />
                </div>
                <span className={`absolute mt-10 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ${isCurrent ? 'text-green-500' : 'text-gray-600'}`}>{stage.name}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex-grow mr-4">
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${app.progress ?? 0}%` }} />
          </div>
        </div>
        <button className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-green-500 transition-colors flex items-center space-x-1">
          <span>Manage</span><ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC<Props> = ({ user }) => {
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const trialDaysLeft = user.trialEndDate
    ? Math.max(0, Math.ceil((new Date(user.trialEndDate).getTime() - Date.now()) / 86400000))
    : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, summaryRes] = await Promise.all([
          dashboardApi.getStats(),
          marketplaceApi.getDashboardSummary(),
        ]);
        setStats(statsRes.data);
        setApplications(summaryRes.data?.applications || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const ecoScore            = stats?.ecoScore            ?? user.ecoScore ?? 0;
  const carbonBalance       = stats?.carbonBalance       ?? 0;
  const carbonFootprint     = stats?.carbonFootprint     ?? 0;
  const socialParity        = stats?.socialParity        ?? null;
  const statutoryCompliance = stats?.statutoryCompliance ?? null;
  const greenFundAccess     = stats?.greenFundAccess     ?? 0;
  const emissionData        = stats?.emissionData        ?? [];
  const esgDistribution     = stats?.esgDistribution     ?? [];
  const ledger              = stats?.ledger              ?? [];
  const kpi                 = stats?.kpiData             ?? {};
  const hasData             = stats?.hasData             ?? false;

  const statCards = [
    { label: 'Carbon Footprint',     value: carbonFootprint > 0 ? carbonFootprint.toFixed(2) : '0.00', unit: 'tCO2e', icon: Zap },
    { label: 'Social Parity',        value: socialParity        !== null ? socialParity        : '—',   unit: '%',     icon: Users },
    { label: 'Statutory Compliance', value: statutoryCompliance !== null ? statutoryCompliance : '—',   unit: '%',     icon: Award },
    { label: 'Green Fund Access',    value: greenFundAccess,                                            unit: 'Funds', icon: TrendingUp },
  ];

  const kpiSections = [
    {
      category: 'Environmental',
      metrics: [
        { label: 'Renewable Energy Mix', current: kpi.renewableEnergyMix ?? null, target: 80, unit: '%' },
        { label: 'Waste Diversion',      current: kpi.wasteDiversion      ?? null, target: 70, unit: '%' },
      ],
    },
    {
      category: 'Social',
      metrics: [
        { label: 'Local Sourcing',   current: kpi.localSourcing   ?? null, target: 85, unit: '%' },
        { label: 'Gender Diversity', current: kpi.genderDiversity ?? null, target: 50, unit: '%' },
      ],
    },
    {
      category: 'Governance',
      metrics: [
        { label: 'Policy Adherence',   current: kpi.policyAdherence   ?? null, target: 100, unit: '%' },
        { label: 'Board Independence', current: kpi.boardIndependence ?? null, target: 60,  unit: '%' },
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {user.subscriptionStatus === 'trialing' && (
        <div className="bg-gradient-to-r from-green-500/20 to-transparent border-l-4 border-green-500 p-4 rounded-r-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-green-500" />
            <p className="text-sm font-medium">
              You are on a <span className="text-green-500 font-bold">7-Day Free Trial</span>.{' '}
              {trialDaysLeft} days remaining on your {user.tier} plan.
            </p>
          </div>
          <Link to="/pricing" className="text-xs font-black uppercase tracking-widest bg-white text-black px-4 py-1.5 rounded-lg hover:bg-green-500 transition-colors">
            Manage Subscription
          </Link>
        </div>
      )}
      {user.subscriptionStatus === 'expired' && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm font-medium">Your trial has expired. Update your payment to continue.</p>
          </div>
          <Link to="/pricing" className="text-xs font-black uppercase tracking-widest bg-red-500 text-white px-4 py-1.5 rounded-lg">Renew Plan</Link>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
          <p className="text-gray-400">Real-time ESG auditing for {user.businessName}.</p>
        </div>
        <div>
          {loading ? (
            <div className="flex items-center space-x-2 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Loading...</span></div>
          ) : (
            <div className="text-center bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-2 green-glow">
              <p className="text-[10px] uppercase tracking-[0.2em] text-green-500 font-black">Verified EcoScore</p>
              <p className="text-4xl font-black text-white">{ecoScore}</p>
            </div>
          )}
        </div>
      </header>

      {!loading && !hasData && (
        <div className="glass-card p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart2 className="w-5 h-5 text-yellow-500" />
            <p className="text-sm text-yellow-400 font-medium">Add suppliers and run your first ESG audit to see real data.</p>
          </div>
          <Link to="/analysis" className="text-xs font-black uppercase tracking-widest bg-yellow-500 text-black px-4 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors">Run Audit</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/carbon" className="glass-card p-6 rounded-3xl border border-green-500/40 bg-gradient-to-r from-green-500/10 to-transparent flex items-center justify-between hover:scale-[1.01] transition-all group">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-green-500/20 rounded-2xl group-hover:bg-green-500/30 transition-colors">
              <Coins className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-green-400 tracking-widest">Tradeable Carbon Credit Balance</p>
              <h3 className="text-3xl font-black text-white">KES {carbonBalance.toLocaleString()}</h3>
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-green-400 animate-pulse" />
        </Link>
        <div className="glass-card p-6 rounded-3xl border border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-blue-500/20 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Certification Level</p>
              <h3 className="text-3xl font-black tracking-tight text-white">{user.tier}</h3>
            </div>
          </div>
          <div className="text-[10px] bg-blue-500 text-white font-black px-3 py-1 rounded uppercase tracking-widest">Active</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-white/20 hover:border-green-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <stat.icon className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <div className="flex items-baseline space-x-1">
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <span className="text-xs text-gray-400 font-medium">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-3"><TrendingUp className="w-6 h-6 text-green-500" /><span>Green Capital Pipeline</span></h2>
            <p className="text-sm text-gray-400">Tracking your deployment roadmap into institutional green funding.</p>
          </div>
          <Link to="/marketplace" className="text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-lg hover:bg-green-500/20 transition-all">View Marketplace</Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
        ) : applications.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {applications.map((app, i) => <PipelineCard key={app._id || i} app={app} />)}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No active applications yet.</p>
            <Link to="/marketplace" className="text-green-500 text-sm hover:underline">Explore Green Funds →</Link>
          </div>
        )}
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold flex items-center space-x-3"><Target className="w-6 h-6 text-green-500" /><span>ESG Performance Targets</span></h2>
          <p className="text-sm text-gray-400 mt-1">{hasData ? 'Tracking progress against 2026 CBK Directives.' : 'Run an ESG audit to populate your KPI targets.'}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {kpiSections.map((cat, idx) => (
            <div key={idx} className="space-y-4">
              <div className="pb-2 border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">{cat.category}</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {cat.metrics.map((m, midx) => <KPICard key={midx} {...m} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Carbon Emissions (Scope 1 & 2)</h2>
              <span className="text-[10px] px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20">{emissionData.length > 0 ? 'From Audits' : 'No Data Yet'}</span>
            </div>
            {emissionData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-600 text-sm">Run an ESG audit to generate emission data.</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emissionData}>
                    <XAxis dataKey="month" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="co2" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center space-x-2"><Activity className="w-5 h-5 text-green-500" /><span>Carbon Ledger</span></h2>
              <p className="text-xs text-gray-500">Derived from your supplier & credit data</p>
            </div>
            <div className="divide-y divide-white/5">
              {ledger.length === 0 ? (
                <div className="p-8 text-center text-gray-600 text-sm">No entries yet. Add suppliers or complete a carbon credit transaction.</div>
              ) : ledger.map((item: any, i: number) => (
                <div key={i} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{item.desc}</p>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">{item.type} · {item.status}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${item.color}`}>{item.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <ComplianceTracker />
          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold mb-6">ESG Distribution</h2>
            {esgDistribution.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-600 text-sm text-center">Run an ESG audit to see your distribution.</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={esgDistribution}>
                    <PolarGrid stroke="#222" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#666', fontSize: 10 }} />
                    <RadarArea name="Score" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;