import { FUND_SDK_VERSION } from "../version";
import { GrokApiError, GrokResponseError, GrokTimeoutError } from "./errors";
import { createDiligenceInput } from "./prompt";
import { diligenceSchema } from "./schema";
import type {
  GrokDiligenceInput,
  GrokDiligenceResult,
  GrokEvidenceLink,
  GrokFinding,
  GrokMemo,
  GrokOpenQuestion,
  GrokOptions,
} from "./types";

interface XaiResponse {
  id?: unknown;
  model?: unknown;
  output?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function validateEvidence(value: unknown): value is GrokEvidenceLink[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        isRecord(item) &&
        isNonEmptyString(item.sourceId) &&
        isNonEmptyString(item.quote),
    )
  );
}

function validateFinding(value: unknown): value is GrokFinding {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.summary) &&
    ["high", "medium", "low"].includes(String(value.confidence)) &&
    validateEvidence(value.evidence)
  );
}

function validateQuestion(value: unknown): value is GrokOpenQuestion {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.question) &&
    isNonEmptyString(value.rationale) &&
    ["high", "medium", "low"].includes(String(value.priority)) &&
    stringArray(value.sourceIds)
  );
}

function validateMemo(value: unknown): value is GrokMemo {
  return (
    isRecord(value) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.executiveSummary) &&
    stringArray(value.strengths) &&
    stringArray(value.risks) &&
    isNonEmptyString(value.recommendation)
  );
}

function parseAnalysis(
  value: unknown,
): Omit<GrokDiligenceResult, "responseId" | "model"> {
  if (
    !isRecord(value) ||
    !Array.isArray(value.findings) ||
    !value.findings.every(validateFinding) ||
    !Array.isArray(value.openQuestions) ||
    !value.openQuestions.every(validateQuestion) ||
    !validateMemo(value.memo)
  ) {
    throw new GrokResponseError("Grok returned an invalid diligence result");
  }
  return {
    findings: value.findings,
    openQuestions: value.openQuestions,
    memo: value.memo,
  };
}

function extractOutputText(response: XaiResponse): string {
  if (!Array.isArray(response.output)) {
    throw new GrokResponseError("Grok response did not contain output items");
  }
  for (const item of response.output) {
    if (
      !isRecord(item) ||
      item.type !== "message" ||
      !Array.isArray(item.content)
    )
      continue;
    for (const content of item.content) {
      if (
        isRecord(content) &&
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        return content.text;
      }
    }
  }
  throw new GrokResponseError("Grok response did not contain output text");
}

function validateInput(input: GrokDiligenceInput): void {
  if (input.sources.length === 0)
    throw new TypeError("At least one evidence source is required");
  if (input.sources.length > 100)
    throw new RangeError("A maximum of 100 evidence sources is supported");
  const ids = new Set<string>();
  let totalCharacters = 0;
  for (const source of input.sources) {
    if (
      !isNonEmptyString(source.id) ||
      !isNonEmptyString(source.title) ||
      !isNonEmptyString(source.content)
    ) {
      throw new TypeError(
        "Every evidence source requires a non-empty id, title, and content",
      );
    }
    if (ids.has(source.id))
      throw new TypeError(`Duplicate evidence source id: ${source.id}`);
    ids.add(source.id);
    totalCharacters += source.content.length;
  }
  if (totalCharacters > 2_000_000)
    throw new RangeError(
      "Evidence content exceeds the 2,000,000 character limit",
    );
}

function validateBaseUrl(raw: string): URL {
  const url = new URL(raw.endsWith("/") ? raw : `${raw}/`);
  if (url.protocol !== "https:" || !/(^|\.)api\.x\.ai$/i.test(url.hostname)) {
    throw new TypeError("Grok baseUrl must be an HTTPS xAI API origin");
  }
  if (url.username !== "" || url.password !== "")
    throw new TypeError("Grok baseUrl must not contain credentials");
  return url;
}

function parseApiError(payload: unknown): {
  message: string;
  code?: string;
  details?: unknown;
} {
  if (!isRecord(payload)) return { message: "xAI request failed" };
  const nested = isRecord(payload.error) ? payload.error : undefined;
  const message = nested?.message ?? payload.message;
  const code = nested?.code ?? payload.code;
  const result: { message: string; code?: string; details?: unknown } = {
    message: typeof message === "string" ? message : "xAI request failed",
  };
  if (typeof code === "string") result.code = code;
  if (nested !== undefined) result.details = nested;
  return result;
}

/** Server-only Grok client for evidence-backed Fund diligence. */
export class Grok {
  readonly #apiKey: string;
  readonly #model: string;
  readonly #baseUrl: URL;
  readonly #fetch: typeof fetch;
  readonly #timeoutMs: number;
  readonly #headers: Headers;

  /** Creates a Grok diligence client. Keep the supplied API key server-side. */
  public constructor(options: GrokOptions) {
    if (!isNonEmptyString(options.apiKey))
      throw new TypeError("A non-empty xAI API key is required");
    this.#apiKey = options.apiKey;
    this.#model = options.model ?? "grok-4.7";
    this.#baseUrl = validateBaseUrl(options.baseUrl ?? "https://api.x.ai/v1");
    this.#fetch = options.fetch ?? globalThis.fetch;
    if (typeof this.#fetch !== "function")
      throw new TypeError("A Fetch API implementation is required");
    this.#timeoutMs = options.timeoutMs ?? 120_000;
    if (!Number.isFinite(this.#timeoutMs) || this.#timeoutMs <= 0)
      throw new RangeError("timeoutMs must be positive");
    this.#headers = new Headers(options.headers);
    if (this.#headers.has("authorization"))
      throw new TypeError("Authorization cannot be overridden");
  }

  /**
   * Analyzes supplied evidence into linked findings, unanswered questions, and a working memo.
   * The request is not stored by xAI and is never automatically retried.
   */
  public async analyzeDiligence(
    input: GrokDiligenceInput,
  ): Promise<GrokDiligenceResult> {
    validateInput(input);
    const timeoutMs = input.timeoutMs ?? this.#timeoutMs;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
      throw new RangeError("timeoutMs must be positive");
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    const signal =
      input.signal === undefined
        ? controller.signal
        : AbortSignal.any([input.signal, controller.signal]);
    const headers = new Headers(this.#headers);
    headers.set("authorization", `Bearer ${this.#apiKey}`);
    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");
    headers.set("x-fund-sdk-version", FUND_SDK_VERSION);

    try {
      const response = await this.#fetch(new URL("responses", this.#baseUrl), {
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          model: this.#model,
          store: false,
          input: createDiligenceInput(input),
          text: {
            format: {
              type: "json_schema",
              name: "fund_diligence",
              strict: true,
              schema: diligenceSchema,
            },
          },
        }),
      });
      const text = await response.text();
      let payload: unknown;
      try {
        payload = text === "" ? undefined : (JSON.parse(text) as unknown);
      } catch (cause) {
        throw new GrokResponseError("xAI returned malformed JSON", { cause });
      }
      if (!response.ok) {
        const parsed = parseApiError(payload);
        const requestId = response.headers.get("x-request-id") ?? undefined;
        throw new GrokApiError(parsed.message, {
          status: response.status,
          ...(parsed.code === undefined ? {} : { code: parsed.code }),
          ...(requestId === undefined ? {} : { requestId }),
          ...(parsed.details === undefined ? {} : { details: parsed.details }),
        });
      }
      if (!isRecord(payload))
        throw new GrokResponseError("xAI returned an empty response");
      const responseId = payload.id;
      const model = payload.model;
      if (!isNonEmptyString(responseId) || !isNonEmptyString(model)) {
        throw new GrokResponseError("xAI response metadata is missing");
      }
      let parsedOutput: unknown;
      try {
        parsedOutput = JSON.parse(extractOutputText(payload)) as unknown;
      } catch (cause) {
        if (cause instanceof GrokResponseError) throw cause;
        throw new GrokResponseError("Grok output was not valid JSON", {
          cause,
        });
      }
      const analysis = parseAnalysis(parsedOutput);
      const sourceIds = new Set(input.sources.map((source) => source.id));
      for (const finding of analysis.findings) {
        if (finding.evidence.some((link) => !sourceIds.has(link.sourceId))) {
          throw new GrokResponseError("Grok cited an unknown evidence source");
        }
      }
      for (const question of analysis.openQuestions) {
        if (question.sourceIds.some((sourceId) => !sourceIds.has(sourceId))) {
          throw new GrokResponseError(
            "Grok referenced an unknown evidence source",
          );
        }
      }
      return { responseId, model, ...analysis };
    } catch (cause) {
      if (controller.signal.aborted && !input.signal?.aborted) {
        throw new GrokTimeoutError(timeoutMs, { cause });
      }
      if (input.signal?.aborted) throw input.signal.reason;
      throw cause;
    } finally {
      clearTimeout(timeout);
    }
  }
}
