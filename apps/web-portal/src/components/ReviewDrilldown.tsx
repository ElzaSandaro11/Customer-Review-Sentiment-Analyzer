import { X, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface GuardrailResult {
  score: number;
  verdict: 'PASS' | 'WARN' | 'BLOCK';
  reason?: string;
}

interface ReviewDetail {
  id: string;
  text: string;
  sentiment: string;
  confidence: number;
  scores: any;
  overallVerdict: 'PASS' | 'WARN' | 'BLOCK';
  guardrailCheck?: {
    results: {
        guardrailKey: string;
        score: number;
        verdict: 'PASS' | 'WARN' | 'BLOCK';
        reason?: string;
    }[]
  };
}

interface Props {
  review: ReviewDetail;
  onClose: () => void;
}

export function ReviewDrilldown({ review, onClose }: Props) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'PASS': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'WARN': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'BLOCK': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400';
    }
  };

  const getIcon = (verdict: string) => {
      switch(verdict) {
          case 'PASS': return <ShieldCheck size={18} />;
          case 'WARN': return <AlertTriangle size={18} />;
          case 'BLOCK': return <ShieldAlert size={18} />;
      }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Analysis Details</h2>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${getVerdictColor(review.overallVerdict)}`}>
               {getIcon(review.overallVerdict)}
              Guardrail Status: {review.overallVerdict}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          <section>
            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-3">Review Content</h3>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
              {review.text}
            </div>
          </section>

          <section>
            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-3">Sentiment Analysis</h3>
            <div className="grid grid-cols-3 gap-4">
               {Object.entries(review.scores).map(([label, score]: [string, any]) => (
                 <div key={label} className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400 capitalize mb-1">{label}</div>
                    <div className="text-xl font-semibold text-slate-200">{(score * 100).toFixed(1)}%</div>
                 </div>
               ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-3">Guardrail Breakdown</h3>
            <div className="space-y-3">
              {(review.guardrailCheck?.results || []).map((res, idx) => (
                <div key={idx} className="flex items-start justify-between bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium text-slate-200 capitalize">
                      {res.guardrailKey.replace('_', ' ')}
                    </div>
                    {res.reason && (
                      <div className="text-sm text-slate-400">
                        {res.reason}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase ${getVerdictColor(res.verdict)}`}>
                      {res.verdict}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Score: {res.score.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              {(!review.guardrailCheck?.results || review.guardrailCheck.results.length === 0) && (
                  <div className="text-sm text-slate-500 italic">No specific guardrails were triggered or recorded.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
