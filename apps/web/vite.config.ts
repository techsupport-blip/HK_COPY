import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Demo-only: drop `type="module"` / `crossorigin` from the script tag so the
 * (IIFE) bundle runs as a classic script in any simple HTML renderer.
 */
function classicScriptTag(): Plugin {
  return {
    name: "hearth-classic-script",
    enforce: "post",
    transformIndexHtml(html) {
      return html
        .replace(/\s+type="module"/g, "")
        .replace(/\s+crossorigin/g, "");
    },
  };
}

// `--mode demo` produces a single self-contained index.html (no backend) written
// to the repo-root `demo/` folder, served publicly via a CDN for the tablet demo.
export default defineConfig(({ mode }) => {
  const isDemo = mode === "demo";
  return {
    base: isDemo ? "./" : "/",
    plugins: [react(), ...(isDemo ? [viteSingleFile(), classicScriptTag()] : [])],
    server: { port: 5173, host: true },
    build: isDemo
      ? {
          outDir: "../../demo",
          emptyOutDir: true,
          // Emit a single classic (IIFE) script — no ES module — so the inlined
          // demo runs in any simple HTML renderer (htmlpreview, CDNs, etc.).
          rollupOptions: {
            output: { format: "iife", inlineDynamicImports: true },
          },
        }
      : {},
  };
});
