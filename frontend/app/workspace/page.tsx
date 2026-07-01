'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  ClapperboardIcon,
  CpuIcon,
  MicIcon,
  LightbulbIcon,
  VideoIcon,
  UploadIcon,
  RocketIcon,
  MusicIcon,
  YoutubeIcon,
  FileIcon,
  SparklesIcon,
  MessageSquareIcon,
  PenToolIcon,
  PaletteIcon,
  ImageIcon,
  RefreshCwIcon,
  FolderIcon,
  TrashIcon,
  HelpCircleIcon,
  PlayIcon,
  GlobeIcon,
  DownloadIcon,
  HeartIcon,
  BookOpenIcon,
  SaveIcon,
  CopyIcon
} from '../components/Icons';

export default function WorkspacePage() {
  // Navigation & Workspace State
  const [videoId, setVideoId] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  const handleLogout = async () => {
    try {
      await authFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Video playback sync
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeClip, setActiveClip] = useState<any>(null);

  // Spotify-style lyrics lines refs & state
  const activeLineRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<any>(null);
  const pendingSeekTime = useRef<number | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle pending seek when source changes back to original
  useEffect(() => {
    if (pendingSeekTime.current !== null && videoRef.current) {
      const targetTime = pendingSeekTime.current;
      pendingSeekTime.current = null;
      
      const handleLoadedMetadata = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = targetTime;
          videoRef.current.play();
        }
      };
      
      if (videoRef.current.readyState >= 1) {
        videoRef.current.currentTime = targetTime;
        videoRef.current.play();
      } else {
        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      }
    }
  }, [activeClip]);

  const handleScroll = () => {
    if (isProgrammaticScroll.current) {
      return;
    }
    // If the user scrolls manually, pause auto-scroll
    if (autoScroll) {
      setAutoScroll(false);
    }
  };

  const handleUserInteraction = () => {
    // Direct user wheel or touch interaction pauses auto-scroll immediately
    if (autoScroll) {
      setAutoScroll(false);
    }
  };

  const transcriptLines = useMemo(() => {
    const words = videoData?.transcript?.words;
    if (!words || words.length === 0) return [];
    
    const lines: any[] = [];
    let currentLine: any[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      currentLine.push(w);
      
      const wordText = w.word;
      const hasPunctuation = /[.!?]/.test(wordText);
      const hasComma = /,/.test(wordText);
      const isTooLong = currentLine.length >= 8;
      
      let shouldSplit = false;
      if (hasPunctuation) {
        shouldSplit = true;
      } else if (isTooLong) {
        shouldSplit = true;
      } else if (i < words.length - 1) {
        const nextW = words[i + 1];
        const gap = nextW.start - w.end;
        if (gap > 0.5) {
          shouldSplit = true;
        } else if (hasComma && currentLine.length >= 4) {
          shouldSplit = true;
        }
      } else {
        shouldSplit = true;
      }
      
      if (shouldSplit) {
        lines.push({
          words: currentLine,
          start: currentLine[0].start,
          end: currentLine[currentLine.length - 1].end,
        });
        currentLine = [];
      }
    }
    
    if (currentLine.length > 0) {
      lines.push({
        words: currentLine,
        start: currentLine[0].start,
        end: currentLine[currentLine.length - 1].end,
      });
    }
    
    return lines;
  }, [videoData?.transcript?.words]);

  const activeLineIndex = useMemo(() => {
    if (transcriptLines.length === 0) return -1;
    const exactIndex = transcriptLines.findIndex(
      (line) => currentTime >= line.start && currentTime <= line.end
    );
    if (exactIndex !== -1) return exactIndex;

    let lastStartedIndex = -1;
    for (let i = 0; i < transcriptLines.length; i++) {
      if (currentTime >= transcriptLines[i].start) {
        lastStartedIndex = i;
      }
    }
    return lastStartedIndex;
  }, [transcriptLines, currentTime]);

  useEffect(() => {
    if (autoScroll && activeLineIndex !== -1 && activeLineRef.current) {
      isProgrammaticScroll.current = true;
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      
      // Clear any existing scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset programmatic flag after smooth scroll is complete (approx 800ms)
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 800);
    }
  }, [activeLineIndex, autoScroll]);


  // RAG Chat Copilot
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [transliterating, setTransliterating] = useState(false);
  const [brandDocs, setBrandDocs] = useState<any[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docMessage, setDocMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Platform Copywriter
  const [activeTab, setActiveTab] = useState<'chat' | 'copywriter' | 'branding'>('chat');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('linkedin');
  const [captions, setCaptions] = useState<any[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  // Branding & Enhancements
  const [font, setFont] = useState('Arial');
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [subtitlePos, setSubtitlePos] = useState('bottom');
  const [subtitleAnim, setSubtitleAnim] = useState('classic');
  const [watermarkPath, setWatermarkPath] = useState('');
  const [brollEnabled, setBrollEnabled] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [numClipsToDetect, setNumClipsToDetect] = useState(3);
  const [clipPrompt, setClipPrompt] = useState('');
  const [isDetectingClips, setIsDetectingClips] = useState(false);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // Extract query parameters manually and verify authentication
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

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const vid = params.get('video_id');
      const jid = params.get('job_id');

      // Set jobId first so the polling effect runs before videoId fetch
      if (jid) setJobId(jid);
      // Only set videoId if there is no active job — otherwise the job
      // poller will set it once the pipeline is actually done
      if (vid && !jid) setVideoId(parseInt(vid, 10));
      // If both exist, still store videoId so the poller can use it as
      // a fallback if job.video_id is missing from the response
      if (vid && jid) setVideoId(parseInt(vid, 10));

      // Load recent videos to choose from
      fetchRecentVideos();
      fetchBrandDocuments();
    }
  }, []);

  // Poll job status if jobId exists and is running
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await authFetch(`/api/v1/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setJobData(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setJobId(null);
          if (data.video_id) {
            setVideoId(data.video_id);
            fetchVideoDetails(data.video_id);
          }
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setJobId(null);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId]);

  // Load video details when videoId changes, but ONLY when no active job is running.
  // When a job is active, we wait for the poller to finish before fetching details,
  // otherwise we race with the pipeline and see empty transcript/clips.
  useEffect(() => {
    if (videoId && !jobId) {
      fetchVideoDetails(videoId);
    } else if (!videoId && !jobId) {
      setLoading(false);
    }
  }, [videoId, jobId]);

  // Set up video playback time listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoData, activeClip]);

  const fetchRecentVideos = async () => {
    try {
      const res = await authFetch('/api/v1/jobs');
      if (!res.ok) return;
      const data = await res.json();
      // We can use the job list to find unique video links
      const list = data.jobs || [];
      const uniq: any[] = [];
      const seen = new Set();
      for (const j of list) {
        if (j.video_id && !seen.has(j.video_id)) {
          seen.add(j.video_id);
          uniq.push({ id: j.video_id, title: j.message || `Video #${j.video_id}` });
        }
      }
      setRecentVideos(uniq);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVideoDetails = async (id: number) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/v1/videos/${id}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setVideoData(data);
      setActiveClip(null); // default to original
      
      // Populate branding settings if they exist
      if (data.branding_settings) {
        setFont(data.branding_settings.font || 'Arial');
        setHighlightColor(data.branding_settings.color || '#FFFF00');
        setSubtitlePos(data.branding_settings.position || 'bottom');
        setWatermarkPath(data.branding_settings.watermark_path || '');
        setSubtitleAnim(data.branding_settings.animation || 'classic');
      }
      setBrollEnabled(data.broll_enabled || false);
      if (data.num_clips) {
        setNumClipsToDetect(data.num_clips);
      }
      if (data.clip_prompt) {
        setClipPrompt(data.clip_prompt);
      }
      
      // Load stored comments if any or reset chat
      setChatHistory([
        { role: 'assistant', content: `👋 Hi! I've loaded your video: **${data.filename}**. Ask me anything about it or upload your brand style guide, and I can generate copy or summarize the transcript for you!` }
      ]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching video details:', err);
      setLoading(false);
    }
  };

  const fetchBrandDocuments = async () => {
    try {
      const res = await authFetch('/api/v1/rag/documents');
      if (!res.ok) return;
      const data = await res.json();
      setBrandDocs(data.documents || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadBrandDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    setDocMessage('Embedding brand voice document...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch('/api/v1/rag/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setDocMessage(`Upload failed: ${data.detail || 'Error'}`);
      } else {
        setDocMessage(`✓ ${file.name} uploaded successfully!`);
        fetchBrandDocuments();
      }
    } catch (err) {
      setDocMessage(`Upload error: ${err}`);
    } finally {
      setUploadingDoc(false);
      setTimeout(() => setDocMessage(''), 4000);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !videoId) return;

    const messageText = chatInput.trim();
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user', content: messageText }]);
    setChatLoading(true);

    try {
      const res = await authFetch('/api/v1/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          message: messageText,
          chat_history: chatHistory,
        }),
      });

      if (!res.ok) {
        throw new Error('Chat API returned an error');
      }

      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Sorry, I had trouble connecting to the RAG database. Please ensure the backend is running and API keys are set.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGeneratePlatformCopy = async () => {
    if (!videoData?.transcript?.raw_text) return;
    setGeneratingCopy(true);
    setCopyStatus(`Generating platform copy in your voice...`);

    try {
      // We will call the captions API
      const res = await authFetch('/api/v1/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: videoData.transcript.raw_text }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setCopyStatus(`Failed: ${data.detail || 'Error'}`);
      } else {
        // Format returned captions per selected platform
        const platformCaps = data.captions?.captions || [];
        const platformTitles = data.titles?.titles || [];
        setCaptions(platformCaps);
        setTitles(platformTitles);
        setCopyStatus('✓ Copy generated!');
      }
    } catch (err) {
      setCopyStatus(`Error generating copy: ${err}`);
    } finally {
      setGeneratingCopy(false);
    }
  };

  const handleTriggerRender = async (clipId: number) => {
    if (!videoId) return;
    
    // Optimistically update clip status in state
    setVideoData((prev: any) => {
      if (!prev) return prev;
      const updatedClips = prev.clips.map((c: any) => {
        if (c.id === clipId) {
          return { ...c, status: 'rendering' };
        }
        return c;
      });
      return { ...prev, clips: updatedClips };
    });

    try {
      // Find clip details
      const targetClip = videoData.clips.find((c: any) => c.id === clipId);
      if (!targetClip) return;

      const res = await authFetch('/api/v1/generate-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_path: videoData.saved_path,
          clips: [{
            start_time: targetClip.start_time,
            end_time: targetClip.end_time,
            segment: targetClip.segment_text,
            viral_score: targetClip.viral_score,
            clip_type: targetClip.clip_type,
          }]
        }),
      });

      if (!res.ok) {
        throw new Error('Failed rendering');
      }

      const data = await res.json();
      // Reload details after rendering finishes
      fetchVideoDetails(videoId);
    } catch (err) {
      console.error(err);
      fetchVideoDetails(videoId);
    }
  };

  const handleCreateAndRenderFullVideo = async () => {
    if (!videoId || !videoData) return;

    try {
      // 1. Create the full video clip record in the backend
      const createRes = await authFetch(`/api/v1/videos/${videoId}/create-full-clip`, {
        method: 'POST',
      });

      if (!createRes.ok) {
        throw new Error('Failed to create full video clip');
      }

      const createData = await createRes.json();
      const newClipId = createData.clip_id;

      // 2. Refresh the video details to pull in the newly created clip
      const fetchRes = await authFetch(`/api/v1/videos/${videoId}`);
      if (fetchRes.ok) {
        const newData = await fetchRes.json();
        setVideoData(newData);
      }

      // 3. Trigger the render for the new clip
      await handleTriggerRender(newClipId);

    } catch (err) {
      console.error('Error creating and rendering full video:', err);
      alert('Failed to start full video render. Please try again.');
    }
  };

  const handleTransliterate = async () => {
    if (!videoId || !videoData?.transcript) return;
    
    // Detect whether currently Hindi script or Hinglish
    const isHindiScript = /[\u0900-\u097F]/.test(videoData.transcript.raw_text || '');
    const target = isHindiScript ? 'hinglish' : 'hindi';
    
    setTransliterating(true);
    try {
      const res = await authFetch(`/api/v1/videos/${videoId}/transliterate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      
      if (!res.ok) {
        throw new Error('Transliteration failed');
      }
      
      // Reload video details to populate the new transcript
      fetchVideoDetails(videoId);
    } catch (err) {
      console.error(err);
      alert('Transliteration failed. Please ensure the backend is running.');
    } finally {
      setTransliterating(false);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setAutoScroll(true); // Re-enable auto-scroll when user clicks a line to seek
    }
  };

  // Helper to extract file name from full path
  const getStorageUrl = (fullPath: string) => {
    if (!fullPath) return '';
    // Standardize path separators and take last section
    const parts = fullPath.replace(/\\/g, '/').split('/');
    const filename = parts[parts.length - 1];
    const subfolder = fullPath.includes('clips') ? 'clips' : fullPath.includes('watermarks') ? 'watermarks' : 'uploads';
    return `/storage/${subfolder}/${filename}`;
  };

  const handleUploadWatermark = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch('/api/v1/upload/watermark', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setWatermarkPath(data.path);
      } else {
        alert(`Upload failed: ${data.detail || 'Error'}`);
      }
    } catch (err) {
      alert(`Upload error: ${err}`);
    }
  };

  const handleSaveSettings = async () => {
    if (!videoId) return;
    setSavingSettings(true);
    
    try {
      const res = await authFetch(`/api/v1/videos/${videoId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branding_settings: {
            font,
            color: highlightColor,
            position: subtitlePos,
            watermark_path: watermarkPath,
            animation: subtitleAnim
          },
          broll_enabled: brollEnabled
        })
      });
      if (!res.ok) throw new Error('Failed to save settings');
      // Update local data
      fetchVideoDetails(videoId);
    } catch(err) {
      console.error('Save Settings Error', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRedetectClips = async () => {
    if (!videoId || !videoData?.transcript) return;
    setIsDetectingClips(true);
    try {
      const res = await authFetch('/api/v1/viral-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: videoData.transcript.raw_text,
          video_id: videoId,
          num_clips: numClipsToDetect,
          clip_prompt: clipPrompt.trim() || undefined,
        })
      });
      if (!res.ok) throw new Error('Failed to re-detect clips');
      // Reload details after detection finishes
      await fetchVideoDetails(videoId);
    } catch (err) {
      console.error(err);
      alert(`Error re-detecting clips: ${err}`);
    } finally {
      setIsDetectingClips(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-zinc-100 flex flex-col font-sans relative overflow-hidden">
      
      {/* Top Navbar */}
      <nav className="border-b border-[var(--border)]/60 bg-black/60 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[var(--foreground)] hover:text-zinc-300 hover:scale-105 transition-transform animate-pulse">
            <ClapperboardIcon className="w-7 h-7" />
          </Link>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
              CreatorPilot AI Workspace
            </h1>
            <p className="text-xs text-[var(--muted)] font-mono">Status: Production Grade</p>
          </div>
        </div>

        {/* Right side: Brand Document Upload & User Profile */}
        <div className="flex items-center gap-6">
          {/* Brand Document Upload */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-[var(--muted)]">RAG Brand Guides</p>
              <p className="text-xs text-[var(--foreground)] font-semibold">{brandDocs.length} files loaded</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-[var(--foreground)] rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all"
            >
              {uploadingDoc ? (
                <>
                  <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <FolderIcon className="w-3.5 h-3.5" />
                  <span>Load Style Guide</span>
                </>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadBrandDoc}
              accept=".txt,.md,.pdf"
              className="hidden"
            />
          </div>

          {/* User Profile Info & Sign Out */}
          {currentUser && (
            <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]/60">
              {currentUser.picture && (
                <img 
                  src={currentUser.picture} 
                  alt={currentUser.name} 
                  className="w-8 h-8 rounded-full border border-indigo-500/30 object-cover" 
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-zinc-200 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-[var(--muted)] leading-none mt-1 truncate max-w-[120px]">{currentUser.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 bg-[var(--panel)]/80 hover:bg-red-950/40 border border-[var(--border)] hover:border-red-900/30 hover:text-red-400 text-[var(--muted)] rounded-lg text-xs font-semibold transition-all"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* RAG Status Bar */}
      {docMessage && (
        <div className="bg-indigo-950/80 border-b border-indigo-500/30 px-6 py-2 text-xs text-zinc-300 text-center animate-pulse">
          {docMessage}
        </div>
      )}

      {/* Main Panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Loading / Empty State or Job Progress Tracker */}
        {loading || jobId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--panel)]/20 backdrop-blur">
            {jobId ? (
              <div className="max-w-md w-full card border-cyan-500/30 bg-[var(--panel)]/90 text-center space-y-6 shadow-2xl shadow-cyan-900/10">
                <CpuIcon className="w-12 h-12 text-[var(--foreground)] mx-auto animate-bounce" />
                <div>
                  <h2 className="text-xl font-bold text-indigo-450">AI Background Pipeline</h2>
                  <p className="text-[var(--muted)] text-sm mt-1">{jobData?.job_type === 'full_pipeline' ? 'Transcribing & Reframing Video...' : jobData?.job_type === 'audio_download' ? 'Extracting Audio from YouTube...' : 'Processing Task...'}</p>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-zinc-800 rounded-full h-3 border border-zinc-700/60 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 h-full transition-all duration-500"
                    style={{ width: `${jobData?.progress || 5}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-xs text-[var(--muted)] font-mono">
                  <span>Progress: {Math.round(jobData?.progress || 5)}%</span>
                  <span className="text-zinc-300">{jobData?.message || 'Connecting...'}</span>
                </div>

                {jobData?.status === 'failed' && (
                  <div className="bg-red-950/30 border border-red-800/55 rounded-lg p-3 text-left">
                    <p className="text-xs text-red-400 font-semibold">Pipeline Error:</p>
                    <p className="text-[10px] text-red-300 font-mono mt-1 whitespace-pre-wrap line-clamp-4">
                      {jobData?.error_message || 'Unknown processing error'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <RefreshCwIcon className="w-8 h-8 animate-spin text-[var(--muted)] mx-auto" />
                <p className="text-[var(--muted)]">Fetching workspace assets...</p>
              </div>
            )}
          </div>
        ) : !videoId ? (
          /* Select Video Screen if None Selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto space-y-6">
            <ClapperboardIcon className="w-16 h-16 text-[var(--muted)] mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Choose a video to open in the editor</h2>
            <p className="text-[var(--muted)] text-sm">
              You haven't selected a video yet. Paste a YouTube link or drag-and-drop a video file on the homepage to start, or choose a recent upload below:
            </p>
            
            {recentVideos.length > 0 ? (
              <div className="w-full bg-[var(--background)]/80 border border-[var(--border)]/50 rounded-xl overflow-hidden text-left">
                <div className="px-4 py-2 border-b border-[var(--border)]/50 bg-[var(--panel)]/40 text-xs font-semibold text-[var(--muted)]">Recent Videos</div>
                <div className="divide-y divide-zinc-800">
                  {recentVideos.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVideoId(v.id)}
                      className="w-full px-4 py-3 hover:bg-[var(--panel)]/60 text-left text-sm text-zinc-300 flex justify-between items-center transition-colors"
                    >
                      <span className="font-medium truncate max-w-xs">{v.title}</span>
                      <span className="text-xs text-[var(--muted)] font-mono">Open →</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
                <UploadIcon className="w-4 h-4" /> Upload A Video Now
              </Link>
            )}
          </div>
        ) : (
          /* Active Workspace Layout */
          <>
            {/* Left Column: Video Player & Clips */}
            <div className="w-full md:w-5/12 border-r border-[var(--border)]/50 flex flex-col bg-transparent p-4 space-y-4 overflow-y-auto max-h-[85vh] md:max-h-none">
              
              {/* Toggle Clip view */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/40">
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Video Source</span>
                {activeClip && (
                  <button
                    onClick={() => setActiveClip(null)}
                    className="text-xs text-[var(--foreground)] hover:text-zinc-300 font-semibold"
                  >
                    ← Switch to Original Video
                  </button>
                )}
              </div>

              {/* Player Container */}
              {videoData.audio_only ? (
                /* Audio-Only Player */
                <div className="bg-[var(--background)]/80 rounded-xl overflow-hidden border border-[var(--border)]/50 shadow-lg p-6 space-y-4">
                  <div className="flex items-center justify-center gap-3 py-6">
                    <MusicIcon className="w-16 h-16 text-[var(--muted)] mx-auto animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{videoData.filename}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">Audio Only Mode</p>
                  </div>
                  <audio
                    ref={videoRef as any}
                    src={getStorageUrl(videoData.saved_path)}
                    controls
                    className="w-full"
                  />
                  {/* Download Button */}
                  <a
                    href={`/api/v1/videos/${videoData.id}/download`}
                    download
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-650 hover:bg-white text-[var(--foreground)] rounded-lg text-sm font-semibold shadow hover:scale-[1.01] transition-transform"
                  >
                    <DownloadIcon className="w-4 h-4" /> Download MP3 Audio
                  </a>
                </div>
              ) : (
                /* Video Player */
                <div className="relative bg-black rounded-xl overflow-hidden border border-[var(--border)]/60 flex items-center justify-center shadow-2xl">
                  <video
                    ref={videoRef}
                    src={activeClip ? getStorageUrl(activeClip.output_path) : getStorageUrl(videoData.saved_path)}
                    controls
                    className={`w-full max-h-[400px] bg-black ${activeClip ? 'aspect-[9/16]' : 'aspect-video'}`}
                  />
                </div>
              )}

              {/* Clip Details Info */}
              <div className="bg-[var(--background)]/50 border border-[var(--border)]/40 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--foreground)]">
                      {activeClip ? (
                        <span className="flex items-center gap-1.5">
                          <VideoIcon className="w-4 h-4 text-[var(--foreground)]" />
                          <span>Clip: {activeClip.title}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          {videoData.audio_only ? <MusicIcon className="w-4 h-4 text-[var(--foreground)]" /> : <VideoIcon className="w-4 h-4 text-[var(--foreground)]" />}
                          <span>{videoData.audio_only ? 'Audio' : 'Original'}: {videoData.filename}</span>
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1 font-mono">
                      {activeClip 
                        ? `Timings: ${activeClip.start_time}s - ${activeClip.end_time}s | Duration: ${(activeClip.end_time - activeClip.start_time).toFixed(1)}s` 
                        : `Duration: ${videoData.duration ? videoData.duration.toFixed(1) + 's' : 'N/A'}${videoData.audio_only ? ' | Format: MP3' : ''}`
                      }
                    </p>
                  </div>
                  {!activeClip && !videoData.audio_only && (
                    <button
                      onClick={handleCreateAndRenderFullVideo}
                      className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-[var(--foreground)] rounded text-[10px] font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <ClapperboardIcon className="w-3.5 h-3.5" />
                      <span>Render Full Video as Reel</span>
                    </button>
                  )}
                </div>
                {activeClip?.explanation && (
                  <div className="text-xs text-zinc-300 bg-indigo-950/10 border border-indigo-500/10 rounded p-2.5 mt-2.5 leading-relaxed">
                    <span className="flex items-start gap-1.5">
                      <SparklesIcon className="w-4 h-4 text-[var(--foreground)] mt-0.5 shrink-0" />
                      <span><strong>Viral Hook Reason:</strong> {activeClip.explanation}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* AI Clips List */}
              <div className="flex-1 flex flex-col min-h-[250px]">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">AI-Detected Clips</h4>
                  <span className="text-[10px] text-[var(--foreground)] font-mono font-semibold">Configured: {videoData.num_clips || 3} clips</span>
                </div>

                {/* Re-detect Panel */}
                <div className="bg-[var(--background)]/50 border border-[var(--border)]/50 rounded-xl p-3 mb-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Re-detect count</label>
                    <span className="text-xs font-extrabold text-[var(--foreground)] font-mono">{numClipsToDetect}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={numClipsToDetect}
                    onChange={(e) => setNumClipsToDetect(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-550"
                    style={{ accentColor: '#6366f1' }}
                    disabled={isDetectingClips}
                  />
                  {/* Clip Style Brief for re-detect */}
                  <div className="pt-1">
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                      🎯 Style Brief
                      <span className="ml-1 text-zinc-600 normal-case font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="workspace-clip-prompt"
                      value={clipPrompt}
                      onChange={(e) => setClipPrompt(e.target.value)}
                      rows={2}
                      disabled={isDetectingClips}
                      placeholder="e.g. Motivational, high-energy hooks only..."
                      className="w-full bg-[var(--background)]/60 border border-zinc-700/60 rounded-lg px-2.5 py-2 text-[11px] text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-violet-500/50 transition-all leading-relaxed disabled:opacity-40"
                    />
                  </div>
                  <button
                    onClick={handleRedetectClips}
                    disabled={isDetectingClips || !videoData.transcript}
                    className="w-full py-1.5 bg-white hover:bg-zinc-200 text-[var(--foreground)] rounded font-bold text-[10px] uppercase tracking-wider shadow disabled:opacity-50 transition-all"
                  >
                    {isDetectingClips ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> Analyzing Transcript...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 justify-center">
                        <SparklesIcon className="w-3.5 h-3.5" /> Re-Detect Viral Moments
                      </span>
                    )}
                  </button>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  {videoData.clips && videoData.clips.length > 0 ? (
                    videoData.clips.map((clip: any) => (
                      <div
                        key={clip.id}
                        onClick={() => {
                          if (clip.status === 'completed' && clip.output_path) {
                            setActiveClip(clip);
                          } else {
                            // If not completed (pending/failed), play the original video and seek to its start time
                            if (activeClip !== null) {
                              pendingSeekTime.current = clip.start_time;
                              setActiveClip(null);
                            } else {
                              seekTo(clip.start_time);
                            }
                          }
                        }}
                        className={`card-hover p-4 cursor-pointer flex justify-between items-start ${
                          activeClip?.id === clip.id ? 'border-indigo-550 bg-indigo-950/15' : 'bg-[var(--background)]/50'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1.5">
                            {clip.clip_type === 'hook' ? (
                              <SparklesIcon className="w-4 h-4 text-[var(--foreground)]" />
                            ) : clip.clip_type === 'educational' ? (
                              <LightbulbIcon className="w-4 h-4 text-yellow-400" />
                            ) : clip.clip_type === 'storytelling' ? (
                              <BookOpenIcon className="w-4 h-4 text-emerald-400" />
                            ) : clip.clip_type === 'full_video' ? (
                              <VideoIcon className="w-4 h-4 text-[var(--muted)]" />
                            ) : (
                              <HeartIcon className="w-4 h-4 text-rose-400" />
                            )}
                            <span className="text-xs font-bold text-zinc-300 capitalize">
                              {clip.clip_type === 'full_video' ? 'Full Video Reel' : `${clip.clip_type} clip`}
                            </span>
                          </div>
                          {/* Timing badge */}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-[10px] font-mono text-[var(--foreground)] font-semibold tracking-wide">
                              &#9201; {clip.start_time?.toFixed(1)}s – {clip.end_time?.toFixed(1)}s
                            </span>
                            {clip.duration && (
                              <span className="text-[10px] text-[var(--muted)] font-mono">
                                {clip.duration}s
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-zinc-200 truncate">{clip.title || 'Untitled Clip'}</p>
                          <p className="text-[10px] text-[var(--muted)] mt-1 line-clamp-2 leading-relaxed">{clip.segment_text}</p>
                        </div>
                        
                        <div className="text-right flex flex-col items-end gap-2">
                          <div>
                            <span className="text-lg font-bold bg-[var(--panel)] bg-clip-text text-transparent">{clip.viral_score}%</span>
                            <p className="text-[9px] text-[var(--muted)]">Viral score</p>
                          </div>
                          
                          {/* Rendering action status */}
                          {clip.status === 'completed' ? (
                            <span className="text-[10px] font-semibold text-green-400 flex items-center gap-1">✓ Ready</span>
                          ) : clip.status === 'rendering' ? (
                            <span className="text-[10px] text-yellow-400 animate-pulse font-semibold flex items-center gap-1">
                              <RefreshCwIcon className="w-3 h-3 animate-spin" /> Rendering...
                            </span>
                          ) : clip.status === 'failed' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerRender(clip.id);
                              }}
                              className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-700 rounded text-[9px] font-semibold hover:bg-red-900"
                            >
                              Render Failed (Retry)
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerRender(clip.id);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-zinc-200 text-[var(--foreground)] rounded text-[10px] font-bold shadow-md transition-all"
                            >
                              <span className="flex items-center gap-1 justify-center">
                                <ClapperboardIcon className="w-3.5 h-3.5" />
                                <span>Render Vertical</span>
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-[var(--background)]/20 rounded-xl border border-dashed border-[var(--border)]/50 text-[var(--muted)] text-xs">
                      No clips detected. Try transcribing the video first.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center Column: Interactive Transcript */}
            <div className="flex-1 border-r border-[var(--border)]/50 flex flex-col bg-[var(--background)]/20 p-4 min-h-[300px] overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/50 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Interactive Transcript</h3>
                  <p className="text-[10px] text-[var(--muted)] font-mono">Click any line to seek video player</p>
                </div>
                {videoData?.transcript && (
                  <div className="flex items-center gap-2">
                    {/* Auto-Scroll Sync Toggle */}
                    <button
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all flex items-center gap-1 border ${
                        autoScroll
                          ? 'bg-white hover:bg-indigo-550 border-indigo-500/30 text-[var(--foreground)] shadow-sm'
                          : 'bg-black hover:bg-[var(--panel)] border-[var(--border)] text-[var(--muted)]'
                      }`}
                      title={autoScroll ? "Click to pause auto-scrolling transcript" : "Click to follow video playhead"}
                    >
                      {autoScroll ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-0.5" />
                          <span>Sync Scroll</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mr-0.5" />
                          <span>Scroll Paused</span>
                        </>
                      )}
                    </button>

                    {/* Transliteration Switcher */}
                    {(() => {
                      const isHindiScript = /[\u0900-\u097F]/.test(videoData.transcript.raw_text || '');
                      return (
                        <button
                          onClick={handleTransliterate}
                          disabled={transliterating}
                          className="px-2 py-1 bg-[var(--panel)] hover:bg-zinc-800 border border-[var(--border)] text-[10px] text-[var(--foreground)] rounded font-semibold transition-all disabled:opacity-50"
                        >
                          {transliterating ? (
                            <span className="flex items-center gap-1">
                              <RefreshCwIcon className="w-3 h-3 animate-spin text-[var(--foreground)]" />
                              <span>Converting...</span>
                            </span>
                          ) : isHindiScript ? (
                            <span className="flex items-center gap-1">
                              <GlobeIcon className="w-3 h-3 text-[var(--foreground)]" />
                              <span>Switch to Hinglish</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <PenToolIcon className="w-3 h-3 text-[var(--foreground)]" />
                              <span>Switch to Hindi Script</span>
                            </span>
                          )}
                        </button>
                      );
                    })()}
                    <span className="badge-success text-[10px] py-0.5">✓ AI Generated</span>
                  </div>
                )}
              </div>

              {/* Scrollable Word List */}
              <div 
                ref={transcriptContainerRef}
                onScroll={handleScroll}
                onWheel={handleUserInteraction}
                onTouchMove={handleUserInteraction}
                className="flex-1 overflow-y-auto pr-2 pb-6"
              >
                {(() => {
                  const words = videoData.transcript?.words;
                  const hasTimestamps = words && words.length > 0;
                  const rawText = videoData.transcript?.raw_text || '';

                  // ── Case 1: we have word-level timestamps → clickable + highlighted ──
                  if (hasTimestamps) {
                    return (
                      <div className="flex flex-col gap-5 px-2 py-4">
                        {transcriptLines.map((line: any, index: number) => {
                          const isActive = index === activeLineIndex;
                          const isPast = index < activeLineIndex && activeLineIndex !== -1;
                          
                          return (
                            <div
                              key={index}
                              ref={isActive ? activeLineRef : null}
                              onClick={() => seekTo(line.start)}
                              className={`cursor-pointer transition-all duration-300 rounded-lg p-3 flex flex-wrap gap-x-1.5 gap-y-1 select-none items-center ${
                                isActive
                                  ? 'bg-[var(--panel)]/90 border border-[var(--border)]/80 shadow-2xl scale-[1.01]'
                                  : isPast
                                  ? 'opacity-40 hover:opacity-85'
                                  : 'opacity-70 hover:opacity-100'
                              }`}
                            >
                              {line.words.map((w: any, wIdx: number) => {
                                const isWordActive = currentTime >= w.start && currentTime <= w.end;
                                return (
                                  <span
                                    key={wIdx}
                                    className={`transition-all duration-100 px-1 py-0.5 rounded text-sm md:text-base ${
                                      isWordActive
                                        ? 'text-[var(--foreground)] bg-zinc-200/10 font-semibold border border-indigo-500/15'
                                        : isActive
                                        ? 'text-[var(--foreground)]'
                                        : 'text-zinc-300'
                                    }`}
                                  >
                                    {w.word}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // ── Case 2: no timestamps but we have raw transcript text → plain tokens ──
                  if (rawText.trim().length > 0) {
                    const tokens = rawText.trim().split(/\s+/);
                    return (
                      <div>
                        <div className="mb-3 mx-2 px-3 py-2 bg-[var(--panel)]/80 border border-[var(--border)]/50 rounded-lg text-[10px] text-[var(--muted)] leading-relaxed">
                          <span className="inline-flex items-center gap-1 mr-1 text-amber-500">
                            <HelpCircleIcon className="w-3.5 h-3.5" />
                          </span>
                          No word-level timestamps saved. Showing plain transcript — add a <strong>GROQ_API_KEY</strong> or <strong>GEMINI_API_KEY</strong> to enable precise word highlights.
                        </div>
                        <div className="flex flex-wrap gap-x-1.5 gap-y-3 leading-relaxed text-sm text-zinc-300 px-2">
                          {tokens.map((token: string, index: number) => (
                            <span
                              key={index}
                              className="rounded px-1 py-0.5 text-zinc-300 hover:text-[var(--foreground)] hover:bg-[var(--panel)] transition-colors cursor-default select-none"
                            >
                              {token}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // ── Case 3: no transcript at all ──
                  return (
                    <div className="text-center py-16 text-[var(--muted)] flex flex-col items-center gap-4">
                      <FileIcon className="w-12 h-12 text-[var(--muted)] mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--muted)]">Transcript not ready yet</p>
                        <p className="text-xs mt-1 text-[var(--muted)]">The pipeline may still be processing. Click Refresh to reload.</p>
                      </div>
                      <button
                        onClick={() => videoId && fetchVideoDetails(videoId)}
                        className="px-4 py-2 bg-[var(--panel)] hover:bg-zinc-800 border border-[var(--border)] text-[var(--foreground)] text-xs rounded-lg font-semibold transition-colors"
                      >
                        <span className="flex items-center gap-1.5 justify-center">
                          <RefreshCwIcon className="w-3.5 h-3.5" />
                          <span>Refresh Transcript</span>
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Column: AI Sidebar (Chat Copilot & platform copywriter) */}
            <div className="w-full md:w-3/12 flex flex-col bg-[var(--background)]/20 overflow-hidden">
              
              {/* Tab Selector */}
              <div className="flex border-b border-[var(--border)]/50 bg-black/30">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'chat'
                      ? 'border-b-2 border-indigo-500 text-[var(--foreground)] bg-[var(--panel)]/20'
                      : 'text-[var(--muted)] hover:text-zinc-200'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <MessageSquareIcon className="w-4 h-4" />
                    <span>Chat</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('copywriter')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'copywriter'
                      ? 'border-b-2 border-indigo-500 text-[var(--foreground)] bg-[var(--panel)]/20'
                      : 'text-[var(--muted)] hover:text-zinc-200'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <PenToolIcon className="w-4 h-4" />
                    <span>Copy</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('branding')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'branding'
                      ? 'border-b-2 border-indigo-500 text-[var(--foreground)] bg-[var(--panel)]/20'
                      : 'text-[var(--muted)] hover:text-zinc-200'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <PaletteIcon className="w-4 h-4" />
                    <span>Brand</span>
                  </span>
                </button>
              </div>

              {/* Tab 3: Branding & Styling */}
              {activeTab === 'branding' && (
                <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">Subtitle Style</label>
                    <div className="flex flex-col gap-2">
                      <select 
                        value={font} 
                        onChange={e => setFont(e.target.value)}
                        className="bg-black border border-[var(--border)]/50 rounded p-2 text-xs text-[var(--foreground)] outline-none focus:border-indigo-500"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Impact">Impact</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Comic Sans MS">Comic Sans</option>
                      </select>

                      <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mt-1">Caption Animation</label>
                      <select 
                        value={subtitleAnim} 
                        onChange={e => setSubtitleAnim(e.target.value)}
                        className="bg-black border border-[var(--border)]/50 rounded p-2 text-xs text-[var(--foreground)] outline-none focus:border-indigo-500 mb-1"
                      >
                        <option value="none">Standard Subtitles (Static)</option>
                        <option value="classic">Classic Color Highlight</option>
                        <option value="zoom_bounce">Zoom Pop Highlight (Reels Style)</option>
                        <option value="glow_highlighter">Glow Spotlight Zoom</option>
                      </select>
                      
                      <div className="flex items-center justify-between bg-black border border-[var(--border)]/50 rounded p-2">
                        <span className="text-xs text-zinc-350">Highlight Color</span>
                        <input 
                          type="color" 
                          value={highlightColor} 
                          onChange={e => setHighlightColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                      
                      <div className="flex items-center gap-1 bg-black border border-[var(--border)]/50 rounded p-1">
                        {['top', 'center', 'bottom'].map(pos => (
                          <button
                            key={pos}
                            onClick={() => setSubtitlePos(pos)}
                            className={`flex-1 py-1 text-[10px] uppercase font-bold rounded ${
                              subtitlePos === pos ? 'bg-white text-[var(--foreground)]' : 'text-[var(--muted)] hover:bg-[var(--panel)]'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">Watermark / Logo</label>
                    <div 
                      className="border-2 border-dashed border-[var(--border)]/50 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors cursor-pointer"
                      onClick={() => watermarkInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={watermarkInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg"
                        onChange={handleUploadWatermark}
                      />
                      {watermarkPath ? (
                        <div className="text-xs text-[var(--foreground)] font-semibold truncate max-w-full">
                          ✓ {watermarkPath.split('/').pop() || watermarkPath.split('\\').pop()}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-450">
                          <ImageIcon className="w-8 h-8 text-[var(--muted)] mx-auto mb-1" />
                          Upload PNG/JPG
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">AI Enhancements</label>
                    <label className="flex items-center justify-between bg-black border border-[var(--border)]/50 rounded p-3 cursor-pointer hover:border-indigo-500 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs text-[var(--foreground)] font-semibold">AI B-Roll Insertion</span>
                        <span className="text-[10px] text-[var(--muted)] font-mono">Auto-overlay images</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${brollEnabled ? 'bg-white' : 'bg-zinc-700'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${brollEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={brollEnabled} 
                        onChange={(e) => setBrollEnabled(e.target.checked)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="w-full py-2 bg-white hover:bg-zinc-200 text-[var(--foreground)] rounded font-bold text-xs shadow disabled:opacity-50 transition-colors"
                    >
                      {savingSettings ? (
                        <span className="flex items-center gap-1.5 justify-center">
                          <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 justify-center">
                          <SaveIcon className="w-3.5 h-3.5" /> Save Branding Settings
                        </span>
                      )}
                    </button>
                    <p className="text-[10px] text-[var(--muted)] text-center mt-2">Saved settings apply when rendering clips.</p>
                  </div>
                </div>
              )}

              {/* Tab 1: Chat Copilot (RAG) */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden p-4">
                  {/* Messages Bubble Container */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-white text-[var(--foreground)] ml-auto rounded-tr-none'
                            : 'bg-[var(--panel)]/90 border border-[var(--border)]/50 text-zinc-105 mr-auto rounded-tl-none'
                        }`}
                      >
                        <span className="font-semibold capitalize text-[10px] text-[var(--muted)] mb-1">
                          {msg.role === 'user' ? 'You' : 'CreatorPilot AI'}
                        </span>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="bg-[var(--panel)]/90 border border-[var(--border)]/50 text-zinc-300 rounded-2xl rounded-tl-none p-3 text-xs mr-auto max-w-[85%] animate-pulse">
                        Thinking...
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendChatMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Chat with your video..."
                      className="flex-1 bg-black border border-[var(--border)]/50 rounded-lg px-3 py-2 text-xs text-[var(--foreground)] placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="px-4 bg-white hover:bg-indigo-550 text-[var(--foreground)] rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Copywriter */}
              {activeTab === 'copywriter' && (
                <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                  
                  {/* Platform Picker */}
                  <div>
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-2">Target Platform</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['linkedin', 'instagram', 'youtube', 'twitter', 'tiktok'].map((platform) => (
                        <button
                          key={platform}
                          onClick={() => setSelectedPlatform(platform)}
                          className={`py-1.5 text-[10px] font-bold rounded capitalize transition-all ${
                            selectedPlatform === platform
                              ? 'bg-white text-[var(--foreground)]'
                              : 'bg-[var(--panel)] text-[var(--muted)] hover:bg-zinc-800'
                          }`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGeneratePlatformCopy}
                    disabled={generatingCopy}
                    className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    {generatingCopy ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> Generating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 justify-center">
                        <SparklesIcon className="w-3.5 h-3.5" /> Generate Platform Copy
                      </span>
                    )}
                  </button>

                  {copyStatus && (
                    <div className="text-[10px] text-[var(--foreground)] text-center font-mono">{copyStatus}</div>
                  )}

                  {/* Generated Outputs */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {captions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Generated Copy Options</h4>
                        {/* Match platform filters */}
                        <div className="card bg-[var(--background)]/60 border-[var(--border)]/50 p-3 text-xs leading-relaxed font-mono relative group">
                          <button
                            onClick={() => {
                              const txt = captions[0]?.text || '';
                              navigator.clipboard.writeText(txt);
                              alert('Copied to clipboard!');
                            }}
                            className="absolute top-2 right-2 bg-[var(--panel)] text-zinc-450 hover:text-[var(--foreground)] px-2 py-1 rounded text-[10px] flex items-center gap-1"
                          >
                            <CopyIcon className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                          <span className="text-[9px] font-bold text-indigo-450 uppercase block mb-1">Captions</span>
                          <p className="whitespace-pre-wrap">{captions[0]?.text || 'Click generate to populate'}</p>
                        </div>

                        {titles.length > 0 && (
                          <div className="card bg-[var(--background)]/60 border-[var(--border)]/50 p-3 text-xs leading-relaxed font-mono relative">
                            <button
                              onClick={() => {
                                const txt = titles[0]?.text || '';
                                navigator.clipboard.writeText(txt);
                                alert('Copied to clipboard!');
                              }}
                              className="absolute top-2 right-2 bg-[var(--panel)] text-zinc-450 hover:text-[var(--foreground)] px-2 py-1 rounded text-[10px] flex items-center gap-1"
                            >
                              <CopyIcon className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                            <span className="text-[9px] font-bold text-violet-400 uppercase block mb-1">Titles</span>
                            <p className="font-semibold">{titles[0]?.text || 'Click generate to populate'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

          </>
        )}

      </div>
    </main>
  );
}
