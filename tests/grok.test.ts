import { describe, expect, it, vi } from "vitest";
import {
  Grok,
  GrokApiError,
  GrokResponseError,
  GrokTimeoutError,
  type GrokDiligenceInput,
} from "../src";

const input: GrokDiligenceInput = {
  companyName: "Acme",
  sources: [
    {
      id: "deck",
      title: "Pitch deck",
      kind: "pitch_deck",
      content: "Acme reports $1m ARR.",
    },
  ],
};

const analysis = {
  findings: [
    {
      id: "finding-1",
      title: "Reported revenue",
      summary: "The deck reports one million dollars in ARR.",
      confidence: "medium",
      evidence: [{ sourceId: "deck", quote: "Acme reports $1m ARR." }],
    },
  ],
  openQuestions: [
    {
      id: "question-1",
      question: "Can the ARR be reconciled?",
      rationale: "Only the pitch deck supports the claim.",
      priority: "high",
      sourceIds: ["deck"],
    },
  ],
  memo: {
    title: "Acme working memo",
    executiveSummary: "Revenue is reported but unverified.",
    strengths: ["Reported traction"],
    risks: ["No financial reconciliation"],
    recommendation: "Request financial statements.",
  },
};

function response(output: unknown = analysis): Response {
  return new Response(
    JSON.stringify({
      id: "resp_123",
      model: "grok-4.7",
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify(output) }],
        },
      ],
    }),
    { headers: { "content-type": "application/json" } },
  );
}

describe("Grok", () => {
  it("creates a private structured diligence request", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (request, init) => {
      expect(request).toBeInstanceOf(URL);
      expect((request as URL).toString()).toBe("https://api.x.ai/v1/responses");
      const headers = new Headers(init?.headers);
      expect(headers.get("authorization")).toBe("Bearer xai-secret");
      expect(headers.get("x-fund-sdk-version")).toBe("0.8.13");
      if (typeof init?.body !== "string")
        throw new Error("Expected a JSON request body");
      const body = JSON.parse(init.body) as Record<string, unknown>;
      expect(body).toMatchObject({ model: "grok-4.7", store: false });
      expect(body.text).toMatchObject({
        format: { type: "json_schema", name: "fund_diligence", strict: true },
      });
      expect(String(body.input)).not.toContain("xai-secret");
      return response();
    });
    const grok = new Grok({ apiKey: "xai-secret", fetch: fetchMock });
    await expect(grok.analyzeDiligence(input)).resolves.toEqual({
      responseId: "resp_123",
      model: "grok-4.7",
      ...analysis,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("does not retry failed paid inference requests", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({ error: { message: "busy", code: "overloaded" } }),
          {
            status: 503,
            headers: { "x-request-id": "req_1" },
          },
        ),
    );
    const grok = new Grok({ apiKey: "key", fetch: fetchMock });
    await expect(grok.analyzeDiligence(input)).rejects.toMatchObject({
      name: "GrokApiError",
      status: 503,
      code: "overloaded",
      requestId: "req_1",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects hallucinated source identifiers", async () => {
    const bad = structuredClone(analysis);
    const finding = bad.findings.at(0);
    const evidence = finding?.evidence.at(0);
    if (evidence === undefined)
      throw new Error("Test fixture is missing evidence");
    evidence.sourceId = "unknown";
    const grok = new Grok({ apiKey: "key", fetch: async () => response(bad) });
    await expect(grok.analyzeDiligence(input)).rejects.toThrow(
      "unknown evidence source",
    );
  });

  it("rejects malformed and structurally invalid outputs", async () => {
    const malformed = new Response(
      JSON.stringify({
        id: "resp_1",
        model: "grok-4.7",
        output: [
          { type: "message", content: [{ type: "output_text", text: "{" }] },
        ],
      }),
    );
    const malformedClient = new Grok({
      apiKey: "key",
      fetch: async () => malformed,
    });
    await expect(malformedClient.analyzeDiligence(input)).rejects.toThrow(
      "not valid JSON",
    );

    const invalidClient = new Grok({
      apiKey: "key",
      fetch: async () => response({ findings: [] }),
    });
    await expect(invalidClient.analyzeDiligence(input)).rejects.toBeInstanceOf(
      GrokResponseError,
    );
  });

  it("validates sources before sending", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const grok = new Grok({ apiKey: "key", fetch: fetchMock });
    const source = input.sources.at(0);
    if (source === undefined)
      throw new Error("Test fixture is missing a source");
    await expect(grok.analyzeDiligence({ sources: [] })).rejects.toThrow(
      "At least one",
    );
    await expect(
      grok.analyzeDiligence({
        sources: [source, source],
      }),
    ).rejects.toThrow("Duplicate");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("restricts custom base URLs to xAI API origins", () => {
    expect(
      () => new Grok({ apiKey: "key", baseUrl: "https://evil.example/v1" }),
    ).toThrow("xAI API origin");
    expect(
      () => new Grok({ apiKey: "key", headers: { Authorization: "secret" } }),
    ).toThrow("cannot be overridden");
  });

  it("maps timeout and preserves caller cancellation", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<typeof fetch>(
      async (_request, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    const grok = new Grok({ apiKey: "key", fetch: fetchMock, timeoutMs: 10 });
    const pending = grok.analyzeDiligence(input);
    const timeoutAssertion =
      expect(pending).rejects.toBeInstanceOf(GrokTimeoutError);
    await vi.advanceTimersByTimeAsync(10);
    await timeoutAssertion;
    vi.useRealTimers();

    const controller = new AbortController();
    const cancelled = grok.analyzeDiligence({
      ...input,
      signal: controller.signal,
    });
    controller.abort(new Error("cancelled by caller"));
    await expect(cancelled).rejects.toThrow("cancelled by caller");
  });

  it("exports provider-specific API errors", () => {
    expect(new GrokApiError("failed", { status: 500 })).toBeInstanceOf(Error);
  });
});
