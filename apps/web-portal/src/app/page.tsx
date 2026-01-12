'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  createdAt: string;
}

export default function Home() {
  const [text, setText] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await axios.get('http://localhost:3000/reviews');
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/analyze', { text });
      setReviews((prev) => [res.data, ...prev]);
      setText('');
    } catch (err) {
      alert('Failed to analyze review');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'bg-green-100/10 text-green-400 border-green-500/50';
      case 'NEGATIVE': return 'bg-red-100/10 text-red-400 border-red-500/50';
      default: return 'bg-gray-100/10 text-gray-400 border-gray-500/50';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return <TrendingUp size={16} />;
      case 'NEGATIVE': return <TrendingDown size={16} />;
      default: return <Minus size={16} />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Sentiment Analyzer
          </h1>
          <p className="text-slate-400">Powered by AI Analysis</p>
        </header>

        {/* Input Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <textarea
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
            placeholder="Type a customer review here (e.g., 'The pizza was amazing but delivery was slow')..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-slate-500">{text.length}/500</span>
            <button
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-6 py-2 transition-colors flex items-center gap-2 font-medium"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Send size={18} />
              )}
              Analyze
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-300">Recent Analyses</h2>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${getSentimentColor(review.sentiment)}`}>
                  {getSentimentIcon(review.sentiment)}
                  {review.sentiment} {(review.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(review.createdAt).toLocaleString()}
                </div>
              </div>
              
              <p className="text-slate-200 mb-4">{review.text}</p>
              
              {/* Confidence Bars */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1 text-green-400"><span>Positive</span> <span>{(review.scores.positive * 100).toFixed(0)}%</span></div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${review.scores.positive * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-red-400"><span>Negative</span> <span>{(review.scores.negative * 100).toFixed(0)}%</span></div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${review.scores.negative * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-gray-400"><span>Neutral</span> <span>{(review.scores.neutral * 100).toFixed(0)}%</span></div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-500" style={{ width: `${review.scores.neutral * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {reviews.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              No reviews analyzed yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
