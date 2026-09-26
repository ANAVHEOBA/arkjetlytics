import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

import { solidStart } from "@solidjs/start/config";

export default defineConfig({
  plugins: [solidStart(), nitro()],
  optimizeDeps: {
    // SolidStart's development error viewer imports this CommonJS package.
    // Prebundling provides the named ESM exports expected by the viewer.
    include: ["error-stack-parser", "source-map-js"],
  },
  server: {
    host: "127.0.0.1",
  },
});
