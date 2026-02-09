import { Text } from "@mariozechner/pi-tui";
import type { SearchToolDetails } from "../types.js";

export function renderSearchCall(
  args: { query: string; domain?: string; maxResults?: number },
  theme: any,
): any {
  let text = theme.fg("toolTitle", theme.bold("ui_search "));
  text += theme.fg("dim", `"${args.query}"`);
  if (args.domain) text += theme.fg("muted", ` → ${args.domain}`);
  return new Text(text, 0, 0);
}

export function renderSearchResult(
  result: { content: Array<{ type: string; text: string }>; details?: SearchToolDetails; isError?: boolean },
  options: { expanded: boolean; isPartial: boolean },
  theme: any,
): any {
  if (options.isPartial) return new Text(theme.fg("warning", "  Searching..."), 0, 0);
  if (result.isError) return new Text(theme.fg("error", `  ✗ ${result.content.map((c) => c.text).join("")}`), 0, 0);
  const details = result.details;
  if (!details) return new Text(theme.fg("dim", result.content.map((c) => c.text).join("")), 0, 0);

  if (!options.expanded) {
    const lines: string[] = [];
    lines.push(theme.fg("success", "  ✓ ") + theme.fg("muted", `${details.domain}`) + theme.fg("dim", ` (${details.results.length} results)`));
    for (const row of details.results) {
      const firstVal = Object.values(row)[0] ?? "";
      const severity = row["Severity"] ?? "";
      const label = severity ? theme.fg("warning", ` (${severity})`) : "";
      lines.push(theme.fg("dim", "    • ") + firstVal + label);
    }
    return new Text(lines.join("\n"), 0, 0);
  }

  // Expanded view
  const lines: string[] = [];
  lines.push(theme.fg("accent", theme.bold(`  ${details.domain}`)) + theme.fg("dim", ` — "${details.query}" — ${details.results.length} results`));
  lines.push("");
  for (let i = 0; i < details.results.length; i++) {
    const row = details.results[i];
    lines.push(theme.fg("accent", `  Result ${i + 1}`));
    for (const [key, value] of Object.entries(row)) {
      if (value) {
        const truncated = value.length > 200 ? value.slice(0, 200) + "..." : value;
        lines.push(theme.fg("dim", `    ${key}: `) + truncated);
      }
    }
    lines.push("");
  }
  return new Text(lines.join("\n"), 0, 0);
}
