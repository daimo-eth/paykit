import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import typescript from "rollup-plugin-typescript2";

/** @type {import('rollup').RollupOptions[]} */
export default [
  // Build bundle: index.js
  {
    input: ["./src/index.ts"],
    external: [
      "react",
      "react-dom",
      "framer-motion",
      "wagmi",
      "styled-components",
    ],
    output: [
      {
        dir: "build",
        format: "esm",
        sourcemap: true,
        preserveModules: true,
      },
      {
        file: "build/index.js",
        format: "esm",
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      json(),
      resolve(),
      commonjs(),
      typescript({
        useTsconfigDeclarationDir: true,
        exclude: "node_modules/**",
      }),
    ],
  },
  // Build types: index.d.ts
  {
    input: "./build/packages/paykit/packages/connectkit/src/index.d.ts",
    output: { file: "build/index.d.ts", format: "esm" },
    external: ["../package.json"],
    plugins: [
      dts({
        compilerOptions: {
          preserveValueImports: false,
        },
      }),
    ],
  },
];
