'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  authService,
  AUTH_CHANGE_EVENT,
  TOKEN_KEY,
  USER_KEY,
} from '../services/authService';
import { User, LoginCredentials } from '../types/auth.types';

interface AuthSnapshot {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const SERVER_SNAPSHOT: AuthSnapshot = {
  user: null,
  isAuthenticated: false,
  isHydrated: false,
};

let cachedRawToken: string | null = null;
let cachedRawUser: string | null = null;
let cachedSnapshot: AuthSnapshot | null = null;

function getAuthSnapshot(): AuthSnapshot {
  const rawToken = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);

  if (
    cachedSnapshot !== null &&
    rawToken === cachedRawToken &&
    rawUser === cachedRawUser
  ) {
    return cachedSnapshot;
  }

  cachedRawToken = rawToken;
  cachedRawUser = rawUser;

  let parsedUser: User | null = null;
  if (rawUser) {
    try {
      parsedUser = JSON.parse(rawUser) as User;
    } catch {
      parsedUser = null;
    }
  }

  cachedSnapshot = {
    user: parsedUser,
    isAuthenticated: Boolean(rawToken),
    isHydrated: true,
  };

  return cachedSnapshot;
}

function getServerAuthSnapshot(): AuthSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribeAuth(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}

export function useAuth() {
  const router = useRouter();
  const snapshot = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        return true;
      }
      setAuthError(response.message || 'Credenciales inválidas');
      return false;
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Error durante el inicio de sesión'
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    router.push('/login');
  }, [router]);

  const isAdmin = snapshot.user?.rol === 'ADMINISTRADOR';
  const isSubAdmin = snapshot.user?.rol === 'SUBADMINISTRADOR';

  return {
    user: snapshot.user,
    isAuthenticated: snapshot.isAuthenticated,
    isLoading: !snapshot.isHydrated || isSubmitting,
    authError,
    login,
    logout,
    isAdmin,
    isSubAdmin,
  };
}
