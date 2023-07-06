import { defineConfig } from "vite";
import path from "path";
import Vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ArcoResolver } from "unplugin-vue-components/resolvers";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import WindiCSS from "vite-plugin-windicss";
import VueJSX from "@vitejs/plugin-vue-jsx";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  return {
    server: {
      host: "0.0.0.0",
    },
    build: {
      target: "esnext",
      sourcemap: !isProd,
    },
    plugins: [
      VueJSX(),
      WindiCSS(),
      AutoImport({
        dts: "src/types/auto-import.d.ts",
        imports: ["vue", "vue-router", "pinia", "@vueuse/core"],
        resolvers: [ArcoResolver()],
        eslintrc: {
          enabled: false, // 默认false, true启用。生成一次就可以，避免每次工程启动都生成
          filepath: "./.eslintrc-auto-import.json", // 生成json文件
          globalsPropValue: true,
        },
      }),
      Components({
        dts: "src/types/components.d.ts",
        resolvers: [
          ArcoResolver({ sideEffect: true, }),
          IconsResolver()
        ],
      }),
      Vue(),
      Icons({
        autoInstall: true,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "esnext",
      },
      include: [
        "vue",
        "vue-router",
      ],
    },
  };
});
