/** Creates a runtime-portable idempotency key. */
export function createIdempotencyKey(): string {
  if (typeof crypto.randomUUID !== "function") {
    throw new Error(
      "crypto.randomUUID() is required to generate an idempotency key",
    );
  }
  return crypto.randomUUID();
}
