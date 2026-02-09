// extensions/index.ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { StringEnum } from "@mariozechner/pi-ai";
import * as path from "node:path";

import { initSearchIndices, searchDomain, searchStack } from "../src/search.js";
import { DesignSystemGenerator } from "../src/design-system.js";
import { persistDesignSystem } from "../src/persist.js";
import { getDataDir } from "../src/csv-loader.js";
import { loadSettings, saveSettings } from "../src/settings.js";
import type {
  Domain, StackName, UiUxSettings,
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

  // Settings
  let settings: UiUxSettings = { autoInjectDesignSystem: false, defaultStack: null, defaultFormat: "markdown" };

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

      const ds = generator.generate(query, projectName);

      const details: DesignSystemToolDetails = {
        designSystem: ds,
        searchScores: {},
        query,
      };

      if (shouldPersist) {
        const result = persistDesignSystem(ds, page, ctx.cwd);
        details.persisted = {
          master: result.createdFiles[0],
          page: result.createdFiles[1],
        };
        activeDesignSystem = {
          summary: `${ds.projectName}: ${ds.style.name} | ${ds.colors.primary} ${ds.colors.secondary} ${ds.colors.cta} | ${ds.typography.heading}/${ds.typography.body}`,
          path: result.createdFiles[0],
        };
      }

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

    renderCall: renderDesignSystemCall as any,
    renderResult: renderDesignSystemResult as any,
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

    renderCall: renderSearchCall as any,
    renderResult: renderSearchResult as any,
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

    renderCall: renderStackCall as any,
    renderResult: renderStackResult as any,
  });

  // ============ Session Start: Load Settings ============
  pi.on("session_start", async (_event, ctx) => {
    settings = loadSettings(path.join(ctx.cwd, ".pi"));
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
