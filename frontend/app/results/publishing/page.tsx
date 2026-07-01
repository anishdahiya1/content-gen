'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function PublishingPage() {
  const platforms = [
    { id: 'youtube', name: 'YouTube Shorts', icon: '▶️', color: 'from-red-600 to-red-700' },
    { id: 'instagram', name: 'Instagram Reels', icon: '📷', color: 'from-pink-600 to-purple-600' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'from-black to-gray-800' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-blue-700' },
    { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: 'from-gray-800 to-black' },
    { id: 'facebook', name: 'Facebook', icon: 'f', color: 'from-blue-700 to-blue-800' },
  ];

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <Link href="/results" className="text-[var(--foreground)] hover:text-zinc-300 mb-6 inline-block">
            ← Back to Results
          </Link>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">📤 Publish to Platforms</h1>
          <p className="text-[var(--foreground)]">One-click publishing to all your social networks</p>
        </div>

        {/* Platform Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {platforms.map((platform) => (
            <div key={platform.id} className={`card-hover border border-zinc-700 p-6 cursor-pointer group hover:scale-105 transition-all bg-gradient-to-br ${platform.color} opacity-20 hover:opacity-30`}>
              <div className="text-5xl mb-3">{platform.icon}</div>
              <h3 className="font-semibold text-lg text-[var(--foreground)] group-hover:text-zinc-300 transition-colors">{platform.name}</h3>
              <p className="text-zinc-300 text-sm mt-2">Ready to publish</p>
              <button className="btn-primary w-full mt-4 py-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Publish
              </button>
            </div>
          ))}
        </div>

        {/* Publish Summary */}
        <div className="card">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">📋 Publishing Checklist</h2>
          <div className="space-y-3">
            {[
              { done: true, text: '✓ Video clip generated' },
              { done: true, text: '✓ Captions written' },
              { done: true, text: '✓ Hashtags prepared' },
              { done: false, text: '⟳ Ready to publish' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${item.done ? 'bg-green-900/20 border border-green-700' : 'bg-yellow-900/20 border border-yellow-700'}`}>
                <span className={item.done ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]'}>{item.done ? '✓' : '○'}</span>
                <span className="text-zinc-200">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
