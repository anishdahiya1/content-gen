'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClapperboardIcon, 
  YoutubeIcon, 
  UploadIcon, 
  MusicIcon, 
  RocketIcon, 
  RefreshCwIcon 
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

      setStatus('✓ Upload successful! Enqueueing pipeline...');
      setIsUploading(false);
      
      // Redirect to the workspace page with video_id and job_id
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

      setStatus(audioOnly ? '✓ Audio extraction enqueued! Redirecting...' : '✓ YouTube link enqueued! Redirecting to workspace...');
      setIsSubmittingYoutube(false);

      // Redirect to the workspace with the new video_id and job_id
      window.location.href = `/workspace?video_id=${data.video_id}&job_id=${data.job_id}`;
    } catch (error) {
      setStatus(`YouTube queue error: ${error}`);
      setIsSubmittingYoutube(false);
    }
  };

  return (
    <main className="min-h-screen premium-bg py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center relative overflow-hidden">
      
      <div className="max-w-xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <RocketIcon className="w-12 h-12 text-sky-400 mx-auto mb-3 animate-float" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3 tracking-tight">
            CreatorPilot AI Upload Console
          </h1>
          <p className="text-slate-400 text-sm">Upload local media or pull from YouTube to launch the AI operating pipeline</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-850/50 bg-[#080b12]/40 rounded-t-xl overflow-hidden p-1 gap-1">
          <button
            onClick={() => { setActiveTab('file'); setStatus(null); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg text-center transition-all ${
              activeTab === 'file'
                ? 'bg-sky-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d121f]/60'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <ClapperboardIcon className="w-4 h-4" />
              Upload MP4/MOV
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('youtube'); setStatus(null); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg text-center transition-all ${
              activeTab === 'youtube'
                ? 'bg-sky-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d121f]/60'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <YoutubeIcon className="w-4 h-4" />
              Paste YouTube Link
            </span>
          </button>
        </div>

        {/* Console Box */}
        <div className="card rounded-t-none border-t-0 animate-slide-up relative bg-slate-900/60 backdrop-blur-md">
          {activeTab === 'file' ? (
            /* File Upload Form */
            <form onSubmit={handleFileUpload} className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-all duration-300 p-10 text-center ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-400/5'
                    : 'border-slate-700 hover:border-cyan-500/50 bg-slate-950/20'
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
                  <UploadIcon className="w-12 h-12 text-slate-500 mx-auto" />
                  <div>
                    <p className="text-slate-200 font-semibold text-sm">
                      {selectedFile ? selectedFile.name : 'Drag & drop vertical/horizontal video'}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {selectedFile ? 'Ready to process' : 'or click to search system files'}
                    </p>
                  </div>
                  {selectedFile && (
                    <p className="text-cyan-400 text-xs font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>

              {/* Number of Clips Selector */}
              <div className="space-y-2 bg-[#04060b]/40 border border-slate-850/50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Number of Clips to Generate</label>
                  <span className="text-sm font-extrabold text-indigo-400 font-mono">{numClips}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={numClips}
                  onChange={(e) => setNumClips(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  style={{ accentColor: '#0ea5e9' }}
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 Clip</span>
                  <span>3 Clips (Default)</span>
                  <span>5 Clips</span>
                </div>
              </div>

              {/* Clip Style Brief */}
              <div className="space-y-2 bg-[#04060b]/40 border border-sky-900/30 rounded-xl p-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  🎯 Clip Style Brief
                  <span className="ml-2 text-[10px] text-slate-500 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  id="clip-prompt-file"
                  value={clipPrompt}
                  onChange={(e) => setClipPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Make motivational clips with high-energy hooks. Focus on emotional storytelling moments only. Target Gen-Z audience."
                  className="w-full bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all leading-relaxed"
                />
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  AI will prioritize clips matching this brief. Leave blank for default viral moment detection.
                </p>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full btn-primary py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 animate-spin text-sky-200" /> Uploading video files...
                  </>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <RocketIcon className="w-4 h-4" /> Launch AI Pipeline
                  </span>
                )}
              </button>
            </form>
          ) : (
            /* YouTube URL Form */
            <form onSubmit={handleYoutubeSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">YouTube URL</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="input-field py-3 text-sm text-white"
                  required
                />
              </div>

              {/* Audio-Only Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#04060b]/40 border border-slate-850/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <MusicIcon className="w-6 h-6 text-sky-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Audio Only Mode</p>
                    <p className="text-xs text-slate-500">Extract MP3 audio instead of downloading video</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAudioOnly(!audioOnly)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                    audioOnly
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/20'
                      : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                      audioOnly ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Number of Clips Selector */}
              <div className="space-y-2 bg-[#04060b]/40 border border-slate-850/50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Number of Clips to Generate</label>
                  <span className="text-sm font-extrabold text-indigo-400 font-mono">{numClips}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={numClips}
                  onChange={(e) => setNumClips(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  style={{ accentColor: '#0ea5e9' }}
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 Clip</span>
                  <span>3 Clips (Default)</span>
                  <span>5 Clips</span>
                </div>
              </div>

              {/* Clip Style Brief (YouTube) */}
              <div className="space-y-2 bg-[#04060b]/40 border border-sky-900/30 rounded-xl p-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  🎯 Clip Style Brief
                  <span className="ml-2 text-[10px] text-slate-500 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  id="clip-prompt-youtube"
                  value={clipPrompt}
                  onChange={(e) => setClipPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Make motivational clips with high-energy hooks. Focus on emotional storytelling moments only. Target Gen-Z audience."
                  className="w-full bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all leading-relaxed"
                />
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  AI will prioritize clips matching this brief. Leave blank for default viral moment detection.
                </p>
              </div>

              <button
                type="submit"
                disabled={!youtubeUrl || isSubmittingYoutube}
                className="w-full btn-primary py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingYoutube ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 animate-spin text-sky-200" /> {audioOnly ? 'Extracting audio...' : 'Queuing download pipeline...'}
                  </>
                ) : (
                  <>
                    {audioOnly ? (
                      <span className="flex items-center gap-2 justify-center">
                        <MusicIcon className="w-4 h-4" /> Extract Audio Only
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <RocketIcon className="w-4 h-4" /> Download & Process Link
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
              {status.includes('successful') || status.includes('✓') ? (
                <div className="badge-success text-center py-2.5 rounded-lg w-full block text-xs">{status}</div>
              ) : status.includes('Uploading') || status.includes('download') ? (
                <div className="badge-info text-center py-2.5 rounded-lg w-full block text-xs animate-pulse">{status}</div>
              ) : (
                <div className="badge-error text-center py-2.5 rounded-lg w-full block text-xs">{status}</div>
              )}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/workspace" className="text-sky-400 hover:text-sky-300 text-xs font-semibold">
            ← Switch to Active Workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
