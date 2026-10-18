import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/pantry-app/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase SDK (最大のベンダー)
          "vendor-firebase": [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
          ],
          // React エコシステム
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // データフェッチ
          "vendor-query": ["@tanstack/react-query"],
          // バリデーション
          "vendor-zod": ["zod"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
