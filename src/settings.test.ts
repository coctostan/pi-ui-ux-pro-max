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

  it("handles partial/corrupt JSON gracefully", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-settings-"));
    const piDir = path.join(tmpDir, ".pi");
    fs.mkdirSync(piDir, { recursive: true });
    fs.writeFileSync(path.join(piDir, "ui-ux-pro-max.json"), "not json!", "utf-8");
    const settings = loadSettings(piDir);
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("fills in missing fields with defaults", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uiux-settings-"));
    const piDir = path.join(tmpDir, ".pi");
    fs.mkdirSync(piDir, { recursive: true });
    fs.writeFileSync(path.join(piDir, "ui-ux-pro-max.json"), JSON.stringify({ autoInjectDesignSystem: true }), "utf-8");
    const settings = loadSettings(piDir);
    expect(settings.autoInjectDesignSystem).toBe(true);
    expect(settings.defaultStack).toBeNull();
    expect(settings.defaultFormat).toBe("markdown");
  });
});
