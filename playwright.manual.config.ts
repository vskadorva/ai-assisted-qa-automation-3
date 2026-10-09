import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  testMatch: "**/purge-programs.manual.spec.ts",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "line",
});
