import { NavLink, useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Search,
  Settings,
  Truck,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/use-auth';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: PackageSearch },
  { to: '/courier', label: 'Courier', icon: Truck },
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
            {NAV.map(({ to, label, icon: Icon }) => (
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
              </NavLink>
            ))}
          </nav>
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
