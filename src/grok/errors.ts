import { FundError } from "../errors";

/** Base error for Grok integration failures. */
export class GrokError extends FundError {}

/** Error returned by the xAI API. */
export class GrokApiError extends GrokError {
  /** HTTP response status. */
  public readonly status: number;
  /** Stable provider error code, when available. */
  public readonly code?: string;
  /** Provider request identifier, when available. */
  public readonly requestId?: string;
  /** Sanitized provider error details. */
  public readonly details?: unknown;

  public constructor(
    message: string,
    options: ErrorOptions & {
      status: number;
      code?: string;
      requestId?: string;
      details?: unknown;
    },
  ) {
    super(message, options);
    this.status = options.status;
    if (options.code !== undefined) this.code = options.code;
    if (options.requestId !== undefined) this.requestId = options.requestId;
    if (options.details !== undefined) this.details = options.details;
  }
}

/** Grok returned a response that could not be safely interpreted. */
export class GrokResponseError extends GrokError {}

/** A Grok inference request exceeded its configured deadline. */
export class GrokTimeoutError extends GrokError {
  /** Timeout duration in milliseconds. */
  public readonly timeoutMs: number;

  public constructor(timeoutMs: number, options?: ErrorOptions) {
    super(`Grok request timed out after ${String(timeoutMs)}ms`, options);
    this.timeoutMs = timeoutMs;
  }
}
