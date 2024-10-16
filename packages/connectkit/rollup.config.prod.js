import json from '@rollup/plugin-json';
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import typescript from "rollup-plugin-typescript2";

import packageJson from "./package.json";

export default [
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
        exclude: "node_modules/**",
      }),
    ],
  },
];
