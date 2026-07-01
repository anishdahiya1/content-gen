'use client';

import Link from 'next/link';
import { 
  RocketIcon, 
  VideoIcon, 
  FileIcon, 
  LightbulbIcon, 
  ClockIcon, 
  BarChartIcon,
  ClapperboardIcon
} from './components/Icons';

export default function DashboardPage() {
  const recentProjects = [
    { id: 1, name: 'Q3 Product Update', status: 'Processing', type: 'Repurposer', time: '10m ago' },
    { id: 2, name: 'Top 5 AI Tools', status: 'Draft', type: 'Script Writer', time: '2h ago' },
    { id: 3, name: 'SaaS Trends 2026', status: 'Analyzed', type: 'Trend Analyzer', time: '1d ago' },
    { id: 4, name: 'Weekly Newsletter', status: 'Completed', type: 'Script Writer', time: '2d ago' },
  ];

  const quickActions = [
    { name: 'New Video Batch', icon: VideoIcon, href: '/repurposer' },
    { name: 'Write Script', icon: FileIcon, href: '/teleprompter' },
    { name: 'Analyze Trends', icon: LightbulbIcon, href: '/trends' },
    { name: 'Browse Vault', icon: ClapperboardIcon, href: '/vault' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Workspace Overview</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">View Docs</button>
          <Link href="/repurposer" className="btn-primary">
            <RocketIcon className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </div>
      </header>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.name} href={action.href} className="surface-panel p-4 flex flex-col items-start hover:bg-[var(--panel-hover)] transition-colors duration-150 group">
            <div className="w-8 h-8 rounded bg-[var(--background)] border border-[var(--border)] flex items-center justify-center mb-3 group-hover:border-[var(--muted)] transition-colors">
              <action.icon className="w-4 h-4 text-[var(--foreground)]" />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">{action.name}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area: Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-panel">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Recent Projects</h2>
              <button className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">View All</button>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--muted)] bg-[var(--background)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {recentProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-[var(--panel-hover)] transition-colors cursor-pointer group">
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{project.name}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{project.type}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          project.status === 'Completed' || project.status === 'Analyzed' ? 'badge-success' : 
                          project.status === 'Processing' ? 'badge-info' : 'badge-default'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)] text-right tabular-nums">{project.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Mock Analytics Chart */}
          <div className="surface-panel p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Content Performance</h2>
              <select className="bg-[var(--background)] border border-[var(--border)] text-xs rounded px-2 py-1 text-[var(--muted)] outline-none focus:border-[var(--foreground)]">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-48 w-full border border-[var(--border)] border-dashed rounded flex items-center justify-center bg-[var(--background)]">
              <div className="flex items-end gap-2 h-32 w-full max-w-sm px-4">
                {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-[var(--foreground)] rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <div className="surface-panel p-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 mb-4">
              <BarChartIcon className="w-4 h-4 text-[var(--muted)]" />
              Usage Statistics
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--muted)]">API Credits</span>
                  <span className="font-medium text-[var(--foreground)]">8,450 / 10,000</span>
                </div>
                <div className="h-2 w-full bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div className="h-full bg-[var(--foreground)]" style={{ width: '84%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--muted)]">Storage</span>
                  <span className="font-medium text-[var(--foreground)]">12 GB / 50 GB</span>
                </div>
                <div className="h-2 w-full bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div className="h-full bg-zinc-400" style={{ width: '24%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-panel p-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 mb-4">
              <ClockIcon className="w-4 h-4 text-[var(--muted)]" />
              Activity Feed
            </h2>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {/* Activity Items */}
              <div className="flex gap-3 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--foreground)] shrink-0 shadow-[0_0_0_4px_var(--background)] relative z-10"></div>
                <div>
                  <p className="text-[var(--foreground)] text-xs">Generated <span className="font-medium">5 clips</span> for Q3 Product Update</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">10 minutes ago</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--border)] shrink-0 shadow-[0_0_0_4px_var(--background)] relative z-10"></div>
                <div>
                  <p className="text-[var(--foreground)] text-xs">Analyzed trends for <span className="font-medium">SaaS Marketing</span></p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">1 day ago</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--border)] shrink-0 shadow-[0_0_0_4px_var(--background)] relative z-10"></div>
                <div>
                  <p className="text-[var(--foreground)] text-xs">Saved script <span className="font-medium">Weekly Newsletter</span></p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">2 days ago</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 btn-ghost text-xs">View Full Timeline</button>
          </div>
        </div>

      </div>
    </div>
  );
}
