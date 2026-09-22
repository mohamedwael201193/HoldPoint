import { describe, expect, it } from "vitest";
import { extractRoutingToken, formatRoutingToken } from "../../convex/engine/routing";

describe("routing token", () => {
  it("extracts HP tokens from subject or body", () => {
    expect(extractRoutingToken("Re: [HP-RIV1] window")).toBe("HP-RIV1");
    expect(extractRoutingToken("no token here")).toBeNull();
  });

  it("formats a bracketed token", () => {
    expect(formatRoutingToken("HP-RIV1")).toBe("[HP-RIV1]");
  });
});
