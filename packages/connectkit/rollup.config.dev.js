import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import typescript from "rollup-plugin-typescript2";
// import createTransformer from "typescript-plugin-styled-components";

import packageJson from "./package.json" with { type: "json" };

// const styledComponentsTransformer = createTransformer({
//   displayName: true,
// });

export default [
  // Build bundle: index.js
  {
    input: ["./src/index.ts"],
    external: ["react", "react-dom", "framer-motion", "wagmi"],
    output: [
      {
        file: packageJson.exports.import,
        format: "esm",
        sourcemap: false,
      },
    ],
    plugins: [
      peerDepsExternal(),
      json(),
      typescript({
        useTsconfigDeclarationDir: true,
        exclude: "node_modules/**",
        // transformers: [
        //   () => ({
        //     before: [styledComponentsTransformer],
        //   }),
        // ],
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
