'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ViralClipsPage() {
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load clips from sessionStorage if available
    const stored = sessionStorage.getItem('viralClips');
    if (stored) {
      try {
        setClips(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load stored clips:', e);
      }
    }
  }, []);

  const handleAnalyzeClips = async () => {
    const transcript = sessionStorage.getItem('transcript');
    
    if (!transcript) {
      setStatus('❌ No transcript found. Please upload and transcribe a video first.');
      return;
    }

    setLoading(true);
    setStatus('🔄 Analyzing transcript for viral moments...');

    try {
      const response = await fetch('/api/v1/viral-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
        mode: 'cors',
      });

      if (!response.ok) {
        const error = await response.json();
        setStatus(`❌ Error: ${error.detail || 'Failed to analyze'}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const clipsData = data.clips || [];
      setClips(clipsData);
      sessionStorage.setItem('viralClips', JSON.stringify(clipsData));
      setStatus(`✅ Found ${clipsData.length} viral moment(s)`);
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <Link href="/" className="text-[var(--foreground)] hover:text-zinc-300 mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">🎯 Viral Clip Moments</h1>
          <p className="text-[var(--foreground)]">AI-detected moments most likely to go viral</p>
        </div>

        {/* Info Card */}
        <div className="card mb-8 bg-blue-900/20 border-blue-700">
          <p className="text-blue-200">
            ℹ️ Based on your transcript, these moments have the highest viral potential. Each clip is ranked by engagement prediction.
          </p>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`card mb-6 ${status.includes('✅') ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'}`}>
            <p className={status.includes('✅') ? 'text-green-200' : 'text-yellow-200'}>{status}</p>
          </div>
        )}

        {/* Analyze Button */}
        {clips.length === 0 && !loading && (
          <div className="card mb-6 text-center py-8">
            <p className="text-zinc-300 mb-4">Analyze your transcript to find viral moments</p>
            <button
              onClick={handleAnalyzeClips}
              className="btn-primary px-8 py-3 text-lg"
            >
              🔍 Analyze Transcript
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card mb-6 text-center py-8 animate-pulse">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-zinc-300">Analyzing transcript for viral moments...</p>
            <p className="text-[var(--muted)] text-sm mt-2">Using AI to identify high-engagement segments</p>
          </div>
        )}

        {/* Clips Grid */}
        {clips.length > 0 && (
          <>
            <div className="space-y-4">
              {clips.map((clip, i) => (
                <div key={i} className="card-hover p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {clip.clip_type === 'hook' ? '🪝' : clip.clip_type === 'emotional' ? '❤️' : clip.clip_type === 'storytelling' ? '📖' : clip.clip_type === 'educational' ? '💡' : '⭐'}
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--foreground)] capitalize">{clip.clip_type} Moment</p>
                          <p className="text-sm text-[var(--foreground)]">{clip.start_time.toFixed(1)}s - {clip.end_time.toFixed(1)}s ({(clip.end_time - clip.start_time).toFixed(1)}s)</p>
                        </div>
                      </div>
                      <p className="text-zinc-300 mt-3 bg-zinc-700/30 rounded p-3">{clip.segment}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold bg-white bg-clip-text text-transparent">
                        {clip.viral_score}%
                      </div>
                      <p className="text-xs text-[var(--foreground)]">Viral Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Next Action */}
            <div className="mt-8 card">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">📊 Ready for Next Step?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/results/clips">
                  <button className="w-full btn-primary py-3 text-lg">
                    🎬 Generate Vertical Clips
                  </button>
                </Link>
                <Link href="/results">
                  <button className="w-full btn-secondary py-3 text-lg">
                    📊 View All Options
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
