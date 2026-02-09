# Architecture

> Technical deep-dive into how pi-ui-ux-pro-max works — data flow, design decisions, and why things are the way they are.

## Overview

pi-ui-ux-pro-max is a [pi extension package](https://github.com/mariozechner/pi-coding-agent) that registers three tools, one command, one prompt template, and three event hooks. Everything runs in-process — no subprocess spawning, no network calls, no Python runtime.

```
┌───────────────────────────────────────────────────────┐
│                     pi Runtime                        │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │           extensions/index.ts                    │  │
│  │                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │  │
│  │  │design_   │  │ui_search │  │ui_stack_guide│  │  │
│  │  │system    │  │          │  │              │  │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │  │
│  │       │              │               │           │  │
│  │  ┌────▼──────────────▼───────────────▼───────┐  │  │
│  │  │            src/search.ts                   │  │  │
│  │  │     searchDomain() / searchStack()         │  │  │
│  │  └────────────────┬──────────────────────────┘  │  │
│  │                   │                              │  │
│  │  ┌────────────────▼──────────────────────────┐  │  │
│  │  │           src/csv-loader.ts                │  │  │
│  │  │   IndexedDomain { rows, bm25, cols }       │  │  │
│  │  └────────────────┬──────────────────────────┘  │  │
│  │                   │                              │  │
│  │  ┌────────────────▼──────────────────────────┐  │  │
│  │  │            src/bm25.ts                     │  │  │
│  │  │   BM25.fit() → BM25.score()               │  │  │
│  │  └───────────────────────────────────────────┘  │  │
│  │                                                  │  │
│  │  Event Hooks:                                    │  │
│  │    session_start → load settings, restore state  │  │
│  │    before_agent_start → auto-inject (opt-in)     │  │
│  │    context → prune old design_system results     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                       │
│  ┌──────────────┐  ┌────────────────────────────┐    │
│  │  data/*.csv   │  │  src/render/*.ts           │    │
│  │  (476KB)      │  │  TUI compact + expanded    │    │
│  └──────────────┘  └────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initialization (Extension Load)

When pi loads the extension, `extensions/index.ts` runs synchronously:

1. **Locate data directory** — `getDataDir()` resolves `data/` relative to the package root using `import.meta.url`
2. **Load all CSV files** — `initSearchIndices()` reads 10 domain CSVs + 13 stack CSVs from disk
3. **Parse CSV** — `parseCsv()` handles quoted fields, escaped quotes, CRLF line endings
4. **Build BM25 indices** — For each domain/stack, concatenate searchable columns into document strings, then call `bm25.fit()` to compute IDF scores
5. **Create generator** — `DesignSystemGenerator` loads the `ui-reasoning.csv` file separately for the reasoning engine

Total init time: ~50-70ms for all 24 files.

### 2. Tool Invocation (design_system)

The `design_system` tool is the most complex. Here's the full flow:

```
User message → LLM → tool call → execute()
                                      │
                    ┌─────────────────▼──────────────────┐
                    │  1. Search products.csv             │
                    │     → detect product category        │
                    │     e.g. "Beauty/Spa Service"       │
                    ├────────────────────────────────────┤
                    │  2. Find reasoning rule             │
                    │     ui-reasoning.csv → matching      │
                    │     category → style priority,       │
                    │     color mood, anti-patterns        │
                    ├────────────────────────────────────┤
                    │  3. Multi-domain BM25 search        │
                    │     styles.csv    → best style       │
                    │     colors.csv    → best palette     │
                    │     typography.csv → best fonts      │
                    │     landing.csv   → best pattern     │
                    ├────────────────────────────────────┤
                    │  4. Style selection with priority    │
                    │     Reasoning rule provides style    │
                    │     priority keywords. Best match    │
                    │     from BM25 results is weighted    │
                    │     by those priorities.             │
                    ├────────────────────────────────────┤
                    │  5. Aggregate into DesignSystem      │
                    │     Colors, typography, pattern,     │
                    │     style, effects, anti-patterns    │
                    ├────────────────────────────────────┤
                    │  6. (Optional) Persist to disk       │
                    │     MASTER.md + page override        │
                    └────────────────┬───────────────────┘
                                     │
                    ┌────────────────▼───────────────────┐
                    │  Return:                            │
                    │    content: ~400 bytes (for LLM)    │
                    │    details: full DesignSystem obj   │
                    │             (for TUI rendering)     │
                    └────────────────────────────────────┘
```

### 3. Tool Invocation (ui_search / ui_stack_guide)

These are simpler — direct BM25 search against a specific domain/stack:

1. Resolve domain (explicit or auto-detected via keyword matching)
2. Get the pre-built `IndexedDomain` from the indices map
3. Call `bm25.score(query)` — returns `[docIndex, score][]` sorted descending
4. Map top-N results to output columns
5. Return compact content + full details

### 4. Context Pruning (context hook)

On every LLM turn, the `context` event hook scans all messages:

```typescript
// Iterate backward — first match is the latest
for (let i = messages.length - 1; i >= 0; i--) {
  if (msg is design_system toolResult) {
    if (first match) → keep it
    else → replace with "(superseded by later iteration)"
  }
}
```

This means 4 design system iterations cost ~520 bytes instead of ~1,600 bytes.

## Design Decisions

### Why BM25 Instead of Embeddings?

The original project used BM25 and it works well for this use case:

- **Data is small** — ~1,500 total rows across all CSVs. BM25 is instant.
- **Queries are keyword-rich** — "fintech dashboard dark mode" has clear keyword signals.
- **No runtime dependencies** — No need for an embedding model, vector DB, or API calls.
- **Deterministic** — Same query always returns same results. Easier to test and debug.

The BM25 implementation uses standard parameters (k1=1.5, b=0.75) and tokenizes by lowercasing, splitting on whitespace, removing punctuation, and filtering words ≤ 2 characters.

### Why Content/Details Split?

This is a core pi pattern. The LLM only needs enough information to reason about the result (~400 bytes). The full design system with all fields, code examples, and checklists is sent as `details` — visible to the user via TUI rendering but never entering the LLM context window.

**Without split:** Each design_system call would cost ~2KB in context.
**With split:** ~400 bytes per call, and the user still sees everything.

### Why Eager Loading?

All 24 CSV files are loaded at extension init time (~50-70ms) rather than lazily on first access. This is intentional:

- **Predictable latency** — First tool call is instant, no cold start
- **Small data** — 476KB of CSV data is negligible in memory
- **Simple code** — No lazy initialization logic, no race conditions

If the data grows significantly (10x+), lazy loading per domain would be the right optimization.

### Why No Streaming/onUpdate?

The current implementation doesn't use `onUpdate` for streaming progress during design system generation. The entire pipeline runs in <10ms — there's nothing meaningful to stream. The TUI renderers support the `isPartial` state for future use if generation becomes async (e.g., Gemini visual review in v2.0).

### Why Prune Only design_system?

The `context` hook only prunes `design_system` tool results because:

1. **Iterative by nature** — Users typically refine design systems 3-5 times
2. **Large results** — Each result is ~400 bytes of content
3. **Superseding semantics** — A new design system replaces the old one

`ui_search` and `ui_stack_guide` results are typically one-shot and small. Pruning them would lose useful reference data.

## Module Dependency Graph

```
extensions/index.ts
  ├── src/search.ts
  │     ├── src/csv-loader.ts
  │     │     ├── src/bm25.ts
  │     │     └── src/types.ts
  │     └── src/types.ts
  ├── src/design-system.ts
  │     ├── src/csv-loader.ts (parseCsv only)
  │     ├── src/search.ts (searchDomain)
  │     └── src/types.ts
  ├── src/persist.ts
  │     └── src/types.ts
  ├── src/settings.ts
  │     └── src/types.ts
  └── src/render/
        ├── design-system.ts → src/types.ts
        ├── search.ts → src/types.ts
        └── stack.ts → src/types.ts
```

Dependencies flow strictly downward. No circular references. Each module has a single responsibility.

## The Reasoning Engine

The design system generator doesn't just search — it *reasons* about what style fits a product type. The reasoning pipeline:

1. **Category detection** — Search `products.csv` to identify the product type (e.g., "Beauty/Spa Service", "SaaS Dashboard", "E-commerce Luxury")

2. **Rule lookup** — Match category against `ui-reasoning.csv` which contains 100 rules mapping categories to:
   - `Style_Priority` — Ordered list of recommended styles (e.g., "Soft UI + Minimalism")
   - `Color_Mood` — What mood the color palette should convey
   - `Typography_Mood` — Font pairing mood keywords
   - `Key_Effects` — Recommended visual effects
   - `Anti_Patterns` — What to avoid for this category
   - `Decision_Rules` — Additional JSON rules

3. **Priority-weighted search** — The style search query is augmented with priority keywords from the reasoning rule, so BM25 naturally ranks the recommended styles higher

4. **Best match selection** — `selectBestMatch()` scores results against priority keywords using a tiered system:
   - Style name match: +10 points
   - Keyword column match: +3 points
   - Any field match: +1 point

This means the generator doesn't just return the closest BM25 match — it returns the match that best aligns with domain expertise encoded in the reasoning rules.

## Persistence Format

When `persist: true` is passed to `design_system`, two files are generated:

### MASTER.md

The master design system file contains:
- Global rules (colors, typography, spacing variables)
- Style guidelines with effects and keywords
- Page pattern with section order and CTA strategy
- Component specs (button CSS)
- Anti-patterns with explanations
- Pre-delivery checklist

### Page Overrides

Page-specific files (e.g., `pages/landing.md`) use a cascade model:

> Rules in this file **override** the Master file. Only deviations are documented.

Currently, page overrides are generated as scaffolds for manual editing. The master file includes a logic note: "When building a specific page, first check `design-system/pages/[page-name].md`."

Path sanitization via `slugify()` prevents directory traversal attacks through project names or page names.

## Comparison with Original

| Aspect | Original (Python Skill) | pi-ui-ux-pro-max |
|--------|------------------------|------------------|
| Runtime | Python subprocess | In-process TypeScript |
| Context cost | ~2,000 tokens always | ~180 words (tool descriptions) |
| Search interface | LLM constructs CLI strings | Typed tool parameters |
| Result format | stdout text | content (LLM) + details (TUI) |
| Iteration | Re-run from scratch | Refine conversationally |
| Visual feedback | None | TUI renderers (compact + expanded) |
| Persistence | Not built-in | MASTER.md + page overrides |
| Testing | Manual | 89 automated tests |
| Context pruning | None | Auto-prune old iterations |

## Future: v2.0 Visual Review

The v2.0 roadmap includes a `ui_review` tool that dispatches to Gemini 3 Pro for visual review of screenshots against the design system. The architecture is designed to support this:

- `details` already carries the full `DesignSystem` object
- `activeDesignSystem` tracks the current design system path
- The `before_agent_start` hook can inject design system context
- Renderer infrastructure supports additional tool types

See [the spec](plans/2026-02-09-pi-ui-ux-pro-max-spec.md) for the full v2.0 plan.
