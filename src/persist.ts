// src/persist.ts
import * as fs from "node:fs";
import * as path from "node:path";
import type { DesignSystem, CsvRow } from "./types.js";
import type { SearchIndices } from "./search.js";
import { searchDomain } from "./search.js";

/** Sanitize a string for use as a directory/file name */
function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unnamed";
}

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
  indices?: SearchIndices,
  pageQuery?: string,
): PersistResult {
  const projectSlug = slugify(ds.projectName);
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
    const pageSlug = slugify(page);
    const pageFile = path.join(pagesDir, `${pageSlug}.md`);
    fs.writeFileSync(pageFile, formatPageOverrideMd(ds, page, indices, pageQuery), "utf-8");
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

  // Shadow Depths
  lines.push("### Shadow Depths");
  lines.push("");
  lines.push("| Level | Value | Usage |");
  lines.push("|-------|-------|-------|");
  lines.push("| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |");
  lines.push("| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |");
  lines.push("| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |");
  lines.push("| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |");
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
  lines.push(".btn-primary:hover {");
  lines.push(`  background: ${colors.cta}dd;`);
  lines.push("  transform: translateY(-1px);");
  lines.push("  box-shadow: var(--shadow-md);");
  lines.push("}");
  lines.push(`.btn-secondary {`);
  lines.push(`  background: transparent;`);
  lines.push(`  color: ${colors.primary};`);
  lines.push(`  border: 2px solid ${colors.primary};`);
  lines.push("  padding: 12px 24px;");
  lines.push("  border-radius: 8px;");
  lines.push("  font-weight: 600;");
  lines.push("  transition: all 200ms ease;");
  lines.push("  cursor: pointer;");
  lines.push("}");
  lines.push(".btn-secondary:hover {");
  lines.push(`  background: ${colors.primary};`);
  lines.push("  color: white;");
  lines.push("}");
  lines.push("```");
  lines.push("");

  // Cards
  lines.push("### Cards");
  lines.push("");
  lines.push("```css");
  lines.push(".card {");
  lines.push(`  background: ${colors.background};`);
  lines.push("  border-radius: 12px;");
  lines.push("  padding: var(--space-lg);");
  lines.push("  box-shadow: var(--shadow-md);");
  lines.push("  transition: all 200ms ease;");
  lines.push("}");
  lines.push(".card:hover {");
  lines.push("  transform: translateY(-2px);");
  lines.push("  box-shadow: var(--shadow-lg);");
  lines.push("}");
  lines.push("```");
  lines.push("");

  // Inputs
  lines.push("### Inputs");
  lines.push("");
  lines.push("```css");
  lines.push(".input {");
  lines.push("  width: 100%;");
  lines.push("  padding: 10px 14px;");
  lines.push("  border: 1px solid #d1d5db;");
  lines.push("  border-radius: 8px;");
  lines.push("  font-size: 1rem;");
  lines.push("  transition: all 150ms ease;");
  lines.push("}");
  lines.push(".input:focus {");
  lines.push("  outline: none;");
  lines.push(`  border-color: ${colors.primary};`);
  lines.push(`  box-shadow: 0 0 0 3px ${colors.primary}20;`);
  lines.push("}");
  lines.push("```");
  lines.push("");

  // Modals
  lines.push("### Modals");
  lines.push("");
  lines.push("```css");
  lines.push(".modal-overlay {");
  lines.push("  position: fixed;");
  lines.push("  inset: 0;");
  lines.push("  background: rgba(0, 0, 0, 0.5);");
  lines.push("  backdrop-filter: blur(4px);");
  lines.push("  display: flex;");
  lines.push("  align-items: center;");
  lines.push("  justify-content: center;");
  lines.push("  z-index: 50;");
  lines.push("}");
  lines.push(".modal {");
  lines.push(`  background: ${colors.background};`);
  lines.push("  border-radius: 16px;");
  lines.push("  padding: var(--space-xl);");
  lines.push("  box-shadow: var(--shadow-xl);");
  lines.push("  max-width: 500px;");
  lines.push("  width: 90%;");
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
  lines.push("### Additional Forbidden Patterns");
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
  lines.push("Before delivering any UI code, verify:");
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
export function formatPageOverrideMd(
  ds: DesignSystem,
  pageName: string,
  indices?: SearchIndices,
  pageQuery?: string,
): string {
  // When indices are available, generate intelligent overrides
  if (indices && pageQuery) {
    return generateIntelligentOverrides(pageName, pageQuery, ds, indices);
  }

  // Skeleton fallback (backward compatible)
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

// ============ Intelligent Page Overrides ============

interface LayoutInference {
  maxWidth: string;
  columns: string;
  density: string;
}

/** Infer layout from style search keywords */
function inferLayout(styleResults: CsvRow[]): LayoutInference {
  if (!styleResults.length) return { maxWidth: "1200px", columns: "full-width sections", density: "standard" };

  const text = styleResults.map((r) =>
    Object.values(r).join(" "),
  ).join(" ").toLowerCase();

  if (/data|dense|dashboard|grid|table/.test(text)) {
    return { maxWidth: "1400px", columns: "12-column grid", density: "high" };
  }
  if (/minimal|simple|clean|zen/.test(text)) {
    return { maxWidth: "800px", columns: "single column", density: "low" };
  }
  return { maxWidth: "1200px", columns: "full-width sections", density: "standard" };
}

/** Generate intelligent page overrides using BM25 search */
function generateIntelligentOverrides(
  pageName: string,
  pageQuery: string,
  ds: DesignSystem,
  indices: SearchIndices,
): string {
  const pageTitle = pageName.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const context = `${pageName} ${pageQuery}`;

  // Search 1: Style — infer layout from keywords
  const styleResult = searchDomain(context, "style", 1, indices);
  const layout = inferLayout(styleResult.results);

  // Extract effects recommendations from style results
  const effectsRecs: string[] = [];
  for (const row of styleResult.results) {
    const effects = row["Effects & Animation"] ?? "";
    if (effects) effectsRecs.push(effects);
  }

  // Search 2: UX — Do recommendations, Don't component warnings
  const uxResult = searchDomain(context, "ux", 3, indices);
  const uxDos: string[] = [];
  const uxDonts: string[] = [];
  for (const row of uxResult.results) {
    const doText = row["Do"] ?? "";
    const dontText = row["Don't"] ?? "";
    if (doText) uxDos.push(doText);
    if (dontText) uxDonts.push(dontText);
  }

  // Search 3: Landing — section order, CTA placement, color strategy
  const landingResult = searchDomain(context, "landing", 1, indices);
  const landingRow = landingResult.results[0];

  // Detect page type
  const pageType = detectPageType(context, styleResult.results);

  const lines: string[] = [];

  // Header
  lines.push(`# ${pageTitle} Page Overrides`);
  lines.push("");
  lines.push(`> **PROJECT:** ${ds.projectName}`);
  lines.push(`> **Generated:** ${new Date().toISOString().slice(0, 19).replace("T", " ")}`);
  lines.push(`> **Page Type:** ${pageType}`);
  lines.push("");
  lines.push("> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).");
  lines.push("> Only deviations from the Master are documented here.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Layout Overrides
  lines.push("## Layout Overrides");
  lines.push("");
  lines.push(`- **Max Width:** ${layout.maxWidth}`);
  lines.push(`- **Grid:** ${layout.columns}`);
  lines.push(`- **Content Density:** ${layout.density}`);
  lines.push("");

  // Spacing Overrides
  lines.push("## Spacing Overrides");
  lines.push("");
  if (layout.density === "high") {
    lines.push("- Reduce `--space-lg` to `16px` for tighter data layouts");
    lines.push("- Use `--space-xs` between grid items");
  } else if (layout.density === "low") {
    lines.push("- Increase `--space-2xl` to `64px` for breathing room");
    lines.push("- Use `--space-xl` between content blocks");
  } else {
    lines.push("- Use Master spacing defaults");
  }
  lines.push("");

  // Typography Overrides
  lines.push("## Typography Overrides");
  lines.push("");
  if (pageType === "Blog" || pageType === "Product") {
    lines.push("- Body font size: `1.125rem` for readability");
    lines.push("- Line height: `1.75` for long-form content");
  } else if (pageType === "Dashboard") {
    lines.push("- Data labels: `0.75rem` with `font-weight: 500`");
    lines.push("- Metric values: `1.5rem` with heading font");
  } else {
    lines.push("- Use Master typography defaults");
  }
  lines.push("");

  // Color Overrides
  lines.push("## Color Overrides");
  lines.push("");
  if (landingRow?.["Color Strategy"]) {
    lines.push(`- **Color Strategy:** ${landingRow["Color Strategy"]}`);
  }
  if (pageType === "Auth") {
    lines.push("- Subdued background: reduce visual noise for form focus");
    lines.push(`- Primary action: \`${ds.colors.cta}\` for submit buttons only`);
  } else if (pageType === "Dashboard") {
    lines.push("- Use semantic colors for status indicators (success/warning/error)");
    lines.push(`- Charts: derive palette from \`${ds.colors.primary}\` with opacity variants`);
  } else {
    lines.push("- Use Master color palette");
  }
  lines.push("");

  // Component Overrides
  lines.push("## Component Overrides");
  lines.push("");
  if (uxDonts.length) {
    lines.push("**⚠️ Component Warnings:**");
    lines.push("");
    for (const d of uxDonts) {
      lines.push(`- ❌ ${d}`);
    }
    lines.push("");
  }
  if (effectsRecs.length) {
    lines.push("**Recommended Effects:**");
    lines.push("");
    for (const e of effectsRecs) {
      lines.push(`- ✨ ${e}`);
    }
    lines.push("");
  }

  // Page-Specific Components
  lines.push("## Page-Specific Components");
  lines.push("");
  if (landingRow) {
    if (landingRow["Section Order"]) {
      lines.push(`- **Section Order:** ${landingRow["Section Order"]}`);
    }
    if (landingRow["Primary CTA Placement"]) {
      lines.push(`- **CTA Placement:** ${landingRow["Primary CTA Placement"]}`);
    }
    if (landingRow["Conversion Optimization"]) {
      lines.push(`- **Conversion Strategy:** ${landingRow["Conversion Optimization"]}`);
    }
  } else {
    lines.push("- Use Master component specs");
  }
  lines.push("");

  // Recommendations
  lines.push("## Recommendations");
  lines.push("");
  if (uxDos.length) {
    for (const d of uxDos) {
      lines.push(`- ✅ ${d}`);
    }
  } else {
    lines.push("- Refer to MASTER.md for all design rules");
  }
  lines.push("");

  return lines.join("\n");
}

const PAGE_TYPE_KEYWORDS: Record<string, string[]> = {
  Dashboard: ["dashboard", "analytics", "metrics", "admin", "panel", "stats"],
  Checkout: ["checkout", "cart", "payment", "billing", "order"],
  Settings: ["settings", "preferences", "config", "account", "profile"],
  Landing: ["landing", "homepage", "home", "marketing", "launch"],
  Auth: ["auth", "login", "signup", "register", "sign-in", "sign-up"],
  Pricing: ["pricing", "plans", "subscription", "tier"],
  Blog: ["blog", "article", "post", "content", "editorial"],
  Product: ["product", "catalog", "shop", "store", "ecommerce"],
  Search: ["search", "results", "filter", "browse", "explore"],
  Empty: ["empty", "onboarding", "welcome", "getting-started", "zero-state"],
};

/** Detect page type from context and style search results */
export function detectPageType(context: string, styleResults?: CsvRow[]): string {
  const ctx = context.toLowerCase();

  let bestType = "";
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(PAGE_TYPE_KEYWORDS)) {
    const score = keywords.filter((kw) => ctx.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  if (bestType) return bestType;

  // Fallback: check style results "Best For" field
  if (styleResults?.length) {
    const bestFor = (styleResults[0]["Best For"] ?? "").toLowerCase();
    for (const [type, keywords] of Object.entries(PAGE_TYPE_KEYWORDS)) {
      if (keywords.some((kw) => bestFor.includes(kw))) return type;
    }
  }

  return "General";
}
