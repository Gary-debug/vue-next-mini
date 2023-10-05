import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createapp(rootComponent, rootProps = null) {
    const app = {
      _component: rootComponent,
      _container: null,
      // 挂载方法
      mount(rootContainer) {
        // 直接通过 createVNode 方法构建 vnode
        const vnode = createVNode(rootComponent, rootProps, null);
        // 通过 render 函数进行挂载
        render(vnode, rootContainer);
      }
    };
    return app;
  }
}