import { isArray, isObject } from "@vue/shared";
import { VNode, createVNode, isVnode } from "./vnode";

export function h(type: any, propsOrChildren?: any, children?: any): VNode {
  // 获取参数长度
  const l = arguments.length;

  if(l === 2) {
    if(isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if(isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }

      return createVNode(type, propsOrChildren, [])
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if(l>3) {
      children = Array.prototype.slice.call(arguments, 2);
    }
    else if(l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}