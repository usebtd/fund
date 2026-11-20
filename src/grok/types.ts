/** Supported evidence categories for Grok diligence. */
export type GrokEvidenceKind =
  | "pitch_deck"
  | "financials"
  | "customer_evidence"
  | "founder_context"
  | "legal"
  | "other";

/** A text source supplied to a Grok diligence analysis. */
export interface GrokEvidenceSource {
  /** Stable caller-defined identifier used by findings and questions. */
  id: string;
  /** Human-readable source title. */
  title: string;
  /** Evidence category. */
  kind: GrokEvidenceKind;
  /** Plain-text source content. */
  content: string;
  /** Optional ISO 8601 date associated with the source. */
  date?: string;
}

/** Input for evidence-backed startup diligence. */
export interface GrokDiligenceInput {
  /** Sources Grok must use as its exclusive evidence set. */
  sources: readonly GrokEvidenceSource[];
  /** Startup or company name, when known. */
  companyName?: string;
  /** Optional investment thesis or review focus. */
  focus?: string;
  /** Optional caller cancellation signal. */
  signal?: AbortSignal;
  /** Optional request timeout override in milliseconds. */
  timeoutMs?: number;
}

/** Confidence assigned to a source-linked finding. */
export type GrokFindingConfidence = "high" | "medium" | "low";

/** Priority assigned to an unanswered diligence question. */
export type GrokQuestionPriority = "high" | "medium" | "low";

/** A precise link from a finding back to supplied evidence. */
export interface GrokEvidenceLink {
  /** Identifier of a supplied source. */
  sourceId: string;
  /** Short verbatim excerpt supporting the finding. */
  quote: string;
}

/** A diligence finding supported by one or more source excerpts. */
export interface GrokFinding {
  /** Stable identifier within this analysis. */
  id: string;
  /** Concise finding title. */
  title: string;
  /** Evidence-grounded explanation. */
  summary: string;
  /** Model-assigned confidence based on the available evidence. */
  confidence: GrokFindingConfidence;
  /** Supporting source links. */
  evidence: readonly GrokEvidenceLink[];
}

/** An important question that the supplied evidence does not resolve. */
export interface GrokOpenQuestion {
  /** Stable identifier within this analysis. */
  id: string;
  /** Question an investor should ask next. */
  question: string;
  /** Why the answer matters to the investment decision. */
  rationale: string;
  /** Review priority. */
  priority: GrokQuestionPriority;
  /** Sources that created or contextualized the question. */
  sourceIds: readonly string[];
}

/** Structured working memo generated from the evidence. */
export interface GrokMemo {
  /** Memo title. */
  title: string;
  /** Short decision-oriented overview. */
  executiveSummary: string;
  /** Evidence-supported strengths. */
  strengths: readonly string[];
  /** Material risks or uncertainties. */
  risks: readonly string[];
  /** Provisional next-step recommendation. */
  recommendation: string;
}

/** Complete evidence-backed diligence result. */
export interface GrokDiligenceResult {
  /** xAI response identifier for audit and support. */
  responseId: string;
  /** Grok model used for the request. */
  model: string;
  /** Source-linked findings. */
  findings: readonly GrokFinding[];
  /** Questions the evidence leaves unanswered. */
  openQuestions: readonly GrokOpenQuestion[];
  /** Draft investment memo. */
  memo: GrokMemo;
}

/** Configuration for the server-only Grok diligence client. */
export interface GrokOptions {
  /** Secret xAI API key. Never expose this value in browser code. */
  apiKey: string;
  /** Grok model identifier. Defaults to `grok-4.7`. */
  model?: string;
  /** xAI Responses API base URL. Defaults to `https://api.x.ai/v1`. */
  baseUrl?: string;
  /** Fetch-compatible implementation. Defaults to global Fetch. */
  fetch?: typeof fetch;
  /** Default inference timeout in milliseconds. Defaults to 120,000. */
  timeoutMs?: number;
  /** Additional non-authentication headers. */
  headers?: Readonly<Record<string, string>>;
}
