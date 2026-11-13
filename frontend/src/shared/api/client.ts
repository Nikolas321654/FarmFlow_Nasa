import { env } from '@/shared/config/env';
import { ApiError, type ApiErrorKind, type ApiProblemDetails } from './ApiError';

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  json?: unknown;
};

type CsrfTokenResponse = {
  headerName: string;
  token: string;
};

const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function apiUrl(path: string): string {
  return `${env.apiBaseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function errorKind(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status >= 500) return 'server';
  return 'http';
}

function problemDetails(value: unknown): ApiProblemDetails | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as ApiProblemDetails;
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function fetchResponse(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError('network', null, 'Unable to reach the server.', undefined, error);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError('network', null, 'Unable to read the server response.', undefined, error);
  }

  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new ApiError(
          'invalid-response',
          response.status,
          'The server returned invalid JSON.',
        );
      }
    }
  }

  if (!response.ok) {
    const problem = problemDetails(data);
    const message =
      (typeof problem?.detail === 'string' && problem.detail) ||
      (typeof problem?.title === 'string' && problem.title) ||
      response.statusText ||
      `Request failed with status ${response.status}.`;
    throw new ApiError(errorKind(response.status), response.status, message, data);
  }

  if (response.status === 204 || response.status === 205) return undefined as T;
  if (data === undefined) {
    throw new ApiError(
      'invalid-response',
      response.status,
      'The server returned an empty response.',
    );
  }
  return data as T;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, ...requestOptions } = options;
  const method = (requestOptions.method ?? 'GET').toUpperCase();
  const headers = new Headers(requestOptions.headers);
  headers.set('Accept', 'application/json');

  if (json !== undefined) headers.set('Content-Type', 'application/json');

  if (stateChangingMethods.has(method)) {
    const csrf = await apiRequest<CsrfTokenResponse>('/auth/csrf', {
      signal: requestOptions.signal,
    });
    if (!csrf || !csrf.headerName || !csrf.token) {
      throw new ApiError('invalid-response', 200, 'The server returned an invalid CSRF token.');
    }
    headers.set(csrf.headerName, csrf.token);
  }

  const response = await fetchResponse(apiUrl(path), {
    ...requestOptions,
    method,
    credentials: 'include',
    headers,
    body: json === undefined ? undefined : JSON.stringify(json),
  });
  return parseResponse<T>(response);
}
