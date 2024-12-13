import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import typescript from "rollup-plugin-typescript2";

import packageJson from "./package.json" with { type: "json" };

export default [
  // Build bundle: index.js
  {
    input: ["./src/index.ts"],
    external: ["react", "react-dom", "framer-motion", "wagmi"],
    output: {
      file: packageJson.exports.import,
      format: "esm",
      sourcemap: true,
    },
    plugins: [
      peerDepsExternal(),
      json(),
      typescript({
        useTsconfigDeclarationDir: true,
        exclude: ["node_modules/**"],
      }),
    ],
  },
  // Build types: index.d.ts
  {
    input: "./build/packages/paykit/packages/connectkit/src/index.d.ts",
    output: { file: "build/index.d.ts", format: "esm" },
    plugins: [
      dts({
        exclude: ["**/pay-api/**"],
        compilerOptions: {
          importsNotUsedAsValues: "remove",
          preserveValueImports: false,
        },
      }),
    ],
  },
];
