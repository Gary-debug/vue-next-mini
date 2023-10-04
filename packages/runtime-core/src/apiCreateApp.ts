import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createapp(rootComponent, rootProps = null) {
    const app = {
      _component: rootComponent,
      _container: null,
      mount(rootContainer) {
        const vnode = createVNode(rootComponent, rootProps, null);
        render(vnode, rootContainer);
      }
    };
    return app;
  }
}