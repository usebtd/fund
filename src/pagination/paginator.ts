import type { Page } from "./types";

/** Iterates a verified page loader without assuming an API envelope. */
export async function* paginate<T>(
  load: (page: number) => Promise<Page<T>>,
  startPage = 1,
): AsyncGenerator<T> {
  if (!Number.isInteger(startPage) || startPage < 1)
    throw new RangeError("startPage must be a positive integer");
  let pageNumber = startPage;
  for (;;) {
    const page = await load(pageNumber);
    yield* page.data;
    if (!page.meta.hasMore) return;
    pageNumber += 1;
  }
}
