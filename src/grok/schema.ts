export const diligenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          evidence: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                sourceId: { type: "string" },
                quote: { type: "string" },
              },
              required: ["sourceId", "quote"],
            },
          },
        },
        required: ["id", "title", "summary", "confidence", "evidence"],
      },
    },
    openQuestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          rationale: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          sourceIds: { type: "array", items: { type: "string" } },
        },
        required: ["id", "question", "rationale", "priority", "sourceIds"],
      },
    },
    memo: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        executiveSummary: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" },
      },
      required: [
        "title",
        "executiveSummary",
        "strengths",
        "risks",
        "recommendation",
      ],
    },
  },
  required: ["findings", "openQuestions", "memo"],
} as const;
