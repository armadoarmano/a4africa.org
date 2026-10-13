// a4a-v1 — builds for Vercel. (Inside Lovable's sandbox the config still forces Cloudflare,
// so the project keeps working there too.)
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  nitro: { preset: "vercel" },
});
