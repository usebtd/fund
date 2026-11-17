import type { FundOptions } from "./config";
import { FetchTransport } from "./http/transport";

/**
 * Fund SDK client.
 *
 * Resource modules are intentionally not exposed until the backend routes,
 * schemas, authentication scheme, and pagination envelope can be verified.
 */
export class Fund {
  /** Shared HTTP transport for verified extension adapters. */
  public readonly transport: FetchTransport;

  /** Creates a Fund client. */
  public constructor(options: FundOptions) {
    this.transport = new FetchTransport(options);
  }
}
