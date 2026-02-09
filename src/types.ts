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
