import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Use repository path in production (GitHub Pages), root path in dev.
  base: mode === "production" ? "/mediflow/" : "/",
  plugins: [react()],
}));
