import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `--mode demo` produces a single self-contained index.html (no backend) written
// to the repo-root `demo/` folder, served publicly via a CDN for the tablet demo.
export default defineConfig(({ mode }) => {
  const isDemo = mode === "demo";
  return {
    base: isDemo ? "./" : "/",
    plugins: [react(), ...(isDemo ? [viteSingleFile()] : [])],
    server: { port: 5173, host: true },
    build: isDemo
      ? {
          outDir: "../../demo",
          emptyOutDir: true,
        }
      : {},
  };
});
