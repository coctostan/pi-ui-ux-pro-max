// src/design-system.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { parseCsv } from "./csv-loader.js";
import { searchDomain, type SearchIndices } from "./search.js";
import type {
  CsvRow, DesignSystem, DesignSystemPattern, DesignSystemStyle,
  DesignSystemColors, DesignSystemTypography, ReasoningRule,
} from "./types.js";

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
