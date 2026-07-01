'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CaptionsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  const [captions, setCaptions] = useState<any>({});
  const [titles, setTitles] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load from session storage if available
    const stored = sessionStorage.getItem('generatedCaptions');
    if (stored) {
      try {
        setCaptions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load captions:', e);
      }
    }
    const storedTitles = sessionStorage.getItem('generatedTitles');
    if (storedTitles) {
      try {
        setTitles(JSON.parse(storedTitles));
      } catch (e) {
        console.error('Failed to load titles:', e);
      }
    }
  }, []);

  const handleGenerateCaptions = async () => {
    const transcript = sessionStorage.getItem('transcript');
    
    if (!transcript) {
      setStatus('❌ No transcript found. Please upload and transcribe a video first.');
      return;
    }

    setLoading(true);
    setStatus('🔄 Generating captions and titles...');

    try {
      const response = await fetch('/api/v1/captions', {
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
      setCaptions(data.captions || {});
      setTitles(data.titles || {});
      sessionStorage.setItem('generatedCaptions', JSON.stringify(data.captions || {}));
      sessionStorage.setItem('generatedTitles', JSON.stringify(data.titles || {}));
      setStatus('✅ Captions and titles generated!');
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const event = new CustomEvent('copied', { detail: text });
    window.dispatchEvent(event);
  };

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Link href="/" className="text-[var(--foreground)] hover:text-zinc-300 mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">✍️ Captions & Titles</h1>
          <p className="text-[var(--foreground)]">Platform-specific copy optimized for engagement</p>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`card mb-6 ${status.includes('✅') ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'}`}>
            <p className={status.includes('✅') ? 'text-green-200' : 'text-yellow-200'}>{status}</p>
          </div>
        )}

        {/* Generate Button */}
        {Object.keys(captions).length === 0 && !loading && (
          <div className="card mb-8 text-center py-8">
            <p className="text-zinc-300 mb-4">Generate platform-optimized captions and titles</p>
            <button
              onClick={handleGenerateCaptions}
              className="btn-primary px-8 py-3 text-lg"
            >
              🚀 Generate Captions & Titles
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card mb-6 text-center py-8 animate-pulse">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-zinc-300">Generating captions and titles...</p>
          </div>
        )}

        {/* Platform Selector */}
        {Object.keys(captions).length > 0 && (
          <>
            <div className="flex gap-2 mb-8 flex-wrap">
              {Object.keys(captions).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedPlatform === p
                      ? 'btn-primary bg-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-white'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Captions Section */}
            <div className="space-y-4 mb-8">
              <div className="card">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">📝 Captions</h3>
                <div className="space-y-3">
                  {captions[selectedPlatform]?.map((caption: any, i: number) => (
                    <div key={i} className="card-hover p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[var(--foreground)] capitalize">{caption.style}</span>
                        <button 
                          onClick={() => copyToClipboard(caption.text)}
                          className="text-xs bg-white hover:bg-cyan-700 px-3 py-1 rounded text-[var(--foreground)] transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className="bg-zinc-700/50 rounded p-4 text-zinc-100 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {caption.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Titles Section */}
            <div className="card">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">🎯 Titles</h3>
              <div className="space-y-3">
                {titles[selectedPlatform]?.map((title: any, i: number) => (
                  <div key={i} className="card-hover p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[var(--foreground)] capitalize">{title.style}</span>
                      <button 
                        onClick={() => copyToClipboard(title.text)}
                        className="text-xs bg-white hover:bg-cyan-700 px-3 py-1 rounded text-[var(--foreground)] transition-colors"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="bg-zinc-700/50 rounded p-3 text-zinc-100 font-mono text-sm">
                      {title.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
