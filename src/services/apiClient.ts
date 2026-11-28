import { env } from '../config/env';

/**
 * Cliente HTTP desacoplado para la API REST del backend UTS.
 * Manejo centralizado de tokens JWT, headers institucionales, FormData y excepciones.
 */

export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

type MutationRequestOptions = Omit<RequestOptions, 'method' | 'body'>;
type GetRequestOptions = Omit<RequestOptions, 'method' | 'params' | 'body'>;

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('uts_auth_token');
  }

  private serializeBody(body?: unknown): BodyInit | undefined {
    if (body === undefined || body === null) return undefined;
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      return body;
    }
    return JSON.stringify(body);
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, timeoutMs, ...restOptions } = options;

    let url = `${env.API_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const token = this.getAuthToken();
    const isFormData =
      typeof FormData !== 'undefined' && restOptions.body instanceof FormData;

    const defaultHeaders: Record<string, string> = {
      Accept: 'application/json',
      // Para FormData el navegador asigna multipart/form-data junto con su boundary
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...restOptions,
        signal: restOptions.signal ?? AbortSignal.timeout(timeoutMs ?? env.API_TIMEOUT_MS),
        headers: {
          ...defaultHeaders,
          ...(headers as Record<string, string>),
        },
      });

      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
        let details: unknown = null;

        try {
          const errorJson = await response.json();
          errorMessage = errorJson.message || errorJson.error || errorMessage;
          details = errorJson;
        } catch {
          // No es JSON, usar mensaje estándar
        }

        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('uts_auth_token');
          localStorage.removeItem('uts_auth_user');
          window.dispatchEvent(new Event('uts-auth-change'));
        }

        throw new ApiError(errorMessage, response.status, details);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (
        error instanceof DOMException &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new ApiError('Tiempo de espera agotado al conectar con el servidor', 408);
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Error de conexión con el servidor',
        0
      );
    }
  }

  public get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    options?: GetRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
    options?: MutationRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: this.serializeBody(body),
    });
  }

  public put<T>(
    endpoint: string,
    body?: unknown,
    options?: MutationRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: this.serializeBody(body),
    });
  }

  public patch<T>(
    endpoint: string,
    body?: unknown,
    options?: MutationRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: this.serializeBody(body),
    });
  }

  public delete<T>(endpoint: string, options?: MutationRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
