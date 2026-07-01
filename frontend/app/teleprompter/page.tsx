'use client';

import { useState } from 'react';
import { 
  FileIcon, 
  RefreshCwIcon, 
  Wand2Icon, 
  SaveIcon,
  PlayIcon,
  MessageSquareIcon
} from '../components/Icons';

export default function ScriptWriterPage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [scriptData, setScriptData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/scriptwriter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone: 'professional', length_seconds: 60 })
      });
      if (res.ok) {
        const data = await res.json();
        setScriptData(data);
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
            <FileIcon className="w-4 h-4 text-[var(--foreground)]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Script Writer</h1>
            <p className="text-xs text-[var(--muted)]">Draft and refine your content</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs py-1.5" disabled={!scriptData}>
            <SaveIcon className="w-4 h-4 mr-2" />
            Save Draft
          </button>
          <button className="btn-primary text-xs py-1.5" disabled={!scriptData}>
            <PlayIcon className="w-4 h-4 mr-2" />
            Launch Teleprompter
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Outline & AI Prompt */}
        <div className="w-72 border-r border-[var(--border)] bg-[var(--background)] flex flex-col shrink-0">
          <div className="p-4 border-b border-[var(--border)]">
            <form onSubmit={handleGenerate} className="space-y-3">
              <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">AI Generation</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe your video topic or paste an outline..."
                className="input-field min-h-[100px] resize-none"
              />
              <button type="submit" disabled={loading || !topic} className="btn-secondary w-full text-xs py-1.5">
                {loading ? <RefreshCwIcon className="w-4 h-4 animate-spin mr-2" /> : <Wand2Icon className="w-4 h-4 mr-2" />}
                Generate Draft
              </button>
            </form>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Document Outline</h3>
            {scriptData ? (
              <ul className="space-y-1">
                <li className="text-xs text-[var(--foreground)] font-medium p-1.5 rounded hover:bg-[var(--panel)] cursor-pointer">1. Hook</li>
                <li className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] p-1.5 rounded hover:bg-[var(--panel)] cursor-pointer">2. Intro & Context</li>
                <li className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] p-1.5 rounded hover:bg-[var(--panel)] cursor-pointer">3. Main Value Point</li>
                <li className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] p-1.5 rounded hover:bg-[var(--panel)] cursor-pointer">4. Call to Action</li>
              </ul>
            ) : (
              <p className="text-xs text-[var(--muted)]">Generate a script to see the outline.</p>
            )}
          </div>
        </div>

        {/* Right Content Area: Editor */}
        <div className="flex-1 flex flex-col bg-[var(--background)] min-w-0">
          <div className="flex items-center p-2 border-b border-[var(--border)] gap-1 shrink-0 bg-[var(--background)]">
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'editor' ? 'bg-[var(--panel)] text-[var(--foreground)] shadow-sm border border-[var(--border)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
              onClick={() => setActiveTab('editor')}
            >
              Text Editor
            </button>
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'preview' ? 'bg-[var(--panel)] text-[var(--foreground)] shadow-sm border border-[var(--border)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
              onClick={() => setActiveTab('preview')}
            >
              Teleprompter Preview
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[var(--panel)]">
            <div className="w-full max-w-2xl bg-[var(--background)] border border-[var(--border)] rounded-md shadow-sm h-full p-8">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <RefreshCwIcon className="w-6 h-6 animate-spin text-[var(--muted)]" />
                  <p className="text-xs text-[var(--muted)] font-mono">Writing script...</p>
                </div>
              ) : scriptData ? (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-[var(--foreground)]">{scriptData.title}</h1>
                  <div className="flex gap-2">
                    <span className="badge badge-default">Estimated time: {scriptData.estimated_time_seconds}s</span>
                    <span className="badge badge-info">Tone: Professional</span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)] leading-relaxed">
                    {scriptData.script.split('\n').map((para: string, i: number) => (
                      <p key={i} className="mb-4">{para}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center">
                    <FileIcon className="w-6 h-6 text-[var(--muted)]" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">No Script Active</p>
                  <p className="text-xs text-[var(--muted)] max-w-xs">Use the AI generation panel on the left to start your first draft.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
