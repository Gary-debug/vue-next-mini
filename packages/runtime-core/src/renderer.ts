import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { Comment, Fragment, Text, isSameVNodeType } from "./vnode";
import { EMPTY_OBJ, isString } from "@vue/shared";
import { normalizeVNode, renderComponentRoot } from "./componentRenderUtils";
import { createComponentInstance, setupComponent } from "./component";
import { ReactiverEffect } from "packages/reactivity/src/effect";
import { queuePreFlushCb } from "./scheduler";

export interface RendererOptions {
  // 为指定的 Element 的 props 打补丁
  patchProp(el: Element, key: string, preValue: any, nextValue: any): void;
  // 为指定的 Element 设置 text
  setElementText(node: Element, text: string): void;
  // 插入指定的 el 到 parent 中，anchor 表示插入的位置，即：锚点
  insert(el, parent: Element, anchor?): void;
  // 创建 element
  createElement(type: string);
  remove(el: Element);
  createText(text: string);
  setText(node, text);
  createComment(text: string);
}

export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options);
}

function baseCreateRenderer(options: RendererOptions): any {
  const {
    insert: hostInsert,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
    createComment: hostCreateComment
  } = options;

  const processComponent = (oldVNode, newVNode, container, anchor) => {
    if(oldVNode == null) {
      mountComponent(newVNode, container, anchor);
    }
  }

  const processFragment = (oldVNode, newVNode, container, anchor) => {
    if(oldVNode == null) {
      // 挂载操作
      mountChildren(newVNode.children, container, anchor);
    } else {
      // 更新操作
      patchChildren(oldVNode, newVNode, container, anchor);
    }
  }

  const processText = (oldVNode, newVNode, container, anchor) => {
    if(oldVNode == null) {
      // 挂载操作
      newVNode.el = hostCreateText(newVNode.children)
      hostInsert(newVNode.el, container, anchor);
    } else {
      // 更新操作
      const el = (newVNode.el = oldVNode.el!)
      if(newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children);
      }
    }
  }

  const processCommentNode = (oldVNode, newVNode, container, anchor) => {
    if(oldVNode == null) {
      // 挂载操作
      newVNode.el = hostCreateComment((newVNode.children as string) || '');
      hostInsert(newVNode.el, container, anchor);
    } else {
      // 更新操作
      newVNode.el = oldVNode.el;
    }
  }

  const processElement = (oldVNode, newVNode, container, anchor) => {
    if(oldVNode == null) {
      // 挂载操作
      mountElement(newVNode, container, anchor)
    } else {
      // 更新操作
      patchElement(oldVNode, newVNode)
    }
  }

  const mountComponent = (initialVNode, container, anchor) => {
    initialVNode.component = createComponentInstance(initialVNode);
    const instance = initialVNode.component;

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  const setupRenderEffect = (instance, initialVnode, container, anchor) => {
    const componentUpdateFn = () => {
      if(!instance.isMounted) {
        const { bm, m } = instance;

        if(bm) {
          bm();
        }

        const subTree = (instance.subTree = renderComponentRoot(instance))
        
        patch(null, subTree, container, anchor);

        if(m) {
          m();
        }

        initialVnode.el = subTree.el;

        instance.isMounted = true;

      } else {
        let { next, vnode } = instance;
        if(!next) {
          next = vnode;
        }

        const nextTree = renderComponentRoot(instance);

        const prevTree = instance.subTree;
        instance.subTree = nextTree;

        patch(prevTree, nextTree, container, anchor);

        next.el = nextTree.el;
      }
    };

    const effect = (instance.effect = new ReactiverEffect(
      componentUpdateFn,
      () => queuePreFlushCb(update)
    ))

    const update = (instance.update = () => effect.run());

    update()
  }

  const mountElement = (vnode, container, anchor) => {
    const { type, props, shapeFlag } = vnode
    // 1. 创建element
    const el = (vnode.el = hostCreateElement(type))
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 2. 设置文本
      hostSetElementText(el, vnode.children);
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, anchor);
    }
    // 3. 设置 props
    if(props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 4. 插入
    hostInsert(el, container, anchor);
  }

  const patchElement = (oldVNode, newVNode) => {
    const el = (newVNode.el = oldVNode.el);

    const oldProps = oldVNode.props || EMPTY_OBJ;
    const newProps = newVNode.props || EMPTY_OBJ;

    patchChildren(oldVNode, newVNode, el, null);

    patchProps(el, newVNode, oldProps, newProps);
  }

  const mountChildren = (children, container, anchor) => {
    if(isString(children)) {
      children = children.split('')
    }
    for(let i=0; i<children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]));
      patch(null, child, container, anchor);
    }
  }

  const patchChildren = (oldVNode, newVNode, container, anchor) => {
    const c1 = oldVNode && oldVNode.children;
    const prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0;
    const c2 = newVNode && newVNode.children;
    const { shapeFlag } = newVNode;

    // 新节点是TEXT_CHILDREN
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧节点是ARRAY_CHILDREN
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // TODO：卸载旧子节点
      }

      if(c2 !== c1) {
        // 挂载新子节点的文本
        hostSetElementText(container, c2);
      }
    } else {
      // 旧节点是ARRAY_CHILDREN
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新节点也是ARRAY_CHILDREN
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO: diff
          patchKeyedChildren(c1, c2, container, anchor);
        } else {
          // TODO：卸载
        }
      } else {
        // 旧节点是TEXT_CHILDREN
        if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 删除旧节点的text
          hostSetElementText(container, '');
        }
        // 新节点是ARRAY_CHILDREN
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO：单独新子节点的挂载
        }
      }
    }
  }

  const patchKeyedChildren = (
    oldChildren, 
    newChildren, 
    container,
    parentAnchor
    ) => {
      let i = 0;
      const newChildrenLength = newChildren.length;
      let oldChildrenEnd = oldChildren.length - 1;
      let newChildrenEnd = newChildrenLength - 1;

      // 1. 自前向后
      while(i<=oldChildrenEnd && i<=newChildrenEnd) {
        const oldVNode = oldChildren[i];
        const newVNode = normalizeVNode(newChildren[i]);
        if(isSameVNodeType(oldVNode, newVNode)) {
          patch(oldVNode, newVNode, container, null);
        } else {
          break;
        }
        i++
      }

      // 2. 自后向前
      while(i<=oldChildrenEnd && i<=newChildrenEnd) {
        const oldVNode = oldChildren[oldChildrenEnd];
        const newVNode = newChildren[newChildrenEnd];
        if(isSameVNodeType(oldVNode, newVNode)) {
          patch(oldVNode, newVNode, container, null);
        } else {
          break;
        }
        oldChildrenEnd--;
        newChildrenEnd--;
      }

      // 3. 新节点多于旧节点
      if(i>oldChildrenEnd) {
        if(i<=newChildrenEnd) {
          const nextPos = newChildrenEnd + 1;
          const anchor = nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor;
          while(i<=newChildrenEnd) {
            patch(null, normalizeVNode(newChildren[i]), container, anchor);
            i++;
          }
        }
      }
    }

  const patchProps = (el: Element, vnode, oldProps, newProps) => {
    if(oldProps !== newProps) {
      // 新的prop新增
      for(const key in newProps) {
        const next = newProps[key];
        const prev = oldProps[key];
        if(next !== prev) {
          hostPatchProp(el, key, prev, next);
        }
      }
      // 删除存在于旧的的prop不存在新的prop
      if(oldProps !== EMPTY_OBJ) {
        for(const key in oldProps) {
          if(!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if(oldVNode === newVNode) {
      return
    }

    if(oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
      unmount(oldVNode)
      oldVNode = null
    }

    const { type, shapeFlag } = newVNode;
    switch(type) {
      case Text:
        processText(oldVNode, newVNode, container, anchor);
        break;
      case Comment:
        processCommentNode(oldVNode, newVNode, container, anchor)
        break;
      case Fragment:
        processFragment(oldVNode, newVNode, container, anchor)
        break;
      default:
        if(shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, newVNode, container, anchor);
        } else if(shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(oldVNode, newVNode, container, anchor);
        }
    }
  };

  const unmount = (vnode) => {
    hostRemove(vnode.el)
  }

  const render = (vnode, container) => {
    if(vnode == null) {
       // TODO：卸载
       if(container._vnode) {
        unmount(container._vnode)
       }
    } else {
      // 打补丁
      patch(container._vnode || null, vnode, container)
    }

    container._vnode = vnode;
  } 

  return {
    render
  }
}