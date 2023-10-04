import { extend, isString } from "@vue/shared";
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

export const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args);
  
  const { mount } = app;

  app.mount = (containerOrSelector: Element | string) => {
    const container = normalizeContainer(containerOrSelector);

    if(!container) {
      console.error('容器必须存在')
      return 
    }

    mount(container);
  }
  
  return app;
}

function normalizeContainer(container: Element | string) : Element | null {
  if(isString(container)) {
    const res = document.querySelector(container);
    return res;
  }

  return container;
}