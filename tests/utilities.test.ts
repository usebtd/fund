import { describe, expect, it } from "vitest";
import {
  FundError,
  FUND_SDK_VERSION,
  paginate,
  redactHeaders,
  serializeQuery,
} from "../src";

describe("utilities", () => {
  it("serializes scalar, array, false, and zero values", () => {
    expect(
      serializeQuery({
        page: 0,
        active: false,
        tag: ["a", "b"],
        absent: undefined,
      }),
    ).toBe("?page=0&active=false&tag=a&tag=b");
  });

  it("iterates pages", async () => {
    const output: number[] = [];
    for await (const value of paginate(async (page) => ({
      data: [page],
      meta: { page, limit: 1, hasMore: page < 3 },
    })))
      output.push(value);
    expect(output).toEqual([1, 2, 3]);
  });

  it("redacts sensitive headers", () => {
    expect(
      redactHeaders({
        Authorization: "Bearer secret",
        Cookie: "session=x",
        Accept: "json",
      }),
    ).toEqual({
      accept: "json",
      authorization: "[REDACTED]",
      cookie: "[REDACTED]",
    });
  });

  it("exports version and base error", () => {
    expect(FUND_SDK_VERSION).toBe("0.8.13");
    expect(new FundError("failure")).toBeInstanceOf(Error);
  });
});
