import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? "/BlackjackTrainer_A_spec/" : "/",
  plugins: [react(), tailwindcss()],
  test: {
    css: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
