'use client';

import { useState } from 'react';
import { 
  LightbulbIcon, 
  SearchIcon, 
  BarChartIcon, 
  GlobeIcon, 
  RefreshCwIcon,
  PlayIcon
} from '../components/Icons';

export default function TrendsPage() {
  const [region, setRegion] = useState('Global');
  const [niche, setNiche] = useState('General');
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<any[]>([]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/trends/analyze?region=${encodeURIComponent(region)}&niche=${encodeURIComponent(niche)}`);
      if (res.ok) {
        const data = await res.json();
        setTrends(data.trends || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0 bg-[var(--panel)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--background)] border border-[var(--border)] flex items-center justify-center">
            <BarChartIcon className="w-4 h-4 text-[var(--foreground)]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Trend Analyzer</h1>
            <p className="text-xs text-[var(--muted)]">Data-driven content opportunities</p>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Filters */}
        <div className="w-64 border-r border-[var(--border)] bg-[var(--background)] flex flex-col p-4 shrink-0 overflow-y-auto space-y-6">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Target Niche</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. AI SaaS, Fitness..."
                className="input-field"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="input-field"
              >
                <option value="Global">Global</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="India">India</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <RefreshCwIcon className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <SearchIcon className="w-4 h-4 mr-2" />
              )}
              Analyze Market
            </button>
          </form>

          <div className="border-t border-[var(--border)] pt-4 space-y-2">
            <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">Saved Searches</h3>
            <button className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--panel-hover)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center justify-between">
              SaaS Marketing <span className="badge badge-default">Global</span>
            </button>
            <button className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--panel-hover)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center justify-between">
              Indie Hackers <span className="badge badge-default">US</span>
            </button>
          </div>
        </div>

        {/* Main Content Area: Data Table */}
        <div className="flex-1 flex flex-col bg-[var(--background)] min-w-0 overflow-hidden">
          
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]">
            <div className="flex gap-2">
              <span className="badge badge-info">Score &gt; 80</span>
              <span className="badge badge-default">Format: Any</span>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5">Export CSV</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {trends.length === 0 && !loading ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-lg bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center mb-4">
                  <BarChartIcon className="w-6 h-6 text-[var(--muted)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">No Data Active</h3>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-sm">Run an analysis to generate real-time market data, trend scores, and hook ideas.</p>
              </div>
            ) : loading ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <RefreshCwIcon className="w-6 h-6 animate-spin text-[var(--muted)]" />
                <p className="text-xs text-[var(--muted)]">Crunching market data...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-[var(--panel)] text-[var(--muted)] text-xs font-semibold border-b border-[var(--border)] shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Topic</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3 text-right">Trend Score</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {trends.map((trend, i) => (
                    <tr key={i} className="hover:bg-[var(--panel-hover)] group transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 max-w-sm">
                          <span className="font-semibold text-[var(--foreground)] truncate">{trend.topic}</span>
                          <span className="text-xs text-[var(--muted)] truncate">{trend.hook}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-default">{trend.format}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-[var(--panel)] border border-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--foreground)]" style={{ width: `${trend.virality_score}%` }}></div>
                          </div>
                          <span className="text-xs font-mono font-medium text-[var(--foreground)] w-6">{trend.virality_score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="btn-secondary text-xs py-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity">Write Script</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
