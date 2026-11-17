/** Serializes defined query values without lossy truthiness checks. */
export function serializeQuery(
  values: Readonly<
    Record<
      string,
      string | number | boolean | readonly string[] | null | undefined
    >
  >,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value))
      for (const item of value as readonly string[]) query.append(key, item);
    else query.append(key, String(value));
  }
  const serialized = query.toString();
  return serialized === "" ? "" : `?${serialized}`;
}
