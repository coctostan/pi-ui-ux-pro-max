import { Text } from "@mariozechner/pi-tui";
import type { DesignSystem, DesignSystemToolDetails } from "../types.js";

export function renderDesignSystemCall(
  args: { query: string; projectName?: string; persist?: boolean; page?: string },
  theme: any,
): any {
  let text = theme.fg("toolTitle", theme.bold("design_system "));
  text += theme.fg("dim", `"${args.query}"`);
  if (args.projectName) text += theme.fg("muted", ` → ${args.projectName}`);
  if (args.persist) text += theme.fg("success", " 💾");
  return new Text(text, 0, 0);
}

export function renderDesignSystemResult(
  result: { content: Array<{ type: string; text: string }>; details?: DesignSystemToolDetails; isError?: boolean },
  options: { expanded: boolean; isPartial: boolean },
  theme: any,
): any {
  // Handle partial/streaming
  if (options.isPartial) {
    const details = result.details;
    if (!details) return new Text(theme.fg("warning", "  Searching..."), 0, 0);
    const ds = details.designSystem;
    const lines: string[] = [];
    if (ds.category) lines.push(theme.fg("success", "  ✓ ") + theme.fg("muted", `Product type: ${ds.category}`));
    if (ds.style.name) lines.push(theme.fg("success", "  ✓ ") + theme.fg("muted", `Style: ${ds.style.name}`));
    if (ds.colors.primary) {
      lines.push(theme.fg("success", "  ✓ ") + theme.fg("muted", `Colors: ${ds.colors.primary} / ${ds.colors.secondary} / ${ds.colors.cta}`));
    }
    if (ds.typography.heading) {
      lines.push(theme.fg("success", "  ✓ ") + theme.fg("muted", `Typography: ${ds.typography.heading} / ${ds.typography.body}`));
    }
    if (ds.pattern.name) lines.push(theme.fg("success", "  ✓ ") + theme.fg("muted", `Pattern: ${ds.pattern.name}`));
    return new Text(lines.join("\n"), 0, 0);
  }

  // Handle error
  if (result.isError) {
    const errText = result.content.map((c) => c.text).join("");
    return new Text(theme.fg("error", `  ✗ ${errText}`), 0, 0);
  }

  const details = result.details;
  if (!details?.designSystem) {
    return new Text(theme.fg("dim", result.content.map((c) => c.text).join("")), 0, 0);
  }

  const ds = details.designSystem;

  // Compact view (default)
  if (!options.expanded) {
    const lines: string[] = [];
    lines.push(theme.fg("success", "  ✓ ") + theme.bold(ds.projectName) + theme.fg("dim", ` (${ds.category})`));
    lines.push(theme.fg("dim", "    Style: ") + ds.style.name + theme.fg("dim", " | Pattern: ") + ds.pattern.name);
    lines.push(theme.fg("dim", "    Colors: ") + `${ds.colors.primary} ${ds.colors.secondary} ${ds.colors.cta}`);
    lines.push(theme.fg("dim", "    Typography: ") + `${ds.typography.heading} / ${ds.typography.body}`);
    if (details.persisted?.master) {
      lines.push(theme.fg("success", "    💾 ") + theme.fg("dim", details.persisted.master));
    }
    return new Text(lines.join("\n"), 0, 0);
  }

  // Expanded view — full design system details
  return new Text(formatExpandedDesignSystem(ds, details, theme), 0, 0);
}

function formatExpandedDesignSystem(ds: DesignSystem, details: DesignSystemToolDetails, theme: any): string {
  const lines: string[] = [];
  const h = (t: string) => theme.fg("accent", theme.bold(t));
  const d = (t: string) => theme.fg("dim", t);

  lines.push(h(`  Design System: ${ds.projectName}`) + d(` (${ds.category})`));
  lines.push("");
  lines.push(h("  Pattern"));
  lines.push(`    Name: ${ds.pattern.name}`);
  if (ds.pattern.conversion) lines.push(`    Conversion: ${ds.pattern.conversion}`);
  if (ds.pattern.ctaPlacement) lines.push(`    CTA: ${ds.pattern.ctaPlacement}`);
  lines.push(`    Sections: ${ds.pattern.sections}`);
  lines.push("");
  lines.push(h("  Style"));
  lines.push(`    ${ds.style.name}` + d(` (${ds.style.type})`));
  if (ds.style.keywords) lines.push(d(`    Keywords: ${ds.style.keywords}`));
  if (ds.style.bestFor) lines.push(d(`    Best For: ${ds.style.bestFor}`));
  if (ds.style.performance) lines.push(d(`    Performance: ${ds.style.performance} | Accessibility: ${ds.style.accessibility}`));
  lines.push("");
  lines.push(h("  Colors"));
  lines.push(`    Primary:    ${ds.colors.primary}`);
  lines.push(`    Secondary:  ${ds.colors.secondary}`);
  lines.push(`    CTA:        ${ds.colors.cta}`);
  lines.push(`    Background: ${ds.colors.background}`);
  lines.push(`    Text:       ${ds.colors.text}`);
  if (ds.colors.notes) lines.push(d(`    Notes: ${ds.colors.notes}`));
  lines.push("");
  lines.push(h("  Typography"));
  lines.push(`    Heading: ${ds.typography.heading}`);
  lines.push(`    Body: ${ds.typography.body}`);
  if (ds.typography.mood) lines.push(d(`    Mood: ${ds.typography.mood}`));
  if (ds.typography.googleFontsUrl) lines.push(d(`    Fonts: ${ds.typography.googleFontsUrl}`));
  lines.push("");
  if (ds.keyEffects) { lines.push(h("  Effects")); lines.push(`    ${ds.keyEffects}`); lines.push(""); }
  if (ds.antiPatterns) {
    lines.push(h("  Anti-Patterns"));
    for (const item of ds.antiPatterns.split("+").map((s) => s.trim()).filter(Boolean)) {
      lines.push(theme.fg("error", `    ✗ `) + item);
    }
    lines.push("");
  }
  lines.push(h("  Pre-Delivery Checklist"));
  lines.push(theme.fg("muted", "    [ ] No emojis as icons (use SVG: Heroicons/Lucide)"));
  lines.push(theme.fg("muted", "    [ ] cursor-pointer on all clickable elements"));
  lines.push(theme.fg("muted", "    [ ] Hover states with smooth transitions (150-300ms)"));
  lines.push(theme.fg("muted", "    [ ] Light mode: text contrast 4.5:1 minimum"));
  lines.push(theme.fg("muted", "    [ ] Focus states visible for keyboard nav"));
  lines.push(theme.fg("muted", "    [ ] prefers-reduced-motion respected"));
  lines.push(theme.fg("muted", "    [ ] Responsive: 375px, 768px, 1024px, 1440px"));
  if (details.persisted?.master) {
    lines.push(""); lines.push(theme.fg("success", `  💾 Saved: ${details.persisted.master}`));
    if (details.persisted.page) lines.push(theme.fg("success", `  💾 Page: ${details.persisted.page}`));
  }
  return lines.join("\n");
}
