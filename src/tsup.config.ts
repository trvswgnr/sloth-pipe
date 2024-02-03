import { defineConfig } from "tsup";

export default defineConfig({
    format: ["esm", "cjs"],
    entry: {
        index: "pipe.ts",
        "fifo-queue": "fifo-queue.ts",
    },
    outDir: "dist",
    dts: true,
    sourcemap: true,
    clean: true,
});
