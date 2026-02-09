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
