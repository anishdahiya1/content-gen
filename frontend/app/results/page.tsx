'use client';

import Link from 'next/link';

export default function ResultsPage() {
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <Link href="/" className="text-[var(--foreground)] hover:text-zinc-300 mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Content Results</h1>
          <p className="text-[var(--foreground)]">View and manage your generated content</p>
        </div>

        {/* Results Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Viral Clips */}
          <Link href="/results/viral-clips">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">🎯</div>
              <h3 className="font-semibold text-lg text-[var(--foreground)]">Viral Clips</h3>
              <p className="text-[var(--foreground)] text-sm mt-2">Identify the most engaging moments</p>
              <div className="mt-4 text-xs text-[var(--muted)]">Powered by AI analysis</div>
            </div>
          </Link>

          {/* Generated Clips */}
          <Link href="/results/clips">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">🎬</div>
              <h3 className="font-semibold text-lg text-[var(--foreground)]">Short-Form Clips</h3>
              <p className="text-[var(--foreground)] text-sm mt-2">Ready-to-post vertical videos</p>
              <div className="mt-4 text-xs text-[var(--muted)]">9:16 format with subtitles</div>
            </div>
          </Link>

          {/* Captions */}
          <Link href="/results/captions">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">✍️</div>
              <h3 className="font-semibold text-lg text-[var(--foreground)]">Captions & Titles</h3>
              <p className="text-[var(--foreground)] text-sm mt-2">Platform-optimized copy</p>
              <div className="mt-4 text-xs text-[var(--muted)]">Multiple styles per platform</div>
            </div>
          </Link>

          {/* Hashtags */}
          <Link href="/results/hashtags">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">#️⃣</div>
              <h3 className="font-semibold text-lg text-[var(--foreground)]">Hashtags</h3>
              <p className="text-[var(--foreground)] text-sm mt-2">Trending tags per platform</p>
              <div className="mt-4 text-xs text-[var(--muted)]">Maximize discoverability</div>
            </div>
          </Link>

          {/* Publishing */}
          <Link href="/results/publishing">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">📤</div>
              <h3 className="font-semibold text-lg text-[var(--foreground)]">Publishing</h3>
              <p className="text-[var(--foreground)] text-sm mt-2">One-click multi-platform publish</p>
              <div className="mt-4 text-xs text-[var(--muted)]">YouTube, Instagram, TikTok & more</div>
            </div>
          </Link>

          {/* Analytics */}
          <Link href="/results/analytics">
            <div className="card-hover cursor-pointer h-full hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">📊</div>
              <h3 className="font-semibold text-lg text-[var(--foreground)]">Analytics</h3>
              <p className="text-[var(--foreground)] text-sm mt-2">Track performance & engagement</p>
              <div className="mt-4 text-xs text-[var(--muted)]">Coming soon</div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
