// src/design-system.test.ts
import { describe, it, expect } from "vitest";
import { DesignSystemGenerator } from "./design-system.js";
import { initSearchIndices } from "./search.js";
import { getDataDir } from "./csv-loader.js";

const dataDir = getDataDir();
const indices = initSearchIndices(dataDir);
const generator = new DesignSystemGenerator(dataDir, indices);

describe("DesignSystemGenerator", () => {
  it("generates a design system for SaaS dashboard query", () => {
    const ds = generator.generate("SaaS dashboard analytics", "My SaaS App");
    expect(ds.projectName).toBe("My SaaS App");
    expect(ds.category).toBeDefined();
    expect(ds.style.name).toBeDefined();
    expect(ds.colors.primary).toMatch(/^#/);
    expect(ds.colors.secondary).toMatch(/^#/);
    expect(ds.colors.cta).toMatch(/^#/);
    expect(ds.typography.heading).toBeDefined();
    expect(ds.typography.body).toBeDefined();
    expect(ds.pattern.name).toBeDefined();
  });

  it("generates different results for different queries", () => {
    const spa = generator.generate("beauty spa wellness", "Spa");
    const tech = generator.generate("tech startup developer tools", "DevTool");
    // Different queries should produce different styles or colors
    const spaKey = `${spa.style.name}|${spa.colors.primary}`;
    const techKey = `${tech.style.name}|${tech.colors.primary}`;
    expect(spaKey).not.toBe(techKey);
  });

  it("uses query as project name when not provided", () => {
    const ds = generator.generate("fintech banking");
    expect(ds.projectName).toBe("FINTECH BANKING");
  });

  it("includes reasoning data (anti-patterns, effects)", () => {
    const ds = generator.generate("e-commerce luxury", "Luxury Shop");
    // Should have some anti-patterns from reasoning rules
    expect(typeof ds.antiPatterns).toBe("string");
    expect(typeof ds.keyEffects).toBe("string");
  });

  it("finds matching reasoning rule for known categories", () => {
    const ds = generator.generate("SaaS", "Test");
    // SaaS should match the "SaaS (General)" reasoning rule
    expect(ds.severity).toBeDefined();
  });
});
