'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  VideoIcon, 
  ClapperboardIcon, 
  LightbulbIcon, 
  FileIcon, 
  GlobeIcon
} from './Icons';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{name: string, email: string} | null>(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    } catch(e) {}
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: GlobeIcon },
    { name: 'Repurposer', href: '/repurposer', icon: VideoIcon },
    { name: 'Script Writer', href: '/teleprompter', icon: FileIcon },
    { name: 'Trend Analyzer', href: '/trends', icon: LightbulbIcon },
    { name: 'Content Vault', href: '/vault', icon: ClapperboardIcon },
    { name: 'AI Studio', href: '/studio', icon: VideoIcon },
  ];

  return (
    <aside className="w-64 h-screen bg-[var(--background)] border-r border-[var(--border)] flex flex-col flex-shrink-0">
      {/* Brand Header */}
      <div className="h-14 px-6 flex items-center border-b border-[var(--border)]">
        <Link href="/" className="font-semibold text-[var(--foreground)] tracking-tight flex items-center gap-2 hover:text-[var(--accent)] transition-colors">
          <div className="w-5 h-5 bg-[var(--foreground)] rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-[var(--background)] rounded-sm"></div>
          </div>
          CreatorPilot
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="px-2 pb-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-[var(--panel)] text-[var(--foreground)]' 
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-hover)]'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User / Usage Section */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="bg-[var(--panel)] rounded-md p-3 mb-4 border border-[var(--border)]">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-2">
            <span>AI Credits</span>
            <span className="text-[var(--foreground)]">84%</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--background)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--foreground)] rounded-full" style={{ width: '84%' }}></div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--foreground)] shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">{user?.name || 'Pro User'}</p>
            <p className="text-xs text-[var(--muted)] truncate">{user?.email || 'user@creatorpilot.ai'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
