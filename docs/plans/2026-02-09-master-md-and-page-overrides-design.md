# MASTER.md Completeness + Intelligent Page Overrides

**Date:** 2026-02-09
**Status:** Approved

---

## Problem

Two gaps vs. the original Python implementation:

1. **MASTER.md missing sections** — `formatMasterMd()` is missing: Shadow Depths table, Cards/Inputs/Modals component specs, expanded Buttons (hover + secondary), "Additional Forbidden Patterns" subheader, checklist preamble text.

2. **Intelligent page overrides** — `formatPageOverrideMd()` writes skeleton placeholders ("No overrides — use Master"). The original runs 3 BM25 searches (style, ux, landing) for the page context and generates context-aware layout/spacing/typography/color/component overrides.

---

## Solution

### Gap 1: MASTER.md Sections

Add to `formatMasterMd()` in `src/persist.ts`:

**Shadow Depths** — after Spacing Variables:

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

**Buttons** — expand to include `:hover` + `.btn-secondary`. Use `colors.primary` for secondary (improvement over hardcoded `#2563EB`).

**Cards** — `.card` with `colors.background`, `var(--shadow-md)`, hover lift.

**Inputs** — `.input` with focus ring using `colors.primary + "20"` alpha. Improvement: original hardcodes `#2563EB`.

**Modals** — `.modal-overlay` with backdrop blur + `.modal` with `var(--shadow-xl)`.

**Anti-Patterns** — add `### Additional Forbidden Patterns` subheader.

**Checklist** — add `"Before delivering any UI code, verify:"` preamble.

### Gap 2: Intelligent Page Overrides

**Signature changes (backward compatible):**

```typescript
export function persistDesignSystem(
  ds: DesignSystem, page: string | undefined, outputDir: string,
  indices?: SearchIndices, pageQuery?: string,
): PersistResult

export function formatPageOverrideMd(
  ds: DesignSystem, pageName: string,
  indices?: SearchIndices, pageQuery?: string,
): string
```

When `indices` is omitted → skeleton fallback (no breaking changes).

**New private functions:**

`generateIntelligentOverrides(pageName, pageQuery, ds, indices)`:
- Search 1: `searchDomain(context, "style", 1)` → infer layout from keywords
  - data/dense/dashboard/grid → 1400px, 12-col grid, high density
  - minimal/simple/clean → 800px, single column, low density
  - default → 1200px, full-width sections
  - Extract effects → recommendations
- Search 2: `searchDomain(context, "ux", 3)` → Do → recommendations, Don't → component warnings
- Search 3: `searchDomain(context, "landing", 1)` → section order, CTA placement, color strategy

`detectPageType(context, styleResults)`:
- 10 keyword patterns: dashboard, checkout, settings, landing, auth, pricing, blog, product, search, empty
- Fallback: style's Best For field, then "General"

**Output structure:**
- Page header with project, timestamp, detected Page Type
- Layout Overrides, Spacing Overrides, Typography Overrides, Color Overrides, Component Overrides
- Page-Specific Components
- Recommendations

**Call site in `extensions/index.ts`:**
```typescript
persistDesignSystem(ds, page, ctx.cwd, indices, query)
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/persist.ts` | Add shadow depths, cards, inputs, modals, expanded buttons to `formatMasterMd()`. Add `generateIntelligentOverrides()`, `detectPageType()`. Update signatures. |
| `src/persist.test.ts` | New tests for shadow depths, component specs, intelligent overrides, page type detection, backward compat. |
| `extensions/index.ts` | Pass `indices` and `query` to `persistDesignSystem()`. |

---

## Tests

1. `formatMasterMd` includes Shadow Depths, Cards, Inputs, Modals, expanded Buttons
2. `formatMasterMd` uses design system colors in component CSS (not hardcoded)
3. `formatPageOverrideMd` with indices → intelligent overrides with page type and layout content
4. `formatPageOverrideMd` without indices → skeleton fallback (backward compat)
5. `detectPageType` keyword → type mappings
6. `persistDesignSystem` with page + indices → intelligent override file on disk
