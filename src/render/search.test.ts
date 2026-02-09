import { describe, it, expect } from "vitest";
import { Text } from "@mariozechner/pi-tui";
import { renderSearchCall, renderSearchResult } from "./search.js";
import type { SearchToolDetails } from "../types.js";

function mockTheme() {
  const theme: any = {
    fg: (color: string, text: string) => `[${color}:${text}]`,
    bold: (text: string) => `<b>${text}</b>`,
  };
  return theme;
}

describe("renderSearchCall", () => {
  it("returns a Text instance", () => {
    const theme = mockTheme();
    const result = renderSearchCall({ query: "hover effects" }, theme);
    expect(result).toBeInstanceOf(Text);
  });

  it("includes query in output", () => {
    const theme = mockTheme();
    const result = renderSearchCall({ query: "hover effects" }, theme);
    const output = result.render(200).join("\n");
    expect(output).toContain("ui_search");
    expect(output).toContain("hover effects");
  });

  it("includes domain when provided", () => {
    const theme = mockTheme();
    const result = renderSearchCall({ query: "test", domain: "ux" }, theme);
    const output = result.render(200).join("\n");
    expect(output).toContain("ux");
  });

  it("does not include domain arrow when not provided", () => {
    const theme = mockTheme();
    const result = renderSearchCall({ query: "test" }, theme);
    const output = result.render(200).join("\n");
    expect(output).not.toContain("→");
  });
});

describe("renderSearchResult", () => {
  it("shows searching message when partial", () => {
    const theme = mockTheme();
    const result = renderSearchResult(
      { content: [], isError: false },
      { expanded: false, isPartial: true },
      theme,
    );
    expect(result).toBeInstanceOf(Text);
    const output = result.render(200).join("\n");
    expect(output).toContain("Searching");
  });

  it("shows error when isError is true", () => {
    const theme = mockTheme();
    const result = renderSearchResult(
      { content: [{ type: "text", text: "bad query" }], isError: true },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("bad query");
    expect(output).toContain("error");
  });

  it("falls back to content text when no details", () => {
    const theme = mockTheme();
    const result = renderSearchResult(
      { content: [{ type: "text", text: "raw content" }] },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("raw content");
  });

  it("shows compact view with result count and bullets", () => {
    const theme = mockTheme();
    const details: SearchToolDetails = {
      domain: "ux",
      query: "hover effects",
      results: [
        { "Category": "Interaction", "Issue": "Missing hover state", "Severity": "High" },
        { "Category": "Visual", "Issue": "No focus indicator", "Severity": "Medium" },
      ],
    };
    const result = renderSearchResult(
      { content: [], details, isError: false },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("ux");
    expect(output).toContain("2 results");
    expect(output).toContain("Interaction");
    expect(output).toContain("Visual");
  });

  it("shows severity labels in compact view", () => {
    const theme = mockTheme();
    const details: SearchToolDetails = {
      domain: "ux",
      query: "test",
      results: [
        { "Issue": "Problem", "Severity": "Critical" },
      ],
    };
    const result = renderSearchResult(
      { content: [], details, isError: false },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("Critical");
  });

  it("shows expanded view with all fields", () => {
    const theme = mockTheme();
    const details: SearchToolDetails = {
      domain: "ux",
      query: "hover",
      results: [
        { "Category": "Interaction", "Issue": "No hover", "Description": "Elements lack hover states" },
      ],
    };
    const result = renderSearchResult(
      { content: [], details, isError: false },
      { expanded: true, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("ux");
    expect(output).toContain("hover");
    expect(output).toContain("1 results");
    expect(output).toContain("Result 1");
    expect(output).toContain("Category");
    expect(output).toContain("Interaction");
    expect(output).toContain("Description");
  });

  it("truncates long values in expanded view", () => {
    const theme = mockTheme();
    const longValue = "x".repeat(300);
    const details: SearchToolDetails = {
      domain: "ux",
      query: "test",
      results: [{ "Field": longValue }],
    };
    const result = renderSearchResult(
      { content: [], details, isError: false },
      { expanded: true, isPartial: false },
      theme,
    );
    const output = result.render(500).join("\n");
    expect(output).toContain("...");
    // Should not contain the full 300-char string
    expect(output).not.toContain(longValue);
  });
});
