import { Link, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, PackageSearch, Truck } from 'lucide-react';

import { Button } from './ui/button';
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
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-hairline bg-graphite/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            {/*
             * Blue into violet. The violet exists only here and on the sign-in
             * screen — it is one hue step from `in_transit` blue and measures
             * ΔE 1.1 under protanopia, so it is never allowed near a chart.
             */}
            <span
              className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-accent-hi to-violet font-mono text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(47,107,255,0.7)]"
              aria-hidden
            >
              O
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-sm font-semibold tracking-tight">Onway</span>
              <span className="font-mono text-[10px] tracking-widest text-fog-dim uppercase">
                Delivery control
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 rounded-full border border-hairline bg-graphite-deep/80 p-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3.5 sm:text-sm',
                    isActive || (to === '/orders' && location.pathname.startsWith('/orders'))
                      ? 'bg-accent text-white shadow-[0_4px_14px_-4px_rgba(47,107,255,0.8)]'
                      : 'text-fog hover:bg-slate-raised hover:text-ink',
                  )
                }
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2.5 rounded-full border border-hairline bg-slate-surface py-1 pr-3 pl-1 sm:flex">
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-accent to-violet font-mono text-[11px] font-semibold text-white"
              >
                {initials(staff?.name)}
              </span>
              <span className="text-right leading-tight">
                <span className="block text-xs font-medium text-ink">{staff?.name}</span>
                <span className="block font-mono text-[10px] text-fog-dim">{staff?.email}</span>
              </span>
            </span>
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t border-hairline px-4 py-4 sm:px-6">
        <p className="mx-auto max-w-7xl font-mono text-[11px] text-fog-dim">
          Onway Package Delivery Tracker · Hono v4 · Drizzle · PostgreSQL (Neon)
        </p>
      </footer>
    </div>
  );
}
