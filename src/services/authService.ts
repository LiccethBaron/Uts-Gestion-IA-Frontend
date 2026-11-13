import { apiClient } from './apiClient';
import { LoginCredentials, LoginResponse, User } from '../types/auth.types';

export const TOKEN_KEY = 'uts_auth_token';
export const USER_KEY = 'uts_auth_user';
export const AUTH_CHANGE_EVENT = 'uts-auth-change';

function notifyAuthChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

/**
 * Servicio de autenticación y sesión administrativa (CU05, CU06).
 */
export const authService = {
  /**
   * Inicia sesión con credenciales de administrador (CU05).
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

    if (response.success && response.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        notifyAuthChange();
      }
    }

    return response;
  },

  /**
   * Cierra sesión y purga tokens almacenados.
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      notifyAuthChange();
    }
  },

  /**
   * Obtiene el usuario autenticado desde el almacenamiento local.
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  /**
   * Verifica si existe un token de autenticación activo.
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
