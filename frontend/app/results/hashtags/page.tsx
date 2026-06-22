'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HashtagsPage() {
  const [hashtags, setHashtags] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load from session storage if available
    const stored = sessionStorage.getItem('generatedHashtags');
    if (stored) {
      try {
        setHashtags(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load hashtags:', e);
      }
    }
  }, []);

  const handleGenerateHashtags = async () => {
    const transcript = sessionStorage.getItem('transcript');
    
    if (!transcript) {
      setStatus('❌ No transcript found. Please upload and transcribe a video first.');
      return;
    }

    setLoading(true);
    setStatus('🔄 Generating hashtags...');

    try {
      const response = await fetch('/api/v1/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
        mode: 'cors',
      });

      if (!response.ok) {
        const error = await response.json();
        setStatus(`❌ Error: ${error.detail || 'Failed to generate'}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setHashtags(data.hashtags || {});
      sessionStorage.setItem('generatedHashtags', JSON.stringify(data.hashtags || {}));
      setStatus('✅ Hashtags generated!');
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">#️⃣ Hashtags</h1>
          <p className="text-slate-400">Trending hashtags optimized per platform</p>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`card mb-6 ${status.includes('✅') ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'}`}>
            <p className={status.includes('✅') ? 'text-green-200' : 'text-yellow-200'}>{status}</p>
          </div>
        )}

        {/* Generate Button */}
        {Object.keys(hashtags).length === 0 && !loading && (
          <div className="card mb-8 text-center py-8">
            <p className="text-slate-300 mb-4">Generate trending hashtags for your platforms</p>
            <button
              onClick={handleGenerateHashtags}
              className="btn-primary px-8 py-3 text-lg"
            >
              🚀 Generate Hashtags
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card mb-6 text-center py-8 animate-pulse">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-slate-300">Generating hashtags...</p>
          </div>
        )}

        {/* Hashtags Grid */}
        {Object.keys(hashtags).length > 0 && (
          <div className="grid gap-6">
            {Object.entries(hashtags).map(([platform, data]: [string, any]) => (
              <div key={platform} className="card">
                <h3 className="text-lg font-semibold text-cyan-400 capitalize mb-4">{platform}</h3>
                
                {/* Hashtag Tags */}
                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-3">Popular tags:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.hashtags?.map((tag: string, i: number) => (
                      <span
                        key={i}
                        onClick={() => copyToClipboard(tag)}
                        className="px-3 py-1 bg-cyan-900/30 border border-cyan-600 rounded-full text-sm text-cyan-300 hover:bg-cyan-800 cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Full String */}
                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-2">Copy all:</p>
                  <div className="bg-slate-700/50 rounded p-3 text-slate-100 text-sm break-words font-mono">
                    {data.hashtag_string}
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(data.hashtag_string)}
                  className="w-full text-sm bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-white transition-colors"
                >
                  📋 Copy All Hashtags
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
