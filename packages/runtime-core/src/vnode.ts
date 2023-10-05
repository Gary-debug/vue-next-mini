import { isArray, isFunction, isObject, isString } from "@vue/shared";
import { normalizeClass } from "packages/shared/src/normalizeProp";
import { ShapeFlags } from "packages/shared/src/shapeFlags";

export const Fragment = Symbol('Fragment');
export const Text = Symbol('Text');
export const Comment = Symbol('comment');

export interface VNode {
  __v_isVNode: true;
  type: any;
  props: any;
  children: any;
  shapeFlag: number;
  key: any;
}

export function isVnode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false;
}

export function createVNode(type, props, chilren?): VNode {

  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT 
    : isObject(type) 
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;
    
  if(props) {
    // 处理 class
    let { class: klass, style} = props
    if(klass && !isString(klass)) {
      props.class = normalizeClass(klass);
    }
  }

  return createBaseVNode(type, props, chilren, shapeFlag);
}

export { createVNode as createElementVNode }

function createBaseVNode(type, props, children, shapeFlag) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    shapeFlag,
    key: props?.key || null
  } as VNode;

  normalizeChildren(vnode, children)

  return vnode;
}

export function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0;

  if(children == null) {
    children = null 
  } else if(isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if(typeof children === 'object') {
    // TODO：object
  } else if(isFunction(children)) {
    // TODO：function
  } else {
    // children 为 string
    children = String(children);
    // 为 type 指定 Flags
    type = ShapeFlags.TEXT_CHILDREN;

  }
  // 修改 vnode 的 children
  vnode.children = children;
  // 按位或赋值
  vnode.shapeFlag |= type;
}

export function isSameVNodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key;
}
// 创建注释节点
export function createCommentVNode(text) {
  return createVNode(Comment, null, text);
}