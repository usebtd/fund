import type { DebugEvent } from "./http/transport";

/** Authentication accepted by the transport. Confirm the scheme with the Fund backend before use. */
export type FundAuthentication =
  | { apiKey: string; accessToken?: never }
  | { accessToken: string; apiKey?: never };

/** Retry policy for safe and idempotent requests. */
export interface RetryOptions {
  /** Maximum number of retries after the initial request. Defaults to 2. */
  maxRetries?: number;
  /** Initial exponential-backoff delay in milliseconds. Defaults to 250. */
  baseDelayMs?: number;
  /** Maximum backoff delay in milliseconds. Defaults to 5,000. */
  maxDelayMs?: number;
}

/** Options used to construct a {@link Fund} client. */
export type FundOptions = FundAuthentication & {
  /** Absolute HTTPS API base URL. HTTP is allowed only for localhost development. */
  baseUrl: string;
  /** Fetch-compatible implementation. Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
  /** Default request timeout in milliseconds. Defaults to 30,000. */
  timeoutMs?: number;
  /** Additional non-sensitive headers sent with every request. */
  headers?: Readonly<Record<string, string>>;
  /** Retry policy. */
  retry?: RetryOptions;
  /** Receives redacted diagnostic events. No events are emitted when omitted. */
  debug?: (event: DebugEvent) => void;
};
