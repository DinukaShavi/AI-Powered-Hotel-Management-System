import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Guarantees a single copy of the renderer in the bundle. @asgardeo/react
    // (and its @floating-ui dependency) would otherwise pull in their own
    // react-dom, and two renderers against one React instance render nothing.
    dedupe: ["react", "react-dom"],
  },
})
