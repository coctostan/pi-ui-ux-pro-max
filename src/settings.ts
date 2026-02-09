// src/settings.ts
import * as fs from "node:fs";
import * as path from "node:path";
import type { UiUxSettings } from "./types.js";

export { DEFAULT_SETTINGS } from "./types.js";

const SETTINGS_FILE = "ui-ux-pro-max.json";

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

export function saveSettings(piDir: string, settings: UiUxSettings): void {
  fs.mkdirSync(piDir, { recursive: true });
  const filePath = path.join(piDir, SETTINGS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
}
