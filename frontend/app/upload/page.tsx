'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClapperboardIcon, 
  YoutubeIcon, 
  UploadIcon, 
  MusicIcon, 
  RocketIcon, 
  RefreshCwIcon,
  SparklesIcon
} from '../components/Icons';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<'file' | 'youtube'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isSubmittingYoutube, setIsSubmittingYoutube] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [numClips, setNumClips] = useState(3);
  const [clipPrompt, setClipPrompt] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const requireAuth = process.env.NEXT_PUBLIC_REQUIRE_AUTH !== 'false';
    if (requireAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const authFetch = async (url: string, options: any = {}) => {
    const requireAuth = process.env.NEXT_PUBLIC_REQUIRE_AUTH !== 'false';
    if (requireAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return new Response(JSON.stringify({ detail: 'Unauthorized' }), { status: 401 });
      }
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    const res = await fetch(url, options);
    if (requireAuth && res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return res;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setStatus(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
    setStatus(null);
  };

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setStatus('Please select a video to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('num_clips', numClips.toString());
    if (clipPrompt.trim()) formData.append('clip_prompt', clipPrompt.trim());

    setIsUploading(true);
    setStatus('Uploading video files to storage...');

    try {
      const res = await authFetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(`Upload failed: ${data.detail ?? res.statusText}`);
        setIsUploading(false);
        return;
      }

      setStatus('Upload successful! Enqueueing pipeline...');
      setIsUploading(false);
      
      window.location.href = `/workspace?video_id=${data.video_id}&job_id=${data.job_id}`;
    } catch (error) {
      setStatus(`Upload error: ${error}`);
      setIsUploading(false);
    }
  };

  const handleYoutubeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const url = youtubeUrl.trim();
    if (!url) {
      setStatus('Please paste a valid YouTube URL.');
      return;
    }

    setIsSubmittingYoutube(true);
    setStatus('Enqueueing YouTube download job...');

    try {
      const res = await authFetch('/api/v1/upload/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, audio_only: audioOnly, num_clips: numClips, clip_prompt: clipPrompt.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(`Failed to queue YouTube video: ${data.detail ?? res.statusText}`);
        setIsSubmittingYoutube(false);
        return;
      }

      setStatus(audioOnly ? 'Audio extraction enqueued! Redirecting...' : 'YouTube link enqueued! Redirecting to workspace...');
      setIsSubmittingYoutube(false);

      window.location.href = `/workspace?video_id=${data.video_id}&job_id=${data.job_id}`;
    } catch (error) {
      setStatus(`YouTube queue error: ${error}`);
      setIsSubmittingYoutube(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center relative overflow-hidden text-zinc-100">
      
      <div className="max-w-xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mx-auto mb-6">
            <RocketIcon className="w-8 h-8 text-[var(--foreground)]" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-3 tracking-tight">
            CreatorPilot Upload
          </h1>
          <p className="text-[var(--muted)] text-sm">Upload local media or pull from YouTube to launch the AI pipeline</p>
          <div className="mt-6">
            <Link href="/studio" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--panel)] text-zinc-300 border border-[var(--border)] rounded-full text-sm font-bold hover:bg-white hover:text-black transition-colors">
              <SparklesIcon className="w-4 h-4" /> Try the new AI Series Studio
            </Link>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[var(--background)] border border-zinc-900 rounded-t-xl overflow-hidden p-1 gap-1">
          <button
            onClick={() => { setActiveTab('file'); setStatus(null); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg text-center transition-colors ${
              activeTab === 'file'
                ? 'bg-white text-black'
                : 'text-[var(--muted)] hover:text-zinc-300 hover:bg-[var(--panel)]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <ClapperboardIcon className="w-4 h-4" />
              Upload MP4/MOV
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('youtube'); setStatus(null); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg text-center transition-colors ${
              activeTab === 'youtube'
                ? 'bg-white text-black'
                : 'text-[var(--muted)] hover:text-zinc-300 hover:bg-[var(--panel)]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <YoutubeIcon className="w-4 h-4" />
              YouTube Link
            </span>
          </button>
        </div>

        {/* Console Box */}
        <div className="bg-black border border-[var(--border)] rounded-b-xl p-8 shadow-2xl relative">
          {activeTab === 'file' ? (
            /* File Upload Form */
            <form onSubmit={handleFileUpload} className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-colors duration-300 p-10 text-center ${
                  isDragging
                    ? 'border-white bg-[var(--panel)]'
                    : 'border-[var(--border)] hover:border-zinc-600 bg-[var(--background)]'
                }`}
              >
                <input
                  id="file"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-3">
                  <UploadIcon className="w-12 h-12 text-zinc-600 mx-auto" />
                  <div>
                    <p className="text-zinc-200 font-semibold text-sm">
                      {selectedFile ? selectedFile.name : 'Drag & drop vertical/horizontal video'}
                    </p>
                    <p className="text-[var(--muted)] text-xs mt-1">
                      {selectedFile ? 'Ready to process' : 'or click to browse'}
                    </p>
                  </div>
                  {selectedFile && (
                    <p className="text-[var(--foreground)] text-xs font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>

              {/* Number of Clips Selector */}
              <div className="space-y-2 surface-panel p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Number of Clips</label>
                  <span className="text-sm font-extrabold text-[var(--foreground)] font-mono">{numClips}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={numClips}
                  onChange={(e) => setNumClips(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                  style={{ accentColor: '#ffffff' }}
                />
                <div className="flex justify-between text-[10px] text-[var(--muted)] font-mono">
                  <span>1 Clip</span>
                  <span>3 Clips (Default)</span>
                  <span>5 Clips</span>
                </div>
              </div>

              {/* Clip Style Brief */}
              <div className="space-y-2 surface-panel p-4">
                <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block">
                  Clip Style Brief
                  <span className="ml-2 text-[10px] text-zinc-600 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  id="clip-prompt-file"
                  value={clipPrompt}
                  onChange={(e) => setClipPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Focus on emotional storytelling moments. Target Gen-Z."
                  className="input-field leading-relaxed resize-none"
                />
                <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                  AI will prioritize clips matching this brief.
                </p>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full btn-primary py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 animate-spin text-[var(--muted)]" /> Uploading video...
                  </>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <RocketIcon className="w-4 h-4" /> Launch Pipeline
                  </span>
                )}
              </button>
            </form>
          ) : (
            /* YouTube URL Form */
            <form onSubmit={handleYoutubeSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block">YouTube URL</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="input-field py-3 text-sm text-[var(--foreground)]"
                  required
                />
              </div>

              {/* Audio-Only Toggle */}
              <div className="flex items-center justify-between p-4 surface-panel">
                <div className="flex items-center gap-3">
                  <MusicIcon className="w-6 h-6 text-[var(--foreground)]" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Audio Only Mode</p>
                    <p className="text-xs text-[var(--muted)]">Extract audio instead of downloading video</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAudioOnly(!audioOnly)}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${
                    audioOnly
                      ? 'bg-white'
                      : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${
                      audioOnly ? 'translate-x-7 bg-black' : 'translate-x-0 bg-zinc-400'
                    }`}
                  />
                </button>
              </div>

              {/* Number of Clips Selector */}
              <div className="space-y-2 surface-panel p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Number of Clips</label>
                  <span className="text-sm font-extrabold text-[var(--foreground)] font-mono">{numClips}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={numClips}
                  onChange={(e) => setNumClips(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                  style={{ accentColor: '#ffffff' }}
                />
                <div className="flex justify-between text-[10px] text-[var(--muted)] font-mono">
                  <span>1 Clip</span>
                  <span>3 Clips (Default)</span>
                  <span>5 Clips</span>
                </div>
              </div>

              {/* Clip Style Brief (YouTube) */}
              <div className="space-y-2 surface-panel p-4">
                <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block">
                  Clip Style Brief
                  <span className="ml-2 text-[10px] text-zinc-600 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  id="clip-prompt-youtube"
                  value={clipPrompt}
                  onChange={(e) => setClipPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Focus on emotional storytelling moments. Target Gen-Z."
                  className="input-field leading-relaxed resize-none"
                />
                <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                  AI will prioritize clips matching this brief.
                </p>
              </div>

              <button
                type="submit"
                disabled={!youtubeUrl || isSubmittingYoutube}
                className="w-full btn-primary py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingYoutube ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 animate-spin text-[var(--muted)]" /> {audioOnly ? 'Extracting audio...' : 'Queuing download...'}
                  </>
                ) : (
                  <>
                    {audioOnly ? (
                      <span className="flex items-center gap-2 justify-center">
                        <MusicIcon className="w-4 h-4" /> Extract Audio Only
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <RocketIcon className="w-4 h-4" /> Process Link
                      </span>
                    )}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Status logs */}
          {status && (
            <div className="mt-6">
              <div className="bg-white/[0.03] border border-white/[0.05] text-zinc-300 text-center py-2.5 rounded-lg w-full block text-xs">
                {status}
              </div>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/workspace" className="text-[var(--muted)] hover:text-[var(--foreground)] text-xs font-semibold transition-colors">
            &larr; Switch to Active Workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
