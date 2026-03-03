import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, Radar as RadarArea
} from 'recharts';
import {
  TrendingUp, Award, Zap, Users, ShieldCheck, Activity, Target, Droplets,
  Recycle, Briefcase, GraduationCap, Gavel, Coins, Sparkles,
  ClipboardCheck, Send, Search, CheckCircle2, ChevronRight, Calendar,
  AlertTriangle, Loader2
} from 'lucide-react';
import ComplianceTracker from './ComplianceTracker';
import { dashboardApi, marketplaceApi } from '../services/api';

interface Props { user: User; }

const stages = [
  { name: 'Pre-qualified', icon: ClipboardCheck },
  { name: 'Application Submitted', icon: Send },
  { name: 'Under Review', icon: Search },
  { name: 'Funded', icon: CheckCircle2 },
];

const kpiData = [
  {
    category: 'Environmental',
    metrics: [
      { label: 'Renewable Energy Mix', current: 65, target: 80, unit: '%', icon: Zap },
      { label: 'Water Intensity', current: 12, target: 10, unit: 'm3/unit', icon: Droplets, inverse: true },
      { label: 'Waste Diversion', current: 45, target: 70, unit: '%', icon: Recycle },
    ]
  },
  {
    category: 'Social',
    metrics: [
      { label: 'Local Sourcing', current: 72, target: 85, unit: '%', icon: Briefcase },
      { label: 'Training Hours / Staff', current: 28, target: 40, unit: 'hrs', icon: GraduationCap },
      { label: 'Gender Diversity', current: 48, target: 50, unit: '%', icon: Users },
    ]
  },
  {
    category: 'Governance',
    metrics: [
      { label: 'Policy Adherence', current: 95, target: 100, unit: '%', icon: Gavel },
      { label: 'Board Independence', current: 60, target: 60, unit: '%', icon: Award },
    ]
  }
];

const KPICard: React.FC<{ metric: any }> = ({ metric }) => {
  const progress = (metric.current / metric.target) * 100;
  const isOverTarget = metric.inverse ? metric.current <= metric.target : metric.current >= metric.target;
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-green-500/30 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <metric.icon className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium text-gray-300">{metric.label}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold">{metric.current}</span>
          <span className="text-[10px] text-gray-500 ml-1">{metric.unit}</span>
        </div>
      </div>
      <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${isOverTarget ? 'bg-green-500' : 'bg-yellow-500'}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Target: {metric.target}{metric.unit}</span>
        <span className={`text-[9px] font-bold ${isOverTarget ? 'text-green-500' : 'text-yellow-500'}`}>
          {isOverTarget ? 'ON TRACK' : 'ACTION REQUIRED'}
        </span>
      </div>
    </div>
  );
};

const PipelineCard: React.FC<{ app: any }> = ({ app }) => {
  const currentStageIndex = stages.findIndex(s => s.name === app.stage);
  const timeSince = app.lastUpdated
    ? new Date(app.lastUpdated).toLocaleDateString()
    : new Date(app.updatedAt).toLocaleDateString();

  return (
    <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-green-500/30 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-bold text-lg">{app.fundName || app.fund}</h4>
          <p className="text-green-500 font-mono text-sm">{app.amount}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Last Update</span>
          <p className="text-xs text-gray-300">{timeSince}</p>
        </div>
      </div>
      <div className="relative pt-2 pb-8">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-[150%]" />
        <div className="flex justify-between relative z-10">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div key={idx} className="flex flex-col items-center group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCurrent ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-110' :
                  isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-700'
                }`}>
                  <stage.icon className="w-4 h-4" />
                </div>
                <span className={`absolute mt-10 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ${
                  isCurrent ? 'text-green-500' : 'text-gray-600'
                }`}>
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex-grow mr-4">
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${app.progress}%` }} />
          </div>
        </div>
        <button className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-green-500 transition-colors flex items-center space-x-1">
          <span>Manage</span>
          <ChevronRight className="w-3 h-3" />
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
    ? Math.max(0, Math.ceil((new Date(user.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, summaryRes] = await Promise.all([
          dashboardApi.getStats(),
          marketplaceApi.getDashboardSummary(),
        ]);
        setStats(statsRes.data);
        setApplications(summaryRes.data.applications || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const ecoScore = stats?.ecoScore ?? user.ecoScore ?? 82;
  const carbonBalance = stats?.carbonBalance ?? 0;
  const carbonFootprint = stats?.carbonFootprint ?? 0;
  const emissionData = stats?.emissionData ?? [];
  const esgDistribution = stats?.esgDistribution ?? [];

  const ledger = [
    { id: 1, type: 'Utility', desc: 'Kenya Power (KPLC)', status: 'Audited', impact: '-2.4kg', color: 'text-red-400' },
    { id: 2, type: 'Fuel', desc: 'Rubis Energy', status: 'Pending', impact: '-5.1kg', color: 'text-yellow-400' },
    { id: 3, type: 'Social', desc: 'Payroll Disbursement', status: 'Verified', impact: '+12pts', color: 'text-green-400' },
    { id: 4, type: 'Supply', desc: 'Maina Hauliers Ltd', status: 'Scope 3', impact: '-1.2kg', color: 'text-red-400' },
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
            <p className="text-sm font-medium">Your trial has expired. Update your payment to continue using EcoScore features.</p>
          </div>
          <Link to="/pricing" className="text-xs font-black uppercase tracking-widest bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
            Renew Plan
          </Link>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
          <p className="text-gray-400">Real-time ESG auditing for {user.businessName}.</p>
        </div>
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="flex items-center space-x-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <div className="text-center bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-2 green-glow">
              <p className="text-[10px] uppercase tracking-[0.2em] text-green-500 font-black">Verified EcoScore</p>
              <p className="text-4xl font-black text-white">{ecoScore}</p>
            </div>
          )}
        </div>
      </header>

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
              <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Premium Certification Level</p>
              <h3 className="text-3xl font-black tracking-tight text-white">{user.tier} Plus</h3>
            </div>
          </div>
          <div className="text-[10px] bg-blue-500 text-white font-black px-3 py-1 rounded uppercase tracking-widest">Active</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Carbon Footprint', value: carbonFootprint || '72.4', unit: 'tCO2e', icon: Zap, trend: '-12%' },
          { label: 'Social Parity', value: stats?.socialParity ?? '88', unit: '%', icon: Users, trend: '+4%' },
          { label: 'Statutory Compliance', value: stats?.statutoryCompliance ?? '100', unit: '%', icon: Award, trend: '0%' },
          { label: 'Green Fund Access', value: stats?.greenFundAccess ?? applications.length, unit: 'Funds', icon: TrendingUp, trend: '+2' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-white/20 hover:border-green-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <stat.icon className="w-5 h-5 text-green-400" />
              </div>
              <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-green-400' : stat.trend === '0%' ? 'text-gray-400' : 'text-red-400'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <div className="flex items-baseline space-x-1">
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <span className="text-xs text-gray-400 font-medium">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Green Capital Pipeline */}
      <div className="glass-card p-8 rounded-3xl border border-white/10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <span>Green Capital Pipeline</span>
            </h2>
            <p className="text-sm text-gray-400">Tracking your deployment roadmap into institutional green funding.</p>
          </div>
          <Link to="/marketplace" className="text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-lg hover:bg-green-500/20 transition-all">
            View Marketplace
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
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

      {/* ESG Performance Targets */}
      <div className="glass-card p-8 rounded-3xl border border-white/10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-3">
              <Target className="w-6 h-6 text-green-500" />
              <span>ESG Performance Targets</span>
            </h2>
            <p className="text-sm text-gray-400">Tracking progress against 2026 CBK Directives.</p>
          </div>
          <button className="text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg transition-colors">
            Customise Targets
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {kpiData.map((cat, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">{cat.category}</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {cat.metrics.map((m, midx) => <KPICard key={midx} metric={m} />)}
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
              <div className="flex space-x-2">
                <span className="text-[10px] px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20">Audited</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionData}>
                  <XAxis dataKey="month" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="co2" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span>M-Pesa Carbon Ledger</span>
              </h2>
              <p className="text-xs text-gray-500">Live transaction stream</p>
            </div>
            <div className="divide-y divide-white/5">
              {ledger.map((item) => (
                <div key={item.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium">{item.desc}</p>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">{item.type} • {item.status}</p>
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
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={esgDistribution}>
                  <PolarGrid stroke="#222" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#666', fontSize: 10 }} />
                  <RadarArea name="Score" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;