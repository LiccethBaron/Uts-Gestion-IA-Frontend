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

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

/**
 * Servicio de autenticación y sesión administrativa (CU05, CU06).
 */
export const authService = {
  /**
   * Inicia sesión con credenciales de administrador (CU05).
   * Soporta respuestas envueltas en `data: { token, user }` y respuestas planas.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

    const token = response.data?.token ?? response.token;
    const user = response.data?.user ?? response.user;

    if (response.success && token && user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        notifyAuthChange();
      }
      return {
        success: true,
        token,
        user,
        message: response.message,
      };
    }

    return {
      success: false,
      message: response.message || 'No se recibió el token de sesión del servidor.',
    };
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
