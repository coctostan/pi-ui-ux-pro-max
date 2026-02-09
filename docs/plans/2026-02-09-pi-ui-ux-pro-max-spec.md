# pi-ui-ux-pro-max — Project Spec & Roadmap

> A pi package that provides UI/UX design intelligence through custom tools, porting the capabilities of [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) to pi's extension system.

**Date:** 2026-02-09
**Status:** Draft

---

## Problem

The original ui-ux-pro-max is a Claude Code skill with 476KB of curated UI/UX data (67 styles, 97 color palettes, 57 font pairings, 100 reasoning rules, 24 landing patterns, 13 stack guideline sets). It works by:

1. Loading a ~250-line SKILL.md into context (always present)
2. Having the LLM manually construct Python CLI commands to search CSV data
3. Returning results as stdout text

**Issues with this approach on pi:**
- Massive SKILL.md permanently in context (~2K tokens wasted every turn)
- Python dependency — unnecessary runtime requirement
- LLM must construct CLI strings — fragile, token-wasteful
- No iterative collaboration — generates once, no refinement loop
- No visual review capability

## Solution

A pi package with **typed custom tools** that the LLM calls naturally. The BM25 search engine and all data are ported to TypeScript. Only tool descriptions (~180 words total) occupy the system prompt. All data stays in memory inside the extension, never in LLM context.

### Design Principles

1. **Lightweight context** — tool descriptions only; results use content/details split
2. **Collaborative iteration** — design system tool is cheap to re-call; LLM drives the conversation
3. **No external dependencies** — pure TypeScript, no Python
4. **Progressive disclosure** — compact results for LLM, rich rendering for user
5. **Pi-native** — packages, tools, commands, rendering, event hooks

---

## Architecture

### Package Structure

```
pi-ui-ux-pro-max/
├── package.json              # pi package manifest
├── extensions/
│   └── index.ts              # Extension entry point — registers tools, commands, hooks
├── src/
│   ├── bm25.ts               # BM25 search engine (ported from core.py)
│   ├── csv-loader.ts          # Load + index all CSV data at init
│   ├── design-system.ts       # Multi-domain aggregation + reasoning engine
│   ├── search.ts              # Domain search + stack search functions
│   ├── persist.ts             # MASTER.md + page override file generation
│   ├── settings.ts            # Extension settings management
│   ├── types.ts               # Shared types
│   └── render/
│       ├── design-system.ts   # renderCall + renderResult for design_system tool
│       ├── search.ts          # renderCall + renderResult for ui_search tool
│       └── stack.ts           # renderCall + renderResult for ui_stack_guide tool
├── data/                      # CSV data files (shipped with package)
│   ├── styles.csv
│   ├── colors.csv
│   ├── typography.csv
│   ├── charts.csv
│   ├── landing.csv
│   ├── products.csv
│   ├── icons.csv
│   ├── ui-reasoning.csv
│   ├── ux-guidelines.csv
│   ├── react-performance.csv
│   ├── web-interface.csv
│   └── stacks/
│       ├── html-tailwind.csv
│       ├── react.csv
│       ├── nextjs.csv
│       ├── vue.csv
│       ├── svelte.csv
│       ├── swiftui.csv
│       ├── react-native.csv
│       ├── flutter.csv
│       ├── shadcn.csv
│       ├── jetpack-compose.csv
│       ├── astro.csv
│       ├── nuxtjs.csv
│       └── nuxt-ui.csv
├── prompts/
│   └── ui-checklist.md        # /ui-checklist prompt template
└── docs/
    └── plans/
        └── 2026-02-09-pi-ui-ux-pro-max-spec.md  # This file
```

### package.json

```json
{
  "name": "pi-ui-ux-pro-max",
  "version": "1.0.0",
  "description": "UI/UX design intelligence for pi — 67 styles, 97 palettes, 57 font pairings, 13 stacks",
  "keywords": ["pi-package"],
  "license": "MIT",
  "pi": {
    "extensions": ["./extensions"],
    "prompts": ["./prompts"]
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-tui": "*",
    "@mariozechner/pi-ai": "*",
    "@sinclair/typebox": "*"
  }
}
```

### Context Budget

| Component | System Prompt Cost | Per-Use Context Cost |
|---|---|---|
| `design_system` tool description | ~80 words | ~400 bytes per result |
| `ui_search` tool description | ~60 words | ~400 bytes per result |
| `ui_stack_guide` tool description | ~40 words | ~400 bytes per result |
| `/ui-checklist` prompt template | 0 (expands on use only) | ~300 bytes when used |
| `/ui-settings` command | 0 | 0 |
| Auto-inject hook (opt-in) | 0 | ~100 bytes when enabled |
| **Total always-in-context** | **~180 words** | — |

Compare: the original skill's SKILL.md adds ~2,000 tokens permanently.

---

## Tools

### Tool 1: `design_system`

**Description (sent to LLM):**
> Generate a tailored UI/UX design system by searching curated data (67 styles, 97 color palettes, 57 font pairings, 100 reasoning rules, 24 landing patterns). Returns recommended pattern, style, colors, typography, effects, anti-patterns, and checklist. Call multiple times to explore alternatives — refine the query based on user feedback. Use persist to save to disk.

**Parameters:**

```typescript
Type.Object({
  query: Type.String({ description: "Descriptive query: product type, industry, mood, keywords" }),
  projectName: Type.Optional(Type.String({ description: "Project name for the design system" })),
  stack: Type.Optional(StringEnum([
    "html-tailwind", "react", "nextjs", "vue", "svelte",
    "swiftui", "react-native", "flutter", "shadcn",
    "jetpack-compose", "astro", "nuxtjs", "nuxt-ui"
  ] as const)),
  format: Type.Optional(StringEnum(["markdown", "ascii"] as const)),
  persist: Type.Optional(Type.Boolean({ description: "Save design system to design-system/MASTER.md" })),
  page: Type.Optional(Type.String({ description: "Generate page-specific override file" })),
})
```

**Internal flow:**
1. Search `products.csv` → detect category
2. Search `ui-reasoning.csv` → get reasoning rules for category (style priority, color mood, typography mood, effects, anti-patterns)
3. Multi-domain BM25 search with reasoning-informed queries:
   - `styles.csv` → best style match (weighted by reasoning priority)
   - `colors.csv` → color palette
   - `typography.csv` → font pairing
   - `landing.csv` → page pattern
4. Aggregate into design system object
5. If `persist: true`, write MASTER.md + optional page override

**Content (sent to LLM, ~400 bytes):**

```
Design System: Serenity Spa
Style: Soft UI Evolution | Pattern: Hero-Centric + Social Proof
Colors: primary=#E8B4B8 secondary=#A8D5BA cta=#D4AF37 bg=#FFF5F5 text=#2D3436
Typography: Cormorant Garamond / Montserrat (elegant, calming)
Anti-patterns: neon colors, harsh animations, dark mode
Saved: design-system/MASTER.md
Refine query or call again to explore alternatives.
```

**Details (for rendering, not in LLM context):**

```typescript
{
  designSystem: { /* full object with all fields */ },
  searchScores: { style: 4.2, color: 3.8, typography: 3.1, landing: 2.9 },
  query: "beauty spa wellness service elegant",
  persisted: { master: "design-system/MASTER.md" },
}
```

**Streaming progress via `onUpdate`:**

Each BM25 search completes and reports via `onUpdate`, so the user sees:

```
 design_system "beauty spa wellness" → Serenity Spa
  ✓ Product type: Beauty/Spa Service
  ✓ Style: Soft UI Evolution (4.2)
  ✓ Colors: #E8B4B8 / #A8D5BA / #D4AF37
  ✓ Typography: Cormorant Garamond / Montserrat
  ✓ Pattern: Hero-Centric + Social Proof
```

**Expanded view (Ctrl+O):** Full design system with color notes, effects description, CSS variables, component specs, anti-patterns with explanations, and pre-delivery checklist.

### Tool 2: `ui_search`

**Description:**
> Search the UI/UX knowledge base by domain. Domains: style, color, typography, chart, landing, product, ux, icons, react (performance), web (interface guidelines). Auto-detects domain from query if omitted.

**Parameters:**

```typescript
Type.Object({
  query: Type.String({ description: "Search keywords" }),
  domain: Type.Optional(StringEnum([
    "style", "color", "typography", "chart", "landing",
    "product", "ux", "icons", "react", "web"
  ] as const)),
  maxResults: Type.Optional(Type.Number({ description: "Max results, default 3" })),
})
```

**Content (~300-500 bytes):** Compact result summaries with key fields per domain.

**Details:** Full rows including code examples, implementation checklists, CSS snippets.

**Rendered (collapsed):**

```
 ui_search "animation accessibility" → ux (3 results)
  duration-timing (MEDIUM) · transform-performance (MEDIUM) · reduced-motion (CRITICAL)
```

### Tool 3: `ui_stack_guide`

**Description:**
> Get implementation guidelines for a specific tech stack. Covers best practices, Do/Don't patterns, and code examples.

**Parameters:**

```typescript
Type.Object({
  query: Type.String({ description: "What you need guidance on" }),
  stack: StringEnum([
    "html-tailwind", "react", "nextjs", "vue", "svelte",
    "swiftui", "react-native", "flutter", "shadcn",
    "jetpack-compose", "astro", "nuxtjs", "nuxt-ui"
  ] as const),
  maxResults: Type.Optional(Type.Number({ description: "Max results, default 3" })),
})
```

**Content:** Compact guideline summaries with Do/Don't.

**Details:** Full code examples (good and bad), severity, docs URLs.

**Rendered (collapsed):**

```
 ui_stack_guide "responsive layout" → nextjs (2 results)
  image-optimization (HIGH) · layout-component (HIGH)
```

---

## Context Efficiency

### Content/Details Split

Every tool returns:
- **`content`** → compact summary for the LLM (~300-500 bytes). Enough to reason about, not enough to bloat.
- **`details`** → full data for TUI rendering. Zero context cost. User sees it via expand (Ctrl+O).

### Iteration Pruning

The `context` event hook keeps conversation lean during iterative design:

```typescript
pi.on("context", async (event) => {
  const messages = event.messages;
  let lastDesignSystemIdx = -1;

  // Find all design_system tool results
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "toolResult" && msg.toolName === "design_system") {
      if (lastDesignSystemIdx === -1) {
        lastDesignSystemIdx = i; // keep the latest
      } else {
        // Replace older iterations with a stub
        messages[i] = {
          ...msg,
          content: [{ type: "text", text: "(superseded by later iteration)" }],
        };
      }
    }
  }

  return { messages };
});
```

**Steady-state cost of 4 design system iterations:** ~400 bytes (latest) + 3 × ~40 bytes (stubs) = ~520 bytes total. Without pruning: ~1,600 bytes.

### Collaboration Model

The LLM drives the conversation. The tool is a pure function — no UI dialogs, no interactive prompts. This means:

1. LLM asks clarifying questions (mood, audience, constraints)
2. LLM calls `design_system` with a rich query
3. LLM presents the result conversationally
4. User gives feedback ("colors too corporate", "want something warmer")
5. LLM refines the query and re-calls the tool
6. Repeat until satisfied → persist

The tool description explicitly says "Call multiple times to explore alternatives" to encourage this pattern.

---

## Prompt Template

### `/ui-checklist`

```markdown
---
description: Pre-delivery UI/UX checklist — verify before shipping
---
Review the current UI code against this checklist. For each item, check the actual code and report pass/fail with specific file:line references.

**Visual Quality**
- [ ] No emojis used as icons (use SVG: Heroicons/Lucide)
- [ ] All icons from consistent icon set
- [ ] Hover states don't cause layout shift
- [ ] Brand logos verified (Simple Icons)

**Interaction**
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide visual feedback
- [ ] Transitions are 150-300ms
- [ ] Focus states visible for keyboard navigation

**Contrast & Color**
- [ ] Light mode text contrast 4.5:1 minimum
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes

**Layout**
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

**Accessibility**
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected
```

---

## Commands

### `/ui-settings`

Interactive settings dialog for the extension.

```typescript
pi.registerCommand("ui-settings", {
  description: "Configure UI/UX Pro Max settings",
  handler: async (_args, ctx) => {
    // Uses ctx.ui.custom() with SettingsList component
    // Settings:
    //   - Auto-inject design system context: ON/OFF (default: OFF)
    //   - Default stack: <select from 13>
    //   - Default output format: markdown / ascii
    // Persisted to .pi/ui-ux-pro-max.json
  },
});
```

---

## Optional Event Hook: Auto-Inject Design System

**Disabled by default.** When enabled via `/ui-settings`:

```typescript
pi.on("before_agent_start", async (event, ctx) => {
  if (!settings.autoInjectDesignSystem) return;
  if (!activeDesignSystem) return;

  return {
    message: {
      customType: "ui-ux-context",
      content: `Active design system: ${activeDesignSystem.summary}\nFull spec: ${activeDesignSystem.path}`,
      display: false,
    },
  };
});
```

Cost when enabled: ~100 bytes per turn. Cost when disabled: 0.

The design system reference is detected on `session_start` by:
1. Checking `appendEntry` state in the session
2. Checking for `design-system/MASTER.md` on disk

---

## v1.0 — Phases 1-3 (Full Text-Based Workflow)

### Phase 1: Core Engine + Design System Tool

**Deliverables:**
- `src/bm25.ts` — TypeScript BM25 engine (~150 lines)
- `src/csv-loader.ts` — CSV parsing and indexing
- `src/types.ts` — Shared type definitions
- `src/design-system.ts` — Multi-domain search, reasoning engine, aggregation
- `src/render/design-system.ts` — renderCall + renderResult with streaming progress
- `extensions/index.ts` — Extension entry, `design_system` tool registration
- `data/` — All CSV files copied from source
- `package.json` — Pi package manifest

**Acceptance criteria:**
- `design_system` tool generates correct recommendations matching original Python output
- Streaming progress shows each search step completing
- Content/details split verified: LLM sees ~400 bytes, user sees full system
- No Python dependency
- Extension loads without errors

### Phase 2: Domain Search + Stack Guidelines

**Deliverables:**
- `src/search.ts` — Domain search with auto-detection, stack search
- `src/render/search.ts` — renderCall + renderResult for ui_search
- `src/render/stack.ts` — renderCall + renderResult for ui_stack_guide
- `ui_search` and `ui_stack_guide` tools registered in index.ts

**Acceptance criteria:**
- All 10 domains searchable with correct BM25 ranking
- All 13 stacks searchable
- Auto-domain detection matches original Python logic
- Content/details split applied consistently

### Phase 3: Persistence, Settings, Context Efficiency

**Deliverables:**
- `src/persist.ts` — MASTER.md generation, page override generation
- `src/settings.ts` — Settings management, file I/O
- `prompts/ui-checklist.md` — Pre-delivery checklist template
- `/ui-settings` command with SettingsList UI
- `context` event hook for iteration pruning
- `before_agent_start` hook (opt-in) for design system injection
- `session_start` hook for state reconstruction

**Acceptance criteria:**
- Design system persists to `design-system/MASTER.md` matching original format
- Page overrides generate correctly
- Settings persist across sessions
- Iteration pruning reduces context: 4 iterations cost < 600 bytes
- Auto-inject hook works when enabled, invisible when disabled

---

## v2.0 — Phase 4 (Visual Review with Gemini)

> Deferred until v1.0 is validated through real usage. The sub-agent dispatch pattern and review UX should be informed by experience with the text-based workflow.

### Phase 4: Gemini Visual Review

**Deliverables:**
- `ui_review` tool — takes URL or image path, dispatches to Gemini 3 Pro
- Screenshot capture via browser tool (or user-provided image)
- Structured review output: severity, issue, fix
- renderCall + renderResult for review results

**Parameters:**
```typescript
Type.Object({
  url: Type.Optional(Type.String({ description: "URL to screenshot" })),
  imagePath: Type.Optional(Type.String({ description: "Path to screenshot image" })),
  designSystemPath: Type.Optional(Type.String({ description: "Path to design system file" })),
  focus: Type.Optional(Type.Array(Type.String(), { description: "Areas to focus review on" })),
})
```

**Sub-agent dispatch:**
- Reads MASTER.md from disk
- Builds focused review prompt
- Dispatches to Gemini 3 Pro with screenshot + prompt
- Parses structured feedback from Gemini response

**Acceptance criteria:**
- Gemini receives screenshot + design system context
- Review returns structured issues with severity and fixes
- Content/details split: LLM sees critical issues only, user sees all

---

## Data Source

All CSV data is copied from the original repository's `.claude/skills/ui-ux-pro-max/data/` directory (476KB total). The data files are MIT-licensed per the source repository.

CSV files and their roles:

| File | Records | Purpose |
|---|---|---|
| `styles.csv` | 67 | UI style definitions with keywords, colors, effects, prompts |
| `colors.csv` | 97 | Color palettes by product type |
| `typography.csv` | 57 | Font pairings with mood, Google Fonts URLs |
| `charts.csv` | 25 | Chart type recommendations by data type |
| `landing.csv` | 24 | Landing page patterns with section order, CTA strategy |
| `products.csv` | 100 | Product type → style/pattern/color mappings |
| `ui-reasoning.csv` | 100 | Reasoning rules: category → style priority, anti-patterns |
| `ux-guidelines.csv` | 99 | UX best practices with Do/Don't, code examples |
| `icons.csv` | ~50 | Icon recommendations by category |
| `react-performance.csv` | ~30 | React-specific performance guidelines |
| `web-interface.csv` | ~30 | Web accessibility and interface guidelines |
| `stacks/*.csv` | 13 files | Stack-specific implementation guidelines |

---

## Installation (end user)

```bash
# From npm (once published)
pi install npm:pi-ui-ux-pro-max

# From git
pi install git:github.com/<org>/pi-ui-ux-pro-max

# Local development
pi -e ./extensions/index.ts
```

Once installed, the tools are available in every pi session. No setup, no Python, no configuration required.
