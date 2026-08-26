import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { seoHtmlPlugin } from "./vite.seo";

export default defineConfig({
  plugins: [react(), seoHtmlPlugin()],
});
