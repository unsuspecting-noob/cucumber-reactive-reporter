import { readFileSync } from "fs";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);
const extensions = [".js", ".mjs"];

export default [
  {
    input: "index.mjs",
    external: ["ncp", "fs", "path", "util"],
    output: [
      {
        file: pkg.main,
        format: "cjs"
      },
      {
        file: pkg.module,
        format: "es"
      }
    ],
    plugins: [
      nodeResolve({ extensions }),
      commonjs(),
      babel({
        babelHelpers: "bundled",
        exclude: ["node_modules/**"],
        extensions
      }),
      copy({
        targets: [{ src: "react/**/*", dest: "dist/react" }],
        flatten: false
      })
    ]
  }
];
