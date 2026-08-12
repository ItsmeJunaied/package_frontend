import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getToken, setToken, UNAUTHORIZED_EVENT } from '@/api/client';
import type { Session } from '@/api/queries';

type StaffProfile = Session['staff'];

interface AuthContextValue {
  staff: StaffProfile | null;
  isAuthenticated: boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_KEY = 'onway.staff.profile';
const EXPIRY_KEY = 'onway.staff.expiresAt';

function readStoredProfile(): StaffProfile | null {
  try {
    const expiresAt = localStorage.getItem(EXPIRY_KEY);
    // Don't restore a session the server would reject anyway.
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return null;

    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw || !getToken()) return null;
    return JSON.parse(raw) as StaffProfile;
  } catch {
    return null;
  }
}

/**
 * Session state (DESIGN.md §11). Every `/orders` route on the API requires a
 * token, so this is the gate for the whole console, not just for advancing a
 * status — `RequireAuth` reads `isAuthenticated` and nothing renders without it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffProfile | null>(readStoredProfile);

  const signIn = useCallback((session: Session) => {
    setToken(session.token);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(session.staff));
      localStorage.setItem(EXPIRY_KEY, session.expiresAt);
    } catch {
      /* session just won't survive a reload */
    }
    setStaff(session.staff);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    } catch {
      /* nothing to clean up */
    }
    setStaff(null);
  }, []);

  /* A token the server refuses is not a session. Drop it the moment we find out
     rather than leaving the user staring at 401s on every panel. */
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, signOut);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, signOut);
  }, [signOut]);

  const value = useMemo(
    () => ({ staff, isAuthenticated: staff !== null, signIn, signOut }),
    [staff, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
