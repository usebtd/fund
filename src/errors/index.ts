/** A field-level validation issue returned by the API. */
export interface ValidationIssue {
  /** Field or object path. */
  path?: string;
  /** Human-readable issue description. */
  message: string;
  /** Stable issue code, when supplied by the API. */
  code?: string;
}

/** Base error for all SDK failures. */
export class FundError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** Metadata available on an HTTP API error. */
export interface FundApiErrorOptions extends ErrorOptions {
  status: number;
  code?: string;
  requestId?: string;
  details?: unknown;
  issues?: readonly ValidationIssue[];
  retryAfterMs?: number;
}

/** An error response received from the Fund API. */
export class FundApiError extends FundError {
  public readonly status: number;
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly details?: unknown;
  public readonly issues?: readonly ValidationIssue[];
  public readonly retryAfterMs?: number;

  public constructor(message: string, options: FundApiErrorOptions) {
    super(message, options);
    this.status = options.status;
    if (options.code !== undefined) this.code = options.code;
    if (options.requestId !== undefined) this.requestId = options.requestId;
    if (options.details !== undefined) this.details = options.details;
    if (options.issues !== undefined) this.issues = options.issues;
    if (options.retryAfterMs !== undefined)
      this.retryAfterMs = options.retryAfterMs;
  }
}

/** Authentication or authorization failed. */
export class FundAuthenticationError extends FundApiError {}
/** Input validation failed. */
export class FundValidationError extends FundApiError {}
/** The requested object does not exist. */
export class FundNotFoundError extends FundApiError {}
/** The request conflicts with current server state. */
export class FundConflictError extends FundApiError {}
/** The API rate limit was exceeded. */
export class FundRateLimitError extends FundApiError {}
/** A request exceeded its configured deadline. */
export class FundTimeoutError extends FundError {
  /** Timeout duration in milliseconds. */
  public readonly timeoutMs: number;
  public constructor(timeoutMs: number, options?: ErrorOptions) {
    super(`Request timed out after ${String(timeoutMs)}ms`, options);
    this.timeoutMs = timeoutMs;
  }
}
