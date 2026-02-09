import { describe, it, expect } from "vitest";

describe("types.ts", () => {
  // ============ CSV_CONFIG ============

  describe("CSV_CONFIG", () => {
    it("exports CSV_CONFIG with all 10 domains", async () => {
      const { CSV_CONFIG } = await import("./types.js");
      const keys = Object.keys(CSV_CONFIG);
      expect(keys).toEqual([
        "style", "color", "chart", "landing", "product",
        "ux", "typography", "icons", "react", "web",
      ]);
    });

    it("each domain has file, searchCols, and outputCols", async () => {
      const { CSV_CONFIG } = await import("./types.js");
      for (const [key, config] of Object.entries(CSV_CONFIG)) {
        expect(config).toHaveProperty("file");
        expect(config).toHaveProperty("searchCols");
        expect(config).toHaveProperty("outputCols");
        expect(typeof config.file).toBe("string");
        expect(Array.isArray(config.searchCols)).toBe(true);
        expect(Array.isArray(config.outputCols)).toBe(true);
        expect(config.searchCols.length).toBeGreaterThan(0);
        expect(config.outputCols.length).toBeGreaterThan(0);
      }
    });

    it("style domain has correct file and columns", async () => {
      const { CSV_CONFIG } = await import("./types.js");
      expect(CSV_CONFIG.style.file).toBe("styles.csv");
      expect(CSV_CONFIG.style.searchCols).toContain("Style Category");
      expect(CSV_CONFIG.style.searchCols).toContain("Keywords");
      expect(CSV_CONFIG.style.outputCols).toContain("Design System Variables");
    });

    it("color domain has correct file", async () => {
      const { CSV_CONFIG } = await import("./types.js");
      expect(CSV_CONFIG.color.file).toBe("colors.csv");
      expect(CSV_CONFIG.color.outputCols).toContain("Primary (Hex)");
    });
  });

  // ============ STACK_CONFIG ============

  describe("STACK_CONFIG", () => {
    it("exports STACK_CONFIG with all 13 stacks", async () => {
      const { STACK_CONFIG } = await import("./types.js");
      const keys = Object.keys(STACK_CONFIG);
      expect(keys).toHaveLength(13);
      expect(keys).toContain("html-tailwind");
      expect(keys).toContain("react");
      expect(keys).toContain("nextjs");
      expect(keys).toContain("flutter");
      expect(keys).toContain("nuxt-ui");
    });

    it("each stack has a file path under stacks/", async () => {
      const { STACK_CONFIG } = await import("./types.js");
      for (const [key, config] of Object.entries(STACK_CONFIG)) {
        expect(config.file).toMatch(/^stacks\//);
        expect(config.file).toMatch(/\.csv$/);
      }
    });
  });

  // ============ STACK_SEARCH_COLS / STACK_OUTPUT_COLS ============

  describe("STACK_SEARCH_COLS and STACK_OUTPUT_COLS", () => {
    it("exports STACK_SEARCH_COLS as an array of strings", async () => {
      const { STACK_SEARCH_COLS } = await import("./types.js");
      expect(Array.isArray(STACK_SEARCH_COLS)).toBe(true);
      expect(STACK_SEARCH_COLS).toContain("Category");
      expect(STACK_SEARCH_COLS).toContain("Guideline");
    });

    it("exports STACK_OUTPUT_COLS as an array of strings", async () => {
      const { STACK_OUTPUT_COLS } = await import("./types.js");
      expect(Array.isArray(STACK_OUTPUT_COLS)).toBe(true);
      expect(STACK_OUTPUT_COLS).toContain("Docs URL");
      expect(STACK_OUTPUT_COLS).toContain("Severity");
    });
  });

  // ============ DOMAIN_NAMES / STACK_NAMES ============

  describe("DOMAIN_NAMES and STACK_NAMES", () => {
    it("DOMAIN_NAMES matches CSV_CONFIG keys", async () => {
      const { DOMAIN_NAMES, CSV_CONFIG } = await import("./types.js");
      expect(DOMAIN_NAMES).toEqual(Object.keys(CSV_CONFIG));
    });

    it("STACK_NAMES matches STACK_CONFIG keys", async () => {
      const { STACK_NAMES, STACK_CONFIG } = await import("./types.js");
      expect(STACK_NAMES).toEqual(Object.keys(STACK_CONFIG));
    });
  });

  // ============ DEFAULT_SETTINGS ============

  describe("DEFAULT_SETTINGS", () => {
    it("exports DEFAULT_SETTINGS with correct defaults", async () => {
      const { DEFAULT_SETTINGS } = await import("./types.js");
      expect(DEFAULT_SETTINGS).toEqual({
        autoInjectDesignSystem: false,
        defaultStack: null,
        defaultFormat: "markdown",
      });
    });
  });

  // ============ Type-level checks (compile-time) ============

  describe("type structure verification", () => {
    it("CsvDomainConfig shape is correct via CSV_CONFIG values", async () => {
      const { CSV_CONFIG } = await import("./types.js");
      const style = CSV_CONFIG.style;
      // Verify runtime shape matches CsvDomainConfig
      expect(typeof style.file).toBe("string");
      expect(Array.isArray(style.searchCols)).toBe(true);
      expect(Array.isArray(style.outputCols)).toBe(true);
    });

    it("CsvStackConfig shape is correct via STACK_CONFIG values", async () => {
      const { STACK_CONFIG } = await import("./types.js");
      const react = STACK_CONFIG.react;
      expect(typeof react.file).toBe("string");
      // CsvStackConfig only has 'file'
      expect(Object.keys(react)).toEqual(["file"]);
    });
  });
});
