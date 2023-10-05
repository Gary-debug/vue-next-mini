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

// 创建并生成 app 实例
export const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args);
  
  // 获取到 mount 挂载方法
  const { mount } = app;

  // 对该方法进行重构，标准化 container，再重新触发 mount 进行挂载
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

// 标准化 container 容器
function normalizeContainer(container: Element | string) : Element | null {
  if(isString(container)) {
    const res = document.querySelector(container);
    return res;
  }

  return container;
}