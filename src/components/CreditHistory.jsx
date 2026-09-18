import React, { useEffect, useState } from 'react';
import { authenticatedFetch } from '../lib/auth';
import { readApiResponse } from '../lib/api';

export default function CreditHistory({ entries, showUser = false }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!entries);
  const [limit, setLimit] = useState(20);
  useEffect(() => {
    if (entries) { setHistory(entries); setLoading(false); return; }
    let current = true;
    authenticatedFetch('/api/user/history').then(readApiResponse)
      .then(data => { if (current) setHistory(data.history); })
      .catch(err => { if (current) setError(err.message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [entries]);
  return (
    <section className="space-y-3 pt-4" aria-label="Credit and token history">
      <h3 className="text-sm font-semibold text-white">Credit &amp; token history</h3>
      {loading && <p className="text-xs text-slate-400">Loading history...</p>}
      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
      {!loading && !error && !history.length && <p className="text-xs text-slate-400">No transactions recorded yet. History starts with this release; older temporary logs may be unavailable.</p>}
      <div className="space-y-2">
        {history.slice(0, limit).map((entry, index) => (
          <div key={entry.id || index} className="rounded-xl border border-slate-800 p-3 text-xs space-y-1">
            <p className="font-medium text-slate-200">{entry.courseTitle || entry.type}</p>
            <p className="text-slate-400">{new Date(entry.timestamp).toLocaleString()} {entry.model && ' · ' + entry.model}</p>
            {showUser && <p className="text-slate-400">{entry.userId}</p>}
            <p className="text-indigo-300">{entry.credits > 0 ? '+' : ''}{Number(entry.credits || 0).toFixed(1)} credits · Balance: {Number(entry.balance || 0).toFixed(1)} · {entry.totalTokens || 0} tokens</p>
          </div>
        ))}
      </div>
      {history.length > limit && <button type="button" className="text-xs text-indigo-300" onClick={() => setLimit(limit + 20)}>Show 20 more</button>}
    </section>
  );
}
