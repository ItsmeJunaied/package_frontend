import { NavLink, useLocation } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreVertical,
  PackageSearch,
  Plus,
  Search,
  Settings,
  Truck,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/use-auth';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 4 },
  { to: '/orders', label: 'Project', icon: PackageSearch, badge: 1 },
  { to: '/courier', label: 'People', icon: Users },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
];

const WORKSPACES = [
  { name: 'Pertamina', color: '#2f6bff', active: true },
  { name: 'SCBD Tower', color: '#f04452' },
  { name: 'Bets Hotel', color: '#f5a623' },
];

/** First letters of a name, for the avatar chip. */
function initials(name: string | undefined): string {
  if (!name) return '··';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Only ever rendered inside `RequireAuth`, so `staff` is always present here. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { staff, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="sidebar-layout">
      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-6">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent-hi to-violet text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(47,107,255,0.7)]"
            aria-hidden
          >
            O
          </span>
          <span className="text-base font-semibold tracking-tight text-ink">Onway</span>
        </div>

        {/* Admin Section */}
        <div className="px-4">
          <p className="mb-2 px-2 text-[10px] font-semibold tracking-[0.12em] text-fog-dim uppercase">
            Administrator
          </p>

          <nav className="space-y-0.5">
            {NAV.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'sidebar-nav-item',
                    (isActive || (to === '/orders' && location.pathname.startsWith('/orders'))) &&
                      'active',
                  )
                }
              >
                <Icon className="size-[18px]" aria-hidden />
                <span className="flex-1">{label}</span>
                {badge != null && (
                  <span
                    className={cn(
                      'grid size-5 place-items-center rounded-md text-[10px] font-semibold',
                      'bg-white/10 text-white',
                    )}
                  >
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Workspace Section */}
        <div className="mt-6 px-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-fog-dim uppercase">
              Workspace
            </p>
            <button
              type="button"
              className="grid size-5 place-items-center rounded-md bg-accent/20 text-accent transition-colors hover:bg-accent/30"
            >
              <Plus className="size-3" />
            </button>
          </div>

          <ul className="space-y-0.5">
            {WORKSPACES.map((ws) => (
              <li key={ws.name}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
                    ws.active
                      ? 'bg-slate-raised text-ink'
                      : 'text-fog hover:bg-sidebar-hover hover:text-ink',
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: ws.color }}
                  />
                  <span className="flex-1 truncate">{ws.name}</span>
                  <MoreVertical className="size-3.5 text-fog-dim" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Items */}
        <div className="mt-auto border-t border-hairline px-4 py-4 space-y-0.5">
          <button
            type="button"
            className="sidebar-nav-item w-full"
          >
            <Settings className="size-[18px]" aria-hidden />
            <span className="flex-1">Settings</span>
          </button>
          <button
            type="button"
            onClick={signOut}
            className="sidebar-nav-item w-full"
          >
            <LogOut className="size-[18px]" aria-hidden />
            <span className="flex-1">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="main-content flex min-h-dvh flex-col">
        {/* Top Bar */}
        <header className="topbar sticky top-0 z-40">
          <div className="search-input">
            <Search className="size-4 text-fog-dim" />
            <input type="text" placeholder="Type anywhere to search" />
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Notification bell */}
            <button
              type="button"
              className="relative grid size-9 place-items-center rounded-lg transition-colors hover:bg-slate-raised"
            >
              <Bell className="size-[18px] text-fog" />
              <span className="absolute top-1 right-1.5 size-2 rounded-full bg-alert" />
            </button>

            {/* Profile */}
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl border border-hairline bg-slate-surface py-1.5 pr-3 pl-1.5 transition-colors hover:bg-slate-raised"
            >
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-violet font-mono text-[11px] font-semibold text-white"
              >
                {initials(staff?.name)}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-xs font-medium text-ink">
                  {staff?.name ?? 'User'}
                </span>
                <span className="block text-[10px] text-fog-dim">
                  {staff?.email ?? 'admin@onway.app'}
                </span>
              </span>
              <ChevronDown className="size-3.5 text-fog-dim" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-5">{children}</main>
      </div>
    </div>
  );
}
