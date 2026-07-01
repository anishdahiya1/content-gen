'use client';

import { 
  FolderIcon, 
  SearchIcon, 
  FileIcon, 
  VideoIcon, 
  ImageIcon,
  RefreshCwIcon,
  PlusIcon
} from '../components/Icons';

export default function VaultPage() {
  const folders = [
    { name: 'All Files', count: 124, active: true },
    { name: 'Recent Exports', count: 12, active: false },
    { name: 'Raw Footage', count: 45, active: false },
    { name: 'B-Roll Library', count: 56, active: false },
    { name: 'Thumbnails', count: 11, active: false },
  ];

  const tags = ['#viral', '#q3-launch', '#draft', '#needs-review', '#youtube'];

  const files = [
    { name: 'Q3_Product_Update_Final.mp4', type: 'video', size: '245 MB', date: 'Oct 24, 2026' },
    { name: 'Script_v2_draft.txt', type: 'doc', size: '12 KB', date: 'Oct 23, 2026' },
    { name: 'Thumbnail_Option_A.png', type: 'image', size: '2.4 MB', date: 'Oct 23, 2026' },
    { name: 'Raw_Webcam_Takes.mov', type: 'video', size: '1.2 GB', date: 'Oct 22, 2026' },
    { name: 'SaaS_Trends_Report.pdf', type: 'doc', size: '1.5 MB', date: 'Oct 20, 2026' },
    { name: 'B_Roll_Office.mp4', type: 'video', size: '850 MB', date: 'Oct 19, 2026' },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0 bg-[var(--panel)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--background)] border border-[var(--border)] flex items-center justify-center">
            <FolderIcon className="w-4 h-4 text-[var(--foreground)]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Content Vault</h1>
            <p className="text-xs text-[var(--muted)]">Manage your assets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary text-xs py-1.5">
            <PlusIcon className="w-4 h-4 mr-2" />
            Upload File
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Navigation */}
        <div className="w-64 border-r border-[var(--border)] bg-[var(--background)] flex flex-col p-4 shrink-0 overflow-y-auto space-y-6">
          
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 px-2">Folders</h3>
            {folders.map((folder) => (
              <button 
                key={folder.name}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                  folder.active 
                    ? 'bg-[var(--panel)] text-[var(--foreground)]' 
                    : 'text-[var(--muted)] hover:bg-[var(--panel-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderIcon className={`w-4 h-4 ${folder.active ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`} />
                  <span>{folder.name}</span>
                </div>
                <span className="text-xs font-mono text-[var(--muted)]">{folder.count}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 px-2">Tags</h3>
            <div className="flex flex-wrap gap-1.5 px-2">
              {tags.map((tag) => (
                <span key={tag} className="badge badge-default cursor-pointer hover:bg-[var(--border)]">{tag}</span>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Content Area: File Grid */}
        <div className="flex-1 flex flex-col bg-[var(--background)] min-w-0">
          
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-4 bg-[var(--background)] shrink-0">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input 
                type="text" 
                placeholder="Search files by name or tag..." 
                className="input-field pl-9 py-1.5 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="font-medium">Sort by:</span>
              <select className="bg-transparent border-none outline-none font-semibold text-[var(--foreground)] cursor-pointer">
                <option>Date Added</option>
                <option>Name (A-Z)</option>
                <option>Size</option>
              </select>
            </div>
          </div>

          {/* Files */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {files.map((file, i) => (
                <div key={i} className="surface-panel p-3 flex flex-col gap-3 group cursor-pointer hover:border-[var(--muted)] transition-colors">
                  <div className="aspect-[4/3] w-full rounded bg-[var(--background)] border border-[var(--border)] flex items-center justify-center relative overflow-hidden group-hover:bg-[var(--panel-hover)] transition-colors">
                    {file.type === 'video' ? <VideoIcon className="w-8 h-8 text-[var(--muted)]" /> : 
                     file.type === 'image' ? <ImageIcon className="w-8 h-8 text-[var(--muted)]" /> : 
                     <FileIcon className="w-8 h-8 text-[var(--muted)]" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)] truncate" title={file.name}>{file.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-mono text-[var(--muted)]">{file.size}</span>
                      <span className="text-[10px] text-[var(--muted)]">{file.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
