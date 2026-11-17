const SENSITIVE =
  /^(authorization|proxy-authorization|x-api-key|api-key|cookie|set-cookie)$/i;

/** Returns a copy of headers with credential-bearing values replaced. */
export function redactHeaders(headers: HeadersInit): Record<string, string> {
  const result: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    result[key] = SENSITIVE.test(key) ? "[REDACTED]" : value;
  });
  return result;
}
