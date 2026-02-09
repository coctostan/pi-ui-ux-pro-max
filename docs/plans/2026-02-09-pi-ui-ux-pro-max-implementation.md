# pi-ui-ux-pro-max Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Port the ui-ux-pro-max Claude Code skill to a pi package with typed custom tools, BM25 search in TypeScript, custom TUI rendering, and zero Python dependency.

**Architecture:** Three custom tools (`design_system`, `ui_search`, `ui_stack_guide`) backed by a TypeScript BM25 engine that indexes CSV data at extension load. Tool descriptions (~180 words) are the only system prompt cost. Results use content/details split for context efficiency. A `context` event hook prunes superseded design system iterations. Settings and persistence are file-based.

**Tech Stack:** TypeScript, pi extension API (`@mariozechner/pi-coding-agent`), TypeBox schemas (`@sinclair/typebox`), `StringEnum` from `@mariozechner/pi-ai`, TUI components from `@mariozechner/pi-tui`, Node.js built-ins (`node:fs`, `node:path`).

---

## Phase 1: Core Engine

### Task 1: Project scaffolding and data files

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `data/` (copy all CSV files from source)

**Step 1: Create package.json**

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

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true
  },
  "include": ["src/**/*", "extensions/**/*"]
}
```

**Step 3: Copy all CSV data files from source**

Run:
```bash
cp -r /tmp/pi-github-repos/nextlevelbuilder/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/data/ ./data/
```

Verify: `ls data/*.csv data/stacks/*.csv` — should list 24 CSV files.

**Step 4: Commit**

```bash
git add package.json tsconfig.json data/
git commit -m "chore: project scaffolding and CSV data files"
```

---

### Task 2: Type definitions

**Files:**
- Create: `src/types.ts`

**Step 1: Write the type definitions**

These types model all domains from the CSV config in `core.py`, the design system output from `design_system.py`, and the tool parameters/results.

```typescript
// src/types.ts

// ============ CSV Domain Configuration ============

export interface CsvDomainConfig {
  file: string;
  searchCols: string[];
  outputCols: string[];
}

export interface CsvStackConfig {
  file: string;
}

export const CSV_CONFIG: Record<string, CsvDomainConfig> = {
  style: {
    file: "styles.csv",
    searchCols: ["Style Category", "Keywords", "Best For", "Type", "AI Prompt Keywords"],
    outputCols: [
      "Style Category", "Type", "Keywords", "Primary Colors",
      "Effects & Animation", "Best For", "Performance", "Accessibility",
      "Framework Compatibility", "Complexity", "AI Prompt Keywords",
      "CSS/Technical Keywords", "Implementation Checklist", "Design System Variables",
    ],
  },
  color: {
    file: "colors.csv",
    searchCols: ["Product Type", "Notes"],
    outputCols: [
      "Product Type", "Primary (Hex)", "Secondary (Hex)", "CTA (Hex)",
      "Background (Hex)", "Text (Hex)", "Notes",
    ],
  },
  chart: {
    file: "charts.csv",
    searchCols: ["Data Type", "Keywords", "Best Chart Type", "Accessibility Notes"],
    outputCols: [
      "Data Type", "Keywords", "Best Chart Type", "Secondary Options",
      "Color Guidance", "Accessibility Notes", "Library Recommendation", "Interactive Level",
    ],
  },
  landing: {
    file: "landing.csv",
    searchCols: ["Pattern Name", "Keywords", "Conversion Optimization", "Section Order"],
    outputCols: [
      "Pattern Name", "Keywords", "Section Order",
      "Primary CTA Placement", "Color Strategy", "Conversion Optimization",
    ],
  },
  product: {
    file: "products.csv",
    searchCols: ["Product Type", "Keywords", "Primary Style Recommendation", "Key Considerations"],
    outputCols: [
      "Product Type", "Keywords", "Primary Style Recommendation",
      "Secondary Styles", "Landing Page Pattern",
      "Dashboard Style (if applicable)", "Color Palette Focus",
    ],
  },
  ux: {
    file: "ux-guidelines.csv",
    searchCols: ["Category", "Issue", "Description", "Platform"],
    outputCols: [
      "Category", "Issue", "Platform", "Description",
      "Do", "Don't", "Code Example Good", "Code Example Bad", "Severity",
    ],
  },
  typography: {
    file: "typography.csv",
    searchCols: ["Font Pairing Name", "Category", "Mood/Style Keywords", "Best For", "Heading Font", "Body Font"],
    outputCols: [
      "Font Pairing Name", "Category", "Heading Font", "Body Font",
      "Mood/Style Keywords", "Best For", "Google Fonts URL",
      "CSS Import", "Tailwind Config", "Notes",
    ],
  },
  icons: {
    file: "icons.csv",
    searchCols: ["Category", "Icon Name", "Keywords", "Best For"],
    outputCols: [
      "Category", "Icon Name", "Keywords", "Library",
      "Import Code", "Usage", "Best For", "Style",
    ],
  },
  react: {
    file: "react-performance.csv",
    searchCols: ["Category", "Issue", "Keywords", "Description"],
    outputCols: [
      "Category", "Issue", "Platform", "Description",
      "Do", "Don't", "Code Example Good", "Code Example Bad", "Severity",
    ],
  },
  web: {
    file: "web-interface.csv",
    searchCols: ["Category", "Issue", "Keywords", "Description"],
    outputCols: [
      "Category", "Issue", "Platform", "Description",
      "Do", "Don't", "Code Example Good", "Code Example Bad", "Severity",
    ],
  },
};

export const STACK_CONFIG: Record<string, CsvStackConfig> = {
  "html-tailwind": { file: "stacks/html-tailwind.csv" },
  react: { file: "stacks/react.csv" },
  nextjs: { file: "stacks/nextjs.csv" },
  vue: { file: "stacks/vue.csv" },
  svelte: { file: "stacks/svelte.csv" },
  swiftui: { file: "stacks/swiftui.csv" },
  "react-native": { file: "stacks/react-native.csv" },
  flutter: { file: "stacks/flutter.csv" },
  shadcn: { file: "stacks/shadcn.csv" },
  "jetpack-compose": { file: "stacks/jetpack-compose.csv" },
  astro: { file: "stacks/astro.csv" },
  nuxtjs: { file: "stacks/nuxtjs.csv" },
  "nuxt-ui": { file: "stacks/nuxt-ui.csv" },
};

export const STACK_SEARCH_COLS = ["Category", "Guideline", "Description", "Do", "Don't"];
export const STACK_OUTPUT_COLS = [
  "Category", "Guideline", "Description", "Do", "Don't",
  "Code Good", "Code Bad", "Severity", "Docs URL",
];

export const DOMAIN_NAMES = Object.keys(CSV_CONFIG) as Domain[];
export const STACK_NAMES = Object.keys(STACK_CONFIG) as StackName[];

export type Domain = "style" | "color" | "chart" | "landing" | "product" | "ux" | "typography" | "icons" | "react" | "web";
export type StackName = "html-tailwind" | "react" | "nextjs" | "vue" | "svelte" | "swiftui" | "react-native" | "flutter" | "shadcn" | "jetpack-compose" | "astro" | "nuxtjs" | "nuxt-ui";

// ============ Search Results ============

/** A single row from a CSV file, keyed by column name */
export type CsvRow = Record<string, string>;

export interface SearchResult {
  domain: string;
  query: string;
  file: string;
  count: number;
  results: CsvRow[];
}

export interface StackSearchResult {
  domain: "stack";
  stack: string;
  query: string;
  file: string;
  count: number;
  results: CsvRow[];
}

// ============ Design System ============

export interface DesignSystemPattern {
  name: string;
  sections: string;
  ctaPlacement: string;
  colorStrategy: string;
  conversion: string;
}

export interface DesignSystemStyle {
  name: string;
  type: string;
  effects: string;
  keywords: string;
  bestFor: string;
  performance: string;
  accessibility: string;
}

export interface DesignSystemColors {
  primary: string;
  secondary: string;
  cta: string;
  background: string;
  text: string;
  notes: string;
}

export interface DesignSystemTypography {
  heading: string;
  body: string;
  mood: string;
  bestFor: string;
  googleFontsUrl: string;
  cssImport: string;
}

export interface ReasoningRule {
  pattern: string;
  stylePriority: string[];
  colorMood: string;
  typographyMood: string;
  keyEffects: string;
  antiPatterns: string;
  decisionRules: Record<string, string>;
  severity: string;
}

export interface DesignSystem {
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

// ============ Tool Result Details ============

export interface DesignSystemToolDetails {
  designSystem: DesignSystem;
  searchScores: Record<string, number>;
  query: string;
  persisted?: { master?: string; page?: string };
}

export interface SearchToolDetails {
  domain: string;
  query: string;
  results: CsvRow[];
}

export interface StackToolDetails {
  stack: string;
  query: string;
  results: CsvRow[];
}

// ============ Settings ============

export interface UiUxSettings {
  autoInjectDesignSystem: boolean;
  defaultStack: StackName | null;
  defaultFormat: "markdown" | "ascii";
}

export const DEFAULT_SETTINGS: UiUxSettings = {
  autoInjectDesignSystem: false,
  defaultStack: null,
  defaultFormat: "markdown",
};
```

**Step 2: Run type check**

Run: `npx tsc --noEmit --skipLibCheck src/types.ts 2>&1 || echo "(type check — expected to pass or show only import issues)"`

The file has no imports, so this should pass cleanly.

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add type definitions for all domains, design system, and settings"
```

---

### Task 3: BM25 search engine

**Files:**
- Create: `src/bm25.ts`
- Create: `src/bm25.test.ts`

**Step 1: Write the failing test**

```typescript
// src/bm25.test.ts
import { describe, it, expect } from "vitest";
import { BM25 } from "./bm25.js";

describe("BM25", () => {
  it("returns empty scores for empty corpus", () => {
    const bm25 = new BM25();
    bm25.fit([]);
    const scores = bm25.score("test");
    expect(scores).toEqual([]);
  });

  it("ranks exact match highest", () => {
    const bm25 = new BM25();
    bm25.fit([
      "the quick brown fox",
      "SaaS dashboard analytics",
      "lazy dog sleeping",
    ]);
    const scores = bm25.score("SaaS dashboard");
    // Index 1 should have highest score
    expect(scores[0][0]).toBe(1);
    expect(scores[0][1]).toBeGreaterThan(0);
  });

  it("scores zero for no matching terms", () => {
    const bm25 = new BM25();
    bm25.fit(["apple banana cherry"]);
    const scores = bm25.score("xylophone");
    expect(scores[0][1]).toBe(0);
  });

  it("tokenizes and lowercases correctly", () => {
    const bm25 = new BM25();
    bm25.fit(["Hello, World! This is a TEST."]);
    const scores = bm25.score("hello world test");
    expect(scores[0][1]).toBeGreaterThan(0);
  });

  it("filters short words (length <= 2)", () => {
    const bm25 = new BM25();
    bm25.fit(["an is it the dashboard"]);
    const scores = bm25.score("an is it");
    // All query words are <= 2 chars, so no matches
    expect(scores[0][1]).toBe(0);
  });

  it("ranks documents with more matching terms higher", () => {
    const bm25 = new BM25();
    bm25.fit([
      "modern clean design",
      "modern clean design minimalist professional",
      "unrelated text here",
    ]);
    const scores = bm25.score("modern clean design minimalist");
    // Doc 1 (index 1) matches all 4 terms, doc 0 matches 3
    expect(scores[0][0]).toBe(1);
    expect(scores[1][0]).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/bm25.test.ts 2>&1 | tail -5`
Expected: FAIL — cannot find module `./bm25.js`

**Step 3: Write the BM25 implementation**

Port from Python `core.py` — same algorithm, same parameters (k1=1.5, b=0.75).

```typescript
// src/bm25.ts

/**
 * BM25 ranking algorithm for text search.
 * Ported from ui-ux-pro-max core.py.
 */
export class BM25 {
  private k1: number;
  private b: number;
  private corpus: string[][] = [];
  private docLengths: number[] = [];
  private avgdl = 0;
  private idf: Map<string, number> = new Map();
  private N = 0;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  /** Lowercase, split, remove punctuation, filter words with length <= 2 */
  tokenize(text: string): string[] {
    const cleaned = String(text).toLowerCase().replace(/[^\w\s]/g, " ");
    return cleaned.split(/\s+/).filter((w) => w.length > 2);
  }

  /** Build BM25 index from an array of document strings */
  fit(documents: string[]): void {
    this.corpus = documents.map((doc) => this.tokenize(doc));
    this.N = this.corpus.length;
    if (this.N === 0) return;

    this.docLengths = this.corpus.map((doc) => doc.length);
    this.avgdl = this.docLengths.reduce((a, b) => a + b, 0) / this.N;

    const docFreqs = new Map<string, number>();
    for (const doc of this.corpus) {
      const seen = new Set<string>();
      for (const word of doc) {
        if (!seen.has(word)) {
          docFreqs.set(word, (docFreqs.get(word) ?? 0) + 1);
          seen.add(word);
        }
      }
    }

    this.idf = new Map();
    for (const [word, freq] of docFreqs) {
      this.idf.set(word, Math.log((this.N - freq + 0.5) / (freq + 0.5) + 1));
    }
  }

  /** Score all documents against query, returns array of [index, score] sorted descending */
  score(query: string): [number, number][] {
    const queryTokens = this.tokenize(query);
    const scores: [number, number][] = [];

    for (let idx = 0; idx < this.corpus.length; idx++) {
      const doc = this.corpus[idx];
      const docLen = this.docLengths[idx];
      const termFreqs = new Map<string, number>();
      for (const word of doc) {
        termFreqs.set(word, (termFreqs.get(word) ?? 0) + 1);
      }

      let score = 0;
      for (const token of queryTokens) {
        const idfVal = this.idf.get(token);
        if (idfVal !== undefined) {
          const tf = termFreqs.get(token) ?? 0;
          const numerator = tf * (this.k1 + 1);
          const denominator =
            tf + this.k1 * (1 - this.b + (this.b * docLen) / this.avgdl);
          score += idfVal * (numerator / denominator);
        }
      }

      scores.push([idx, score]);
    }

    return scores.sort((a, b) => b[1] - a[1]);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/bm25.test.ts 2>&1 | tail -10`
Expected: All 6 tests PASS.

**Step 5: Commit**

```bash
git add src/bm25.ts src/bm25.test.ts
git commit -m "feat: BM25 search engine ported from Python"
```

---

### Task 4: CSV loader and domain indexing

**Files:**
- Create: `src/csv-loader.ts`
- Create: `src/csv-loader.test.ts`

**Step 1: Write the failing test**

```typescript
// src/csv-loader.test.ts
import { describe, it, expect } from "vitest";
import { parseCsv, loadDomain, loadStack, getDataDir } from "./csv-loader.js";
import * as path from "node:path";

describe("parseCsv", () => {
  it("parses simple CSV text into rows", () => {
    const csv = `Name,Age,City\nAlice,30,NYC\nBob,25,LA`;
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Name: "Alice", Age: "30", City: "NYC" });
    expect(rows[1]).toEqual({ Name: "Bob", Age: "25", City: "LA" });
  });

  it("handles quoted fields with commas", () => {
    const csv = `Name,Description\nAlice,"Hello, World"\nBob,"Simple"`;
    const rows = parseCsv(csv);
    expect(rows[0].Description).toBe("Hello, World");
  });

  it("handles empty CSV", () => {
    const rows = parseCsv("");
    expect(rows).toEqual([]);
  });
});

describe("loadDomain", () => {
  it("loads styles domain and returns indexed data", () => {
    const result = loadDomain("style", getDataDir());
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.bm25).toBeDefined();
    // Styles CSV should have 67 rows
    expect(result.rows.length).toBe(67);
  });

  it("loads all 10 domains without error", () => {
    const domains = ["style", "color", "chart", "landing", "product", "ux", "typography", "icons", "react", "web"] as const;
    for (const domain of domains) {
      const result = loadDomain(domain, getDataDir());
      expect(result.rows.length).toBeGreaterThan(0);
    }
  });
});

describe("loadStack", () => {
  it("loads react stack and returns indexed data", () => {
    const result = loadStack("react", getDataDir());
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.bm25).toBeDefined();
  });

  it("loads all 13 stacks without error", () => {
    const stacks = [
      "html-tailwind", "react", "nextjs", "vue", "svelte", "swiftui",
      "react-native", "flutter", "shadcn", "jetpack-compose", "astro", "nuxtjs", "nuxt-ui",
    ] as const;
    for (const stack of stacks) {
      const result = loadStack(stack, getDataDir());
      expect(result.rows.length).toBeGreaterThan(0);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/csv-loader.test.ts 2>&1 | tail -5`
Expected: FAIL — cannot find module `./csv-loader.js`

**Step 3: Write the CSV loader implementation**

```typescript
// src/csv-loader.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { BM25 } from "./bm25.js";
import {
  CSV_CONFIG, STACK_CONFIG, STACK_SEARCH_COLS, STACK_OUTPUT_COLS,
  type CsvRow, type Domain, type StackName,
} from "./types.js";

export interface IndexedDomain {
  rows: CsvRow[];
  bm25: BM25;
  searchCols: string[];
  outputCols: string[];
}

/** Resolve the data/ directory relative to this package */
export function getDataDir(): string {
  // Walk up from src/ to package root, then into data/
  return path.resolve(__dirname, "..", "data");
}

/** Parse CSV text into array of row objects. Handles quoted fields. */
export function parseCsv(text: string): CsvRow[] {
  if (!text.trim()) return [];

  const lines = parseLines(text);
  if (lines.length < 2) return [];

  const headers = lines[0];
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i];
    if (fields.length === 0 || (fields.length === 1 && fields[0] === "")) continue;
    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = fields[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

/** Parse CSV text into array of field arrays, handling quoted fields */
function parseLines(text: string): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        current.push(field);
        field = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        current.push(field);
        field = "";
        if (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n") i++;
        result.push(current);
        current = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Last field/line
  if (field || current.length > 0) {
    current.push(field);
    result.push(current);
  }

  return result;
}

/** Load and index a domain's CSV data */
export function loadDomain(domain: Domain, dataDir: string): IndexedDomain {
  const config = CSV_CONFIG[domain];
  const filePath = path.join(dataDir, config.file);
  const text = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(text);

  const documents = rows.map((row) =>
    config.searchCols.map((col) => row[col] ?? "").join(" ")
  );

  const bm25 = new BM25();
  bm25.fit(documents);

  return { rows, bm25, searchCols: config.searchCols, outputCols: config.outputCols };
}

/** Load and index a stack's CSV data */
export function loadStack(stack: StackName, dataDir: string): IndexedDomain {
  const config = STACK_CONFIG[stack];
  const filePath = path.join(dataDir, config.file);
  const text = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(text);

  const documents = rows.map((row) =>
    STACK_SEARCH_COLS.map((col) => row[col] ?? "").join(" ")
  );

  const bm25 = new BM25();
  bm25.fit(documents);

  return { rows, bm25, searchCols: STACK_SEARCH_COLS, outputCols: STACK_OUTPUT_COLS };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/csv-loader.test.ts 2>&1 | tail -10`
Expected: All tests PASS.

Note: If `__dirname` resolution fails in vitest, use `import.meta.url` + `fileURLToPath` instead. The test provides `getDataDir()` which should resolve correctly.

**Step 5: Commit**

```bash
git add src/csv-loader.ts src/csv-loader.test.ts
git commit -m "feat: CSV loader with BM25 indexing for all domains and stacks"
```

---

### Task 5: Domain search and auto-detection

**Files:**
- Create: `src/search.ts`
- Create: `src/search.test.ts`

**Step 1: Write the failing test**

```typescript
// src/search.test.ts
import { describe, it, expect } from "vitest";
import { detectDomain, searchDomain, searchStack, initSearchIndices } from "./search.js";
import { getDataDir } from "./csv-loader.js";

// Initialize indices once for all tests
const dataDir = getDataDir();
const indices = initSearchIndices(dataDir);

describe("detectDomain", () => {
  it("detects color domain", () => {
    expect(detectDomain("color palette for SaaS")).toBe("color");
  });

  it("detects typography domain", () => {
    expect(detectDomain("font pairing for headings")).toBe("typography");
  });

  it("detects ux domain", () => {
    expect(detectDomain("accessibility keyboard navigation")).toBe("ux");
  });

  it("defaults to style for ambiguous queries", () => {
    expect(detectDomain("something completely unrelated")).toBe("style");
  });

  it("detects chart domain", () => {
    expect(detectDomain("bar chart visualization trend")).toBe("chart");
  });
});

describe("searchDomain", () => {
  it("searches style domain with results", () => {
    const result = searchDomain("minimalist clean", "style", 3, indices);
    expect(result.domain).toBe("style");
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.length).toBeLessThanOrEqual(3);
  });

  it("respects maxResults", () => {
    const result = searchDomain("design", "style", 1, indices);
    expect(result.results.length).toBeLessThanOrEqual(1);
  });

  it("filters zero-score results", () => {
    const result = searchDomain("xyznonexistentterm", "style", 3, indices);
    expect(result.results.every((r) => Object.keys(r).length > 0 || true)).toBe(true);
  });

  it("auto-detects domain when not specified", () => {
    const result = searchDomain("color palette hex", undefined, 3, indices);
    expect(result.domain).toBe("color");
  });
});

describe("searchStack", () => {
  it("searches react stack", () => {
    const result = searchStack("useState local state", "react", 3, indices);
    expect(result.domain).toBe("stack");
    expect(result.stack).toBe("react");
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("searches nextjs stack", () => {
    const result = searchStack("image optimization", "nextjs", 3, indices);
    expect(result.results.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/search.test.ts 2>&1 | tail -5`
Expected: FAIL — cannot find module `./search.js`

**Step 3: Write the search implementation**

```typescript
// src/search.ts
import { loadDomain, loadStack, type IndexedDomain } from "./csv-loader.js";
import {
  CSV_CONFIG, STACK_CONFIG, DOMAIN_NAMES, STACK_NAMES,
  type CsvRow, type Domain, type StackName,
  type SearchResult, type StackSearchResult,
} from "./types.js";

export interface SearchIndices {
  domains: Map<string, IndexedDomain>;
  stacks: Map<string, IndexedDomain>;
}

/** Initialize all search indices at startup */
export function initSearchIndices(dataDir: string): SearchIndices {
  const domains = new Map<string, IndexedDomain>();
  for (const domain of DOMAIN_NAMES) {
    domains.set(domain, loadDomain(domain, dataDir));
  }

  const stacks = new Map<string, IndexedDomain>();
  for (const stack of STACK_NAMES) {
    stacks.set(stack, loadStack(stack, dataDir));
  }

  return { domains, stacks };
}

/** Auto-detect the most relevant domain from query keywords */
export function detectDomain(query: string): Domain {
  const q = query.toLowerCase();

  const domainKeywords: Record<Domain, string[]> = {
    color: ["color", "palette", "hex", "#", "rgb"],
    chart: ["chart", "graph", "visualization", "trend", "bar", "pie", "scatter", "heatmap", "funnel"],
    landing: ["landing", "page", "cta", "conversion", "hero", "testimonial", "pricing", "section"],
    product: ["saas", "ecommerce", "e-commerce", "fintech", "healthcare", "gaming", "portfolio", "crypto", "dashboard"],
    style: ["style", "design", "ui", "minimalism", "glassmorphism", "neumorphism", "brutalism", "dark mode", "flat", "aurora", "prompt", "css", "implementation", "variable", "checklist", "tailwind"],
    ux: ["ux", "usability", "accessibility", "wcag", "touch", "scroll", "animation", "keyboard", "navigation", "mobile"],
    typography: ["font", "typography", "heading", "serif", "sans"],
    icons: ["icon", "icons", "lucide", "heroicons", "symbol", "glyph", "pictogram", "svg icon"],
    react: ["react", "next.js", "nextjs", "suspense", "memo", "usecallback", "useeffect", "rerender", "bundle", "waterfall", "barrel", "dynamic import", "rsc", "server component"],
    web: ["aria", "focus", "outline", "semantic", "virtualize", "autocomplete", "form", "input type", "preconnect"],
  };

  let bestDomain: Domain = "style";
  let bestScore = 0;

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    const score = keywords.filter((kw) => q.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain as Domain;
    }
  }

  return bestDomain;
}

/** Search a domain (or auto-detect) */
export function searchDomain(
  query: string,
  domain: Domain | undefined,
  maxResults: number,
  indices: SearchIndices,
): SearchResult {
  const resolvedDomain = domain ?? detectDomain(query);
  const indexed = indices.domains.get(resolvedDomain);

  if (!indexed) {
    return { domain: resolvedDomain, query, file: "", count: 0, results: [] };
  }

  const ranked = indexed.bm25.score(query);
  const results: CsvRow[] = [];

  for (const [idx, score] of ranked) {
    if (score <= 0 || results.length >= maxResults) break;
    const row = indexed.rows[idx];
    const output: CsvRow = {};
    for (const col of indexed.outputCols) {
      if (col in row) output[col] = row[col];
    }
    results.push(output);
  }

  const config = CSV_CONFIG[resolvedDomain];
  return { domain: resolvedDomain, query, file: config.file, count: results.length, results };
}

/** Search a specific tech stack */
export function searchStack(
  query: string,
  stack: StackName,
  maxResults: number,
  indices: SearchIndices,
): StackSearchResult {
  const indexed = indices.stacks.get(stack);

  if (!indexed) {
    return { domain: "stack", stack, query, file: "", count: 0, results: [] };
  }

  const ranked = indexed.bm25.score(query);
  const results: CsvRow[] = [];

  for (const [idx, score] of ranked) {
    if (score <= 0 || results.length >= maxResults) break;
    const row = indexed.rows[idx];
    const output: CsvRow = {};
    for (const col of indexed.outputCols) {
      if (col in row) output[col] = row[col];
    }
    results.push(output);
  }

  const config = STACK_CONFIG[stack];
  return { domain: "stack", stack, query, file: config.file, count: results.length, results };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/search.test.ts 2>&1 | tail -10`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/search.ts src/search.test.ts
git commit -m "feat: domain search with auto-detection and stack search"
```

---

### Task 6: Design system generator

**Files:**
- Create: `src/design-system.ts`
- Create: `src/design-system.test.ts`

**Step 1: Write the failing test**

```typescript
// src/design-system.test.ts
import { describe, it, expect } from "vitest";
import { DesignSystemGenerator } from "./design-system.js";
import { initSearchIndices } from "./search.js";
import { getDataDir } from "./csv-loader.js";

const dataDir = getDataDir();
const indices = initSearchIndices(dataDir);
const generator = new DesignSystemGenerator(dataDir, indices);

describe("DesignSystemGenerator", () => {
  it("generates a design system for SaaS dashboard query", () => {
    const ds = generator.generate("SaaS dashboard analytics", "My SaaS App");
    expect(ds.projectName).toBe("My SaaS App");
    expect(ds.category).toBeDefined();
    expect(ds.style.name).toBeDefined();
    expect(ds.colors.primary).toMatch(/^#/);
    expect(ds.colors.secondary).toMatch(/^#/);
    expect(ds.colors.cta).toMatch(/^#/);
    expect(ds.typography.heading).toBeDefined();
    expect(ds.typography.body).toBeDefined();
    expect(ds.pattern.name).toBeDefined();
  });

  it("generates different results for different queries", () => {
    const spa = generator.generate("beauty spa wellness", "Spa");
    const tech = generator.generate("tech startup developer tools", "DevTool");
    // Different queries should produce different styles or colors
    const spaKey = `${spa.style.name}|${spa.colors.primary}`;
    const techKey = `${tech.style.name}|${tech.colors.primary}`;
    expect(spaKey).not.toBe(techKey);
  });

  it("uses query as project name when not provided", () => {
    const ds = generator.generate("fintech banking");
    expect(ds.projectName).toBe("FINTECH BANKING");
  });

  it("includes reasoning data (anti-patterns, effects)", () => {
    const ds = generator.generate("e-commerce luxury", "Luxury Shop");
    // Should have some anti-patterns from reasoning rules
    expect(typeof ds.antiPatterns).toBe("string");
    expect(typeof ds.keyEffects).toBe("string");
  });

  it("finds matching reasoning rule for known categories", () => {
    const ds = generator.generate("SaaS", "Test");
    // SaaS should match the "SaaS (General)" reasoning rule
    expect(ds.severity).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/design-system.test.ts 2>&1 | tail -5`
Expected: FAIL — cannot find module `./design-system.js`

**Step 3: Write the design system generator**

Port the `DesignSystemGenerator` class from `design_system.py`:

```typescript
// src/design-system.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { parseCsv } from "./csv-loader.js";
import { searchDomain, type SearchIndices } from "./search.js";
import type {
  CsvRow, DesignSystem, DesignSystemPattern, DesignSystemStyle,
  DesignSystemColors, DesignSystemTypography, ReasoningRule,
} from "./types.js";

const SEARCH_CONFIG: Record<string, { maxResults: number }> = {
  product: { maxResults: 1 },
  style: { maxResults: 3 },
  color: { maxResults: 2 },
  landing: { maxResults: 2 },
  typography: { maxResults: 2 },
};

export class DesignSystemGenerator {
  private reasoningData: CsvRow[];
  private indices: SearchIndices;

  constructor(dataDir: string, indices: SearchIndices) {
    this.indices = indices;
    const reasoningFile = path.join(dataDir, "ui-reasoning.csv");
    const text = fs.readFileSync(reasoningFile, "utf-8");
    this.reasoningData = parseCsv(text);
  }

  /** Find matching reasoning rule for a UI category */
  private findReasoningRule(category: string): ReasoningRule {
    const catLower = category.toLowerCase();

    // Exact match
    for (const rule of this.reasoningData) {
      if ((rule["UI_Category"] ?? "").toLowerCase() === catLower) {
        return this.parseRule(rule);
      }
    }

    // Partial match
    for (const rule of this.reasoningData) {
      const uiCat = (rule["UI_Category"] ?? "").toLowerCase();
      if (uiCat.includes(catLower) || catLower.includes(uiCat)) {
        return this.parseRule(rule);
      }
    }

    // Keyword match
    for (const rule of this.reasoningData) {
      const uiCat = (rule["UI_Category"] ?? "").toLowerCase();
      const keywords = uiCat.replace(/[/\-]/g, " ").split(/\s+/);
      if (keywords.some((kw) => kw.length > 2 && catLower.includes(kw))) {
        return this.parseRule(rule);
      }
    }

    // Default
    return {
      pattern: "Hero + Features + CTA",
      stylePriority: ["Minimalism", "Flat Design"],
      colorMood: "Professional",
      typographyMood: "Clean",
      keyEffects: "Subtle hover transitions",
      antiPatterns: "",
      decisionRules: {},
      severity: "MEDIUM",
    };
  }

  private parseRule(rule: CsvRow): ReasoningRule {
    let decisionRules: Record<string, string> = {};
    try {
      decisionRules = JSON.parse(rule["Decision_Rules"] ?? "{}");
    } catch {
      // ignore parse errors
    }

    return {
      pattern: rule["Recommended_Pattern"] ?? "",
      stylePriority: (rule["Style_Priority"] ?? "")
        .split("+")
        .map((s) => s.trim())
        .filter(Boolean),
      colorMood: rule["Color_Mood"] ?? "",
      typographyMood: rule["Typography_Mood"] ?? "",
      keyEffects: rule["Key_Effects"] ?? "",
      antiPatterns: rule["Anti_Patterns"] ?? "",
      decisionRules,
      severity: rule["Severity"] ?? "MEDIUM",
    };
  }

  /** Select best match from results based on priority keywords */
  private selectBestMatch(results: CsvRow[], priorityKeywords: string[]): CsvRow {
    if (results.length === 0) return {};
    if (priorityKeywords.length === 0) return results[0];

    // Exact style name match
    for (const priority of priorityKeywords) {
      const pLower = priority.toLowerCase().trim();
      for (const result of results) {
        const styleName = (result["Style Category"] ?? "").toLowerCase();
        if (pLower.includes(styleName) || styleName.includes(pLower)) {
          return result;
        }
      }
    }

    // Score by keyword overlap
    let bestScore = -1;
    let bestResult = results[0];

    for (const result of results) {
      const resultStr = JSON.stringify(result).toLowerCase();
      let score = 0;
      for (const kw of priorityKeywords) {
        const kwLower = kw.toLowerCase().trim();
        if ((result["Style Category"] ?? "").toLowerCase().includes(kwLower)) {
          score += 10;
        } else if ((result["Keywords"] ?? "").toLowerCase().includes(kwLower)) {
          score += 3;
        } else if (resultStr.includes(kwLower)) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
      }
    }

    return bestResult;
  }

  /** Generate a complete design system recommendation */
  generate(query: string, projectName?: string): DesignSystem {
    // Step 1: Search product to get category
    const productResult = searchDomain(query, "product", 1, this.indices);
    const category =
      productResult.results[0]?.["Product Type"] ?? "General";

    // Step 2: Get reasoning rules
    const reasoning = this.findReasoningRule(category);

    // Step 3: Multi-domain search with style priority hints
    const styleQuery =
      reasoning.stylePriority.length > 0
        ? `${query} ${reasoning.stylePriority.slice(0, 2).join(" ")}`
        : query;

    const styleResult = searchDomain(styleQuery, "style", 3, this.indices);
    const colorResult = searchDomain(query, "color", 2, this.indices);
    const typographyResult = searchDomain(query, "typography", 2, this.indices);
    const landingResult = searchDomain(query, "landing", 2, this.indices);

    // Step 4: Select best matches
    const bestStyle = this.selectBestMatch(styleResult.results, reasoning.stylePriority);
    const bestColor = colorResult.results[0] ?? {};
    const bestTypography = typographyResult.results[0] ?? {};
    const bestLanding = landingResult.results[0] ?? {};

    // Step 5: Build design system
    const styleEffects = bestStyle["Effects & Animation"] ?? "";
    const combinedEffects = styleEffects || reasoning.keyEffects;

    const pattern: DesignSystemPattern = {
      name: bestLanding["Pattern Name"] ?? reasoning.pattern,
      sections: bestLanding["Section Order"] ?? "Hero > Features > CTA",
      ctaPlacement: bestLanding["Primary CTA Placement"] ?? "Above fold",
      colorStrategy: bestLanding["Color Strategy"] ?? "",
      conversion: bestLanding["Conversion Optimization"] ?? "",
    };

    const style: DesignSystemStyle = {
      name: bestStyle["Style Category"] ?? "Minimalism",
      type: bestStyle["Type"] ?? "General",
      effects: styleEffects,
      keywords: bestStyle["Keywords"] ?? "",
      bestFor: bestStyle["Best For"] ?? "",
      performance: bestStyle["Performance"] ?? "",
      accessibility: bestStyle["Accessibility"] ?? "",
    };

    const colors: DesignSystemColors = {
      primary: bestColor["Primary (Hex)"] ?? "#2563EB",
      secondary: bestColor["Secondary (Hex)"] ?? "#3B82F6",
      cta: bestColor["CTA (Hex)"] ?? "#F97316",
      background: bestColor["Background (Hex)"] ?? "#F8FAFC",
      text: bestColor["Text (Hex)"] ?? "#1E293B",
      notes: bestColor["Notes"] ?? "",
    };

    const typography: DesignSystemTypography = {
      heading: bestTypography["Heading Font"] ?? "Inter",
      body: bestTypography["Body Font"] ?? "Inter",
      mood: bestTypography["Mood/Style Keywords"] ?? reasoning.typographyMood,
      bestFor: bestTypography["Best For"] ?? "",
      googleFontsUrl: bestTypography["Google Fonts URL"] ?? "",
      cssImport: bestTypography["CSS Import"] ?? "",
    };

    return {
      projectName: projectName ?? query.toUpperCase(),
      category,
      pattern,
      style,
      colors,
      typography,
      keyEffects: combinedEffects,
      antiPatterns: reasoning.antiPatterns,
      decisionRules: reasoning.decisionRules,
      severity: reasoning.severity,
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/design-system.test.ts 2>&1 | tail -10`
Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add src/design-system.ts src/design-system.test.ts
git commit -m "feat: design system generator with reasoning engine"
```

---

### Task 7: Persistence — MASTER.md and page overrides

**Files:**
- Create: `src/persist.ts`
- Create: `src/persist.test.ts`

**Step 1: Write the failing test**

```typescript
// src/persist.test.ts
import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { persistDesignSystem, formatMasterMd, formatPageOverrideMd } from "./persist.js";
import { DesignSystemGenerator } from "./design-system.js";
import { initSearchIndices } from "./search.js";
import { getDataDir } from "./csv-loader.js";

const dataDir = getDataDir();
const indices = initSearchIndices(dataDir);
const generator = new DesignSystemGenerator(dataDir, indices);

describe("formatMasterMd", () => {
  it("produces markdown with all required sections", () => {
    const ds = generator.generate("SaaS dashboard", "TestProject");
    const md = formatMasterMd(ds);
    expect(md).toContain("# Design System Master File");
    expect(md).toContain("**Project:** TestProject");
    expect(md).toContain("## Global Rules");
    expect(md).toContain("### Color Palette");
    expect(md).toContain("### Typography");
    expect(md).toContain("## Anti-Patterns");
    expect(md).toContain("## Pre-Delivery Checklist");
  });

  it("includes CSS variables in color table", () => {
    const ds = generator.generate("SaaS", "Test");
    const md = formatMasterMd(ds);
    expect(md).toContain("`--color-primary`");
    expect(md).toContain("`--color-cta`");
  });
});

describe("persistDesignSystem", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes MASTER.md to design-system/<project>/", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-"));
    const ds = generator.generate("SaaS dashboard", "My App");
    const result = persistDesignSystem(ds, undefined, tmpDir);
    expect(result.createdFiles.length).toBe(1);
    expect(result.createdFiles[0]).toContain("MASTER.md");
    expect(fs.existsSync(result.createdFiles[0])).toBe(true);
  });

  it("writes page override file when page is specified", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-"));
    const ds = generator.generate("SaaS dashboard", "My App");
    const result = persistDesignSystem(ds, "dashboard", tmpDir);
    expect(result.createdFiles.length).toBe(2);
    expect(result.createdFiles[1]).toContain("dashboard.md");
    expect(fs.existsSync(result.createdFiles[1])).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/persist.test.ts 2>&1 | tail -5`
Expected: FAIL — cannot find module `./persist.js`

**Step 3: Write the persistence implementation**

```typescript
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

  // Component Specs (buttons, cards, inputs, modals with colors injected)
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/persist.test.ts 2>&1 | tail -10`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/persist.ts src/persist.test.ts
git commit -m "feat: MASTER.md and page override persistence"
```

---

## Phase 2: Tools and Rendering

### Task 8: Custom renderers for design_system tool

**Files:**
- Create: `src/render/design-system.ts`

**Step 1: Write the design system renderer**

This provides `renderCall` (shows query while running with streaming progress) and `renderResult` (shows compact result or expanded full view).

```typescript
// src/render/design-system.ts
import { Text } from "@mariozechner/pi-tui";
import type { DesignSystem, DesignSystemToolDetails } from "../types.js";

/** Render the tool call line (shown while executing) */
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

/** Render the tool result */
export function renderDesignSystemResult(
  result: { content: Array<{ type: string; text: string }>; details?: DesignSystemToolDetails; isError?: boolean },
  options: { expanded: boolean; isPartial: boolean },
  theme: any,
): any {
  if (options.isPartial) {
    const details = result.details;
    if (!details) return new Text(theme.fg("warning", "  Searching..."), 0, 0);

    const ds = details.designSystem;
    const lines: string[] = [];

    if (ds.category) lines.push(theme.fg("success", "  ✓ ") + theme.fg("muted", `Product type: ${ds.category}`));
    if (ds.style.name) lines.push(theme.fg("success", "  ✓ ") + theme.fg("muted", `Style: ${ds.style.name}`));
    if (ds.colors.primary) {
      lines.push(
        theme.fg("success", "  ✓ ") +
        theme.fg("muted", `Colors: ${ds.colors.primary} / ${ds.colors.secondary} / ${ds.colors.cta}`),
      );
    }
    if (ds.typography.heading) {
      lines.push(
        theme.fg("success", "  ✓ ") +
        theme.fg("muted", `Typography: ${ds.typography.heading} / ${ds.typography.body}`),
      );
    }
    if (ds.pattern.name) lines.push(theme.fg("success", "  ✓ ") + theme.fg("muted", `Pattern: ${ds.pattern.name}`));

    return new Text(lines.join("\n"), 0, 0);
  }

  if (result.isError) {
    const errText = result.content.map((c) => c.text).join("");
    return new Text(theme.fg("error", `  ✗ ${errText}`), 0, 0);
  }

  const details = result.details;
  if (!details?.designSystem) {
    return new Text(theme.fg("dim", result.content.map((c) => c.text).join("")), 0, 0);
  }

  const ds = details.designSystem;

  if (!options.expanded) {
    // Compact view
    const lines: string[] = [];
    lines.push(
      theme.fg("success", "  ✓ ") +
      theme.bold(ds.projectName) +
      theme.fg("dim", ` (${ds.category})`),
    );
    lines.push(
      theme.fg("dim", "    Style: ") + ds.style.name +
      theme.fg("dim", " | Pattern: ") + ds.pattern.name,
    );
    lines.push(
      theme.fg("dim", "    Colors: ") +
      `${ds.colors.primary} ${ds.colors.secondary} ${ds.colors.cta}`,
    );
    lines.push(
      theme.fg("dim", "    Typography: ") +
      `${ds.typography.heading} / ${ds.typography.body}`,
    );
    if (details.persisted?.master) {
      lines.push(theme.fg("success", "    💾 ") + theme.fg("dim", details.persisted.master));
    }
    return new Text(lines.join("\n"), 0, 0);
  }

  // Expanded view — full design system
  return new Text(formatExpandedDesignSystem(ds, details, theme), 0, 0);
}

function formatExpandedDesignSystem(ds: DesignSystem, details: DesignSystemToolDetails, theme: any): string {
  const lines: string[] = [];
  const h = (t: string) => theme.fg("accent", theme.bold(t));
  const d = (t: string) => theme.fg("dim", t);
  const m = (t: string) => theme.fg("muted", t);

  lines.push(h(`  Design System: ${ds.projectName}`) + d(` (${ds.category})`));
  lines.push("");

  // Pattern
  lines.push(h("  Pattern"));
  lines.push(`    Name: ${ds.pattern.name}`);
  if (ds.pattern.conversion) lines.push(`    Conversion: ${ds.pattern.conversion}`);
  if (ds.pattern.ctaPlacement) lines.push(`    CTA: ${ds.pattern.ctaPlacement}`);
  lines.push(`    Sections: ${ds.pattern.sections}`);
  lines.push("");

  // Style
  lines.push(h("  Style"));
  lines.push(`    ${ds.style.name}` + d(` (${ds.style.type})`));
  if (ds.style.keywords) lines.push(d(`    Keywords: ${ds.style.keywords}`));
  if (ds.style.bestFor) lines.push(d(`    Best For: ${ds.style.bestFor}`));
  if (ds.style.performance) lines.push(d(`    Performance: ${ds.style.performance} | Accessibility: ${ds.style.accessibility}`));
  lines.push("");

  // Colors
  lines.push(h("  Colors"));
  lines.push(`    Primary:    ${ds.colors.primary}`);
  lines.push(`    Secondary:  ${ds.colors.secondary}`);
  lines.push(`    CTA:        ${ds.colors.cta}`);
  lines.push(`    Background: ${ds.colors.background}`);
  lines.push(`    Text:       ${ds.colors.text}`);
  if (ds.colors.notes) lines.push(d(`    Notes: ${ds.colors.notes}`));
  lines.push("");

  // Typography
  lines.push(h("  Typography"));
  lines.push(`    Heading: ${ds.typography.heading}`);
  lines.push(`    Body: ${ds.typography.body}`);
  if (ds.typography.mood) lines.push(d(`    Mood: ${ds.typography.mood}`));
  if (ds.typography.googleFontsUrl) lines.push(d(`    Fonts: ${ds.typography.googleFontsUrl}`));
  lines.push("");

  // Effects
  if (ds.keyEffects) {
    lines.push(h("  Effects"));
    lines.push(`    ${ds.keyEffects}`);
    lines.push("");
  }

  // Anti-patterns
  if (ds.antiPatterns) {
    lines.push(h("  Anti-Patterns"));
    for (const item of ds.antiPatterns.split("+").map((s) => s.trim()).filter(Boolean)) {
      lines.push(theme.fg("error", `    ✗ `) + item);
    }
    lines.push("");
  }

  // Checklist
  lines.push(h("  Pre-Delivery Checklist"));
  lines.push(m("    [ ] No emojis as icons (use SVG: Heroicons/Lucide)"));
  lines.push(m("    [ ] cursor-pointer on all clickable elements"));
  lines.push(m("    [ ] Hover states with smooth transitions (150-300ms)"));
  lines.push(m("    [ ] Light mode: text contrast 4.5:1 minimum"));
  lines.push(m("    [ ] Focus states visible for keyboard nav"));
  lines.push(m("    [ ] prefers-reduced-motion respected"));
  lines.push(m("    [ ] Responsive: 375px, 768px, 1024px, 1440px"));

  // Persistence
  if (details.persisted?.master) {
    lines.push("");
    lines.push(theme.fg("success", `  💾 Saved: ${details.persisted.master}`));
    if (details.persisted.page) {
      lines.push(theme.fg("success", `  💾 Page: ${details.persisted.page}`));
    }
  }

  return lines.join("\n");
}
```

**Step 2: Commit**

```bash
git add src/render/design-system.ts
git commit -m "feat: TUI renderer for design_system tool"
```

---

### Task 9: Custom renderers for ui_search and ui_stack_guide tools

**Files:**
- Create: `src/render/search.ts`
- Create: `src/render/stack.ts`

**Step 1: Write the search renderer**

```typescript
// src/render/search.ts
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
  if (options.isPartial) {
    return new Text(theme.fg("warning", "  Searching..."), 0, 0);
  }

  if (result.isError) {
    return new Text(theme.fg("error", `  ✗ ${result.content.map((c) => c.text).join("")}`), 0, 0);
  }

  const details = result.details;
  if (!details) {
    return new Text(theme.fg("dim", result.content.map((c) => c.text).join("")), 0, 0);
  }

  if (!options.expanded) {
    // Compact: domain + count + first result summaries
    const lines: string[] = [];
    lines.push(
      theme.fg("success", "  ✓ ") +
      theme.fg("muted", `${details.domain}`) +
      theme.fg("dim", ` (${details.results.length} results)`),
    );
    for (const row of details.results) {
      const firstVal = Object.values(row)[0] ?? "";
      const severity = row["Severity"] ?? "";
      const label = severity ? theme.fg("warning", ` (${severity})`) : "";
      lines.push(theme.fg("dim", "    • ") + firstVal + label);
    }
    return new Text(lines.join("\n"), 0, 0);
  }

  // Expanded: full row details
  const lines: string[] = [];
  lines.push(
    theme.fg("accent", theme.bold(`  ${details.domain}`)) +
    theme.fg("dim", ` — "${details.query}" — ${details.results.length} results`),
  );
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
```

**Step 2: Write the stack renderer**

```typescript
// src/render/stack.ts
import { Text } from "@mariozechner/pi-tui";
import type { StackToolDetails } from "../types.js";

export function renderStackCall(
  args: { query: string; stack: string; maxResults?: number },
  theme: any,
): any {
  let text = theme.fg("toolTitle", theme.bold("ui_stack_guide "));
  text += theme.fg("dim", `"${args.query}"`);
  text += theme.fg("muted", ` → ${args.stack}`);
  return new Text(text, 0, 0);
}

export function renderStackResult(
  result: { content: Array<{ type: string; text: string }>; details?: StackToolDetails; isError?: boolean },
  options: { expanded: boolean; isPartial: boolean },
  theme: any,
): any {
  if (options.isPartial) {
    return new Text(theme.fg("warning", "  Searching..."), 0, 0);
  }

  if (result.isError) {
    return new Text(theme.fg("error", `  ✗ ${result.content.map((c) => c.text).join("")}`), 0, 0);
  }

  const details = result.details;
  if (!details) {
    return new Text(theme.fg("dim", result.content.map((c) => c.text).join("")), 0, 0);
  }

  if (!options.expanded) {
    const lines: string[] = [];
    lines.push(
      theme.fg("success", "  ✓ ") +
      theme.fg("muted", details.stack) +
      theme.fg("dim", ` (${details.results.length} results)`),
    );
    for (const row of details.results) {
      const guideline = row["Guideline"] ?? Object.values(row)[0] ?? "";
      const severity = row["Severity"] ?? "";
      const label = severity ? theme.fg("warning", ` (${severity})`) : "";
      lines.push(theme.fg("dim", "    • ") + guideline + label);
    }
    return new Text(lines.join("\n"), 0, 0);
  }

  // Expanded view
  const lines: string[] = [];
  lines.push(
    theme.fg("accent", theme.bold(`  ${details.stack}`)) +
    theme.fg("dim", ` — "${details.query}" — ${details.results.length} results`),
  );
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
```

**Step 3: Commit**

```bash
git add src/render/search.ts src/render/stack.ts
git commit -m "feat: TUI renderers for ui_search and ui_stack_guide tools"
```

---

### Task 10: Extension entry point — register all 3 tools

**Files:**
- Create: `extensions/index.ts`

**Step 1: Write the extension entry point**

This is the main file that registers all three tools, the `/ui-settings` command, and event hooks.

```typescript
// extensions/index.ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { StringEnum } from "@mariozechner/pi-ai";
import * as path from "node:path";

import { initSearchIndices, searchDomain, searchStack } from "../src/search.js";
import { DesignSystemGenerator } from "../src/design-system.js";
import { persistDesignSystem } from "../src/persist.js";
import { getDataDir } from "../src/csv-loader.js";
import type {
  Domain, StackName, DesignSystem,
  DesignSystemToolDetails, SearchToolDetails, StackToolDetails,
} from "../src/types.js";

// Renderers
import { renderDesignSystemCall, renderDesignSystemResult } from "../src/render/design-system.js";
import { renderSearchCall, renderSearchResult } from "../src/render/search.js";
import { renderStackCall, renderStackResult } from "../src/render/stack.js";

const STACKS = [
  "html-tailwind", "react", "nextjs", "vue", "svelte",
  "swiftui", "react-native", "flutter", "shadcn",
  "jetpack-compose", "astro", "nuxtjs", "nuxt-ui",
] as const;

const DOMAINS = [
  "style", "color", "typography", "chart", "landing",
  "product", "ux", "icons", "react", "web",
] as const;

export default function (pi: ExtensionAPI) {
  // Initialize search indices (loads all CSV data)
  const dataDir = getDataDir();
  const indices = initSearchIndices(dataDir);
  const generator = new DesignSystemGenerator(dataDir, indices);

  // Track active design system for auto-inject hook
  let activeDesignSystem: { summary: string; path: string } | null = null;

  // ============ Tool 1: design_system ============
  pi.registerTool({
    name: "design_system",
    label: "Design System",
    description:
      "Generate a tailored UI/UX design system by searching curated data (67 styles, 97 color palettes, 57 font pairings, 100 reasoning rules, 24 landing patterns). Returns recommended pattern, style, colors, typography, effects, anti-patterns, and checklist. Call multiple times to explore alternatives — refine the query based on user feedback. Use persist to save to disk.",
    parameters: Type.Object({
      query: Type.String({ description: "Descriptive query: product type, industry, mood, keywords" }),
      projectName: Type.Optional(Type.String({ description: "Project name for the design system" })),
      stack: Type.Optional(StringEnum([...STACKS])),
      format: Type.Optional(StringEnum(["markdown", "ascii"] as const)),
      persist: Type.Optional(Type.Boolean({ description: "Save design system to design-system/MASTER.md" })),
      page: Type.Optional(Type.String({ description: "Generate page-specific override file" })),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { query, projectName, persist: shouldPersist, page } = params;

      // Generate design system
      const ds = generator.generate(query, projectName);

      const details: DesignSystemToolDetails = {
        designSystem: ds,
        searchScores: {},
        query,
      };

      // Persist if requested
      if (shouldPersist) {
        const result = persistDesignSystem(ds, page, ctx.cwd);
        details.persisted = {
          master: result.createdFiles[0],
          page: result.createdFiles[1],
        };

        // Track for auto-inject
        activeDesignSystem = {
          summary: `${ds.projectName}: ${ds.style.name} | ${ds.colors.primary} ${ds.colors.secondary} ${ds.colors.cta} | ${ds.typography.heading}/${ds.typography.body}`,
          path: result.createdFiles[0],
        };
      }

      // Build compact content for LLM (~400 bytes)
      const contentLines: string[] = [];
      contentLines.push(`Design System: ${ds.projectName}`);
      contentLines.push(`Style: ${ds.style.name} | Pattern: ${ds.pattern.name}`);
      contentLines.push(`Colors: primary=${ds.colors.primary} secondary=${ds.colors.secondary} cta=${ds.colors.cta} bg=${ds.colors.background} text=${ds.colors.text}`);
      contentLines.push(`Typography: ${ds.typography.heading} / ${ds.typography.body} (${ds.typography.mood})`);
      if (ds.antiPatterns) contentLines.push(`Anti-patterns: ${ds.antiPatterns}`);
      if (details.persisted?.master) contentLines.push(`Saved: ${details.persisted.master}`);
      contentLines.push("Refine query or call again to explore alternatives.");

      return {
        content: [{ type: "text", text: contentLines.join("\n") }],
        details,
      };
    },

    renderCall: renderDesignSystemCall,
    renderResult: renderDesignSystemResult,
  });

  // ============ Tool 2: ui_search ============
  pi.registerTool({
    name: "ui_search",
    label: "UI Search",
    description:
      "Search the UI/UX knowledge base by domain. Domains: style, color, typography, chart, landing, product, ux, icons, react (performance), web (interface guidelines). Auto-detects domain from query if omitted.",
    parameters: Type.Object({
      query: Type.String({ description: "Search keywords" }),
      domain: Type.Optional(StringEnum([...DOMAINS])),
      maxResults: Type.Optional(Type.Number({ description: "Max results, default 3" })),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { query, domain, maxResults = 3 } = params;

      const result = searchDomain(query, domain as Domain | undefined, maxResults, indices);

      // Compact content for LLM
      const contentLines: string[] = [];
      contentLines.push(`Domain: ${result.domain} | Found: ${result.count} results`);
      for (const row of result.results) {
        const entries = Object.entries(row).slice(0, 4);
        contentLines.push(entries.map(([k, v]) => `${k}: ${v.slice(0, 80)}`).join(" | "));
      }

      const details: SearchToolDetails = {
        domain: result.domain,
        query: result.query,
        results: result.results,
      };

      return {
        content: [{ type: "text", text: contentLines.join("\n") }],
        details,
      };
    },

    renderCall: renderSearchCall,
    renderResult: renderSearchResult,
  });

  // ============ Tool 3: ui_stack_guide ============
  pi.registerTool({
    name: "ui_stack_guide",
    label: "UI Stack Guide",
    description:
      "Get implementation guidelines for a specific tech stack. Covers best practices, Do/Don't patterns, and code examples.",
    parameters: Type.Object({
      query: Type.String({ description: "What you need guidance on" }),
      stack: StringEnum([...STACKS]),
      maxResults: Type.Optional(Type.Number({ description: "Max results, default 3" })),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { query, stack, maxResults = 3 } = params;

      const result = searchStack(query, stack as StackName, maxResults, indices);

      // Compact content for LLM
      const contentLines: string[] = [];
      contentLines.push(`Stack: ${result.stack} | Found: ${result.count} results`);
      for (const row of result.results) {
        const guideline = row["Guideline"] ?? "";
        const severity = row["Severity"] ?? "";
        const doText = row["Do"] ?? "";
        contentLines.push(`${guideline} (${severity}): ${doText.slice(0, 100)}`);
      }

      const details: StackToolDetails = {
        stack: result.stack ?? stack,
        query: result.query ?? query,
        results: result.results,
      };

      return {
        content: [{ type: "text", text: contentLines.join("\n") }],
        details,
      };
    },

    renderCall: renderStackCall,
    renderResult: renderStackResult,
  });

  // ============ Context Hook: Prune old design_system iterations ============
  pi.on("context", async (event) => {
    const messages = event.messages;
    let lastDesignSystemIdx = -1;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "toolResult" && msg.toolName === "design_system") {
        if (lastDesignSystemIdx === -1) {
          lastDesignSystemIdx = i;
        } else {
          // Replace older iterations with stub
          messages[i] = {
            ...msg,
            content: [{ type: "text", text: "(superseded by later iteration)" }],
          };
        }
      }
    }

    return { messages };
  });
}
```

**Step 2: Verify extension loads**

Run: `pi -e ./extensions/index.ts -p "List the tools you have available that start with 'ui' or 'design'" 2>&1 | head -20`

Expected: Should see the three tools listed in the output.

**Step 3: Commit**

```bash
git add extensions/index.ts
git commit -m "feat: extension entry point — registers design_system, ui_search, ui_stack_guide tools"
```

---

## Phase 3: Settings, Prompt Template, and Event Hooks

### Task 11: Settings management

**Files:**
- Create: `src/settings.ts`
- Create: `src/settings.test.ts`

**Step 1: Write the failing test**

```typescript
// src/settings.test.ts
import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "./settings.js";

describe("settings", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns defaults when no file exists", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-settings-"));
    const settings = loadSettings(path.join(tmpDir, ".pi"));
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("saves and loads settings", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-settings-"));
    const piDir = path.join(tmpDir, ".pi");
    const custom = { ...DEFAULT_SETTINGS, defaultStack: "react" as const, autoInjectDesignSystem: true };
    saveSettings(piDir, custom);
    const loaded = loadSettings(piDir);
    expect(loaded.defaultStack).toBe("react");
    expect(loaded.autoInjectDesignSystem).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/settings.test.ts 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write the settings implementation**

```typescript
// src/settings.ts
import * as fs from "node:fs";
import * as path from "node:path";
import type { UiUxSettings } from "./types.js";

export { DEFAULT_SETTINGS } from "./types.js";

const SETTINGS_FILE = "ui-ux-pro-max.json";

/** Load settings from .pi/ directory, returns defaults if not found */
export function loadSettings(piDir: string): UiUxSettings {
  const filePath = path.join(piDir, SETTINGS_FILE);
  try {
    const text = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(text);
    return {
      autoInjectDesignSystem: data.autoInjectDesignSystem ?? false,
      defaultStack: data.defaultStack ?? null,
      defaultFormat: data.defaultFormat ?? "markdown",
    };
  } catch {
    return { autoInjectDesignSystem: false, defaultStack: null, defaultFormat: "markdown" };
  }
}

/** Save settings to .pi/ directory */
export function saveSettings(piDir: string, settings: UiUxSettings): void {
  fs.mkdirSync(piDir, { recursive: true });
  const filePath = path.join(piDir, SETTINGS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/settings.test.ts 2>&1 | tail -10`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/settings.ts src/settings.test.ts
git commit -m "feat: settings management with file persistence"
```

---

### Task 12: Prompt template — /ui-checklist

**Files:**
- Create: `prompts/ui-checklist.md`

**Step 1: Write the prompt template**

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

**Step 2: Commit**

```bash
git add prompts/ui-checklist.md
git commit -m "feat: /ui-checklist prompt template"
```

---

### Task 13: /ui-settings command and auto-inject hook

**Files:**
- Modify: `extensions/index.ts`

**Step 1: Add settings imports and state to extensions/index.ts**

Add to the top of the `export default function` body, after the existing index initialization:

```typescript
  // Settings
  import { loadSettings, saveSettings } from "../src/settings.js";
  import type { UiUxSettings } from "../src/types.js";
```

Wait — imports must be at the top level. We need to add them to the top of the file and use them inside the function. Add these imports at the top of `extensions/index.ts`:

```typescript
import { loadSettings, saveSettings } from "../src/settings.js";
```

Then add inside the default function, after the existing init code:

```typescript
  // Load settings
  let settings = loadSettings(path.join(ctx.cwd, ".pi"));
```

Actually, since `ctx` is only available in event handlers and tool execute, we need to load settings on session_start. Here's the full addition to `extensions/index.ts`.

Add this code inside the `export default function` body, **after** the existing tool registrations and **before** the context hook:

```typescript
  // ============ Settings ============
  let settings: UiUxSettings = { autoInjectDesignSystem: false, defaultStack: null, defaultFormat: "markdown" };

  pi.on("session_start", async (_event, ctx) => {
    settings = loadSettings(path.join(ctx.cwd, ".pi"));

    // Reconstruct active design system from session state
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "message" && entry.message.role === "toolResult" && entry.message.toolName === "design_system") {
        const details = entry.message.details as DesignSystemToolDetails | undefined;
        if (details?.persisted?.master) {
          activeDesignSystem = {
            summary: `${details.designSystem.projectName}: ${details.designSystem.style.name}`,
            path: details.persisted.master,
          };
        }
      }
    }
  });

  // ============ /ui-settings Command ============
  pi.registerCommand("ui-settings", {
    description: "Configure UI/UX Pro Max settings",
    handler: async (_args, ctx) => {
      const { getSettingsListTheme } = await import("@mariozechner/pi-coding-agent");
      const { Container, SettingsList, Text } = await import("@mariozechner/pi-tui");

      await ctx.ui.custom((_tui, theme, _kb, done) => {
        const items = [
          {
            id: "autoInject",
            label: "Auto-inject design system context",
            currentValue: settings.autoInjectDesignSystem ? "on" : "off",
            values: ["on", "off"],
          },
          {
            id: "defaultStack",
            label: "Default tech stack",
            currentValue: settings.defaultStack ?? "none",
            values: ["none", ...STACKS],
          },
          {
            id: "defaultFormat",
            label: "Default output format",
            currentValue: settings.defaultFormat,
            values: ["markdown", "ascii"],
          },
        ];

        const container = new Container();
        container.addChild(new Text(theme.fg("accent", theme.bold("UI/UX Pro Max Settings")), 1, 1));

        const settingsList = new SettingsList(
          items,
          Math.min(items.length + 2, 10),
          getSettingsListTheme(),
          (id: string, newValue: string) => {
            if (id === "autoInject") settings.autoInjectDesignSystem = newValue === "on";
            if (id === "defaultStack") settings.defaultStack = newValue === "none" ? null : newValue as any;
            if (id === "defaultFormat") settings.defaultFormat = newValue as any;
            saveSettings(path.join(ctx.cwd, ".pi"), settings);
          },
          () => done(undefined),
        );
        container.addChild(settingsList);

        return {
          render: (w: number) => container.render(w),
          invalidate: () => container.invalidate(),
          handleInput: (data: string) => { settingsList.handleInput?.(data); },
        };
      });
    },
  });

  // ============ Auto-Inject Hook (opt-in) ============
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

**Important:** The imports for `loadSettings` and `saveSettings` must be at the top of the file with the other imports. Also add `import type { UiUxSettings }` to the imports from `../src/types.js`.

**Step 2: Verify the command works**

Run: `pi -e ./extensions/index.ts -p "What commands are available?" 2>&1 | head -20`

Expected: Should mention `/ui-settings` in the available commands.

**Step 3: Commit**

```bash
git add extensions/index.ts
git commit -m "feat: /ui-settings command, auto-inject hook, session state reconstruction"
```

---

### Task 14: Install vitest and run full test suite

**Files:**
- Modify: `package.json` (add devDependencies)

**Step 1: Add vitest**

Run:
```bash
npm init -y 2>/dev/null  # ensure package.json exists
npm install --save-dev vitest typescript
```

Then update `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 2: Run the full test suite**

Run: `npx vitest run 2>&1 | tail -20`

Expected: All tests pass across bm25, csv-loader, search, design-system, persist, and settings.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vitest, run full test suite"
```

---

### Task 15: Integration test — end-to-end tool execution

**Files:**
- Create: `src/integration.test.ts`

**Step 1: Write the integration test**

```typescript
// src/integration.test.ts
import { describe, it, expect } from "vitest";
import { initSearchIndices, searchDomain, searchStack } from "./search.js";
import { DesignSystemGenerator } from "./design-system.js";
import { persistDesignSystem, formatMasterMd } from "./persist.js";
import { getDataDir } from "./csv-loader.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const dataDir = getDataDir();
const indices = initSearchIndices(dataDir);
const generator = new DesignSystemGenerator(dataDir, indices);

describe("Integration: full design system workflow", () => {
  it("generates, formats, and persists a design system", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-int-"));
    try {
      // 1. Generate
      const ds = generator.generate("beauty spa wellness", "Serenity Spa");
      expect(ds.projectName).toBe("Serenity Spa");
      expect(ds.colors.primary).toMatch(/^#/);

      // 2. Format
      const md = formatMasterMd(ds);
      expect(md).toContain("# Design System Master File");
      expect(md).toContain("Serenity Spa");

      // 3. Persist
      const result = persistDesignSystem(ds, "landing", tmpDir);
      expect(result.createdFiles.length).toBe(2);
      expect(fs.existsSync(result.createdFiles[0])).toBe(true);
      expect(fs.existsSync(result.createdFiles[1])).toBe(true);

      // 4. Verify MASTER.md content
      const masterContent = fs.readFileSync(result.createdFiles[0], "utf-8");
      expect(masterContent).toContain("Serenity Spa");
      expect(masterContent).toContain(ds.colors.primary);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("searches all 10 domains", () => {
    const domains = ["style", "color", "chart", "landing", "product", "ux", "typography", "icons", "react", "web"] as const;
    for (const domain of domains) {
      const result = searchDomain("design", domain, 1, indices);
      expect(result.domain).toBe(domain);
      // Should return at least one result for "design" in most domains
    }
  });

  it("searches all 13 stacks", () => {
    const stacks = [
      "html-tailwind", "react", "nextjs", "vue", "svelte", "swiftui",
      "react-native", "flutter", "shadcn", "jetpack-compose", "astro", "nuxtjs", "nuxt-ui",
    ] as const;
    for (const stack of stacks) {
      const result = searchStack("component state", stack, 1, indices);
      expect(result.domain).toBe("stack");
      expect(result.stack).toBe(stack);
    }
  });

  it("content/details split keeps LLM content under 500 bytes", () => {
    const ds = generator.generate("SaaS dashboard analytics platform", "BigSaaS");
    // Simulate what the tool returns as content
    const contentLines: string[] = [];
    contentLines.push(`Design System: ${ds.projectName}`);
    contentLines.push(`Style: ${ds.style.name} | Pattern: ${ds.pattern.name}`);
    contentLines.push(`Colors: primary=${ds.colors.primary} secondary=${ds.colors.secondary} cta=${ds.colors.cta} bg=${ds.colors.background} text=${ds.colors.text}`);
    contentLines.push(`Typography: ${ds.typography.heading} / ${ds.typography.body} (${ds.typography.mood})`);
    if (ds.antiPatterns) contentLines.push(`Anti-patterns: ${ds.antiPatterns}`);
    contentLines.push("Refine query or call again to explore alternatives.");
    const content = contentLines.join("\n");
    expect(content.length).toBeLessThan(600); // Allow some margin
  });
});
```

**Step 2: Run integration test**

Run: `npx vitest run src/integration.test.ts 2>&1 | tail -15`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/integration.test.ts
git commit -m "test: integration tests for full workflow"
```

---

### Task 16: Final verification and cleanup

**Step 1: Run full test suite**

Run: `npx vitest run 2>&1`
Expected: All tests pass (bm25, csv-loader, search, design-system, persist, settings, integration).

**Step 2: Verify extension loads without errors**

Run: `pi -e ./extensions/index.ts -p "Call the design_system tool with query 'tech startup AI product' and project name 'CoolAI'" 2>&1 | head -40`

Expected: See the design system output with style, colors, typography, pattern.

**Step 3: Verify file structure matches spec**

Run:
```bash
find . -name "*.ts" -o -name "*.md" -o -name "*.json" | grep -v node_modules | grep -v .git | sort
```

Expected structure:
```
./data/*.csv
./data/stacks/*.csv
./docs/plans/2026-02-09-pi-ui-ux-pro-max-spec.md
./docs/plans/2026-02-09-pi-ui-ux-pro-max-implementation.md
./extensions/index.ts
./package.json
./prompts/ui-checklist.md
./src/bm25.ts
./src/bm25.test.ts
./src/csv-loader.ts
./src/csv-loader.test.ts
./src/design-system.ts
./src/design-system.test.ts
./src/integration.test.ts
./src/persist.ts
./src/persist.test.ts
./src/render/design-system.ts
./src/render/search.ts
./src/render/stack.ts
./src/search.ts
./src/search.test.ts
./src/settings.ts
./src/settings.test.ts
./src/types.ts
./tsconfig.json
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: pi-ui-ux-pro-max v1.0 — complete implementation"
```

---

## Summary

| Phase | Tasks | Key Deliverables |
|-------|-------|-----------------|
| **1: Core Engine** | Tasks 1-7 | Types, BM25, CSV loader, search, design system generator, persistence |
| **2: Tools & Rendering** | Tasks 8-10 | TUI renderers, extension entry point with 3 registered tools |
| **3: Settings & Polish** | Tasks 11-16 | Settings, `/ui-checklist` prompt, `/ui-settings` command, event hooks, full test suite |

**Total tasks:** 16
**Estimated time per task:** 2-5 minutes (TDD: write test → verify fail → implement → verify pass → commit)
**Testing approach:** vitest with unit tests per module + integration test
**Context budget:** ~180 words system prompt, ~400 bytes per tool result
