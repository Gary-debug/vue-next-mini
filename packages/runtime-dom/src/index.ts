import { extend } from "@vue/shared";
import { createRenderer } from "packages/runtime-core/src/renderer"
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

let renderer; 
const rendererOptions = extend({patchProp}, nodeOps);

function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}

export const render = (...args) => {
  ensureRenderer().render(...args);
}