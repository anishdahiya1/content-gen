'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ClipsPage() {
  const [clips, setClips] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load clips from sessionStorage if available
    const stored = sessionStorage.getItem('generatedClips');
    if (stored) {
      try {
        setClips(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load stored clips:', e);
      }
    }
  }, []);

  const handleGenerateClips = async () => {
    // Get video path and clips data from session
    const videoPath = sessionStorage.getItem('uploadedVideoPath');
    const viralClipsJson = sessionStorage.getItem('viralClips');

    if (!videoPath || !viralClipsJson) {
      setStatus('❌ Please upload a video and analyze for viral moments first');
      return;
    }

    setGenerating(true);
    setStatus('🔄 Generating vertical clips with FFmpeg...');

    try {
      const viralClips = JSON.parse(viralClipsJson);
      
      const response = await fetch('/api/v1/generate-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_path: videoPath,
          clips: viralClips,  // Send as array of clip objects
        }),
        mode: 'cors',
      });

      if (!response.ok) {
        const error = await response.json();
        setStatus(`❌ Error: ${error.detail || 'Failed to generate clips'}`);
        setGenerating(false);
        return;
      }

      const data = await response.json();
      setClips(data.clips || []);
      sessionStorage.setItem('generatedClips', JSON.stringify(data.clips || []));
      setStatus(`✅ ${data.message}`);
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <Link href="/results" className="text-[var(--foreground)] hover:text-zinc-300 mb-6 inline-block">
            ← Back to Results
          </Link>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">🎬 Short-Form Clips</h1>
          <p className="text-[var(--foreground)]">Vertical 9:16 videos ready to publish</p>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`card mb-6 ${status.includes('✅') ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'}`}>
            <p className={status.includes('✅') ? 'text-green-200' : 'text-yellow-200'}>{status}</p>
          </div>
        )}

        {/* Generate Button */}
        {clips.length === 0 && !generating && (
          <div className="card mb-6 text-center py-8">
            <p className="text-zinc-300 mb-4">Generate vertical 9:16 clips from your viral moments</p>
            <button
              onClick={handleGenerateClips}
              className="btn-primary px-6 py-3 text-lg"
            >
              🚀 Generate Clips
            </button>
          </div>
        )}

        {/* Loading State */}
        {generating && (
          <div className="card mb-6 text-center py-8 animate-pulse">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-zinc-300">Generating clips with FFmpeg...</p>
            <p className="text-[var(--muted)] text-sm mt-2">This may take a few minutes depending on clip length</p>
          </div>
        )}

        {/* Clips Grid */}
        {clips.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clips.map((clip) => (
                <div key={clip.clip_number} className="card-hover flex flex-col">
                  {/* Video Placeholder */}
                  <div className="aspect-[9/16] bg-white rounded-lg mb-4 flex items-center justify-center border-2 border-cyan-600">
                    <div className="text-center">
                      <div className="text-5xl mb-2">🎬</div>
                      <p className="text-zinc-200 font-semibold">Clip {clip.clip_number}</p>
                      <p className="text-[var(--foreground)] text-sm">{clip.duration.toFixed(1)}s</p>
                      <p className="text-[var(--foreground)] text-xs mt-1 capitalize">{clip.clip_type}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-zinc-300 capitalize">{clip.clip_type}</span>
                      <span className="text-xl font-bold bg-white bg-clip-text text-transparent">
                        {clip.viral_score}%
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground)] mb-3 line-clamp-2">{clip.segment}</p>
                    <p className="text-xs text-[var(--muted)] mb-4">
                      📁 {clip.filename}
                    </p>
                    {clip.status === 'generated' ? (
                      <>
                        <button className="w-full btn-primary py-2 text-sm mb-2">
                          📥 Download
                        </button>
                        <button className="w-full btn-secondary py-2 text-sm">
                          👁️ Preview
                        </button>
                      </>
                    ) : (
                      <div className="w-full bg-red-900/20 border border-red-700 rounded p-2 text-center text-zinc-300 text-xs">
                        ❌ {clip.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Download All */}
            <div className="mt-8 text-center">
              <button className="btn-primary px-8 py-3">
                📦 Download All Clips
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
