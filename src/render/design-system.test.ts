import { describe, it, expect } from "vitest";
import { Text } from "@mariozechner/pi-tui";
import { renderDesignSystemCall, renderDesignSystemResult } from "./design-system.js";
import type { DesignSystem, DesignSystemToolDetails } from "../types.js";

// Mock theme that wraps text with markers so we can verify coloring
function mockTheme() {
  const theme: any = {
    fg: (color: string, text: string) => `[${color}:${text}]`,
    bold: (text: string) => `<b>${text}</b>`,
  };
  return theme;
}

function makeDesignSystem(overrides: Partial<DesignSystem> = {}): DesignSystem {
  return {
    projectName: "TestProject",
    category: "SaaS",
    pattern: {
      name: "Hero-Features-Social",
      sections: "Hero → Features → Social Proof → CTA",
      ctaPlacement: "Above fold",
      colorStrategy: "Trust-first",
      conversion: "Free trial emphasis",
    },
    style: {
      name: "Corporate Clean",
      type: "Professional",
      effects: "Subtle shadows",
      keywords: "clean, minimal",
      bestFor: "B2B SaaS",
      performance: "High",
      accessibility: "AAA",
    },
    colors: {
      primary: "#2563EB",
      secondary: "#7C3AED",
      cta: "#F59E0B",
      background: "#FFFFFF",
      text: "#111827",
      notes: "High contrast",
    },
    typography: {
      heading: "Inter",
      body: "System UI",
      mood: "Professional",
      bestFor: "SaaS dashboards",
      googleFontsUrl: "https://fonts.google.com/inter",
      cssImport: "@import url(...)",
    },
    keyEffects: "Subtle hover transitions",
    antiPatterns: "Heavy animations + Auto-playing video",
    decisionRules: {},
    severity: "medium",
    ...overrides,
  };
}

describe("renderDesignSystemCall", () => {
  it("returns a Text instance with query", () => {
    const theme = mockTheme();
    const result = renderDesignSystemCall({ query: "SaaS dashboard" }, theme);
    expect(result).toBeInstanceOf(Text);
  });

  it("includes the query in output", () => {
    const theme = mockTheme();
    const result = renderDesignSystemCall({ query: "SaaS dashboard" }, theme);
    // Text constructor takes (text, paddingX, paddingY)
    // We can't easily access private text, but we can verify it's a Text
    // Let's render it to check content
    const rendered = result.render(200);
    const output = rendered.join("\n");
    expect(output).toContain("design_system");
    expect(output).toContain("SaaS dashboard");
  });

  it("includes projectName when provided", () => {
    const theme = mockTheme();
    const result = renderDesignSystemCall({ query: "test", projectName: "MyApp" }, theme);
    const output = result.render(200).join("\n");
    expect(output).toContain("MyApp");
  });

  it("includes persist indicator when true", () => {
    const theme = mockTheme();
    const result = renderDesignSystemCall({ query: "test", persist: true }, theme);
    const output = result.render(200).join("\n");
    expect(output).toContain("💾");
  });

  it("does not include persist indicator when false", () => {
    const theme = mockTheme();
    const result = renderDesignSystemCall({ query: "test", persist: false }, theme);
    const output = result.render(200).join("\n");
    expect(output).not.toContain("💾");
  });
});

describe("renderDesignSystemResult", () => {
  it("shows searching message when partial with no details", () => {
    const theme = mockTheme();
    const result = renderDesignSystemResult(
      { content: [], isError: false },
      { expanded: false, isPartial: true },
      theme,
    );
    expect(result).toBeInstanceOf(Text);
    const output = result.render(200).join("\n");
    expect(output).toContain("Searching");
  });

  it("shows partial progress with design system details", () => {
    const theme = mockTheme();
    const ds = makeDesignSystem();
    const details: DesignSystemToolDetails = {
      designSystem: ds,
      searchScores: {},
      query: "test",
    };
    const result = renderDesignSystemResult(
      { content: [], details, isError: false },
      { expanded: false, isPartial: true },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("SaaS");
    expect(output).toContain("Corporate Clean");
    expect(output).toContain("#2563EB");
  });

  it("shows error message when isError is true", () => {
    const theme = mockTheme();
    const result = renderDesignSystemResult(
      { content: [{ type: "text", text: "Something went wrong" }], isError: true },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("Something went wrong");
    expect(output).toContain("error");
  });

  it("falls back to content text when no details", () => {
    const theme = mockTheme();
    const result = renderDesignSystemResult(
      { content: [{ type: "text", text: "fallback content" }] },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("fallback content");
  });

  it("shows compact view by default (not expanded)", () => {
    const theme = mockTheme();
    const ds = makeDesignSystem();
    const details: DesignSystemToolDetails = {
      designSystem: ds,
      searchScores: {},
      query: "test",
    };
    const result = renderDesignSystemResult(
      { content: [], details, isError: false },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("TestProject");
    expect(output).toContain("SaaS");
    expect(output).toContain("Corporate Clean");
    expect(output).toContain("#2563EB");
    expect(output).toContain("Inter");
  });

  it("shows persisted path in compact view", () => {
    const theme = mockTheme();
    const ds = makeDesignSystem();
    const details: DesignSystemToolDetails = {
      designSystem: ds,
      searchScores: {},
      query: "test",
      persisted: { master: "/path/to/design-system.md" },
    };
    const result = renderDesignSystemResult(
      { content: [], details, isError: false },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("💾");
    expect(output).toContain("/path/to/design-system.md");
  });

  it("shows expanded view with full details", () => {
    const theme = mockTheme();
    const ds = makeDesignSystem();
    const details: DesignSystemToolDetails = {
      designSystem: ds,
      searchScores: {},
      query: "test",
    };
    const result = renderDesignSystemResult(
      { content: [], details, isError: false },
      { expanded: true, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    // Expanded should include section headers
    expect(output).toContain("Pattern");
    expect(output).toContain("Style");
    expect(output).toContain("Colors");
    expect(output).toContain("Typography");
    expect(output).toContain("Anti-Patterns");
    expect(output).toContain("Pre-Delivery Checklist");
    // Should include detailed values
    expect(output).toContain("Hero-Features-Social");
    expect(output).toContain("#FFFFFF");
    expect(output).toContain("Inter");
    expect(output).toContain("System UI");
    expect(output).toContain("prefers-reduced-motion");
  });

  it("shows persisted paths in expanded view", () => {
    const theme = mockTheme();
    const ds = makeDesignSystem();
    const details: DesignSystemToolDetails = {
      designSystem: ds,
      searchScores: {},
      query: "test",
      persisted: { master: "/path/master.md", page: "/path/page.md" },
    };
    const result = renderDesignSystemResult(
      { content: [], details, isError: false },
      { expanded: true, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("/path/master.md");
    expect(output).toContain("/path/page.md");
  });

  it("shows anti-patterns split by + in expanded view", () => {
    const theme = mockTheme();
    const ds = makeDesignSystem({ antiPatterns: "Heavy animations + Auto-playing video" });
    const details: DesignSystemToolDetails = {
      designSystem: ds,
      searchScores: {},
      query: "test",
    };
    const result = renderDesignSystemResult(
      { content: [], details, isError: false },
      { expanded: true, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("Heavy animations");
    expect(output).toContain("Auto-playing video");
  });
});
