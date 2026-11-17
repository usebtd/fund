/** Generic metadata for a page-based API. Backend field mappings remain unverified. */
export interface PageMetadata {
  /** Current one-based page. */
  page: number;
  /** Maximum items requested per page. */
  limit: number;
  /** Total item count, when supplied. */
  total?: number;
  /** Whether another page exists. */
  hasMore: boolean;
}

/** A typed page of items. */
export interface Page<T> {
  /** Items on this page. */
  data: readonly T[];
  /** Pagination metadata. */
  meta: PageMetadata;
}
