// src/search.test.ts
import { describe, it, expect } from "vitest";
import { detectDomain, searchDomain, searchStack, initSearchIndices } from "./search.js";
import { getDataDir } from "./csv-loader.js";

// Initialize indices once for all tests
const dataDir = getDataDir();
const indices = initSearchIndices(dataDir);

describe("detectDomain", () => {
  it("detects color domain", () => {
    expect(detectDomain("color palette for SaaS")).toBe("color");
  });

  it("detects typography domain", () => {
    expect(detectDomain("font pairing for headings")).toBe("typography");
  });

  it("detects ux domain", () => {
    expect(detectDomain("accessibility keyboard navigation")).toBe("ux");
  });

  it("defaults to style for ambiguous queries", () => {
    expect(detectDomain("something completely unrelated")).toBe("style");
  });

  it("detects chart domain", () => {
    expect(detectDomain("bar chart visualization trend")).toBe("chart");
  });
});

describe("searchDomain", () => {
  it("searches style domain with results", () => {
    const result = searchDomain("minimalist clean", "style", 3, indices);
    expect(result.domain).toBe("style");
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.length).toBeLessThanOrEqual(3);
  });

  it("respects maxResults", () => {
    const result = searchDomain("design", "style", 1, indices);
    expect(result.results.length).toBeLessThanOrEqual(1);
  });

  it("returns empty results for nonexistent terms", () => {
    const result = searchDomain("xyznonexistentterm", "style", 3, indices);
    expect(result.results).toEqual([]);
    expect(result.count).toBe(0);
  });

  it("auto-detects domain when not specified", () => {
    const result = searchDomain("color palette hex", undefined, 3, indices);
    expect(result.domain).toBe("color");
  });
});

describe("searchStack", () => {
  it("searches react stack", () => {
    const result = searchStack("useState local state", "react", 3, indices);
    expect(result.domain).toBe("stack");
    expect(result.stack).toBe("react");
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("searches nextjs stack", () => {
    const result = searchStack("image optimization", "nextjs", 3, indices);
    expect(result.results.length).toBeGreaterThan(0);
  });
});
