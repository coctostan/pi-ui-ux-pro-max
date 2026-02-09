// src/persist.ts
import * as fs from "node:fs";
import * as path from "node:path";
import type { DesignSystem } from "./types.js";

export interface PersistResult {
  status: "success";
  designSystemDir: string;
  createdFiles: string[];
}

/** Persist design system to disk (MASTER.md + optional page override) */
export function persistDesignSystem(
  ds: DesignSystem,
  page: string | undefined,
  outputDir: string,
): PersistResult {
  const projectSlug = ds.projectName.toLowerCase().replace(/\s+/g, "-");
  const designSystemDir = path.join(outputDir, "design-system", projectSlug);
  const pagesDir = path.join(designSystemDir, "pages");

  fs.mkdirSync(designSystemDir, { recursive: true });
  fs.mkdirSync(pagesDir, { recursive: true });

  const createdFiles: string[] = [];

  // Write MASTER.md
  const masterFile = path.join(designSystemDir, "MASTER.md");
  fs.writeFileSync(masterFile, formatMasterMd(ds), "utf-8");
  createdFiles.push(masterFile);

  // Write page override if requested
  if (page) {
    const pageSlug = page.toLowerCase().replace(/\s+/g, "-");
    const pageFile = path.join(pagesDir, `${pageSlug}.md`);
    fs.writeFileSync(pageFile, formatPageOverrideMd(ds, page), "utf-8");
    createdFiles.push(pageFile);
  }

  return { status: "success", designSystemDir, createdFiles };
}

/** Format design system as MASTER.md */
export function formatMasterMd(ds: DesignSystem): string {
  const lines: string[] = [];
  const { pattern, style, colors, typography, keyEffects, antiPatterns } = ds;

  lines.push("# Design System Master File");
  lines.push("");
  lines.push("> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.");
  lines.push("> If that file exists, its rules **override** this Master file.");
  lines.push("> If not, strictly follow the rules below.");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`**Project:** ${ds.projectName}`);
  lines.push(`**Generated:** ${new Date().toISOString().slice(0, 19).replace("T", " ")}`);
  lines.push(`**Category:** ${ds.category}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Global Rules
  lines.push("## Global Rules");
  lines.push("");

  // Color Palette
  lines.push("### Color Palette");
  lines.push("");
  lines.push("| Role | Hex | CSS Variable |");
  lines.push("|------|-----|--------------|");
  lines.push(`| Primary | \`${colors.primary}\` | \`--color-primary\` |`);
  lines.push(`| Secondary | \`${colors.secondary}\` | \`--color-secondary\` |`);
  lines.push(`| CTA/Accent | \`${colors.cta}\` | \`--color-cta\` |`);
  lines.push(`| Background | \`${colors.background}\` | \`--color-background\` |`);
  lines.push(`| Text | \`${colors.text}\` | \`--color-text\` |`);
  lines.push("");
  if (colors.notes) {
    lines.push(`**Color Notes:** ${colors.notes}`);
    lines.push("");
  }

  // Typography
  lines.push("### Typography");
  lines.push("");
  lines.push(`- **Heading Font:** ${typography.heading}`);
  lines.push(`- **Body Font:** ${typography.body}`);
  if (typography.mood) lines.push(`- **Mood:** ${typography.mood}`);
  if (typography.googleFontsUrl) {
    lines.push(`- **Google Fonts:** [${typography.heading} + ${typography.body}](${typography.googleFontsUrl})`);
  }
  lines.push("");
  if (typography.cssImport) {
    lines.push("**CSS Import:**");
    lines.push("```css");
    lines.push(typography.cssImport);
    lines.push("```");
    lines.push("");
  }

  // Spacing Variables
  lines.push("### Spacing Variables");
  lines.push("");
  lines.push("| Token | Value | Usage |");
  lines.push("|-------|-------|-------|");
  lines.push("| `--space-xs` | `4px` / `0.25rem` | Tight gaps |");
  lines.push("| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |");
  lines.push("| `--space-md` | `16px` / `1rem` | Standard padding |");
  lines.push("| `--space-lg` | `24px` / `1.5rem` | Section padding |");
  lines.push("| `--space-xl` | `32px` / `2rem` | Large gaps |");
  lines.push("| `--space-2xl` | `48px` / `3rem` | Section margins |");
  lines.push("| `--space-3xl` | `64px` / `4rem` | Hero padding |");
  lines.push("");

  // Style Guidelines
  lines.push("---");
  lines.push("");
  lines.push("## Style Guidelines");
  lines.push("");
  lines.push(`**Style:** ${style.name}`);
  lines.push("");
  if (style.keywords) { lines.push(`**Keywords:** ${style.keywords}`); lines.push(""); }
  if (style.bestFor) { lines.push(`**Best For:** ${style.bestFor}`); lines.push(""); }
  if (keyEffects) { lines.push(`**Key Effects:** ${keyEffects}`); lines.push(""); }

  // Page Pattern
  lines.push("### Page Pattern");
  lines.push("");
  lines.push(`**Pattern Name:** ${pattern.name}`);
  lines.push("");
  if (pattern.conversion) lines.push(`- **Conversion Strategy:** ${pattern.conversion}`);
  if (pattern.ctaPlacement) lines.push(`- **CTA Placement:** ${pattern.ctaPlacement}`);
  lines.push(`- **Section Order:** ${pattern.sections}`);
  lines.push("");

  // Component Specs
  lines.push("---");
  lines.push("");
  lines.push("## Component Specs");
  lines.push("");
  lines.push("### Buttons");
  lines.push("");
  lines.push("```css");
  lines.push(".btn-primary {");
  lines.push(`  background: ${colors.cta};`);
  lines.push("  color: white;");
  lines.push("  padding: 12px 24px;");
  lines.push("  border-radius: 8px;");
  lines.push("  font-weight: 600;");
  lines.push("  transition: all 200ms ease;");
  lines.push("  cursor: pointer;");
  lines.push("}");
  lines.push("```");
  lines.push("");

  // Anti-Patterns
  lines.push("---");
  lines.push("");
  lines.push("## Anti-Patterns (Do NOT Use)");
  lines.push("");
  if (antiPatterns) {
    for (const item of antiPatterns.split("+").map((s) => s.trim()).filter(Boolean)) {
      lines.push(`- ❌ ${item}`);
    }
  }
  lines.push("");
  lines.push("- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)");
  lines.push("- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer");
  lines.push("- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout");
  lines.push("- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio");
  lines.push("- ❌ **Instant state changes** — Always use transitions (150-300ms)");
  lines.push("- ❌ **Invisible focus states** — Focus states must be visible for a11y");
  lines.push("");

  // Pre-Delivery Checklist
  lines.push("---");
  lines.push("");
  lines.push("## Pre-Delivery Checklist");
  lines.push("");
  lines.push("- [ ] No emojis used as icons (use SVG instead)");
  lines.push("- [ ] All icons from consistent icon set (Heroicons/Lucide)");
  lines.push("- [ ] `cursor-pointer` on all clickable elements");
  lines.push("- [ ] Hover states with smooth transitions (150-300ms)");
  lines.push("- [ ] Light mode: text contrast 4.5:1 minimum");
  lines.push("- [ ] Focus states visible for keyboard navigation");
  lines.push("- [ ] `prefers-reduced-motion` respected");
  lines.push("- [ ] Responsive: 375px, 768px, 1024px, 1440px");
  lines.push("- [ ] No content hidden behind fixed navbars");
  lines.push("- [ ] No horizontal scroll on mobile");
  lines.push("");

  return lines.join("\n");
}

/** Format page-specific override markdown */
export function formatPageOverrideMd(ds: DesignSystem, pageName: string): string {
  const pageTitle = pageName.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const lines: string[] = [];

  lines.push(`# ${pageTitle} Page Overrides`);
  lines.push("");
  lines.push(`> **PROJECT:** ${ds.projectName}`);
  lines.push(`> **Generated:** ${new Date().toISOString().slice(0, 19).replace("T", " ")}`);
  lines.push("");
  lines.push("> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).");
  lines.push("> Only deviations from the Master are documented here.");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Page-Specific Rules");
  lines.push("");
  lines.push("### Layout Overrides");
  lines.push("");
  lines.push("- No overrides — use Master layout");
  lines.push("");
  lines.push("### Color Overrides");
  lines.push("");
  lines.push("- No overrides — use Master colors");
  lines.push("");
  lines.push("### Typography Overrides");
  lines.push("");
  lines.push("- No overrides — use Master typography");
  lines.push("");
  lines.push("## Recommendations");
  lines.push("");
  lines.push("- Refer to MASTER.md for all design rules");
  lines.push("- Add specific overrides as needed for this page");
  lines.push("");

  return lines.join("\n");
}
