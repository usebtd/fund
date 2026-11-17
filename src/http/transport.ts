import type { FundOptions, RetryOptions } from "../config";
import {
  FundApiError,
  FundAuthenticationError,
  FundConflictError,
  FundNotFoundError,
  FundRateLimitError,
  FundTimeoutError,
  FundValidationError,
  type FundApiErrorOptions,
  type ValidationIssue,
} from "../errors";
import { FUND_SDK_VERSION } from "../version";
import { redactHeaders } from "./headers";

/** A safe diagnostic event emitted by the HTTP transport. */
export interface DebugEvent {
  /** Event phase. */
  phase: "request" | "response" | "retry";
  /** HTTP method. */
  method: string;
  /** Request URL. */
  url: string;
  /** Redacted request headers. */
  headers?: Readonly<Record<string, string>>;
  /** Response status. */
  status?: number;
  /** Zero-based request attempt. */
  attempt: number;
}

/** Per-request controls used by resource implementations. */
export interface RequestOptions {
  /** Request body, serialized as JSON unless it is already a BodyInit. */
  body?: unknown;
  /** Cancels the request. */
  signal?: AbortSignal;
  /** Overrides the client timeout. */
  timeoutMs?: number;
  /** Additional headers. */
  headers?: Readonly<Record<string, string>>;
  /** Idempotency key for a mutation the backend guarantees is idempotent. */
  idempotencyKey?: string;
}

interface ErrorShape {
  message?: string;
  error?:
    | string
    | {
        message?: string;
        code?: string;
        details?: unknown;
        issues?: ValidationIssue[];
      };
  code?: string;
  details?: unknown;
  issues?: ValidationIssue[];
}

const BODY_TYPES = ["string", "object"];
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function parseRetryAfter(
  value: string | null,
  now = Date.now(),
): number | undefined {
  if (value === null) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0)
    return Math.round(seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    (typeof ReadableStream !== "undefined" && value instanceof ReadableStream)
  );
}

function errorShape(value: unknown): ErrorShape {
  return typeof value === "object" && value !== null
    ? (value as ErrorShape)
    : {};
}

function createApiError(response: Response, payload: unknown): FundApiError {
  const shape = errorShape(payload);
  const nested = typeof shape.error === "object" ? shape.error : undefined;
  const message =
    nested?.message ??
    shape.message ??
    (typeof shape.error === "string" ? shape.error : undefined) ??
    `Request failed with status ${String(response.status)}`;
  const options: FundApiErrorOptions = { status: response.status };
  const code = nested?.code ?? shape.code;
  const requestId = response.headers.get("x-request-id") ?? undefined;
  const details = nested?.details ?? shape.details;
  const issues = nested?.issues ?? shape.issues;
  const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
  if (code !== undefined) options.code = code;
  if (requestId !== undefined) options.requestId = requestId;
  if (details !== undefined) options.details = details;
  if (issues !== undefined) options.issues = issues;
  if (retryAfterMs !== undefined) options.retryAfterMs = retryAfterMs;
  if (response.status === 401 || response.status === 403)
    return new FundAuthenticationError(message, options);
  if (response.status === 400 || response.status === 422)
    return new FundValidationError(message, options);
  if (response.status === 404) return new FundNotFoundError(message, options);
  if (response.status === 409) return new FundConflictError(message, options);
  if (response.status === 429) return new FundRateLimitError(message, options);
  return new FundApiError(message, options);
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined;
  const text = await response.text();
  if (text.trim() === "") return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) return text;
  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    const options: FundApiErrorOptions = {
      status: response.status,
      details: { contentType },
      cause,
    };
    const requestId = response.headers.get("x-request-id");
    if (requestId !== null) options.requestId = requestId;
    throw new FundApiError("The API returned malformed JSON", options);
  }
}

function validateBaseUrl(raw: string): URL {
  const url = new URL(raw.endsWith("/") ? raw : `${raw}/`);
  const local =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new TypeError(
      "baseUrl must use HTTPS (HTTP is allowed only for localhost)",
    );
  }
  if (url.username !== "" || url.password !== "")
    throw new TypeError("baseUrl must not contain credentials");
  return url;
}

/** Internal, shared Fetch transport. It is exported for advanced adapters and testing. */
export class FetchTransport {
  readonly #baseUrl: URL;
  readonly #fetch: typeof fetch;
  readonly #timeoutMs: number;
  readonly #headers: Headers;
  readonly #retry: Required<RetryOptions>;
  readonly #debug: ((event: DebugEvent) => void) | undefined;

  public constructor(options: FundOptions) {
    this.#baseUrl = validateBaseUrl(options.baseUrl);
    this.#fetch = options.fetch ?? globalThis.fetch;
    if (typeof this.#fetch !== "function")
      throw new TypeError("A Fetch API implementation is required");
    this.#timeoutMs = options.timeoutMs ?? 30_000;
    if (!Number.isFinite(this.#timeoutMs) || this.#timeoutMs <= 0)
      throw new RangeError("timeoutMs must be positive");
    this.#headers = new Headers(options.headers);
    if (this.#headers.has("authorization") || this.#headers.has("x-api-key"))
      throw new TypeError(
        "Pass credentials with apiKey or accessToken, not custom headers",
      );
    this.#headers.set("accept", "application/json");
    this.#headers.set("x-fund-sdk-version", FUND_SDK_VERSION);
    if (options.apiKey !== undefined)
      this.#headers.set("x-api-key", options.apiKey);
    else this.#headers.set("authorization", `Bearer ${options.accessToken}`);
    this.#retry = {
      maxRetries: options.retry?.maxRetries ?? 2,
      baseDelayMs: options.retry?.baseDelayMs ?? 250,
      maxDelayMs: options.retry?.maxDelayMs ?? 5_000,
    };
    this.#debug = options.debug;
  }

  /** Sends a request relative to the configured API origin. */
  public async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("//"))
      throw new TypeError("Request paths must be relative to baseUrl");
    const normalizedMethod = method.toUpperCase();
    const url = new URL(path.replace(/^\//, ""), this.#baseUrl);
    if (url.origin !== this.#baseUrl.origin)
      throw new TypeError(
        "Credential forwarding to another origin is forbidden",
      );
    const headers = new Headers(this.#headers);
    for (const [key, value] of Object.entries(options.headers ?? {}))
      headers.set(key, value);
    if (options.idempotencyKey !== undefined)
      headers.set("idempotency-key", options.idempotencyKey);
    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      body = isBodyInit(options.body)
        ? options.body
        : JSON.stringify(options.body);
      if (
        !headers.has("content-type") &&
        BODY_TYPES.includes(typeof options.body)
      )
        headers.set("content-type", "application/json");
    }
    const canRetry =
      SAFE_METHODS.has(normalizedMethod) ||
      options.idempotencyKey !== undefined;
    for (let attempt = 0; ; attempt += 1) {
      const timeoutMs = options.timeoutMs ?? this.#timeoutMs;
      const timeoutController = new AbortController();
      const timeout = setTimeout(() => {
        timeoutController.abort();
      }, timeoutMs);
      const signal =
        options.signal === undefined
          ? timeoutController.signal
          : AbortSignal.any([options.signal, timeoutController.signal]);
      this.#debug?.({
        phase: "request",
        method: normalizedMethod,
        url: url.toString(),
        headers: redactHeaders(headers),
        attempt,
      });
      try {
        const requestInit: RequestInit = {
          method: normalizedMethod,
          headers,
          signal,
        };
        if (body !== undefined) requestInit.body = body;
        const response = await this.#fetch(url, requestInit);
        this.#debug?.({
          phase: "response",
          method: normalizedMethod,
          url: url.toString(),
          status: response.status,
          attempt,
        });
        const payload = await parseResponse(response);
        if (response.ok) return payload as T;
        const error = createApiError(response, payload);
        if (
          !canRetry ||
          !RETRYABLE_STATUS.has(response.status) ||
          attempt >= this.#retry.maxRetries
        )
          throw error;
        const retryAfter = error.retryAfterMs;
        const exponential = Math.min(
          this.#retry.maxDelayMs,
          this.#retry.baseDelayMs * 2 ** attempt,
        );
        const delay = retryAfter ?? Math.random() * exponential;
        this.#debug?.({
          phase: "retry",
          method: normalizedMethod,
          url: url.toString(),
          status: response.status,
          attempt,
        });
        await new Promise<void>((resolve) => {
          setTimeout(resolve, delay);
        });
      } catch (cause) {
        if (timeoutController.signal.aborted && !options.signal?.aborted)
          throw new FundTimeoutError(timeoutMs, { cause });
        throw cause;
      } finally {
        clearTimeout(timeout);
      }
    }
  }
}

export { parseRetryAfter };
