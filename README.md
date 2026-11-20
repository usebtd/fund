<div  align="center">

# Fund TypeScript SDK

![enter image description here](https://cyan-worried-mite-516.mypinata.cloud/ipfs/bafkreia4ekmqk2fdcs6kfbppo72ttrm5i2gldqveo4pk3urtwtlaqte77y)

**A secure, TypeScript-first HTTP foundation for Fund.**

Build integrations with **[Fund](https://usebtd.xyz)** — an AI-powered platform for fundraising and investment management, built on Solana.

[![SDK Version](https://img.shields.io/badge/SDK-v0.8.13-C9FF73?style=flat-square&labelColor=102E25)](./CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](./tsconfig.json)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](./package.json)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero-16a34a?style=flat-square)](./package.json)
[![License](https://img.shields.io/badge/License-MIT-737373?style=flat-square)](./LICENSE)

[**Website**](https://usebtd.xyz) · [**Changelog**](./CHANGELOG.md) · [**Capabilities**](./CAPABILITIES.md) · [**License**](./LICENSE)

</div>

---

## Overview

`@usebtd/fund` provides a lightweight, runtime-portable transport layer for **verified Fund API integrations**. It uses the native Fetch API, ships ESM and CommonJS builds with TypeScript declarations, and has **zero runtime dependencies**.

| Built for                  | What you get                                                                               |
| :------------------------- | :----------------------------------------------------------------------------------------- |
| 🔐 **Secure Credentials**  | API keys, bearer tokens, HTTPS protection, origin safeguards, and redacted diagnostics.    |
| 🔁 **Reliable Requests**   | Timeouts, cancellation, typed errors, safe retries, and idempotency helpers.               |
| ⚡ **Portable Runtime**    | Native Fetch, Node.js 18+, Next.js server environments, and compatible edge runtimes.      |
| 🧩 **Typed Extensibility** | Strict TypeScript, query serialization, pagination utilities, and advanced transport APIs. |
| 🤖 **Grok Diligence**      | Source-linked findings, open questions, and a working memo from supplied evidence.         |

> [!IMPORTANT]

> **Transport foundation with standalone Grok diligence.** Version `0.8.13` does **not** invent Fund backend endpoints because the authoritative backend contract was unavailable. Grok diligence is implemented directly against the official xAI Responses API and does not represent a Fund backend route. See [Backend capability status](#backend-capability-status).

> [!CAUTION]

> **Never expose secrets in frontend code.** API keys, bearer tokens, Solana private keys, wallet seed phrases, database credentials, and encryption keys must stay in trusted environments. The SDK does not accept Solana private keys.

### On this page

| 🚀 Get Started                                   | 📚 SDK Reference                          | 🛡️ Reliability & Security                     | 🛠️ Project                                   |
| :----------------------------------------------- | :---------------------------------------- | :-------------------------------------------- | :------------------------------------------- |
| [Installation](#installation)                    | [Authentication](#authentication)         | [Errors](#errors)                             | [Backend Status](#backend-capability-status) |
| [Quick Start](#quick-start)                      | [Configuration](#configuration-reference) | [Timeouts](#timeouts-and-cancellation)        | [Development](#local-development)            |
| [Compatibility](#requirements-and-compatibility) | [Architecture](#client-architecture)      | [Retries](#retries)                           | [Testing](#testing)                          |
| [Package Status](#package-status)                | [Transport](#advanced-transport-usage)    | [Idempotency](#idempotency)                   | [Building](#building)                        |
| [Grok Diligence](#grok-diligence)                | [Responses](#response-handling)           | [Pagination](#pagination-and-async-iteration) | [Publishing](#publishing)                    |
|                                                  | [Exports](#typescript-exports)            | [Security](#browser-usage-and-security)       | [Troubleshooting](#troubleshooting)          |
|                                                  |                                           |                                               | [FAQ](#faq)                                  |

## Installation

Choose your package manager:

```bash

npm  install  @usebtd/fund

```

<details>

<summary><strong>Using pnpm, Yarn, or Bun?</strong></summary>

```bash

pnpm  add  @usebtd/fund

# or

yarn  add  @usebtd/fund

# or

bun  add  @usebtd/fund

```

</details>

## Quick start

Create a Fund client on your server:

```ts
import { Fund, FUND_SDK_VERSION } from "@usebtd/fund";

const fund = new Fund({
  apiKey: process.env.FUND_API_KEY!,
  baseUrl: "https://usebtd.xyz/api",
});

console.log(FUND_SDK_VERSION); // "0.8.13"
```

The client is configured, but endpoint-specific resource methods remain unavailable until the backend contract is verified. The public `transport` is intended for audited adapters, not for guessing API paths.

### CommonJS

```js
const { Fund, FUND_SDK_VERSION } = require("@usebtd/fund");

const fund = new Fund({
  accessToken: process.env.FUND_ACCESS_TOKEN,
  baseUrl: "https://usebtd.xyz/api",
});
```

## Requirements and compatibility

The SDK targets ES2022 and requires Node.js 18+ or a runtime with Fetch, `AbortController`, `AbortSignal.any`, and `crypto.randomUUID`.

| Runtime                       |   Support    | Notes                                                   |
| :---------------------------- | :----------: | :------------------------------------------------------ |
| **Node.js 18+**               | ✅ Supported | Store credentials in server-side environment variables. |
| **Next.js Server**            | ✅ Supported | Keep configured SDK clients in server-only modules.     |
| **Next.js Edge**              | ✅ Supported | Ensure required Web APIs are available.                 |
| **React Server Components**   | ✅ Supported | Never expose configured clients to client components.   |
| **Modern Browsers**           |  ⚠️ Limited  | Only use backend-approved public or scoped credentials. |
| **Bun**                       | ✅ Supported | Uses native Fetch and Web Crypto APIs.                  |
| **Serverless / Edge Workers** | 🔄 Expected  | Verify compatibility with your deployment environment.  |

> **Note:** The SDK does not polyfill Fetch, Web Crypto, streams, or abort primitives.

## Package Status

| Property                   | Value                                    |
| :------------------------- | :--------------------------------------- |
| **Package**                | `@usebtd/fund`                           |
| **Version**                | `0.8.13`                                 |
| **Module Formats**         | ESM & CommonJS                           |
| **Type Declarations**      | Included                                 |
| **Minimum Node.js**        | 18+                                      |
| **HTTP Client**            | Native Fetch API                         |
| **Runtime Dependencies**   | Zero                                     |
| **TypeScript**             | Strict Mode                              |
| **Source Maps**            | Not included                             |
| **Network Calls in Tests** | None                                     |
| **Date Format**            | ISO 8601 strings at the network boundary |

### Available in v0.8.13

- API-key and bearer-token header construction

- HTTPS and same-origin credential-forwarding safeguards

- Custom Fetch implementations and non-credential headers

- JSON request serialization and safe response parsing

- Typed HTTP errors

- Request timeouts and caller cancellation

- Retry limits, exponential backoff, jitter, and `Retry-After`

- Prevention of unsafe mutation retries

- Idempotency headers and portable key generation

- Secret-redacted diagnostics

- Query serialization

- Backend-neutral page types and async iteration

- ESM, CommonJS, and declaration output

### Not yet available — requires a backend contract

- Companies, fundraising rounds, and investors

- Deal-room documents and milestones

- AI diligence and funding transactions

- Confirmed authentication and scope semantics

- Confirmed pagination envelope and error schema

No dummy responses or speculative endpoints are included.

---

## Authentication

Authentication is a discriminated union. Supply exactly one credential.

### API key

```ts
const fund = new Fund({
  apiKey: process.env.FUND_API_KEY!,

  baseUrl: "https://usebtd.xyz/api",
});
```

The transport sends the value in `X-API-Key`.

### Bearer token

```ts
const fund = new Fund({
  accessToken: process.env.FUND_ACCESS_TOKEN!,

  baseUrl: "https://usebtd.xyz/api",
});
```

The transport sends the value in `Authorization: Bearer …`.

### Authentication contract warning

The actual Fund machine-to-machine scheme was not available for verification. Before production deployment, confirm:

1. which header is accepted;

2. how credentials are issued, rotated, and revoked;

3. whether credentials have workspace and operation scopes;

4. token expiration behavior;

5. how idempotency records are scoped; and

6. which operations are permitted in browser-visible environments.

Credential headers cannot be supplied through the generic `headers` option. This prevents an innocent-looking override from bypassing typed authentication configuration.

## Grok diligence

The SDK includes a standalone, server-only Grok client for Fund's diligence workflow:

- ingest caller-supplied text evidence once;
- produce findings linked to exact source IDs and quotes;
- identify missing or inconsistent evidence as open questions; and
- draft a structured working investment memo.

The integration uses xAI's Responses API with strict JSON-schema output. Requests set `store: false`, are never automatically retried, and reject output that cites a source ID the caller did not supply.

> [!CAUTION]
> `XAI_API_KEY` is a server secret. Never instantiate `Grok` in browser or client-component code.

```ts
import { Grok } from "@usebtd/fund";

const grok = new Grok({
  apiKey: process.env.XAI_API_KEY!,
});

const review = await grok.analyzeDiligence({
  companyName: "Acme",
  focus: "Seed-stage investment readiness",
  sources: [
    {
      id: "pitch-deck",
      title: "Acme pitch deck",
      kind: "pitch_deck",
      content: pitchDeckText,
    },
    {
      id: "operating-model",
      title: "2026 operating model",
      kind: "financials",
      content: financialModelText,
    },
    {
      id: "customer-interviews",
      title: "Customer interview notes",
      kind: "customer_evidence",
      content: interviewNotes,
    },
    {
      id: "founder-qa",
      title: "Founder Q&A",
      kind: "founder_context",
      content: founderAnswers,
    },
  ],
});

for (const finding of review.findings) {
  console.log(finding.title, finding.evidence);
}

console.log(review.openQuestions);
console.log(review.memo);
```

### Grok configuration

| Option      | Type                     | Default               | Description                                                |
| :---------- | :----------------------- | :-------------------- | :--------------------------------------------------------- |
| `apiKey`    | `string`                 | Required              | Secret xAI API key.                                        |
| `model`     | `string`                 | `grok-4.7`            | Grok model identifier.                                     |
| `baseUrl`   | `string`                 | `https://api.x.ai/v1` | HTTPS xAI API origin; non-xAI origins are rejected.        |
| `fetch`     | `typeof fetch`           | Global Fetch          | Custom Fetch implementation for compatible runtimes/tests. |
| `timeoutMs` | `number`                 | `120000`              | Default inference deadline.                                |
| `headers`   | `Record<string, string>` | `{}`                  | Additional headers; authorization cannot be overridden.    |

Evidence is limited to 100 sources and 2,000,000 total characters per analysis. Source IDs must be unique. Source content is treated as untrusted data, and prompts explicitly instruct Grok not to follow commands embedded in evidence.

The generated memo is a working draft, not financial, legal, or investment advice. Human review remains required.

## Configuration reference

```ts
import type { FundOptions } from "@usebtd/fund";
```

| Option              | Type                          |   Required    | Default            | Description                                                    |
| :------------------ | :---------------------------- | :-----------: | :----------------- | :------------------------------------------------------------- |
| `baseUrl`           | `string`                      |    ✅ Yes     | —                  | Absolute API URL. HTTPS required except for localhost.         |
| `apiKey`            | `string`                      | 🔑 Credential | —                  | Sent via `X-API-Key`. Cannot be combined with `accessToken`.   |
| `accessToken`       | `string`                      | 🔑 Credential | —                  | Bearer token authentication. Cannot be combined with `apiKey`. |
| `fetch`             | `typeof fetch`                |      No       | `globalThis.fetch` | Custom Fetch-compatible implementation.                        |
| `timeoutMs`         | `number`                      |      No       | `30000`            | Default request timeout in milliseconds. Must be positive.     |
| `headers`           | `Record<string, string>`      |      No       | `{}`               | Additional non-credential request headers.                     |
| `retry.maxRetries`  | `number`                      |      No       | `2`                | Maximum retry attempts after the initial request.              |
| `retry.baseDelayMs` | `number`                      |      No       | `250`              | Initial exponential-backoff ceiling in milliseconds.           |
| `retry.maxDelayMs`  | `number`                      |      No       | `5000`             | Maximum exponential-backoff ceiling in milliseconds.           |
| `debug`             | `(event: DebugEvent) => void` |      No       | Disabled           | Callback for sanitized request lifecycle events.               |

### Complete Configuration Example

```ts
import { Fund, type DebugEvent } from "@usebtd/fund";

function debug(event: DebugEvent): void {
  console.debug(`[fund:${event.phase}]`, {
    method: event.method,
    url: event.url,
    status: event.status,
    attempt: event.attempt,
    headers: event.headers,
  });
}

const fund = new Fund({
  accessToken: process.env.FUND_ACCESS_TOKEN!,
  baseUrl: "https://usebtd.xyz/api",
  timeoutMs: 10_000,
  headers: {
    "X-Application-Name": "fund-admin-service",
  },
  retry: {
    maxRetries: 3,
    baseDelayMs: 200,
    maxDelayMs: 4_000,
  },
  debug,
});
```

## Client architecture

```text

Fund
│
└── FetchTransport
    ├── URL & Origin Validation
    ├── Authentication & SDK Headers
    ├── Request Serialization
    ├── Timeout & Cancellation
    ├── Response Parsing
    ├── Typed Error Mapping
    ├── Safe & Idempotent Retries
    └── Redacted Diagnostics

Standalone Utilities
│
├── serializeQuery
├── createIdempotencyKey
├── redactHeaders
└── paginate

```

All network communication is centralized in `FetchTransport`. This keeps authentication, safety rules, parsing, retries, and errors consistent when verified resources are added.

## Advanced transport usage

`fund.transport.request<T>()` supports adapters based on routes you have independently verified.

```ts
interface HealthResponse {
  status: string;
}

// Example only: replace with a path confirmed by your backend contract.

const health = await fund.transport.request<HealthResponse>(
  "GET",

  "verified/health-path",
);
```

### Request options

```ts
interface RequestOptions {
  body?: unknown;

  signal?: AbortSignal;

  timeoutMs?: number;

  headers?: Readonly<Record<string, string>>;

  idempotencyKey?: string;
}
```

Request paths must be relative to `baseUrl`. Absolute and protocol-relative URLs are rejected so credentials cannot be forwarded to an arbitrary origin.

### JSON mutation example

```ts
interface CreateResult {
  id: string;

  createdAt: string;
}

const result = await fund.transport.request<CreateResult>(
  "POST",

  "verified/resource-path",

  {
    body: { name: "Example" },

    idempotencyKey: "operation-unique-key",
  },
);
```

This demonstrates transport mechanics only. It does not assert that the shown path or fields exist in Fund.

---

## Request lifecycle

For every request, the transport:

1. rejects absolute and cross-origin paths;

2. combines default and per-request headers;

3. attaches the configured credential;

4. attaches `X-Fund-SDK-Version: 0.8.13`;

5. attaches `Idempotency-Key` when supplied;

6. JSON-serializes non-`BodyInit` bodies;

7. combines the caller's signal with an SDK timeout;

8. calls the configured Fetch implementation;

9. safely parses JSON, text, or an empty response;

10. maps unsuccessful statuses to typed errors; and

11. retries only when both the failure and operation are eligible.

The SDK does not log request bodies or credentials.

## Response handling

| Response                               | Result                         |
| :------------------------------------- | :----------------------------- |
| `204 No Content` / `205 Reset Content` | Returns `undefined`.           |
| **Empty Body**                         | Returns `undefined`.           |
| **Valid JSON**                         | Returns the parsed JSON value. |
| **Malformed JSON**                     | Throws `FundApiError`.         |
| **Non-JSON Content**                   | Returns a text string.         |
| **Non-Success HTTP Status**            | Throws a typed API error.      |

> **Note:** Generic type parameters describe verified contracts but do not perform runtime validation. Dates remain ISO 8601 strings at the network boundary and are never automatically converted to `Date` objects.

## Errors

All SDK errors extend `FundError`, which inherits from the native JavaScript `Error` class.

| Error                     | Typical Cause                                   |
| :------------------------ | :---------------------------------------------- |
| `FundError`               | Base SDK error.                                 |
| `FundApiError`            | General API failure or malformed JSON response. |
| `FundAuthenticationError` | Authentication failed — HTTP `401` or `403`.    |
| `FundValidationError`     | Invalid request — HTTP `400` or `422`.          |
| `FundNotFoundError`       | Resource not found — HTTP `404`.                |
| `FundConflictError`       | Resource conflict — HTTP `409`.                 |
| `FundRateLimitError`      | Rate limit exceeded — HTTP `429`.               |
| `FundTimeoutError`        | Request exceeded the configured SDK timeout.    |

### API Error Properties

API errors expose additional diagnostic information when available:

```ts
interface FundApiError {
  status: number;
  code?: string;
  requestId?: string;
  details?: unknown;
  issues?: readonly ValidationIssue[];
  retryAfterMs?: number;
}
```

### Error handling example

```ts
import {
  FundApiError,
  FundAuthenticationError,
  FundRateLimitError,
  FundTimeoutError,
  FundValidationError,
} from "@usebtd/fund";

try {
  await fund.transport.request("GET", "verified/resource-path");
} catch (error: unknown) {
  if (error instanceof FundAuthenticationError) {
    console.error("Check credential validity and scopes.");
  } else if (error instanceof FundValidationError) {
    console.error("Validation failed", error.issues);
  } else if (error instanceof FundRateLimitError) {
    console.error("Rate limited", error.retryAfterMs);
  } else if (error instanceof FundTimeoutError) {
    console.error("Request timed out", error.timeoutMs);
  } else if (error instanceof FundApiError) {
    console.error(error.status, error.code, error.requestId);
  } else {
    throw error;
  }
}
```

Do not log complete error details blindly; a backend may include sensitive business data in diagnostic fields.

## Timeouts and cancellation

Set a client-wide default:

```ts
const fund = new Fund({
  apiKey: process.env.FUND_API_KEY!,

  baseUrl: "https://usebtd.xyz/api",

  timeoutMs: 15_000,
});
```

Override it per request:

```ts
await fund.transport.request("GET", "verified/resource-path", {
  timeoutMs: 5_000,
});
```

Cancel from application code:

```ts
const controller = new AbortController();

const pending = fund.transport.request("GET", "verified/resource-path", {
  signal: controller.signal,
});

controller.abort(new Error("User cancelled"));

await pending;
```

An SDK deadline produces `FundTimeoutError`. An explicit caller abort preserves the caller's abort reason.

## Retries

Retries are intentionally conservative.

### Retryable status codes

- `408 Request Timeout`

- `429 Too Many Requests`

- `500 Internal Server Error`

- `502 Bad Gateway`

- `503 Service Unavailable`

- `504 Gateway Timeout`

| Request Type                            | Automatic Retry | Conditions                                 |
| :-------------------------------------- | :-------------: | :----------------------------------------- |
| `GET`, `HEAD`, `OPTIONS`                |     ✅ Yes      | Retryable HTTP statuses only.              |
| **Mutation without Idempotency Key**    |      ❌ No      | Automatic retries disabled.                |
| **Mutation with Idempotency Key**       |     ✅ Yes      | Retryable HTTP statuses only.              |
| **Authentication / Validation Failure** |      ❌ No      | Requires credential or request correction. |
| **Conflict**                            |      ❌ No      | Requires conflict resolution.              |

Delays use exponential backoff with jitter and never exceed `maxDelayMs`. A valid `Retry-After` value takes precedence and may be delta seconds or an HTTP date.

The transport retries retryable HTTP responses, not arbitrary network exceptions. This avoids duplicating a mutation when the server may have accepted it before the connection failed.

## Idempotency

```ts
import { createIdempotencyKey } from "@usebtd/fund";

const key = createIdempotencyKey();

await fund.transport.request("POST", "verified/mutation-path", {
  body: {
    /* verified payload */
  },

  idempotencyKey: key,
});
```

Recommended rules:

1. Create one key per logical operation, not per attempt.

2. Persist the key while reconciling an uncertain result.

3. Reuse it only for an identical request.

4. Never generate a new key to retry an operation whose status is unknown.

5. Confirm backend retention and conflict behavior.

6. For funding, reconcile transaction status before resubmitting.

A UUID does not make an endpoint idempotent by itself; the backend must implement the guarantee.

## Pagination and async iteration

The SDK exposes a backend-neutral page model:

```ts
interface Page<T> {
  data: readonly T[];

  meta: {
    page: number;

    limit: number;

    total?: number;

    hasMore: boolean;
  };
}
```

Map a verified API response into that shape:

```ts
import { paginate, type Page } from "@usebtd/fund";

interface Investor {
  id: string;
}

declare function loadVerifiedPage(page: number): Promise<Page<Investor>>;

for await (const investor of paginate(loadVerifiedPage)) {
  console.log(investor.id);
}
```

Resume from a later page with `paginate(loadVerifiedPage, 5)`. Pages load sequentially and iteration stops when `meta.hasMore` is false.

### Query serialization

`serializeQuery` omits `null` and `undefined`, preserves `false` and `0`, and repeats keys for arrays:

```ts
import { serializeQuery } from "@usebtd/fund";

const query = serializeQuery({
  page: 1,

  limit: 25,

  active: false,

  tag: ["seed", "solana"],

  cursor: undefined,
});

// ?page=1&limit=25&active=false&tag=seed&tag=solana
```

The backend's actual array and pagination conventions must be confirmed before resource methods use this utility.

## Debugging and secret redaction

```ts
const fund = new Fund({
  apiKey: process.env.FUND_API_KEY!,

  baseUrl: "https://usebtd.xyz/api",

  debug(event) {
    console.debug(JSON.stringify(event));
  },
});
```

`Authorization`, `Proxy-Authorization`, `X-API-Key`, `API-Key`, `Cookie`, and `Set-Cookie` are redacted case-insensitively as `[REDACTED]`. Debug events contain lifecycle metadata, not request or response bodies.

URLs may still contain sensitive identifiers. Never place secrets in query strings.

---

## Next.js and server-side usage

Create a server-only client:

```ts
// lib/fund.server.ts

import "server-only";

import { Fund } from "@usebtd/fund";

export const fund = new Fund({
  apiKey: process.env.FUND_API_KEY!,

  baseUrl: process.env.FUND_API_BASE_URL ?? "https://usebtd.xyz/api",
});
```

Use it from a route handler after applying your own authorization:

```ts
import { NextResponse } from "next/server";

import { fund } from "@/lib/fund.server";

export async function GET(): Promise<NextResponse> {
  const result = await fund.transport.request("GET", "verified/resource-path");

  return NextResponse.json(result);
}
```

Never prefix secrets with `NEXT_PUBLIC_`, instantiate this client in a `"use client"` module, serialize tokens into page data, or proxy Fund data without checking the current user's permissions.

## Browser usage and security

Browser compatibility is not the same as secret safety. Browser source, requests, storage, and memory are visible to users and malicious same-origin scripts.

Use the SDK in a browser only if the backend explicitly supports a public or tightly scoped browser credential. Otherwise use a trusted server and expose the minimum application-specific data.

The SDK does not hide bundled secrets, provide secure browser storage, manage OAuth redirects, sign Solana transactions, access a database, or bypass CORS.

## Solana and USDC safety

Solana private keys and seed phrases must never be passed to the SDK, placed in JSON bodies, stored in browser storage, logged, or committed to source control. Use an audited wallet flow or secured policy-controlled signer.

Before adding any irreversible USDC release operation, verify that the backend provides:

1. an explicit confirmation field or challenge;

2. authorization and workspace-scope checks;

3. a durable idempotency guarantee;

4. an immutable audit record;

5. transaction identifiers and reconciliation endpoints;

6. clear pending, confirmed, failed, and expired states;

7. amount, mint, recipient, and network validation; and

8. protection against retrying uncertain submissions.

No milestone-release or funding-submission operation is implemented in `0.8.13`.

---

## Backend capability status

The proposed surface is a gap analysis, not claimed functionality.

| Resource       | Planned Operations                     |     Status     | Required API Contracts                    |
| :------------- | :------------------------------------- | :------------: | :---------------------------------------- |
| **Companies**  | List, retrieve, create, update, delete |   🚧 Blocked   | Routes, schemas, permissions, pagination  |
| **Rounds**     | List, retrieve, create, update         |   🚧 Blocked   | Routes, schemas, status model             |
| **Investors**  | List, retrieve, create, update, delete |   🚧 Blocked   | Routes, schemas, permissions, pagination  |
| **Deal Room**  | List, create, update, delete documents |   🚧 Blocked   | Upload model, storage rules, schemas      |
| **Milestones** | List, create, update, move, release    |   🚧 Blocked   | Status transitions, release contract      |
| **Diligence**  | Retrieve stored Fund analysis          |   🚧 Blocked   | Fund API job lifecycle and persistence    |
| **Grok**       | Analyze caller-supplied evidence       | ✅ Implemented | Direct server-only xAI Responses API      |
| **Funding**    | Configuration, transaction lookup      |   🚧 Blocked   | Onchain transaction and security contract |

To implement these safely, provide the backend repository, a versioned OpenAPI document plus authentication documentation, or route definitions with validators, responses, pagination, errors, and authorization requirements.

Implementation should then proceed resource by resource with contract tests. Existing application behavior should not be changed merely to make the SDK more convenient.

## TypeScript exports

All public values and types are exported from the package root.

### Runtime exports

- `Fund`, `FetchTransport`, and `FUND_SDK_VERSION`

- `Grok` and Grok-specific error classes

- All eight Fund error classes

- `paginate`, `serializeQuery`, `redactHeaders`, and `createIdempotencyKey`

### Type exports

- `FundAuthentication`, `FundOptions`, and `RetryOptions`

- `DebugEvent` and `RequestOptions`

- Grok configuration, evidence, finding, question, memo, and result types

- `ValidationIssue` and `FundApiErrorOptions`

- `Page<T>` and `PageMetadata`

```ts
import {
  Fund,
  type FundOptions,
  type Page,
  type RequestOptions,
} from "@usebtd/fund";
```

The API uses `unknown` where an authoritative schema is unavailable. It does not use `any` to disguise unverified data.

---

## Local development

From `packages/sdk`:

```sh

npm  install

```

| Command | Purpose |

| :--- | :--- |

| `npm run format` | Format source, tests, configuration, and documentation. |

| `npm run format:check` | Verify formatting without changing files. |

| `npm run lint` | Run ESLint against source and tests. |

| `npm run typecheck` | Run strict TypeScript checks without emitting. |

| `npm test` | Run the Vitest suite once. |

| `npm run test:coverage` | Run tests with V8 coverage. |

| `npm run build` | Produce ESM, CommonJS, and declarations. |

| `npm run prepublishOnly` | Run the publication gate. |

Recommended loop:

```sh

npm  run  format

npm  run  lint

npm  run  typecheck

npm  test

npm  run  build

```

## Testing

Tests use Vitest with mocked Fetch functions and never contact production. They verify success, authentication headers, every error mapping, malformed and empty responses, query serialization, pagination, cancellation, timeouts, retry limits, `Retry-After`, redaction, idempotency headers, absolute-URL rejection, and prevention of unsafe mutation retries.

```sh

npm  test

npm  run  test:coverage

```

New resources should test every method, validation boundary, pagination case, permission error, idempotency guarantee, and status transition.

## Building

```sh

npm  run  build

```

```text

dist/

├── index.js # ESM

├── index.cjs # CommonJS

├── index.d.ts # ESM declarations

└── index.d.cts # CommonJS declarations

```

The build targets ES2022, supports tree shaking, and excludes source maps.

### Import smoke tests

```sh

node  --input-type=module  -e  "import { FUND_SDK_VERSION } from './dist/index.js'; console.log(FUND_SDK_VERSION)"

node  -e  "console.log(require('./dist/index.cjs').FUND_SDK_VERSION)"

```

Both commands should print `0.8.13`.

## Publishing

The package includes only `dist`, `README.md`, `CHANGELOG.md`, `LICENSE`, `CAPABILITIES.md`, and package metadata.

### Pre-publication checklist

1. Confirm the version is exactly `0.8.13`.

2. Review [CHANGELOG.md](./CHANGELOG.md).

3. Run `npm run prepublishOnly`.

4. Run ESM and CommonJS smoke tests.

5. Run `npm audit --omit=dev`.

6. Search `dist` for credentials, private keys, database URLs, and `.env` values.

7. Run `npm pack --dry-run` and inspect every file.

8. Confirm no source maps or environment files are present.

9. Confirm npm authentication and package ownership.

10. Publish the public scoped package.

```sh

npm  publish  --access  public

```

Do not publish endpoint-specific methods until they are checked against the backend version they target.

## Versioning policy

The package follows semantic versioning:

- **Patch**: compatible fixes, documentation, and internal changes.

- **Minor**: backward-compatible features or verified resource methods.

- **Major**: breaking changes to constructors, exports, signatures, behavior, or runtimes.

Because the package is below `1.0.0`, consumers should read release notes carefully. Security fixes may make behavior more restrictive in a patch release when retaining old behavior would be unsafe.

## Troubleshooting

### `baseUrl must use HTTPS`

Use `https://`. Plain HTTP is accepted only for `localhost`, `127.0.0.1`, and `[::1]`.

### `baseUrl must not contain credentials`

Remove `username:password@` from the URL and use `apiKey` or `accessToken`.

### `Request paths must be relative to baseUrl`

Pass `resource/path`, not a complete URL. This prevents credential forwarding to an untrusted origin.

### `A Fetch API implementation is required`

Upgrade to Node.js 18+ or pass a standards-compatible Fetch implementation.

### Request aborts immediately

Check whether the signal was already aborted and whether `timeoutMs` is too small.

### A mutation was not retried

This is expected without an idempotency key. Even with a key, only retryable HTTP statuses are retried.

### TypeScript accepts an incorrect response shape

`request<T>` is a compile-time assertion, not runtime validation. Use types derived from a verified contract.

### Browser request fails because of CORS

CORS is controlled by the API and browser. The SDK cannot bypass it. Prefer server-side integration unless the backend explicitly supports the origin and credential model.

## FAQ

### Why are `fund.companies` and the other resource modules absent?

Their backend routes and schemas were not provided. Implementing them from product descriptions would invent behavior and could be dangerous for funding operations.

### Can I call `fund.transport` directly?

Yes, when you have an independently verified route contract. Treat it as an advanced adapter API, not endpoint discovery.

### Does the SDK access Neon or another database?

No. It exposes no database access and contains no Neon credentials.

### Does it sign Solana transactions?

No. It neither accepts nor manages Solana private keys.

### Are dates converted to JavaScript `Date` objects?

No. Network dates remain ISO 8601 strings.

### Can it be bundled into a React application?

The code is bundle-compatible, but secret-bearing clients must remain server-side. Browser use requires a backend-approved public or tightly scoped credential.

### Are retries safe for funding operations?

No funding operation is implemented. A future operation must use verified idempotency and reconcile uncertain on-chain results before resubmission.

## License

MIT. See [LICENSE](./LICENSE).
