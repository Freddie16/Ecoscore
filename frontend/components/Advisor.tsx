import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { analysisApi } from '../services/api';

const Advisor: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: "Hello! I'm your EcoScore Advisor. How can I help you improve your sustainability metrics today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await analysisApi.chat(history);
      setMessages([...newMessages, { role: 'model', text: res.data.response }]);
    } catch (err: any) {
      setMessages([...newMessages, {
        role: 'model',
        text: "I'm having trouble connecting right now. Please check your connection and try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col space-y-4">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 bg-green-500 rounded-lg">
          <Bot className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">EcoAdvisor AI</h1>
          <p className="text-gray-400 text-sm">Strategic sustainability consulting for your business.</p>
        </div>
      </div>

      <div className="flex-grow glass-card rounded-2xl border border-white/10 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`p-2 rounded-lg shrink-0 ${m.role === 'user' ? 'bg-white/10' : 'bg-green-500/10 border border-green-500/20'}`}>
                  {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-green-500" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-white text-black font-medium'
                    : 'bg-white/5 border border-white/10 text-gray-200'
                }`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                <span className="text-xs text-gray-400 italic">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/30 backdrop-blur-xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="e.g. How can I reduce my Scope 2 emissions in Nairobi?"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-green-500 transition-all"
            />
            <button
              onClick={handleSend}
              className="absolute right-2 p-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advisor;