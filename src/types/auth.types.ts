/**
 * Tipos de datos para el subsistema de Autenticación y RBAC (CU05, CU06).
 */

export type RoleName = 'ADMINISTRADOR' | 'SUBADMINISTRADOR';

export interface User {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: RoleName;
  estadoActivo?: boolean;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginPayload {
  token: string;
  user: User;
}

export interface LoginResponse {
  success: boolean;
  data?: LoginPayload;
  token?: string;
  user?: User;
  message?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
