# Backend capability audit

Audit date: 2026-11-17.

The supplied workspace contains only the SDK request. It does not contain the Fund application, API routes, request validators, database models, authentication implementation, pagination envelope, error schema, or an OpenAPI document. The public site did not expose searchable API documentation from the available environment.

Consequently, no endpoint-specific resource method is included in v0.8.1. Adding `companies`, `rounds`, `investors`, `dealRoom`, `milestones`, `diligence`, or `funding` methods without those materials would invent URLs and data fields and could misrepresent security-sensitive funding behavior.

To unlock resource methods, provide one of:

- the backend repository;
- a versioned OpenAPI document plus authentication documentation; or
- route, validator, response, pagination, and error-contract source files.

The SDK foundation includes Fetch transport, API-key or bearer-token header support (pending backend confirmation), timeouts, cancellation, safe/idempotent retry behavior, `Retry-After`, typed errors, redacted diagnostics, query serialization, idempotency-key generation, and a backend-neutral paginator.
