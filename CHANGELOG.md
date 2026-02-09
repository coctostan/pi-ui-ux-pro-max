# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-09

Initial release — TypeScript port of [ui-ux-pro-max-skill](https://github.com/nicholasgriffintn/ui-ux-pro-max-skill) for the [pi coding agent](https://github.com/mariozechner/pi-coding-agent).

### Added

**Core Engine**
- BM25 search engine ported from Python to TypeScript (`src/bm25.ts`)
- CSV parser with quoted field support, no external dependencies (`src/csv-loader.ts`)
- Type definitions for all domains, stacks, design systems, and settings (`src/types.ts`)
- Domain search with auto-detection across 10 domains (`src/search.ts`)
- Stack search across 13 tech stacks (`src/search.ts`)
- Design system generator with reasoning engine (`src/design-system.ts`)
  - Product category detection via BM25 search
  - Reasoning rule lookup from 100 curated rules
  - Multi-domain search (style, color, typography, pattern) with priority weighting
  - Best-match selection with tiered keyword scoring

**Tools**
- `design_system` — Generate tailored design system recommendations
  - Iterative refinement (call multiple times with different queries)
  - Persist to `design-system/<slug>/MASTER.md`
  - Optional page-specific override files
- `ui_search` — Search knowledge base by domain (10 domains)
  - Auto-detect domain from query keywords when not specified
- `ui_stack_guide` — Get stack-specific implementation guidelines (13 stacks)
  - Default stack from `/ui-settings` when not specified

**TUI Renderers**
- Custom renderers for all 3 tools with compact and expanded views
- Partial/streaming state support for future async operations
- Error state rendering

**Persistence**
- MASTER.md generation with colors, typography, spacing, style, pattern, anti-patterns, checklist
- Page override files with cascade model (overrides master)
- Path sanitization via `slugify()` to prevent directory traversal

**Settings & Commands**
- `/ui-settings` command — view and configure extension settings
- Settings persistence to `.pi/ui-ux-pro-max.json`
- Default stack setting (used by `ui_stack_guide` as fallback)
- Auto-inject design system setting (opt-in, ~100 bytes per turn)

**Prompt Templates**
- `/ui-checklist` — Pre-delivery UI/UX checklist covering visual quality, interaction, contrast, layout, accessibility

**Event Hooks**
- `session_start` — Load settings and reconstruct active design system from session history
- `before_agent_start` — Auto-inject active design system context (opt-in)
- `context` — Prune old `design_system` results, keeping only the latest

**Context Efficiency**
- Content/details split: ~400 bytes to LLM, full data to TUI
- System prompt cost: ~180 words (vs ~2,000 tokens for original skill)
- Context pruning: 4 iterations cost ~520 bytes (vs ~1,600 without pruning)

**Data**
- 476KB of curated UI/UX data from the original project:
  - 67 UI styles with metadata, keywords, and framework compatibility
  - 97 color palettes organized by product type
  - 57 font pairings with mood, Google Fonts URLs, and CSS imports
  - 100 reasoning rules mapping categories to design decisions
  - 24 landing page patterns with conversion optimization
  - 100 product type → design recommendation mappings
  - 99 UX guidelines with Do/Don't and code examples
  - ~50 icon recommendations
  - ~30 React performance guidelines
  - ~30 web accessibility guidelines
  - 13 tech stack guideline sets (50-60 guidelines each)

**Testing**
- 89 tests across 11 test files
- Unit tests for BM25, CSV parsing, search, design system, persistence, settings
- Renderer tests with mock theme verification
- Integration tests covering full workflow, all 10 domains, all 13 stacks
- Context size verification (LLM content < 600 bytes)

**Documentation**
- README.md with full attribution, installation, quick start, and usage examples
- docs/ARCHITECTURE.md — technical deep-dive and design decisions
- docs/API.md — complete tool, command, and hook reference
- docs/DATA.md — data dictionary for all 24 CSV files
- docs/CONTRIBUTING.md — contributor guide for data, code, and tests

### Attribution

All CSV data files are derived from [ui-ux-pro-max-skill](https://github.com/nicholasgriffintn/ui-ux-pro-max-skill) by [nextlevelbuilder](https://github.com/nextlevelbuilder), MIT-licensed. The BM25 search engine is a TypeScript port of the original Python implementation. The architecture, tooling, rendering, persistence, and testing are original work for the pi extension system.
