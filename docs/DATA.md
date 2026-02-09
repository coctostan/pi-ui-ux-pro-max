# Data Dictionary

Complete schema and description of all CSV data files shipped with pi-ui-ux-pro-max.

All data is sourced from [ui-ux-pro-max-skill](https://github.com/nicholasgriffintn/ui-ux-pro-max-skill) by [nextlevelbuilder](https://github.com/nextlevelbuilder), MIT-licensed. Total size: 476KB across 24 files.

---

## Domain Files (`data/`)

### styles.csv

UI style definitions with comprehensive metadata for matching styles to projects.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Style Category | Style name | Minimalism & Swiss Style |
| Type | Classification | General |
| Keywords | Searchable keywords | clean, simple, spacious, functional |
| Primary Colors | Main color palette | Monochromatic, Black #000000, White #FFFFFF |
| Secondary Colors | Supporting colors | Neutral (Beige #F5F1E8, Grey #808080) |
| Effects & Animation | Visual effects | Subtle hover (200-250ms), smooth transitions |
| Best For | Recommended use cases | Enterprise apps, dashboards, SaaS |
| Do Not Use For | Anti-patterns | Creative portfolios, entertainment |
| Light Mode ✓ | Light mode support | ✓ Full |
| Dark Mode ✓ | Dark mode support | ✓ Full |
| Performance | Performance rating | ⚡ Excellent |
| Accessibility | Accessibility level | ✓ WCAG AAA |
| Mobile-Friendly | Mobile compatibility | ✓ High |
| Conversion-Focused | Conversion optimization | ◐ Medium |
| Framework Compatibility | Framework support | Tailwind 10/10, Bootstrap 9/10 |
| Era/Origin | Historical origin | 1950s Swiss |
| Complexity | Implementation complexity | Low |
| AI Prompt Keywords | Keywords for AI prompts | Design a minimalist landing page... |
| CSS/Technical Keywords | CSS properties | display: grid, gap: 2rem, font-family: sans-serif |
| Implementation Checklist | Build checklist | ☐ Grid-based layout 12-16 columns... |
| Design System Variables | CSS custom properties | --spacing: 2rem, --border-radius: 0px |

**Records:** 67 styles
**Search columns:** Style Category, Keywords, Best For, Type, AI Prompt Keywords

---

### colors.csv

Color palettes organized by product type.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Product Type | Product category | SaaS (General) |
| Primary (Hex) | Primary brand color | #2563EB |
| Secondary (Hex) | Secondary color | #3B82F6 |
| CTA (Hex) | Call-to-action color | #F97316 |
| Background (Hex) | Background color | #F8FAFC |
| Text (Hex) | Text color | #1E293B |
| Border (Hex) | Border color | #E2E8F0 |
| Notes | Usage notes | Trust blue + orange CTA contrast |

**Records:** 97 palettes (including header, 96 data rows)
**Search columns:** Product Type, Notes

---

### typography.csv

Font pairings with mood metadata and implementation details.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Font Pairing Name | Pairing label | Inter + System |
| Category | Classification | Modern Sans |
| Heading Font | Heading typeface | Inter |
| Body Font | Body typeface | System UI |
| Mood/Style Keywords | Mood descriptors | Professional, clean, neutral |
| Best For | Recommended use | SaaS dashboards, B2B platforms |
| Google Fonts URL | Font link | https://fonts.google.com/... |
| CSS Import | CSS import statement | @import url('...') |
| Tailwind Config | Tailwind font config | fontFamily: { heading: ['Inter'] } |
| Notes | Additional notes | System UI for body improves load time |

**Records:** 57 pairings (including header, 56 data rows)
**Search columns:** Font Pairing Name, Category, Mood/Style Keywords, Best For, Heading Font, Body Font

---

### charts.csv

Chart type recommendations by data pattern.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Data Type | What the data represents | Time Series |
| Keywords | Searchable terms | trend, temporal, chronological |
| Best Chart Type | Primary recommendation | Line Chart |
| Secondary Options | Alternatives | Area Chart, Stepped Line |
| Color Guidance | Coloring strategy | Sequential palette for single series |
| Performance Impact | Performance notes | Lightweight, good for streaming |
| Accessibility Notes | a11y considerations | Add point markers for screen readers |
| Library Recommendation | Suggested libraries | D3.js, Chart.js, Recharts |
| Interactive Level | Interaction complexity | Medium |

**Records:** 25 types (including header)
**Search columns:** Data Type, Keywords, Best Chart Type, Accessibility Notes

---

### landing.csv

Landing page patterns with conversion optimization strategies.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Pattern Name | Pattern label | Hero-Centric |
| Keywords | Searchable terms | hero, bold, visual, above fold |
| Section Order | Page structure | Hero → Features → Social Proof → CTA |
| Primary CTA Placement | CTA position | Above fold, hero section |
| Color Strategy | Color approach | Bold hero, muted sections, accent CTA |
| Recommended Effects | Visual effects | Parallax hero, fade-in sections |
| Conversion Optimization | Optimization tips | Single clear CTA, minimal navigation |

**Records:** 24 patterns (including header, 30 data rows)
**Search columns:** Pattern Name, Keywords, Conversion Optimization, Section Order

---

### products.csv

Product type → design recommendation mappings.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Product Type | Product category | SaaS (General) |
| Keywords | Searchable terms | software, subscription, cloud, B2B |
| Primary Style Recommendation | Recommended style | Minimalism |
| Secondary Styles | Alternative styles | Flat Design, Corporate Clean |
| Landing Page Pattern | Recommended pattern | Hero-Centric |
| Dashboard Style (if applicable) | Dashboard approach | Data-Dense Grid |
| Color Palette Focus | Color mood | Trust, professional, clarity |
| Key Considerations | Design notes | Focus on onboarding flow clarity |

**Records:** 100 types (including header, 95 data rows)
**Search columns:** Product Type, Keywords, Primary Style Recommendation, Key Considerations

---

### ui-reasoning.csv

Reasoning rules that map product categories to design decisions. This is the "brain" of the design system generator.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| UI_Category | Product/UI category | Beauty/Spa Service |
| Recommended_Pattern | Page pattern | Hero-Centric + Social Proof |
| Style_Priority | Ordered style preferences | Soft UI + Organic Design |
| Color_Mood | Color palette mood | Calming, natural, elegant |
| Typography_Mood | Font mood | Elegant, refined |
| Key_Effects | Visual effects to use | Soft shadows, gradient transitions |
| Decision_Rules | JSON rules | {"contrast": "soft", "animation": "gentle"} |
| Anti_Patterns | What to avoid | Neon colors + harsh animations + dark mode |
| Severity | Rule importance | HIGH |

**Records:** 100 rules (including header)
**Search columns:** (Used via direct lookup, not BM25 search)

---

### ux-guidelines.csv

UX best practices with actionable Do/Don't patterns.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Category | Guideline category | Animation |
| Issue | Specific issue | duration-timing |
| Platform | Applicable platform | Web |
| Description | What the guideline covers | Animations should be 150-300ms... |
| Do | Best practice | Use 200ms for micro-interactions |
| Don't | Anti-pattern | Don't exceed 500ms for transitions |
| Code Example Good | Correct code | transition: all 200ms ease |
| Code Example Bad | Incorrect code | transition: all 2s linear |
| Severity | Impact level | MEDIUM |

**Records:** 99 guidelines (including header, 98 data rows)
**Search columns:** Category, Issue, Description, Platform

---

### icons.csv

Icon recommendations organized by category.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Category | Icon category | Navigation |
| Icon Name | Icon identifier | menu |
| Keywords | Search terms | hamburger, nav, sidebar |
| Library | Icon library | Lucide |
| Import Code | Import statement | import { Menu } from 'lucide-react' |
| Usage | Usage context | Mobile navigation toggle |
| Best For | Recommended use | App headers, responsive nav |
| Style | Visual style | Outline |

**Records:** ~100 icons (including header)
**Search columns:** Category, Icon Name, Keywords, Best For

---

### react-performance.csv

React-specific performance optimization guidelines.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Category | Performance category | Rendering |
| Issue | Specific issue | unnecessary-rerenders |
| Keywords | Search terms | memo, usecallback, render |
| Platform | Target platform | React |
| Description | Issue description | Components re-render unnecessarily... |
| Do | Best practice | Use React.memo for pure components |
| Don't | Anti-pattern | Don't wrap everything in memo |
| Code Example Good | Correct code | const Item = React.memo(({ data })... |
| Code Example Bad | Incorrect code | function Item({ data }) { ... } |
| Severity | Impact level | HIGH |

**Records:** ~44 guidelines (including header)
**Search columns:** Category, Issue, Keywords, Description

---

### web-interface.csv

Web accessibility and interface best practices.

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Category | Guideline category | Forms |
| Issue | Specific issue | input-types |
| Keywords | Search terms | form, input, type, validation |
| Platform | Target platform | Web |
| Description | Issue description | Use semantic input types... |
| Do | Best practice | type="email" for email fields |
| Don't | Anti-pattern | type="text" for everything |
| Code Example Good | Correct markup | `<input type="email" />` |
| Code Example Bad | Incorrect markup | `<input type="text" />` |
| Severity | Impact level | MEDIUM |

**Records:** ~30 guidelines (including header)
**Search columns:** Category, Issue, Keywords, Description

---

## Stack Files (`data/stacks/`)

All 13 stack files share the same schema:

| Column | Description | Example |
|--------|-------------|---------|
| No | Row number | 1 |
| Category | Guideline category | State |
| Guideline | Guideline name | Use useState for local state |
| Description | What it covers | Simple component state should use... |
| Do | Best practice | useState for form inputs, toggles |
| Don't | Anti-pattern | Class components, this.state |
| Code Good | Correct code example | `const [count, setCount] = useState(0)` |
| Code Bad | Incorrect code example | `this.state = { count: 0 }` |
| Severity | Impact level | Medium |
| Docs URL | Documentation link | https://react.dev/reference/react/useState |

**Search columns:** Category, Guideline, Description, Do, Don't

### Stack File Summary

| File | Stack | Records |
|------|-------|---------|
| `astro.csv` | Astro | 53 |
| `flutter.csv` | Flutter | 52 |
| `html-tailwind.csv` | HTML + Tailwind CSS | 55 |
| `jetpack-compose.csv` | Jetpack Compose (Android) | 52 |
| `nextjs.csv` | Next.js | 52 |
| `nuxt-ui.csv` | Nuxt UI | 50 |
| `nuxtjs.csv` | Nuxt.js | 58 |
| `react-native.csv` | React Native | 51 |
| `react.csv` | React | 53 |
| `shadcn.csv` | shadcn/ui | 60 |
| `svelte.csv` | Svelte | 53 |
| `swiftui.csv` | SwiftUI | 50 |
| `vue.csv` | Vue.js | 49 |

---

## How Data Is Used

### Search Configuration

Each domain has configured **search columns** (used for BM25 indexing) and **output columns** (returned in results). These are defined in `src/types.ts` as `CSV_CONFIG` and `STACK_CONFIG`.

**Search columns** are concatenated into a single document string per row, then indexed by BM25. When a user queries, BM25 scores all documents and returns the top-N matches.

**Output columns** determine which fields appear in tool results. Not all CSV columns are included in output — only the most relevant ones.

### BM25 Indexing

For each domain/stack, the indexing process:

1. Read CSV file → parse into `CsvRow[]`
2. For each row, concatenate search column values: `"Category Issue Description Platform"`
3. Pass all concatenated strings to `BM25.fit()` which:
   - Tokenizes each document (lowercase, remove punctuation, filter ≤2 chars)
   - Computes document frequencies
   - Calculates IDF scores: `log((N - freq + 0.5) / (freq + 0.5) + 1)`

At query time, `BM25.score(query)` tokenizes the query and scores all documents using the standard BM25 formula with k1=1.5, b=0.75.

### Design System Generator

The `design_system` tool uses data from multiple files in sequence:

1. `products.csv` → detect product category from query
2. `ui-reasoning.csv` → get reasoning rule for that category
3. `styles.csv` → find best style (weighted by reasoning priority)
4. `colors.csv` → find best color palette
5. `typography.csv` → find best font pairing
6. `landing.csv` → find best page pattern

---

## Adding New Data

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding new rows, new domains, or new stacks.

Key rules:
- Follow the existing column schema exactly
- Include a `No` column with sequential numbering
- Escape commas and quotes in CSV fields properly
- After adding data, run `npm test` to verify parsing
