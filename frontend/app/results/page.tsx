'use client';

import Link from 'next/link';

export default function ResultsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Content Results</h1>
          <p className="text-slate-400">View and manage your generated content</p>
        </div>

        {/* Results Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Viral Clips */}
          <Link href="/results/viral-clips">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">🎯</div>
              <h3 className="font-semibold text-lg text-cyan-400">Viral Clips</h3>
              <p className="text-slate-400 text-sm mt-2">Identify the most engaging moments</p>
              <div className="mt-4 text-xs text-slate-500">Powered by AI analysis</div>
            </div>
          </Link>

          {/* Generated Clips */}
          <Link href="/results/clips">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">🎬</div>
              <h3 className="font-semibold text-lg text-cyan-400">Short-Form Clips</h3>
              <p className="text-slate-400 text-sm mt-2">Ready-to-post vertical videos</p>
              <div className="mt-4 text-xs text-slate-500">9:16 format with subtitles</div>
            </div>
          </Link>

          {/* Captions */}
          <Link href="/results/captions">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">✍️</div>
              <h3 className="font-semibold text-lg text-cyan-400">Captions & Titles</h3>
              <p className="text-slate-400 text-sm mt-2">Platform-optimized copy</p>
              <div className="mt-4 text-xs text-slate-500">Multiple styles per platform</div>
            </div>
          </Link>

          {/* Hashtags */}
          <Link href="/results/hashtags">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">#️⃣</div>
              <h3 className="font-semibold text-lg text-cyan-400">Hashtags</h3>
              <p className="text-slate-400 text-sm mt-2">Trending tags per platform</p>
              <div className="mt-4 text-xs text-slate-500">Maximize discoverability</div>
            </div>
          </Link>

          {/* Publishing */}
          <Link href="/results/publishing">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">📤</div>
              <h3 className="font-semibold text-lg text-cyan-400">Publishing</h3>
              <p className="text-slate-400 text-sm mt-2">One-click multi-platform publish</p>
              <div className="mt-4 text-xs text-slate-500">YouTube, Instagram, TikTok & more</div>
            </div>
          </Link>

          {/* Analytics */}
          <Link href="/results/analytics">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">📊</div>
              <h3 className="font-semibold text-lg text-cyan-400">Analytics</h3>
              <p className="text-slate-400 text-sm mt-2">Track performance & engagement</p>
              <div className="mt-4 text-xs text-slate-500">Coming soon</div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
