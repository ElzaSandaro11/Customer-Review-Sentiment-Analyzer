'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Send, TrendingUp, TrendingDown, Minus, Shield, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { TenantSelector } from '../components/TenantSelector';
import { ReviewDrilldown } from '../components/ReviewDrilldown';

interface Review {
  id: string;
  text: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  overallVerdict?: 'PASS' | 'WARN' | 'BLOCK';
  createdAt: string;
}

export default function Home() {
  const [text, setText] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  
  // -- New States --
  const [tenantId, setTenantId] = useState('tenant-a');
  const [guardrails, setGuardrails] = useState({
    toxicity: true,
    pii: true,
    prompt_injection: true,
  });
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<any>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:3000/reviews', {
        headers: { 'x-tenant-id': tenantId }
      });
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
      setReviews([]); 
    }
  }, [tenantId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/analyze', 
        { 
          text,
          guardrails 
        },
        { 
          headers: { 'x-tenant-id': tenantId }
        }
      );
      setReviews((prev) => [res.data, ...prev]);
      setText('');
    } catch (err: any) {
      if (err.response?.status === 422) {
          // It was blocked, but we still want to show it in the list potentially or alert the user
          // The backend returns the saved review even on 422
          const blockedReview = err.response.data;
          alert(`Review BLOCKED by Guardrails: ${blockedReview.overall_guardrail_verdict}`);
          setReviews((prev) => [blockedReview, ...prev]);
          setText('');
      } else {
        alert('Failed to analyze review');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrilldown = async (id: string) => {
      setSelectedReviewId(id);
      try {
          const res = await axios.get(`http://localhost:3000/reviews/${id}`, {
              headers: { 'x-tenant-id': tenantId }
          });
          setDrilldownData(res.data);
      } catch (e) {
          console.error("Failed to load details", e);
          setSelectedReviewId(null);
      }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'NEGATIVE': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getGuardrailBadge = (verdict?: string) => {
      if (!verdict) return null;
      switch(verdict) {
          case 'PASS': 
            return <div title="Guardrails Passed" className="p-1 rounded bg-green-500/10 text-green-400"><ShieldCheck size={16}/></div>;
          case 'WARN':
            return <div title="Guardrails Warning" className="p-1 rounded bg-yellow-500/10 text-yellow-400"><AlertTriangle size={16}/></div>;
          case 'BLOCK':
            return <div title="Guardrails Blocked" className="p-1 rounded bg-red-500/10 text-red-400"><ShieldAlert size={16}/></div>;
          default: return null;
      }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return <TrendingUp size={16} />;
      case 'NEGATIVE': return <TrendingDown size={16} />;
      default: return <Minus size={16} />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-blue-500/30">
      {/* Drilldown Modal */}
      {selectedReviewId && drilldownData && (
          <ReviewDrilldown 
            review={drilldownData} 
            onClose={() => { setSelectedReviewId(null); setDrilldownData(null); }} 
          />
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Sentiment & Guardrails
            </h1>
            <p className="text-slate-500 text-sm">AI-Powered Content Analysis Platform</p>
          </div>
          <TenantSelector currentTenant={tenantId} onTenantChange={setTenantId} />
        </header>

        {/* Input Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="mb-4 flex gap-4 text-sm text-slate-400">
             <span className="font-semibold text-slate-300">Active Guardrails:</span>
             <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                 <input type="checkbox" checked={guardrails.toxicity} onChange={e => setGuardrails({...guardrails, toxicity: e.target.checked})} className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-offset-slate-900" />
                 Toxicity
             </label>
             <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                 <input type="checkbox" checked={guardrails.pii} onChange={e => setGuardrails({...guardrails, pii: e.target.checked})} className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-offset-slate-900" />
                 PII
             </label>
             <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                 <input type="checkbox" checked={guardrails.prompt_injection} onChange={e => setGuardrails({...guardrails, prompt_injection: e.target.checked})} className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-offset-slate-900" />
                 Prompt Injection
             </label>
          </div>

          <textarea
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-32 transition-all"
            placeholder="Type a customer review here (e.g., 'The pizza was amazing but delivery was slow')..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-slate-600 font-mono">{text.length}/500</span>
            <button
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2 transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Shield size={18} className="text-blue-200" />
              )}
              Analyze
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 ml-1">Recent Analyses for {tenantId}</h2>
          
          <div className="grid gap-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                onClick={() => handleOpenDrilldown(review.id)}
                className="group bg-slate-900/40 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 rounded-xl p-4 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 truncate font-medium">{review.text}</p>
                    <div className="flex items-center gap-3 mt-3">
                         <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold border ${getSentimentColor(review.sentiment)}`}>
                            {getSentimentIcon(review.sentiment)}
                            {review.sentiment} {(review.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-slate-500">
                             {new Date(review.createdAt).toLocaleTimeString()}
                        </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                       {getGuardrailBadge(review.overallVerdict || 'PASS')}
                  </div>
                </div>
                
                {/* Confidence Mini-Bars */}
                <div className="flex gap-1 mt-3 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="h-1 bg-green-500 rounded-full" style={{ width: `${review.scores.positive * 100}%` }} />
                    <div className="h-1 bg-red-500 rounded-full" style={{ width: `${review.scores.negative * 100}%` }} />
                    <div className="h-1 bg-gray-500 rounded-full" style={{ width: `${review.scores.neutral * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          
          {reviews.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
              <p className="text-slate-500">No reviews found for this tenant.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
