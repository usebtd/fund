import { describe, expect, it, vi } from "vitest";
import {
  FetchTransport,
  FundApiError,
  FundAuthenticationError,
  FundConflictError,
  FundNotFoundError,
  FundRateLimitError,
  FundTimeoutError,
  FundValidationError,
} from "../src";

const json = (value: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });

describe("FetchTransport", () => {
  it("sends authentication, version, JSON, and idempotency headers", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("x-api-key")).toBe("secret");
      expect(headers.get("x-fund-sdk-version")).toBe("0.8.1");
      expect(headers.get("idempotency-key")).toBe("idem-1");
      expect(init?.body).toBe('{"name":"Acme"}');
      return json({ id: "1" });
    });
    const transport = new FetchTransport({
      apiKey: "secret",
      baseUrl: "https://usebtd.xyz/api",
      fetch: fetchMock,
    });
    await expect(
      transport.request("POST", "companies", {
        body: { name: "Acme" },
        idempotencyKey: "idem-1",
      }),
    ).resolves.toEqual({ id: "1" });
  });

  it("handles empty responses", async () => {
    const transport = new FetchTransport({
      accessToken: "token",
      baseUrl: "https://example.com/api",
      fetch: async () => new Response(null, { status: 204 }),
    });
    await expect(
      transport.request("DELETE", "object"),
    ).resolves.toBeUndefined();
  });

  it("rejects malformed JSON", async () => {
    const transport = new FetchTransport({
      apiKey: "key",
      baseUrl: "https://example.com",
      fetch: async () =>
        new Response("{", { headers: { "content-type": "application/json" } }),
    });
    await expect(transport.request("GET", "broken")).rejects.toThrow(
      "malformed JSON",
    );
  });

  it.each([
    [401, FundAuthenticationError],
    [400, FundValidationError],
    [404, FundNotFoundError],
    [409, FundConflictError],
    [429, FundRateLimitError],
    [500, FundApiError],
  ])("maps status %i", async (status, ErrorClass) => {
    const transport = new FetchTransport({
      apiKey: "key",
      baseUrl: "https://example.com",
      retry: { maxRetries: 0 },
      fetch: async () =>
        json({ error: { message: "no", code: "E_NO" } }, { status }),
    });
    const promise = transport.request("GET", "object");
    await expect(promise).rejects.toBeInstanceOf(ErrorClass);
    await expect(promise).rejects.toMatchObject({ status, code: "E_NO" });
  });

  it("retries safe requests up to the limit", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ message: "later" }, { status: 503 }))
      .mockResolvedValueOnce(json({ ok: true }));
    const transport = new FetchTransport({
      apiKey: "key",
      baseUrl: "https://example.com",
      fetch: fetchMock,
      retry: { maxRetries: 1, baseDelayMs: 0 },
    });
    await expect(transport.request("GET", "object")).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry unsafe mutations without an idempotency key", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(json({ message: "later" }, { status: 503 }));
    const transport = new FetchTransport({
      apiKey: "key",
      baseUrl: "https://example.com",
      fetch: fetchMock,
      retry: { maxRetries: 3, baseDelayMs: 0 },
    });
    await expect(
      transport.request("POST", "funding", { body: { confirm: true } }),
    ).rejects.toBeInstanceOf(FundApiError);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("respects Retry-After", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        json(
          {},
          {
            status: 429,
            headers: { "content-type": "application/json", "retry-after": "1" },
          },
        ),
      )
      .mockResolvedValueOnce(json({ ok: true }));
    const transport = new FetchTransport({
      apiKey: "key",
      baseUrl: "https://example.com",
      fetch: fetchMock,
      retry: { maxRetries: 1 },
    });
    const request = transport.request("GET", "object");
    await vi.advanceTimersByTimeAsync(999);
    expect(fetchMock).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    await expect(request).resolves.toEqual({ ok: true });
    vi.useRealTimers();
  });

  it("supports cancellation", async () => {
    const controller = new AbortController();
    const transport = new FetchTransport({
      apiKey: "key",
      baseUrl: "https://example.com",
      fetch: async (_input, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          ),
        ),
    });
    const request = transport.request("GET", "slow", {
      signal: controller.signal,
    });
    controller.abort(new Error("cancelled"));
    await expect(request).rejects.toThrow("cancelled");
  });

  it("turns deadline aborts into timeout errors", async () => {
    vi.useFakeTimers();
    const transport = new FetchTransport({
      apiKey: "key",
      baseUrl: "https://example.com",
      timeoutMs: 10,
      fetch: async (_input, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          ),
        ),
    });
    const request = transport.request("GET", "slow");
    const assertion = expect(request).rejects.toBeInstanceOf(FundTimeoutError);
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    vi.useRealTimers();
  });

  it("redacts debug credentials and blocks cross-origin paths", async () => {
    const events: unknown[] = [];
    const transport = new FetchTransport({
      apiKey: "top-secret",
      baseUrl: "https://example.com/api",
      debug: (event) => events.push(event),
      fetch: async () => json({ ok: true }),
    });
    await transport.request("GET", "object");
    expect(JSON.stringify(events)).not.toContain("top-secret");
    await expect(
      transport.request("GET", "https://evil.example/steal"),
    ).rejects.toThrow("relative");
  });
});
