# Contributing

Thank you for your interest in contributing to pi-ui-ux-pro-max! This guide covers how to add data, write tests, fix bugs, and extend the package.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/your-org/pi-ui-ux-pro-max
cd pi-ui-ux-pro-max

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Load the extension locally for manual testing
pi -e ./extensions/index.ts
```

## Project Structure

```
src/
├── bm25.ts              # Search engine (rarely needs changes)
├── csv-loader.ts         # CSV parsing and indexing
├── design-system.ts      # Design system generator
├── search.ts             # Domain/stack search functions
├── persist.ts            # File persistence (MASTER.md, pages)
├── settings.ts           # Settings management
├── types.ts              # Type definitions and config
└── render/               # TUI renderers
    ├── design-system.ts
    ├── search.ts
    └── stack.ts
extensions/
└── index.ts              # Extension entry point
data/                     # CSV data files
prompts/                  # Prompt templates
```

## Common Contributions

### Adding New Data Rows

The most common contribution — adding more styles, palettes, guidelines, etc.

**Steps:**

1. Open the relevant CSV file in `data/`
2. Add rows following the existing column schema exactly
3. Increment the `No` column sequentially
4. Escape properly: wrap fields containing commas in double quotes, escape literal quotes as `""`
5. Run `npm test` to verify the CSV parses correctly

**Example — adding a new color palette:**

```csv
98,AI/ML Platform,#6C63FF,#A084DC,#FF6584,#F0F0FF,#1A1A2E,#E0E0E0,Purple primary + coral CTA for AI products
```

**Example — adding a new stack guideline:**

```csv
55,Performance,lazy-load-routes,Load routes lazily to reduce initial bundle,Use dynamic imports for route components,Import all routes statically,const Page = lazy(() => import('./Page')),import Page from './Page',High,https://react.dev/reference/react/lazy
```

### Adding a New Search Domain

To add an entirely new domain (e.g., "animation"):

1. **Create the CSV file** — `data/animation.csv` with headers and data rows
2. **Add config to `src/types.ts`:**

```typescript
// In CSV_CONFIG:
animation: {
  file: "animation.csv",
  searchCols: ["Category", "Property", "Keywords"],
  outputCols: ["Category", "Property", "Duration", "Easing", "Code Example", "Notes"],
},
```

3. **Update the Domain type:**

```typescript
export type Domain = "style" | "color" | ... | "animation";
```

4. **Update `extensions/index.ts`** — add `"animation"` to the `DOMAINS` array
5. **Update domain auto-detection** in `src/search.ts` — add keywords to `domainKeywords`
6. **Write tests** — at minimum, verify the new domain loads and searches correctly
7. **Run full test suite** — `npm test`

### Adding a New Tech Stack

To add a new stack (e.g., "solid"):

1. **Create the CSV file** — `data/stacks/solid.csv` with the standard stack columns:
   ```
   No,Category,Guideline,Description,Do,Don't,Code Good,Code Bad,Severity,Docs URL
   ```
2. **Add config to `src/types.ts`:**

```typescript
// In STACK_CONFIG:
solid: { file: "stacks/solid.csv" },
```

3. **Update the StackName type:**

```typescript
export type StackName = "html-tailwind" | "react" | ... | "solid";
```

4. **Update `extensions/index.ts`** — add `"solid"` to the `STACKS` array
5. **Write tests** — verify the stack loads and searches correctly
6. **Run full test suite**

### Adding a New Tool

To register an entirely new tool:

1. **Define the details type** in `src/types.ts`
2. **Write the renderer** in `src/render/your-tool.ts` — implement `renderCall` and `renderResult`
3. **Write renderer tests** in `src/render/your-tool.test.ts`
4. **Register the tool** in `extensions/index.ts` using `pi.registerTool()`
5. **Add integration tests** in `src/integration.test.ts`

See existing tools as reference — `ui_search` is the simplest example.

### Adding a Prompt Template

1. Create a markdown file in `prompts/` with frontmatter:

```markdown
---
description: Short description shown in /prompt list
---
Your prompt content here...
```

2. The file is automatically discovered by pi — no code changes needed

### Fixing Bugs

1. **Write a failing test first** that demonstrates the bug
2. **Fix the bug** in the source code
3. **Verify the test passes** — `npm test`
4. **Check nothing else broke** — run the full suite

## Writing Tests

We use [vitest](https://vitest.dev/) for testing.

### Test Patterns

**Unit tests** — Test individual functions in isolation:

```typescript
// src/bm25.test.ts
import { BM25 } from "./bm25.js";

it("returns documents ranked by relevance", () => {
  const bm25 = new BM25();
  bm25.fit(["cat dog", "fish bird", "cat fish"]);
  const scores = bm25.score("cat");
  expect(scores[0][0]).toBe(0); // "cat dog" ranked first
});
```

**Integration tests** — Test the full pipeline:

```typescript
// src/integration.test.ts
it("generates, formats, and persists a design system", () => {
  const ds = generator.generate("beauty spa", "Serenity Spa");
  const md = formatMasterMd(ds);
  expect(md).toContain("Serenity Spa");
});
```

**Renderer tests** — Use a mock theme to verify TUI output:

```typescript
function mockTheme() {
  return {
    fg: (color: string, text: string) => `[${color}:${text}]`,
    bold: (text: string) => `<b>${text}</b>`,
  };
}

it("renders compact view with project name", () => {
  const result = renderDesignSystemResult(resultData, { expanded: false, isPartial: false }, mockTheme());
  const output = result.render(200).join("\n");
  expect(output).toContain("TestProject");
});
```

### Test Conventions

- Test files live next to source files: `foo.ts` → `foo.test.ts`
- Renderer tests: `src/render/foo.test.ts`
- Use real CSV data where possible — don't mock the data layer
- Each test should be independent — no shared mutable state between tests
- Clean up temp directories in `afterEach` or `finally` blocks

### Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npx vitest run src/bm25.test.ts

# Run in watch mode
npm run test:watch

# Run with verbose output
npx vitest run --reporter=verbose
```

## Code Style

- **TypeScript strict mode** — `strict: true` in tsconfig.json
- **ES modules** — Use `.js` extensions in imports (TypeScript resolution)
- **Functional core** — Pure functions where possible, classes only for BM25 and DesignSystemGenerator
- **No external runtime dependencies** — Only devDependencies (vitest, typescript)
- **Content/details split** — Tool results must separate LLM content (~400 bytes) from TUI details

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add animation domain with 30 guidelines
fix: handle quoted commas in CSV fields
test: add edge case for empty search results
docs: update DATA.md with new domain schema
chore: update vitest to v5
```

## Pull Request Checklist

Before submitting a PR:

- [ ] `npm test` passes (all 89+ tests green)
- [ ] New code has tests
- [ ] No `any` types added (use proper types from `src/types.ts`)
- [ ] Content/details split maintained for any new tools
- [ ] CSV files parse correctly (verify with `csv-loader.test.ts`)
- [ ] Documentation updated if adding domains/stacks/tools
- [ ] Commit messages follow conventional commits

## Architecture Decisions

Before making significant changes, read [ARCHITECTURE.md](ARCHITECTURE.md) to understand:

- Why BM25 instead of embeddings
- Why eager loading instead of lazy
- Why content/details split
- Why context pruning only for design_system
- The reasoning engine pipeline

## Getting Help

- **Architecture questions** — See [ARCHITECTURE.md](ARCHITECTURE.md)
- **API questions** — See [API.md](API.md)
- **Data schema questions** — See [DATA.md](DATA.md)
- **Bug reports** — Open an issue with reproduction steps and test output
