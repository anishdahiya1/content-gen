import Link from 'next/link';
import { 
  ClapperboardIcon, 
  CpuIcon, 
  MicIcon, 
  LightbulbIcon, 
  VideoIcon, 
  UploadIcon, 
  RocketIcon,
  CopyIcon
} from './components/Icons';

export default function Home() {
  return (
    <main className="min-h-screen premium-bg text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* Premium Glassmorphic Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-glow z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-fuchsia-500/10 rounded-full blur-[140px] animate-pulse-glow z-0 pointer-events-none"></div>
      <div className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] bg-violet-500/10 rounded-full blur-[100px] animate-pulse-glow z-0 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="border-b border-slate-900/50 bg-[#03050a]/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ClapperboardIcon className="w-8 h-8 text-indigo-400 animate-float" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
                CreatorPilot AI
              </h1>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Content OS</p>
            </div>
          </div>
          <Link href="/workspace" className="btn-secondary py-2 text-xs font-bold shadow-sm shadow-slate-950/50">
            Open Workspace
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center space-y-12 z-10">
        <div className="space-y-6 max-w-4xl">
          {/* Badge indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/30 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-semibold shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-450 animate-ping"></span>
            Production Build 2.0 Is Live
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
            Turn Long-Form Videos Into
            <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mt-2 animate-pulse-glow">
              Viral Short Clips
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Upload one video. Our AI reframes landscape frames to vertical, burns in highlighted captions, and drafts social copy in your personalized brand voice—completely for free.
          </p>
        </div>

        {/* CTA Button Area */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
          <Link href="/upload" className="btn-primary py-4 px-8 text-base shadow-lg shadow-indigo-500/20 flex items-center gap-2 hover:scale-[1.02] transition-transform">
            <UploadIcon className="w-5 h-5 text-indigo-200" /> Upload Your First Video
          </Link>
          <Link href="/workspace" className="btn-secondary py-4 px-8 text-base hover:bg-slate-900 transition-colors flex items-center gap-2">
            <RocketIcon className="w-5 h-5 text-indigo-450" /> Open Dashboard
          </Link>
        </div>

        {/* Dashboard Visual CSS Mockup (Premium Float Effect) */}
        <div className="w-full pt-10 animate-float">
          <div className="w-full max-w-5xl mx-auto bg-[#0b0e17]/50 border border-slate-850/50 rounded-xl p-4 shadow-2xl backdrop-blur-lg flex flex-col md:flex-row gap-4 text-left">
            {/* Mock Player */}
            <div className="flex-1 bg-[#04060b]/95 border border-slate-900/60 rounded-lg p-4 flex flex-col justify-between aspect-video md:aspect-auto md:min-h-[300px]">
              <div className="flex items-center justify-between border-b border-slate-900/50 pb-2">
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Original Source Player
                </span>
                <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  1080p
                </span>
              </div>
              
              {/* Simulated Video Frame with Bounding Box Face Reframing */}
              <div className="flex-1 my-3 bg-[#070a12]/80 border border-slate-850/50 rounded-lg flex items-center justify-center relative overflow-hidden group shadow-inner min-h-[140px]">
                {/* Simulated video image background or abstract pattern */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/50 via-[#0b0e17] to-indigo-950/20 z-0"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-10 z-0"></div>
                
                {/* Speaker Simulated Avatar / Vector Shape */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center z-10 shadow-lg shadow-indigo-900/55 animate-float border border-indigo-500/20">
                  <VideoIcon className="w-7 h-7 text-indigo-100 animate-pulse" />
                </div>
                
                {/* Glowing Bounding Box representing Face Tracking */}
                <div className="absolute w-24 h-24 border-2 border-dashed border-emerald-500/60 rounded-lg flex items-start justify-start p-1 animate-pulse z-10" style={{ top: '15%', left: '30%' }}>
                  <span className="text-[7px] font-mono text-emerald-400 bg-[#04060b]/90 border border-emerald-500/30 px-1 py-0.5 rounded uppercase tracking-wider">
                    Face Locked
                  </span>
                </div>

                {/* Subtitles Preview burnt-in */}
                <div className="absolute bottom-4 left-0 right-0 text-center z-10 px-2">
                  <span className="bg-black/80 text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 rounded font-bold text-[9px] tracking-tight shadow">
                    Avoid overengineering your MVPs
                  </span>
                </div>
              </div>
              
              {/* Simulated Player Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                  <span className="text-indigo-400">00:12</span>
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden relative">
                    <div className="absolute left-0 top-0 h-full bg-indigo-500 w-[40%] rounded-full"></div>
                  </div>
                  <span>00:30</span>
                </div>
                <div className="bg-[#0b0e17]/50 rounded p-1.5 text-[9px] text-indigo-300 font-mono flex items-center justify-between border border-slate-900/30">
                  <span>crop=1080:1920:face_x_avg:0</span>
                  <span className="text-[8px] text-emerald-400 font-bold uppercase">Reframing Active</span>
                </div>
              </div>
            </div>

            {/* Mock Transcript */}
            <div className="w-full md:w-5/12 bg-[#04060b]/95 border border-slate-900/60 rounded-lg p-4 flex flex-col justify-between">
              <div className="border-b border-slate-900/50 pb-2 mb-2 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-mono">Interactive Word Highlights</span>
                <span className="badge-success text-[8px] py-0">Whisper AI</span>
              </div>
              
              {/* Word List */}
              <div className="flex-1 flex flex-wrap gap-x-2 gap-y-2.5 text-xs leading-relaxed text-slate-400 py-3 items-center">
                <span>So</span> <span>the</span> <span>secret</span> <span>to</span> <span>building</span>
                <span className="text-indigo-300 bg-indigo-500/15 font-bold px-2 py-0.5 rounded border border-indigo-500/20 shadow-sm shadow-indigo-900/30 transition-transform hover:scale-105 cursor-pointer">
                  high-scale
                </span>
                <span>production</span> <span>systems</span> <span>is</span>
                <span className="text-indigo-300 bg-indigo-500/15 font-bold px-2 py-0.5 rounded border border-indigo-500/20 shadow-sm shadow-indigo-900/30 transition-transform hover:scale-105 cursor-pointer">
                  simplicity.
                </span>
                <span>Avoid</span> <span>overengineering</span> <span>your</span> <span>MVPs.</span>
              </div>

              {/* Simulated Audio Waveform Visualizer */}
              <div className="bg-[#0b0e17]/50 border border-slate-900/30 rounded-lg p-2.5 my-2 flex items-center gap-1">
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mr-2">Audio</div>
                <div className="flex-1 flex items-end justify-between h-8 gap-0.5">
                  {[2, 4, 1, 6, 8, 3, 5, 2, 7, 9, 4, 3, 6, 8, 2, 5, 7, 3, 1, 4, 6, 2, 8, 5, 3, 4, 7, 2].map((val, idx) => (
                    <div 
                      key={idx} 
                      className={`w-1 rounded-full ${idx < 12 ? 'bg-indigo-500/85 shadow-sm shadow-indigo-500/50' : 'bg-slate-800'}`} 
                      style={{ height: `${val * 10}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="text-[9px] text-slate-500 italic mt-1">
                * Click any word to seek player timeline
              </div>
            </div>

            {/* Mock Copilot */}
            <div className="w-full md:w-3/12 bg-[#04060b]/95 border border-slate-900/60 rounded-lg p-4 flex flex-col justify-between">
              <div className="border-b border-slate-900/50 pb-2 mb-2 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-mono">Brand Voice RAG</span>
                <span className="badge-info text-[8px] py-0">Gemini</span>
              </div>
              
              {/* Chat Thread view */}
              <div className="flex-1 flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1 py-1">
                {/* User Input Bubble */}
                <div className="bg-indigo-950/20 border border-indigo-500/10 text-[#a5b4fc] text-[9px] rounded-lg p-2 max-w-[90%] ml-auto font-sans leading-relaxed">
                  Draft a LinkedIn post summary.
                </div>
                
                {/* AI Response Output */}
                <div className="bg-[#0b0e17]/85 border border-slate-850/60 rounded-lg p-2.5 text-[9px] leading-relaxed text-slate-350 font-mono relative">
                  <p className="text-indigo-400 font-bold mb-1 text-[8px] uppercase tracking-wider">LinkedIn Post Draft:</p>
                  Overengineering kills MVPs. Keep it simple. SQLite + threading was all we needed...
                </div>
              </div>

              <button className="w-full mt-3 py-2 bg-indigo-650 hover:bg-indigo-600 rounded-lg text-[9px] font-bold text-white shadow-md shadow-indigo-900/20 transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01] hover:bg-indigo-600 active:scale-[0.99]">
                <CopyIcon className="w-3.5 h-3.5" />
                <span>Copy Generated Post</span>
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="pt-20 pb-10 w-full">
          <div className="text-center mb-12 space-y-2">
            <h3 className="text-3xl font-bold text-white tracking-tight">Full-Stack AI Features</h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Equipped with custom video pipelines and vector search RAG engines</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                Icon: CpuIcon,
                title: 'OpenCV Face Reframer',
                desc: 'Scans clip frames to locate face coordinates, centers the speaker, and crops horizontal video dynamically into 9:16 vertical shorts.',
              },
              {
                Icon: MicIcon,
                title: 'Interactive Subtitles',
                desc: 'Generates word-level timestamps and burns stylized subtitle ASS scripts. Clicking on transcript words seeks video player instantly.',
              },
              {
                Icon: LightbulbIcon,
                title: 'Brand Voice RAG Guides',
                desc: 'Upload style guides or newsletters. The vector database retrieves guidelines to generate platform copy in your distinct voice.',
              }
            ].map((f, i) => (
              <div key={i} className="glowing-card hover:scale-[1.02] transition-transform flex flex-col justify-between">
                <div>
                  <div className="text-indigo-400 mb-4 animate-float">
                    <f.Icon className="w-10 h-10" />
                  </div>
                  <h4 className="font-extrabold text-lg text-white mb-2">{f.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-4">API Key Required *</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Preview */}
        <div className="pt-16 border-t border-slate-900/50 w-full">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Built on a Zero-Cost Stack</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {['Next.js 14', 'FastAPI', 'SQLite DB', 'SQLAlchemy', 'OpenCV Face-Tracking', 'FFmpeg Crop', 'Gemini API', 'Groq Whisper', 'Vector RAG Store'].map((tech) => (
              <div key={tech} className="px-3.5 py-1.5 bg-slate-900/40 border border-slate-850/80 hover:border-indigo-500/30 rounded-xl text-xs text-slate-400 hover:text-indigo-300 transition-all font-mono">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 backdrop-blur-md mt-auto py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500 space-y-2">
          <p>CreatorPilot AI &copy; 2026 | Built for creators and developers alike.</p>
          <p className="font-mono text-[10px]">Zero cost server deployment scheme compatible</p>
        </div>
      </footer>
    </main>
  );
}
