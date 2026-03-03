import React, { useState, useEffect } from 'react';
import {
  Check, ShieldCheck, Zap, Building2, Crown, X, Info, Coins,
  Smartphone, CreditCard, Loader2, CheckCircle2, ChevronRight,
  AlertCircle, Clock, Calendar
} from 'lucide-react';
import { User } from '../types';
import { authApi } from '../services/api';

interface PricingProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const Pricing: React.FC<PricingProps> = ({ user, onUpdateUser }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'processing' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'paypal' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [upgradeError, setUpgradeError] = useState('');

  const tiers = [
    {
      id: 'Free', name: 'Essential', price: 'Free',
      description: 'Ideal for micro-SMEs starting their ESG journey.',
      features: ['Basic Carbon Footprint', 'Social Metric Review', 'Standard IFRS Roadmap', 'Community Support'],
      icon: Zap, cta: 'Free Forever', popular: false,
    },
    {
      id: 'Pro', name: 'Professional', price: 'KES 4,500', period: '/mo', trial: '7-Day Free Trial',
      description: 'The standard for growth-stage SMEs seeking bank capital.',
      features: ['Automated M-Pesa Auditing', 'Verified EcoScore Badge', 'Scope 3 Supplier Risk Analysis', 'Priority Fund Matching', 'Exportable Bank-Ready PDFs'],
      icon: Crown, cta: 'Start 7-Day Trial', popular: true,
    },
    {
      id: 'Enterprise', name: 'Enterprise', price: 'KES 45,000', period: '/mo', trial: '7-Day Free Trial',
      description: 'Advanced features for large entities and supply chain anchors.',
      features: ['Multi-entity Consolidated Audits', 'Full API Access for Lenders', 'Custom Compliance Portals', 'Dedicated ESG Strategist', 'Carbon Credit Listing Service'],
      icon: Building2, cta: 'Start 7-Day Trial', popular: false,
    },
  ];

  useEffect(() => {
    let timer: any;
    if (paymentStep === 'processing' && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0 && paymentStep === 'processing') {
      handleFinalizePayment();
    }
    return () => clearInterval(timer);
  }, [paymentStep, countdown]);

  const validatePhone = (num: string) => {
    const regex = /^(?:254|\+254|0)?(7|1)(?:[0-9]){8}$/;
    if (!num) return 'Phone number is required';
    if (!regex.test(num)) return 'Invalid Kenyan phone number format';
    return '';
  };

  const handleUpgradeClick = (tier: any) => {
    if (tier.id === 'Free' || user.tier === tier.id) return;
    setSelectedPlan(tier);
    setIsPaymentModalOpen(true);
    setPaymentStep('method');
    setPaymentMethod(null);
    setPhoneError('');
    setCountdown(30);
    setUpgradeError('');
  };

  const initiatePayment = () => {
    if (paymentMethod === 'mpesa') {
      const error = validatePhone(phoneNumber);
      if (error) { setPhoneError(error); return; }
    }
    setPaymentStep('processing');
  };

  const handleFinalizePayment = async () => {
    try {
      const res = await authApi.upgrade({
        tier: selectedPlan.id,
        paymentMethod: paymentMethod || 'mpesa',
      });

      if (res.success) {
        onUpdateUser({ ...res.user, isAuthenticated: true });
        setPaymentStep('success');
      }
    } catch (err: any) {
      setUpgradeError(err.message || 'Upgrade failed. Please try again.');
      setPaymentStep('details');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-green-400 to-white bg-clip-text text-transparent">
          Sustainable Growth, <br/>Structured for Profit.
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Unlock the financial value of your sustainability metrics with our 7-day free trial on all paid plans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div key={tier.name} className={`glass-card p-10 rounded-[2.5rem] border flex flex-col relative transition-all hover:scale-[1.02] ${
            tier.popular ? 'border-green-500/50 shadow-2xl shadow-green-500/10 bg-white/[0.03]' : 'border-white/10'
          } ${user.tier === tier.id ? 'ring-2 ring-green-500 ring-offset-4 ring-offset-black' : ''}`}>
            {tier.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-green-500 text-black text-[10px] font-black uppercase rounded-full shadow-lg shadow-green-500/40">
                Most Popular
              </span>
            )}
            <div className="flex items-center space-x-4 mb-8">
              <div className={`p-3 rounded-2xl ${tier.popular ? 'bg-green-500 text-black' : 'bg-white/5 text-green-500'}`}>
                <tier.icon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">{tier.name}</h2>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black">{tier.price}</span>
                {(tier as any).period && <span className="text-gray-500 text-lg">{(tier as any).period}</span>}
              </div>
              {(tier as any).trial && (
                <p className="text-green-500 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {(tier as any).trial}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-8 min-h-[40px] leading-relaxed">{tier.description}</p>
            <div className="space-y-4 mb-10 flex-grow">
              {tier.features.map((feature) => (
                <div key={feature} className="flex items-start space-x-3 text-sm">
                  <div className="mt-1 bg-green-500/20 rounded-full p-0.5">
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  </div>
                  <span className="text-gray-300 font-medium">{feature}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleUpgradeClick(tier)}
              disabled={user.tier === tier.id}
              className={`w-full py-4 rounded-2xl font-black transition-all ${
                user.tier === tier.id
                  ? 'bg-white/10 text-gray-500 cursor-default'
                  : tier.popular
                  ? 'bg-green-500 text-black hover:bg-green-400 shadow-xl shadow-green-500/20'
                  : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {user.tier === tier.id ? 'Current Plan' : tier.cta}
            </button>
          </div>
        ))}
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="glass-card w-full max-w-lg rounded-[3rem] border border-white/10 overflow-hidden">
            <div className="p-8 md:p-12 relative">
              <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white p-2">
                <X className="w-6 h-6" />
              </button>

              {paymentStep === 'method' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500/10 rounded-2xl mb-4">
                      <ShieldCheck className="w-7 h-7 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Setup Payment</h2>
                    <p className="text-gray-400 text-sm">
                      Setup your billing to unlock your 7-day trial of <strong>{selectedPlan.name}</strong>. No charge until your trial ends.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <button
                      onClick={() => { setPaymentMethod('mpesa'); setPaymentStep('details'); }}
                      className="w-full p-6 rounded-[2rem] border border-white/10 bg-white/5 hover:border-[#49B549]/50 hover:bg-[#49B549]/[0.05] flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-[#49B549] rounded-2xl flex items-center justify-center shadow-lg shadow-[#49B549]/20">
                          <Smartphone className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-lg">M-Pesa Express</p>
                          <p className="text-xs text-gray-500 font-medium">Auto-bill via STK Push</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-green-500 transition-colors" />
                    </button>
                    <button
                      onClick={() => { setPaymentMethod('paypal'); setPaymentStep('details'); }}
                      className="w-full p-6 rounded-[2rem] border border-white/10 bg-white/5 hover:border-[#003087]/50 hover:bg-[#003087]/[0.05] flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-[#003087] rounded-2xl flex items-center justify-center shadow-lg shadow-[#003087]/20">
                          <CreditCard className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-lg">PayPal / Card</p>
                          <p className="text-xs text-gray-500 font-medium">Standard Global Billing</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-blue-400 transition-colors" />
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl flex items-start gap-3 border border-white/5">
                    <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold">
                      You will be billed <span className="text-white">{selectedPlan.price}</span> starting from{' '}
                      {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}. Cancel anytime.
                    </p>
                  </div>
                </div>
              )}

              {paymentStep === 'details' && (
                <div className="space-y-8">
                  <button onClick={() => setPaymentStep('method')} className="text-xs font-bold text-gray-500 hover:text-white flex items-center space-x-1">
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    <span>Back to methods</span>
                  </button>
                  <div className="text-center">
                    <h2 className="text-3xl font-black tracking-tight">
                      {paymentMethod === 'mpesa' ? 'Enter Phone Number' : 'PayPal Confirmation'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-2">Trial Plan: <span className="text-white font-bold">{selectedPlan.name}</span></p>
                  </div>
                  {upgradeError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center">
                      {upgradeError}
                    </div>
                  )}
                  {paymentMethod === 'mpesa' ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Safaricom Number (M-Pesa)</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => { setPhoneNumber(e.target.value); if (phoneError) setPhoneError(''); }}
                            placeholder="07XX XXX XXX"
                            className={`w-full bg-white/5 border ${phoneError ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-5 focus:outline-none focus:border-green-500 text-white font-mono text-xl transition-all`}
                          />
                          {phoneError && (
                            <p className="absolute -bottom-6 left-1 text-[10px] text-red-500 font-bold flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3" /><span>{phoneError}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-[#49B549]/10 border border-[#49B549]/20 rounded-xl flex items-start gap-3">
                        <Smartphone className="w-4 h-4 text-[#49B549] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-400 font-medium">We will send a validation STK push. You won't be charged for authorization.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 bg-[#003087]/5 border border-[#003087]/20 rounded-3xl text-center space-y-4">
                      <div className="w-16 h-16 bg-[#003087] rounded-full flex items-center justify-center mx-auto shadow-xl">
                        <CreditCard className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm text-gray-300">Proceeding will authorize the monthly recurring payment for the {selectedPlan.name} plan.</p>
                    </div>
                  )}
                  <button
                    onClick={initiatePayment}
                    className={`w-full py-5 ${paymentMethod === 'mpesa' ? 'bg-[#49B549]' : 'bg-[#003087]'} text-white font-black rounded-2xl hover:opacity-90 transition-all active:scale-95`}
                  >
                    Start My 7-Day Free Trial
                  </button>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-white/5 border-t-green-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-green-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black">Validating Setup</h2>
                    <p className="text-sm text-gray-400">
                      {paymentMethod === 'mpesa' ? 'Check your phone for the STK prompt...' : 'Authenticating with PayPal gateway...'}
                    </p>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden max-w-xs">
                    <div className="h-full bg-green-500 transition-all duration-1000 ease-linear" style={{ width: `${(1 - (countdown / 30)) * 100}%` }} />
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.4)]">
                    <CheckCircle2 className="w-12 h-12 text-black stroke-[3px]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight">Access Granted!</h2>
                    <p className="text-gray-400">
                      Welcome to the <strong>{selectedPlan.name}</strong> tier. <br/>
                      Your 7-day trial expires on <strong>{new Date(user.trialEndDate || Date.now() + 7 * 86400000).toLocaleDateString()}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-green-500 transition-all shadow-xl shadow-green-500/20 active:scale-95"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="pt-12 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-1000">
        <div className="flex items-center gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" className="h-6" alt="M-Pesa" />
          <span className="text-xs font-bold">Authorized Billing</span>
        </div>
        <div className="flex items-center gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-6" alt="PayPal" />
          <span className="text-xs font-bold">Encrypted Checkout</span>
        </div>
        <div className="flex items-center gap-3 text-white">
          <ShieldCheck className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-widest">PCI-DSS Compliant</span>
        </div>
      </div>
    </div>
  );
};

export default Pricing;