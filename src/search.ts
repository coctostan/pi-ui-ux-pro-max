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
