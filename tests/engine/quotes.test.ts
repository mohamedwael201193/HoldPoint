import { describe, expect, it } from "vitest";
import { quoteExistsInSource } from "../../convex/engine/quotes";

describe("quote verification", () => {
  const source =
    "Provide updated load calculations for panel A. Replace NM with MC in the wet location. Resubmit sheet E-201.";

  it("accepts a verbatim clause", () => {
    expect(
      quoteExistsInSource(source, "Replace NM with MC in the wet location."),
    ).toBe(true);
  });

  it("rejects an invented clause", () => {
    expect(
      quoteExistsInSource(source, "Install a new transformer on the roof."),
    ).toBe(false);
  });

  it("rejects short quotes", () => {
    expect(quoteExistsInSource(source, "panel")).toBe(false);
  });
});
