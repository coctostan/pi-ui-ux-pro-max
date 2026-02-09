import { describe, it, expect } from "vitest";
import { parseCsv, loadDomain, loadStack, getDataDir } from "./csv-loader.js";

describe("parseCsv", () => {
  it("parses simple CSV text into rows", () => {
    const csv = `Name,Age,City\nAlice,30,NYC\nBob,25,LA`;
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Name: "Alice", Age: "30", City: "NYC" });
    expect(rows[1]).toEqual({ Name: "Bob", Age: "25", City: "LA" });
  });

  it("handles quoted fields with commas", () => {
    const csv = `Name,Description\nAlice,"Hello, World"\nBob,"Simple"`;
    const rows = parseCsv(csv);
    expect(rows[0].Description).toBe("Hello, World");
  });

  it("handles empty CSV", () => {
    const rows = parseCsv("");
    expect(rows).toEqual([]);
  });
});

describe("loadDomain", () => {
  it("loads styles domain and returns indexed data", () => {
    const result = loadDomain("style", getDataDir());
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.bm25).toBeDefined();
    // Styles CSV should have 67 rows
    expect(result.rows.length).toBe(67);
  });

  it("loads all 10 domains without error", () => {
    const domains = ["style", "color", "chart", "landing", "product", "ux", "typography", "icons", "react", "web"] as const;
    for (const domain of domains) {
      const result = loadDomain(domain, getDataDir());
      expect(result.rows.length).toBeGreaterThan(0);
    }
  });
});

describe("loadStack", () => {
  it("loads react stack and returns indexed data", () => {
    const result = loadStack("react", getDataDir());
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.bm25).toBeDefined();
  });

  it("loads all 13 stacks without error", () => {
    const stacks = [
      "html-tailwind", "react", "nextjs", "vue", "svelte", "swiftui",
      "react-native", "flutter", "shadcn", "jetpack-compose", "astro", "nuxtjs", "nuxt-ui",
    ] as const;
    for (const stack of stacks) {
      const result = loadStack(stack, getDataDir());
      expect(result.rows.length).toBeGreaterThan(0);
    }
  });
});
