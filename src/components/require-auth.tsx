import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/use-auth';

/**
 * The client-side half of the gate.
 *
 * The real enforcement is the `requireStaff` middleware on the API — this
 * component cannot keep anyone out of data they could fetch with curl, and it
 * is not pretending to. What it does is stop the console from rendering panels
 * that are guaranteed to 401, and remember where the user was headed so they
 * land there after signing in instead of on a generic home page.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <>{children}</>;
}
