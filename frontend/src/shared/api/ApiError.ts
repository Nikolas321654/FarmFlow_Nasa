export type ApiErrorKind =
  'unauthorized' | 'forbidden' | 'not-found' | 'server' | 'http' | 'network' | 'invalid-response';

export type ApiProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    public readonly status: number | null,
    message: string,
    public readonly details?: unknown,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = 'ApiError';
  }
}
