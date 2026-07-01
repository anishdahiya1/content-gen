'use client';

import { useState } from 'react';
import { 
  VideoIcon, 
  UploadIcon, 
  SettingsIcon, 
  PlayIcon, 
  DownloadIcon,
  MessageSquareIcon,
  ClapperboardIcon,
  RefreshCwIcon
} from '../components/Icons';

export default function RepurposerPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'clips' | 'transcript'>('clips');
  
  const clips = [
    { id: 1, title: 'The Hook That Got 1M Views', duration: '0:45', status: 'ready', score: 95 },
    { id: 2, title: 'Why SaaS Fails in 2026', duration: '0:58', status: 'ready', score: 88 },
    { id: 3, title: 'Pricing Strategy Teardown', duration: '1:12', status: 'processing', score: null },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0 bg-[var(--panel)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--background)] border border-[var(--border)] flex items-center justify-center">
            <VideoIcon className="w-4 h-4 text-[var(--foreground)]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">AI Repurposer</h1>
            <p className="text-xs text-[var(--muted)]">Project: Q3 Product Update Final</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs py-1.5">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Export Settings
          </button>
          <button className="btn-primary text-xs py-1.5">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export All Clips
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Queue & Upload */}
        <div className="w-64 border-r border-[var(--border)] bg-[var(--background)] flex flex-col p-4 shrink-0 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Source Media</h3>
            <div className="surface-panel border-dashed border-2 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--muted)] hover:bg-[var(--panel-hover)] transition-colors">
              <UploadIcon className="w-6 h-6 text-[var(--muted)] mb-2" />
              <p className="text-xs font-medium text-[var(--foreground)]">Upload Video</p>
              <p className="text-[10px] text-[var(--muted)] mt-1">MP4, MOV up to 2GB</p>
            </div>
            <div className="text-center pt-2 pb-2">
              <span className="text-[10px] font-semibold text-[var(--muted)] uppercase">OR</span>
            </div>
            <div className="relative">
              <input type="text" placeholder="Paste YouTube URL" className="input-field text-xs py-2 pr-16" />
              <button className="absolute right-1 top-1 bottom-1 px-3 bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold rounded-md hover:bg-zinc-200">Go</button>
            </div>
          </div>

          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Processing Queue</h3>
            <div className="space-y-2">
              <div className="surface-panel p-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[var(--background)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                  <ClapperboardIcon className="w-4 h-4 text-[var(--muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--foreground)] truncate">Q3_Product_Update.mp4</p>
                  <p className="text-[10px] text-[var(--accent)] font-medium mt-0.5 flex items-center gap-1">
                    <RefreshCwIcon className="w-3 h-3 animate-spin" /> Analyzing 45%
                  </p>
                </div>
              </div>
              <div className="surface-panel p-2 flex items-center gap-3 opacity-60">
                <div className="w-8 h-8 rounded bg-[var(--background)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                  <ClapperboardIcon className="w-4 h-4 text-[var(--muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--foreground)] truncate">Demo_Walkthrough.mp4</p>
                  <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Queued</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Main Preview & Tabs */}
        <div className="flex-1 flex flex-col bg-[var(--background)] min-w-0 border-r border-[var(--border)]">
          <div className="flex items-center p-2 border-b border-[var(--border)] gap-1 shrink-0 bg-[var(--background)]">
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'clips' ? 'bg-[var(--panel)] text-[var(--foreground)] shadow-sm border border-[var(--border)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
              onClick={() => setActiveTab('clips')}
            >
              Generated Clips
            </button>
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'transcript' ? 'bg-[var(--panel)] text-[var(--foreground)] shadow-sm border border-[var(--border)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
              onClick={() => setActiveTab('transcript')}
            >
              Full Transcript
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[var(--panel)] flex justify-center">
            {activeTab === 'clips' ? (
              <div className="w-full max-w-sm flex items-center justify-center">
                <div className="w-[300px] h-[533px] bg-[var(--background)] border border-[var(--border)] rounded-md shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                  <PlayIcon className="w-12 h-12 text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors opacity-50" />
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded text-[var(--foreground)] text-xs text-center border border-white/10">
                    <span className="text-yellow-400 font-bold uppercase">This hook is insane.</span> You won't believe how this changed the game in Q3.
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-2xl bg-[var(--background)] border border-[var(--border)] rounded-md shadow-sm p-6 space-y-4">
                <div className="flex gap-4 p-2 hover:bg-[var(--panel-hover)] rounded group">
                  <span className="text-xs font-mono text-[var(--muted)] w-12 pt-1 shrink-0">0:00</span>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed">
                    Alright, so let's talk about the Q3 product update. It's been a massive quarter for us, and I wanted to walk you through some of the biggest changes.
                  </p>
                </div>
                <div className="flex gap-4 p-2 bg-[var(--panel-hover)] rounded border-l-2 border-[var(--accent)] group relative">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-[var(--accent)] text-[var(--foreground)] text-[9px] font-bold px-1.5 py-0.5 rounded shadow">CLIP 1</div>
                  <span className="text-xs font-mono text-[var(--muted)] w-12 pt-1 shrink-0">0:12</span>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed font-medium">
                    This hook is insane. You won't believe how this changed the game in Q3. We entirely rewrote the processing engine to run 10x faster.
                  </p>
                </div>
                <div className="flex gap-4 p-2 hover:bg-[var(--panel-hover)] rounded group">
                  <span className="text-xs font-mono text-[var(--muted)] w-12 pt-1 shrink-0">0:24</span>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed text-[var(--muted)]">
                    And that means your exports are going to finish before you even have time to grab a coffee. 
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Clips List */}
        <div className="w-72 bg-[var(--background)] flex flex-col shrink-0">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--panel)]">
            <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Clips (3)</h3>
            <button className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"><RefreshCwIcon className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {clips.map((clip) => (
              <div key={clip.id} className="surface-panel p-3 cursor-pointer hover:border-[var(--muted)] transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <span className={`badge ${clip.status === 'ready' ? 'badge-success' : 'badge-info'}`}>
                    {clip.status === 'ready' ? 'Ready' : 'Processing'}
                  </span>
                  <span className="text-xs font-mono text-[var(--muted)]">{clip.duration}</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--foreground)] leading-tight mb-2 group-hover:text-[var(--accent)] transition-colors">{clip.title}</h4>
                {clip.score && (
                  <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-[var(--border)]">
                    <span className="text-[var(--muted)] font-medium">Virality Score</span>
                    <span className="font-mono font-bold text-[var(--foreground)]">{clip.score}/100</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
