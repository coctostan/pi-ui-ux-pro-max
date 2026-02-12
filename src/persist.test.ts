// src/persist.test.ts
import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { persistDesignSystem, formatMasterMd, formatPageOverrideMd, detectPageType } from "./persist.js";
import { DesignSystemGenerator } from "./design-system.js";
import { initSearchIndices } from "./search.js";
import { getDataDir } from "./csv-loader.js";

const dataDir = getDataDir();
const indices = initSearchIndices(dataDir);
const generator = new DesignSystemGenerator(dataDir, indices);

describe("formatMasterMd", () => {
  it("produces markdown with all required sections", () => {
    const ds = generator.generate("SaaS dashboard", "TestProject");
    const md = formatMasterMd(ds);
    expect(md).toContain("# Design System Master File");
    expect(md).toContain("**Project:** TestProject");
    expect(md).toContain("## Global Rules");
    expect(md).toContain("### Color Palette");
    expect(md).toContain("### Typography");
    expect(md).toContain("## Anti-Patterns");
    expect(md).toContain("## Pre-Delivery Checklist");
  });

  it("includes CSS variables in color table", () => {
    const ds = generator.generate("SaaS", "Test");
    const md = formatMasterMd(ds);
    expect(md).toContain("`--color-primary`");
    expect(md).toContain("`--color-cta`");
  });

  it("includes Shadow Depths table", () => {
    const ds = generator.generate("SaaS dashboard", "TestProject");
    const md = formatMasterMd(ds);
    expect(md).toContain("### Shadow Depths");
    expect(md).toContain("`--shadow-sm`");
    expect(md).toContain("`--shadow-md`");
    expect(md).toContain("`--shadow-lg`");
    expect(md).toContain("`--shadow-xl`");
  });

  it("includes Cards, Inputs, Modals, and expanded Buttons", () => {
    const ds = generator.generate("SaaS dashboard", "TestProject");
    const md = formatMasterMd(ds);
    expect(md).toContain("### Cards");
    expect(md).toContain(".card {");
    expect(md).toContain("### Inputs");
    expect(md).toContain(".input {");
    expect(md).toContain(".input:focus {");
    expect(md).toContain("### Modals");
    expect(md).toContain(".modal-overlay {");
    expect(md).toContain(".modal {");
    // Expanded buttons
    expect(md).toContain(".btn-primary:hover {");
    expect(md).toContain(".btn-secondary {");
    expect(md).toContain(".btn-secondary:hover {");
  });

  it("uses design system colors in component CSS (not hardcoded)", () => {
    const ds = generator.generate("SaaS dashboard", "TestProject");
    const md = formatMasterMd(ds);
    // btn-secondary uses colors.primary
    expect(md).toContain(`color: ${ds.colors.primary};`);
    expect(md).toContain(`border: 2px solid ${ds.colors.primary};`);
    // Card uses colors.background
    expect(md).toContain(`background: ${ds.colors.background};`);
    // Input focus uses colors.primary with alpha
    expect(md).toContain(`border-color: ${ds.colors.primary};`);
    expect(md).toContain(`box-shadow: 0 0 0 3px ${ds.colors.primary}20;`);
  });

  it("includes Additional Forbidden Patterns subheader", () => {
    const ds = generator.generate("SaaS dashboard", "TestProject");
    const md = formatMasterMd(ds);
    expect(md).toContain("### Additional Forbidden Patterns");
  });

  it("includes checklist preamble text", () => {
    const ds = generator.generate("SaaS dashboard", "TestProject");
    const md = formatMasterMd(ds);
    expect(md).toContain("Before delivering any UI code, verify:");
  });
});

describe("formatPageOverrideMd", () => {
  it("returns intelligent overrides with page type and layout content when indices provided", () => {
    const ds = generator.generate("SaaS dashboard", "TestProject");
    const md = formatPageOverrideMd(ds, "dashboard", indices, "SaaS dashboard analytics");
    // Should have page type
    expect(md).toContain("**Page Type:**");
    // Should have intelligent sections instead of skeleton
    expect(md).toContain("## Layout Overrides");
    expect(md).toContain("**Max Width:**");
    expect(md).toContain("**Grid:**");
    expect(md).toContain("**Content Density:**");
    expect(md).toContain("## Spacing Overrides");
    expect(md).toContain("## Typography Overrides");
    expect(md).toContain("## Color Overrides");
    expect(md).toContain("## Component Overrides");
    expect(md).toContain("## Page-Specific Components");
    expect(md).toContain("## Recommendations");
    // Should NOT contain skeleton placeholders
    expect(md).not.toContain("No overrides — use Master layout");
  });

  it("returns skeleton fallback without indices (backward compat)", () => {
    const ds = generator.generate("SaaS dashboard", "TestProject");
    const md = formatPageOverrideMd(ds, "dashboard");
    expect(md).toContain("# Dashboard Page Overrides");
    expect(md).toContain("No overrides — use Master layout");
    expect(md).toContain("No overrides — use Master colors");
    expect(md).toContain("No overrides — use Master typography");
    // Should NOT have intelligent page type
    expect(md).not.toContain("**Page Type:**");
  });
});

describe("detectPageType", () => {
  it("detects dashboard from keywords", () => {
    expect(detectPageType("admin dashboard analytics")).toBe("Dashboard");
  });

  it("detects checkout from keywords", () => {
    expect(detectPageType("checkout payment flow")).toBe("Checkout");
  });

  it("detects auth from keywords", () => {
    expect(detectPageType("login signup form")).toBe("Auth");
  });

  it("detects landing from keywords", () => {
    expect(detectPageType("landing page marketing")).toBe("Landing");
  });

  it("detects pricing from keywords", () => {
    expect(detectPageType("pricing plans subscription")).toBe("Pricing");
  });

  it("detects blog from keywords", () => {
    expect(detectPageType("blog article post")).toBe("Blog");
  });

  it("detects settings from keywords", () => {
    expect(detectPageType("settings preferences account")).toBe("Settings");
  });

  it("detects product from keywords", () => {
    expect(detectPageType("product catalog ecommerce")).toBe("Product");
  });

  it("detects search from keywords", () => {
    expect(detectPageType("search results filter")).toBe("Search");
  });

  it("detects empty state from keywords", () => {
    expect(detectPageType("empty onboarding welcome")).toBe("Empty");
  });

  it("returns General for unrecognized context", () => {
    expect(detectPageType("xyzzy foobar baz")).toBe("General");
  });

  it("falls back to style results Best For field", () => {
    const styleResults = [{ "Best For": "SaaS dashboard analytics" }];
    expect(detectPageType("xyzzy foobar", styleResults)).toBe("Dashboard");
  });
});

describe("persistDesignSystem", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes MASTER.md to design-system/<project>/", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-"));
    const ds = generator.generate("SaaS dashboard", "My App");
    const result = persistDesignSystem(ds, undefined, tmpDir);
    expect(result.createdFiles.length).toBe(1);
    expect(result.createdFiles[0]).toContain("MASTER.md");
    expect(fs.existsSync(result.createdFiles[0])).toBe(true);
  });

  it("writes page override file when page is specified", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-"));
    const ds = generator.generate("SaaS dashboard", "My App");
    const result = persistDesignSystem(ds, "dashboard", tmpDir);
    expect(result.createdFiles.length).toBe(2);
    expect(result.createdFiles[1]).toContain("dashboard.md");
    expect(fs.existsSync(result.createdFiles[1])).toBe(true);
  });

  it("writes intelligent override file when page + indices provided", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-"));
    const ds = generator.generate("SaaS dashboard", "My App");
    const result = persistDesignSystem(ds, "dashboard", tmpDir, indices, "SaaS dashboard");
    expect(result.createdFiles.length).toBe(2);
    const pageContent = fs.readFileSync(result.createdFiles[1], "utf-8");
    // Should have intelligent content, not skeleton
    expect(pageContent).toContain("**Page Type:**");
    expect(pageContent).toContain("## Layout Overrides");
    expect(pageContent).not.toContain("No overrides — use Master layout");
  });
});
