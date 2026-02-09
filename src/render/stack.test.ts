import { describe, it, expect } from "vitest";
import { Text } from "@mariozechner/pi-tui";
import { renderStackCall, renderStackResult } from "./stack.js";
import type { StackToolDetails } from "../types.js";

function mockTheme() {
  const theme: any = {
    fg: (color: string, text: string) => `[${color}:${text}]`,
    bold: (text: string) => `<b>${text}</b>`,
  };
  return theme;
}

describe("renderStackCall", () => {
  it("returns a Text instance", () => {
    const theme = mockTheme();
    const result = renderStackCall({ query: "button component", stack: "react" }, theme);
    expect(result).toBeInstanceOf(Text);
  });

  it("includes query and stack in output", () => {
    const theme = mockTheme();
    const result = renderStackCall({ query: "button component", stack: "react" }, theme);
    const output = result.render(200).join("\n");
    expect(output).toContain("ui_stack_guide");
    expect(output).toContain("button component");
    expect(output).toContain("react");
  });
});

describe("renderStackResult", () => {
  it("shows searching message when partial", () => {
    const theme = mockTheme();
    const result = renderStackResult(
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
    const result = renderStackResult(
      { content: [{ type: "text", text: "Stack not found" }], isError: true },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("Stack not found");
    expect(output).toContain("error");
  });

  it("falls back to content text when no details", () => {
    const theme = mockTheme();
    const result = renderStackResult(
      { content: [{ type: "text", text: "raw stack content" }] },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("raw stack content");
  });

  it("shows compact view with stack name and result bullets", () => {
    const theme = mockTheme();
    const details: StackToolDetails = {
      stack: "react",
      query: "state management",
      results: [
        { "Guideline": "Use useState for local state", "Severity": "High" },
        { "Guideline": "Avoid prop drilling", "Severity": "Medium" },
      ],
    };
    const result = renderStackResult(
      { content: [], details, isError: false },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("react");
    expect(output).toContain("2 results");
    expect(output).toContain("Use useState for local state");
    expect(output).toContain("Avoid prop drilling");
  });

  it("shows severity in compact view", () => {
    const theme = mockTheme();
    const details: StackToolDetails = {
      stack: "react",
      query: "test",
      results: [{ "Guideline": "Test guideline", "Severity": "Critical" }],
    };
    const result = renderStackResult(
      { content: [], details, isError: false },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("Critical");
  });

  it("uses first column value when Guideline is missing in compact view", () => {
    const theme = mockTheme();
    const details: StackToolDetails = {
      stack: "vue",
      query: "test",
      results: [{ "Category": "Performance", "Description": "Use computed" }],
    };
    const result = renderStackResult(
      { content: [], details, isError: false },
      { expanded: false, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("Performance");
  });

  it("shows expanded view with all fields", () => {
    const theme = mockTheme();
    const details: StackToolDetails = {
      stack: "nextjs",
      query: "routing",
      results: [
        { "Category": "Navigation", "Guideline": "Use App Router", "Description": "Prefer the new app directory" },
      ],
    };
    const result = renderStackResult(
      { content: [], details, isError: false },
      { expanded: true, isPartial: false },
      theme,
    );
    const output = result.render(200).join("\n");
    expect(output).toContain("nextjs");
    expect(output).toContain("routing");
    expect(output).toContain("1 results");
    expect(output).toContain("Result 1");
    expect(output).toContain("Category");
    expect(output).toContain("Navigation");
    expect(output).toContain("Guideline");
    expect(output).toContain("Use App Router");
  });

  it("truncates long values in expanded view", () => {
    const theme = mockTheme();
    const longValue = "y".repeat(300);
    const details: StackToolDetails = {
      stack: "react",
      query: "test",
      results: [{ "Code": longValue }],
    };
    const result = renderStackResult(
      { content: [], details, isError: false },
      { expanded: true, isPartial: false },
      theme,
    );
    const output = result.render(500).join("\n");
    expect(output).toContain("...");
    expect(output).not.toContain(longValue);
  });
});
