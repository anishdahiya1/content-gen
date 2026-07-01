"use client";

import { useState, useEffect } from 'react';
import { PlayIcon, FilmIcon, SparklesIcon, Wand2Icon, CheckCircleIcon, XCircleIcon, DownloadIcon, Loader2Icon } from '../components/Icons';

export default function StudioPage() {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('english');
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [finalVideoPath, setFinalVideoPath] = useState<string | null>(null);

  // Poll for job status
  useEffect(() => {
    let interval: any;
    if (jobId && (jobStatus?.status === 'pending' || jobStatus?.status === 'processing')) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/v1/generate-series/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            setJobStatus(data);
            if (data.status === 'completed') {
              // Get the filename from the absolute path to construct download url
              const parts = data.output_path.split(/[/\\]/);
              const filename = parts[parts.length - 1];
              setFinalVideoPath(filename);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setJobId(null);
    setJobStatus(null);
    setFinalVideoPath(null);

    try {
      const res = await fetch('http://localhost:8000/api/v1/generate-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language })
      });

      if (!res.ok) {
        throw new Error("Failed to start generation");
      }

      const data = await res.json();
      setJobId(data.job_id);
      setJobStatus({ status: 'pending', message: 'Queued' });
    } catch (err) {
      alert("Error starting generation");
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--background)] text-zinc-200">
      {/* Header */}
      <header className="h-16 shrink-0 bg-black/40 backdrop-blur-md border-b border-white/[0.05] flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
            <FilmIcon className="w-4 h-4 text-[var(--foreground)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">AI Series Studio</h1>
            <p className="text-[11px] text-[var(--muted)] font-medium">Text-to-Video Generation</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Prompt Section */}
          <div className="space-y-6">
            <div className="surface-panel p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-[var(--muted)]" />
                Describe your series
              </h2>
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
                Enter a topic, story, or idea. Our AI will write a 90-second script, generate voiceover, create visuals, and stitch it all together with dynamic animations.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Topic or Story Prompt
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., A dark fantasy story about a lone wolf surviving the winter..."
                    rows={4}
                    disabled={isGenerating || jobStatus?.status === 'processing'}
                    className="input-field resize-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isGenerating || jobStatus?.status === 'processing'}
                    className="input-field disabled:opacity-50"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!topic.trim() || isGenerating || jobStatus?.status === 'processing'}
                  className="btn-primary w-full py-3.5 rounded-xl disabled:opacity-50"
                >
                  {isGenerating || jobStatus?.status === 'processing' ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2Icon className="w-4 h-4" />
                      Generate AI Series
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Section */}
            {jobStatus && (
              <div className="surface-panel p-6">
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-4 uppercase tracking-wider">Generation Status</h3>
                
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {jobStatus.status === 'completed' ? (
                      <CheckCircleIcon className="w-6 h-6 text-[var(--foreground)]" />
                    ) : jobStatus.status === 'failed' ? (
                      <XCircleIcon className="w-6 h-6 text-red-500" />
                    ) : (
                      <Loader2Icon className="w-6 h-6 text-[var(--foreground)] animate-spin" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{jobStatus.status}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{jobStatus.message}</p>
                    {jobStatus.error && (
                      <p className="text-xs text-red-400 mt-2 bg-red-950/30 p-2 rounded border border-red-900/50 font-mono">
                        {jobStatus.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="surface-panel p-6 flex flex-col">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
              <PlayIcon className="w-5 h-5 text-[var(--muted)]" />
              Result Preview
            </h2>

            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
              {finalVideoPath ? (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="w-[280px] aspect-[9/16] bg-black rounded-xl overflow-hidden border border-zinc-700 shadow-2xl relative group flex items-center justify-center">
                    <video 
                      src={`http://localhost:8000/api/v1/generate-series/${jobId}/video`} 
                      controls 
                      autoPlay 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <a 
                    href={`http://localhost:8000/api/v1/generate-series/${jobId}/video`}
                    download={finalVideoPath}
                    target="_blank"
                    className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-sm font-bold shadow-lg transition-all"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Download Video
                  </a>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mx-auto">
                    <FilmIcon className="w-8 h-8 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--muted)]">No video generated yet</p>
                    <p className="text-xs text-[var(--muted)] mt-1">Enter a prompt to create your first series.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
