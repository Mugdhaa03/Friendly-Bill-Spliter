import { describe, expect, it } from "vitest";
import { equalSplitCents, majorUnitsToCents } from "./money";

describe("equalSplitCents", () => {
  it("splits evenly", () => {
    expect(equalSplitCents(1000, 4)).toEqual([250, 250, 250, 250]);
  });

  it("distributes remainder cents deterministically", () => {
    expect(equalSplitCents(1000, 3)).toEqual([334, 333, 333]);
  });

  it("handles more members than cents", () => {
    expect(equalSplitCents(2, 3)).toEqual([1, 1, 0]);
  });

  it("rejects invalid input", () => {
    expect(() => equalSplitCents(1.5, 2)).toThrow();
    expect(() => equalSplitCents(100, 0)).toThrow();
  });
});

describe("majorUnitsToCents", () => {
  it("converts decimal dollars safely", () => {
    expect(majorUnitsToCents(12.34)).toBe(1234);
  });

  it("rejects invalid amounts", () => {
    expect(() => majorUnitsToCents(0)).toThrow();
    expect(() => majorUnitsToCents(Number.NaN)).toThrow();
  });
});
