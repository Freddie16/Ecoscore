import React from 'react';
import { CheckCircle2, Circle, AlertCircle, FileCheck } from 'lucide-react';

const ComplianceTracker: React.FC = () => {
  const steps = [
    { title: 'IFRS S1 General Requirements', status: 'completed', date: 'Jan 2026' },
    { title: 'Scope 1 & 2 Emissions Verification', status: 'completed', date: 'Feb 2026' },
    { title: 'IFRS S2 Climate Disclosures', status: 'in-progress', date: 'Target: June 2026' },
    { title: 'Scope 3 Supply Chain Audit', status: 'pending', date: 'Required by Q3' },
    { title: 'Social Impact (Gender & Pay)', status: 'pending', date: 'Required by Q4' },
    { title: 'CBK Final ESG Certification', status: 'pending', date: 'Dec 2026' },
  ];

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-green-500" />
          <span>Compliance Roadmap</span>
        </h3>
        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">2026 Ready</span>
      </div>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start space-x-4">
            <div className="mt-1">
              {step.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {step.status === 'in-progress' && <Circle className="w-5 h-5 text-blue-500 animate-pulse" />}
              {step.status === 'pending' && <Circle className="w-5 h-5 text-gray-700" />}
            </div>
            <div className="flex-grow pb-4 border-b border-white/5">
              <div className="flex justify-between items-center mb-1">
                <p className={`text-sm font-medium ${step.status === 'pending' ? 'text-gray-500' : 'text-white'}`}>
                  {step.title}
                </p>
                <span className="text-[10px] text-gray-500 font-mono uppercase">{step.date}</span>
              </div>
              {step.status === 'in-progress' && (
                <div className="mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-full w-2/3 transition-all duration-1000" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
        <p className="text-[10px] text-yellow-500/80 leading-tight">
          Warning: Scope 3 reporting for Tier 1 suppliers becomes mandatory in 114 days under CBK Directive 04/2026.
        </p>
      </div>
    </div>
  );
};

export default ComplianceTracker;