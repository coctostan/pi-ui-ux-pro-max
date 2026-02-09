# API Reference

Complete reference for all tools, commands, prompt templates, and event hooks provided by pi-ui-ux-pro-max.

---

## Tools

### `design_system`

Generate a tailored UI/UX design system by searching curated data across multiple domains.

**Label:** Design System

**Description (sent to LLM):**
> Generate a tailored UI/UX design system by searching curated data (67 styles, 97 color palettes, 57 font pairings, 100 reasoning rules, 24 landing patterns). Returns recommended pattern, style, colors, typography, effects, anti-patterns, and checklist. Call multiple times to explore alternatives — refine the query based on user feedback. Use persist to save to disk.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | ✅ | Descriptive query: product type, industry, mood, keywords |
| `projectName` | `string` | ❌ | Project name for the design system. Defaults to uppercase query. |
| `persist` | `boolean` | ❌ | Save design system to `design-system/<slug>/MASTER.md` |
| `page` | `string` | ❌ | Generate a page-specific override file (e.g., `"landing"`, `"dashboard"`) |

#### Return: Content (sent to LLM)

~400 bytes. Example:

```
Design System: Serenity Spa
Style: Soft UI Evolution | Pattern: Hero-Centric + Social Proof
Colors: primary=#E8B4B8 secondary=#A8D5BA cta=#D4AF37 bg=#FFF5F5 text=#2D3436
Typography: Cormorant Garamond / Montserrat (elegant, calming)
Anti-patterns: neon colors + harsh animations + dark mode
Saved: design-system/serenity-spa/MASTER.md
Refine query or call again to explore alternatives.
```

#### Return: Details (for TUI rendering)

```typescript
interface DesignSystemToolDetails {
  designSystem: DesignSystem;      // Full design system object
  searchScores: Record<string, number>;  // BM25 scores per domain
  query: string;                   // Original query
  persisted?: {
    master?: string;               // Path to MASTER.md
    page?: string;                 // Path to page override
  };
}
```

#### TUI Rendering

**Compact view (default):**
```
  ✓ Serenity Spa (Beauty/Spa Service)
    Style: Soft UI Evolution | Pattern: Hero-Centric + Social Proof
    Colors: #E8B4B8 #A8D5BA #D4AF37
    Typography: Cormorant Garamond / Montserrat
    💾 design-system/serenity-spa/MASTER.md
```

**Expanded view (Ctrl+O):**
Full design system with sections for Pattern, Style, Colors, Typography, Effects, Anti-Patterns, and Pre-Delivery Checklist.

**Partial/streaming view:**
```
  ✓ Product type: Beauty/Spa Service
  ✓ Style: Soft UI Evolution
  ✓ Colors: #E8B4B8 / #A8D5BA / #D4AF37
  ✓ Typography: Cormorant Garamond / Montserrat
  ✓ Pattern: Hero-Centric + Social Proof
```

#### Internal Flow

1. Search `products.csv` → detect product category
2. Match category in `ui-reasoning.csv` → get reasoning rule (style priority, color mood, anti-patterns)
3. Multi-domain BM25 search with reasoning-informed queries:
   - `styles.csv` → style (weighted by priority keywords)
   - `colors.csv` → color palette
   - `typography.csv` → font pairing
   - `landing.csv` → page pattern
4. `selectBestMatch()` — score results against priority keywords
5. Aggregate into `DesignSystem` object
6. Optionally persist to disk

#### Example Queries

```
"luxury e-commerce fashion brand"
"SaaS dashboard analytics dark mode"
"wellness spa booking elegant calming"
"fintech crypto trading platform"
"children education playful colorful"
"portfolio minimal developer personal"
```

---

### `ui_search`

Search the UI/UX knowledge base by domain.

**Label:** UI Search

**Description (sent to LLM):**
> Search the UI/UX knowledge base by domain. Domains: style, color, typography, chart, landing, product, ux, icons, react (performance), web (interface guidelines). Auto-detects domain from query if omitted.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | ✅ | Search keywords |
| `domain` | `enum` | ❌ | One of: `style`, `color`, `typography`, `chart`, `landing`, `product`, `ux`, `icons`, `react`, `web`. Auto-detected from query keywords if omitted. |
| `maxResults` | `number` | ❌ | Maximum results to return. Default: 3. |

#### Return: Content (sent to LLM)

~300-500 bytes depending on results. Example:

```
Domain: ux | Found: 3 results
Category: Animation | Issue: duration-timing | Platform: Web | Description: Animations should be...
Category: Animation | Issue: transform-performance | Platform: Web | Description: Use transform...
Category: Motion | Issue: reduced-motion | Platform: All | Description: Always respect...
```

#### Return: Details (for TUI rendering)

```typescript
interface SearchToolDetails {
  domain: string;     // Resolved domain name
  query: string;      // Original query
  results: CsvRow[];  // Full rows with all output columns
}
```

#### Domain Auto-Detection

When `domain` is omitted, keyword matching determines the best domain:

| Domain | Trigger Keywords |
|--------|-----------------|
| `color` | color, palette, hex, rgb |
| `chart` | chart, graph, visualization, pie, scatter |
| `landing` | landing, page, cta, conversion, hero |
| `product` | saas, ecommerce, fintech, healthcare, gaming |
| `style` | style, design, minimalism, glassmorphism, brutalism |
| `ux` | ux, usability, accessibility, wcag, animation |
| `typography` | font, typography, heading, serif |
| `icons` | icon, lucide, heroicons, svg |
| `react` | react, nextjs, suspense, memo, usecallback |
| `web` | aria, focus, semantic, virtualize, form |

Falls back to `style` if no keywords match.

#### TUI Rendering

**Compact view:**
```
  ✓ ux (3 results)
    • duration-timing (MEDIUM)
    • transform-performance (MEDIUM)
    • reduced-motion (CRITICAL)
```

**Expanded view (Ctrl+O):**
Full result rows with all columns, truncated at 200 characters per value.

---

### `ui_stack_guide`

Get implementation guidelines for a specific tech stack.

**Label:** UI Stack Guide

**Description (sent to LLM):**
> Get implementation guidelines for a specific tech stack. Covers best practices, Do/Don't patterns, and code examples.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | ✅ | What you need guidance on |
| `stack` | `enum` | ❌ | One of: `html-tailwind`, `react`, `nextjs`, `vue`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`, `astro`, `nuxtjs`, `nuxt-ui`. Uses default from `/ui-settings` if omitted. Returns error if no stack specified and no default set. |
| `maxResults` | `number` | ❌ | Maximum results to return. Default: 3. |

#### Return: Content (sent to LLM)

~300-400 bytes. Example:

```
Stack: nextjs | Found: 2 results
image-optimization (HIGH): Use next/image for automatic optimization lazy loading...
layout-component (HIGH): Use app router layouts for shared UI persistent state...
```

#### Return: Details (for TUI rendering)

```typescript
interface StackToolDetails {
  stack: string;      // Stack name
  query: string;      // Original query
  results: CsvRow[];  // Full rows with all columns
}
```

#### TUI Rendering

**Compact view:**
```
  ✓ nextjs (2 results)
    • image-optimization (HIGH)
    • layout-component (HIGH)
```

**Expanded view (Ctrl+O):**
Full guideline rows including Do/Don't, Code Good/Bad, Severity, and Docs URL.

---

## Commands

### `/ui-settings`

View current extension settings.

**Description:** Configure UI/UX Pro Max settings (default stack, auto-inject, format)

**Output:**
```
UI/UX Pro Max Settings
════════════════════════════════════════

  Auto-inject design system:  OFF
  Default stack:              (none)
  Default output format:      markdown

Edit settings in: .pi/ui-ux-pro-max.json
```

#### Settings

Settings are stored in `.pi/ui-ux-pro-max.json` in the project directory.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `autoInjectDesignSystem` | `boolean` | `false` | When `true`, inject active design system summary into every LLM turn (~100 bytes) |
| `defaultStack` | `string \| null` | `null` | Default tech stack for `ui_stack_guide`. One of the 13 supported stacks. |
| `defaultFormat` | `"markdown" \| "ascii"` | `"markdown"` | Reserved for future use. |

#### Example `.pi/ui-ux-pro-max.json`

```json
{
  "autoInjectDesignSystem": true,
  "defaultStack": "react",
  "defaultFormat": "markdown"
}
```

---

## Prompt Templates

### `/ui-checklist`

**File:** `prompts/ui-checklist.md`

**Description:** Pre-delivery UI/UX checklist — verify before shipping

Asks the LLM to review current UI code against a structured checklist with specific file:line references for each item.

**Categories:**

| Category | Items |
|----------|-------|
| Visual Quality | No emoji icons, consistent icon set, no layout-shifting hovers, verified brand logos |
| Interaction | cursor-pointer on clickable elements, hover feedback, 150-300ms transitions, visible focus states |
| Contrast & Color | 4.5:1 contrast ratio, glass elements visible in light mode, borders in both modes |
| Layout | No hidden content behind navbars, responsive at 4 breakpoints, no horizontal scroll |
| Accessibility | Alt text, form labels, color not sole indicator, prefers-reduced-motion |

---

## Event Hooks

### `session_start`

**Trigger:** When a pi session starts or is restored.

**Actions:**
1. Load settings from `.pi/ui-ux-pro-max.json`
2. Reconstruct `activeDesignSystem` from session history — scans for the most recent `design_system` tool result with a `persisted.master` path

### `before_agent_start`

**Trigger:** Before each LLM turn.

**Condition:** Only fires when `autoInjectDesignSystem` is `true` AND an active design system exists.

**Action:** Injects a hidden message with the active design system summary and file path (~100 bytes).

```typescript
{
  customType: "ui-ux-context",
  content: "Active design system: ProjectName: Style | #hex1 #hex2 #hex3\nFull spec: design-system/slug/MASTER.md",
  display: false  // Hidden from user, visible to LLM
}
```

### `context`

**Trigger:** Before messages are sent to the LLM on each turn.

**Action:** Prune old `design_system` tool results. Keeps only the latest result in full; replaces all older results with `"(superseded by later iteration)"`.

**Context savings:**
- 1 iteration: 0 bytes saved
- 2 iterations: ~360 bytes saved
- 4 iterations: ~1,080 bytes saved
- 10 iterations: ~3,240 bytes saved

---

## TypeScript Types

All shared types are defined in `src/types.ts`. Key interfaces:

### DesignSystem

```typescript
interface DesignSystem {
  projectName: string;
  category: string;
  pattern: DesignSystemPattern;
  style: DesignSystemStyle;
  colors: DesignSystemColors;
  typography: DesignSystemTypography;
  keyEffects: string;
  antiPatterns: string;
  decisionRules: Record<string, string>;
  severity: string;
}
```

### DesignSystemColors

```typescript
interface DesignSystemColors {
  primary: string;    // Hex color
  secondary: string;  // Hex color
  cta: string;        // Hex color
  background: string; // Hex color
  text: string;       // Hex color
  notes: string;      // Usage notes
}
```

### DesignSystemTypography

```typescript
interface DesignSystemTypography {
  heading: string;        // Font name
  body: string;           // Font name
  mood: string;           // Mood keywords
  bestFor: string;        // Best use cases
  googleFontsUrl: string; // Google Fonts link
  cssImport: string;      // CSS @import statement
}
```

### UiUxSettings

```typescript
interface UiUxSettings {
  autoInjectDesignSystem: boolean;
  defaultStack: StackName | null;
  defaultFormat: "markdown" | "ascii";
}
```

### Domain / StackName

```typescript
type Domain = "style" | "color" | "chart" | "landing" | "product" |
              "ux" | "typography" | "icons" | "react" | "web";

type StackName = "html-tailwind" | "react" | "nextjs" | "vue" | "svelte" |
                 "swiftui" | "react-native" | "flutter" | "shadcn" |
                 "jetpack-compose" | "astro" | "nuxtjs" | "nuxt-ui";
```

---

## Programmatic API

The following functions can be imported directly for use in tests or other extensions:

### Search

```typescript
import { initSearchIndices, searchDomain, searchStack, detectDomain } from "./src/search.js";

const indices = initSearchIndices(dataDir);
const result = searchDomain("fintech dashboard", "style", 3, indices);
const stackResult = searchStack("responsive images", "nextjs", 3, indices);
const domain = detectDomain("chart visualization data");  // → "chart"
```

### Design System Generation

```typescript
import { DesignSystemGenerator } from "./src/design-system.js";

const generator = new DesignSystemGenerator(dataDir, indices);
const ds = generator.generate("wellness spa booking", "Serenity Spa");
```

### Persistence

```typescript
import { persistDesignSystem, formatMasterMd, formatPageOverrideMd } from "./src/persist.js";

const result = persistDesignSystem(ds, "landing", "/path/to/project");
const markdown = formatMasterMd(ds);
```

### Settings

```typescript
import { loadSettings, saveSettings } from "./src/settings.js";

const settings = loadSettings("/path/to/.pi");
settings.defaultStack = "react";
saveSettings("/path/to/.pi", settings);
```

### CSV Loading

```typescript
import { parseCsv, loadDomain, loadStack, getDataDir } from "./src/csv-loader.js";

const rows = parseCsv(csvText);
const indexed = loadDomain("color", dataDir);
```

### BM25 Search

```typescript
import { BM25 } from "./src/bm25.js";

const bm25 = new BM25(1.5, 0.75);
bm25.fit(["document one text", "document two text", "document three"]);
const scores = bm25.score("one text");  // → [[0, 2.3], [1, 1.1], [2, 0]]
```
