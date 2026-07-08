import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../lib/services';
import type { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_CHECK_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkSession = () => {
    let isMounted = true;
    setLoading(true);
    setAuthError(null);

    withTimeout(
      authService.getCurrentUser(),
      SESSION_CHECK_TIMEOUT_MS,
      'This is taking longer than expected. Check your connection and try again.',
    )
      .then((currentUser) => {
        if (!isMounted) return;
        setUser(currentUser);
      })
      .catch((error) => {
        if (!isMounted) return;
        // A stalled network request or a failed profile fetch is a
        // connectivity problem, not proof the session is gone. Surface it
        // as a retry-able error instead of silently dropping to the login
        // screen - that's what was sending people with an active session
        // back to login on a bad connection.
        setAuthError(
          error instanceof Error
            ? error.message
            : 'Failed to check your session. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    const cleanup = checkSession();

    // Keep in sync with token refreshes / sign-outs from elsewhere (e.g. another tab).
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event) => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // Same principle: don't let a transient fetch failure during a
        // background token refresh silently clear a valid session.
        console.error('Auth state sync failed:', error);
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    });

    return () => {
      cleanup();
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = async (phone: string, password: string): Promise<boolean> => {
    const loggedInUser = await authService.loginWithPhone(phone, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  if (loading || authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <div className="flex flex-col items-center gap-3">
          <span className="text-2xl font-semibold tracking-tight text-foreground">SmartQuote</span>
          {loading && (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          )}
        </div>
        {authError && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="max-w-xs text-sm text-muted-foreground">{authError}</p>
            <button
              onClick={checkSession}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}