import { defineConfig } from "vite"
import path from "path"

const scriptFolder = path.resolve(__dirname, "src/server/utils/CustomPlaywright/utils/initScript")

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(scriptFolder, "original", "index.ts"),
            name: "UtilsBundle",
            formats: ["iife"],
            fileName: () => "utils.bundle.js",
        },
        outDir: path.resolve(scriptFolder, "dist-utils"),
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
    },
    define: {
        "process.env.NODE_ENV": JSON.stringify("production")
    }
})