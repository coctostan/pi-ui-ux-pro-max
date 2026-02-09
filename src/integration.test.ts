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

  it("content/details split keeps LLM content under 600 bytes", () => {
    const ds = generator.generate("SaaS dashboard analytics platform", "BigSaaS");
    const contentLines: string[] = [];
    contentLines.push(`Design System: ${ds.projectName}`);
    contentLines.push(`Style: ${ds.style.name} | Pattern: ${ds.pattern.name}`);
    contentLines.push(`Colors: primary=${ds.colors.primary} secondary=${ds.colors.secondary} cta=${ds.colors.cta} bg=${ds.colors.background} text=${ds.colors.text}`);
    contentLines.push(`Typography: ${ds.typography.heading} / ${ds.typography.body} (${ds.typography.mood})`);
    if (ds.antiPatterns) contentLines.push(`Anti-patterns: ${ds.antiPatterns}`);
    contentLines.push("Refine query or call again to explore alternatives.");
    const content = contentLines.join("\n");
    expect(content.length).toBeLessThan(600);
  });
});
