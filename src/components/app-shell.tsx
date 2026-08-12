import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogIn, LogOut, PackageSearch, Truck } from 'lucide-react';

import { Button } from './ui/button';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/use-auth';

const NAV = [
  { to: '/orders', label: 'Orders', icon: PackageSearch },
  { to: '/courier', label: 'Courier view', icon: Truck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { staff, isAuthenticated, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-hairline bg-graphite/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/orders" className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded bg-signal font-mono text-sm font-bold text-graphite">
              O
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-sm font-semibold tracking-tight">Onway</span>
              <span className="font-mono text-[10px] tracking-widest text-fog-dim uppercase">
                Delivery control
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
                    isActive || (to === '/orders' && location.pathname.startsWith('/orders'))
                      ? 'bg-slate-raised text-[#e6eaf0]'
                      : 'text-fog hover:bg-slate-raised/50 hover:text-[#e6eaf0]',
                  )
                }
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="hidden text-right sm:block">
                  <span className="block text-xs font-medium text-[#e6eaf0]">{staff?.name}</span>
                  <span className="block font-mono text-[10px] text-fog-dim">{staff?.email}</span>
                </span>
                <Button size="sm" variant="ghost" onClick={signOut}>
                  <LogOut className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-slate-raised px-3 text-xs font-medium transition-colors hover:border-fog-dim"
              >
                <LogIn className="size-3.5" aria-hidden />
                Staff sign in
              </Link>
            )}
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
