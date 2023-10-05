import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { Comment, Fragment, Text, VNode, isSameVNodeType } from "./vnode";
import { EMPTY_OBJ, isString } from "@vue/shared";
import { cloneIfMounted, normalizeVNode, renderComponentRoot } from "./componentRenderUtils";
import { createComponentInstance, setupComponent } from "./component";
import { ReactiverEffect } from "packages/reactivity/src/effect";
import { queuePreFlushCb } from "./scheduler";
import { createAppAPI } from "./apiCreateApp";

export interface RendererOptions {
  // 为指定的 Element 的 props 打补丁
  patchProp(el: Element, key: string, preValue: any, nextValue: any): void;
  // 为指定的 Element 设置 text
  setElementText(node: Element, text: string): void;
  // 插入指定的 el 到 parent 中，anchor 表示插入的位置，即：锚点
  insert(el, parent: Element, anchor?): void;
  // 创建 element
  createElement(type: string);
  // 卸载指定dom
  remove(el: Element);
  // 创建 Text 节点
  createText(text: string);
  // 设置 Text
  setText(node, text);
  // 创建注释
  createComment(text: string);
}

// 对外暴露创建渲染器的方法
export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options);
}

/**
 * 生成 render 渲染器
 * @param options 兼容性操作配置对象
 * @returns 
 */
function baseCreateRenderer(options: RendererOptions): any {
  // 解构 options，获取所有的兼容性方法
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

  // 组件的打补丁操作
  const processComponent = (oldVNode, newVNode, container, anchor) => {
    if(oldVNode == null) {
      // 挂载
      mountComponent(newVNode, container, anchor);
    }
  }

  // Fragment 的打补丁操作
  const processFragment = (oldVNode, newVNode, container, anchor) => {
    if(oldVNode == null) {
      // 挂载操作
      mountChildren(newVNode.children, container, anchor);
    } else {
      // 更新操作
      patchChildren(oldVNode, newVNode, container, anchor);
    }
  }

  // Text 的打补丁操作
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
  
  // Comment 的打补丁操作
  const processCommentNode = (oldVNode, newVNode, container, anchor) => {
    if(oldVNode == null) {
      // 生成节点
      newVNode.el = hostCreateComment((newVNode.children as string) || '');
      // 挂载
      hostInsert(newVNode.el, container, anchor);
    } else {
      // 无更新
      newVNode.el = oldVNode.el;
    }
  }

  // Element 的打补丁操作
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
    // 生成组件实例
    initialVNode.component = createComponentInstance(initialVNode);
    // 浅拷贝，绑定同一块内存空间
    const instance = initialVNode.component;

    // 标准化组件实例数据
    setupComponent(instance);

    // 设置组件渲染
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  // 设置组件渲染
  const setupRenderEffect = (instance, initialVnode, container, anchor) => {
    // 组件挂载和更新的方法
    const componentUpdateFn = () => {
      // 当前处于 mounted 之前，即执行挂载逻辑
      if(!instance.isMounted) {
        // 获取 hook
        const { bm, m } = instance;

        // beforeMount hook
        if(bm) {
          bm();
        }

        // 从 render 中获取需要渲染的内容
        const subTree = (instance.subTree = renderComponentRoot(instance))
        
        // 通过 patch 对 subTree进行打补丁。即：渲染组件
        patch(null, subTree, container, anchor);

        // mounted hook
        if(m) {
          m();
        }

        // 把组件根节点的 el，作为组件的 el
        initialVnode.el = subTree.el;

        // 修改 mounted 状态
        instance.isMounted = true;
      } else {
        let { next, vnode } = instance;
        if(!next) {
          next = vnode;
        }

        // 获取下一次的 subTree
        const nextTree = renderComponentRoot(instance);

        // 保存对应的 subTree，以便进行更新操作
        const prevTree = instance.subTree;
        instance.subTree = nextTree;

        // 通过 patch 进行更新操作
        patch(prevTree, nextTree, container, anchor);

        // 更新 next
        next.el = nextTree.el;
      }
    };

    // 创建包含 scheduler 的 effect 实例
    const effect = (instance.effect = new ReactiverEffect(
      componentUpdateFn,
      () => queuePreFlushCb(update)
    ))

    // 生成 update 函数
    const update = (instance.update = () => effect.run());

    // 触发 update 函数，本质上触发的事 componentUpdateFn
    update()
  }

  // element 的挂载操作
  const mountElement = (vnode, container, anchor) => {
    const { type, props, shapeFlag } = vnode

    // 1. 创建element
    const el = (vnode.el = hostCreateElement(type))
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 2. 设置文本
      hostSetElementText(el, vnode.children);
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 设置 Array 子节点
      mountChildren(vnode.children, el, anchor);
    }

    // 3. 设置 props
    if(props) {
      // 遍历 props 对象
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 4. 插入
    hostInsert(el, container, anchor);
  }

  // element 的更新操作
  const patchElement = (oldVNode, newVNode) => {
    // 获取指定的 el
    const el = (newVNode.el = oldVNode.el);

    // 新旧 props
    const oldProps = oldVNode.props || EMPTY_OBJ;
    const newProps = newVNode.props || EMPTY_OBJ;

    // 更新子节点
    patchChildren(oldVNode, newVNode, el, null);

    // 更新 props
    patchProps(el, newVNode, oldProps, newProps);
  }

  // 挂载子节点
  const mountChildren = (children, container, anchor) => {
    if(isString(children)) {
      children = children.split('')
    }
    for(let i=0; i<children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]));
      patch(null, child, container, anchor);
    }
  }

  // 为子节点打补丁
  const patchChildren = (oldVNode, newVNode, container, anchor) => {
    // 旧节点的 children
    const c1 = oldVNode && oldVNode.children;
    // 旧节点的 prevShapeFlag
    const prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0;
    // 新节点的 children
    const c2 = newVNode && newVNode.children;
    // 新节点的 shapeFlag
    const { shapeFlag } = newVNode;

    // 新节点是TEXT_CHILDREN
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧节点是ARRAY_CHILDREN
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // TODO：卸载旧子节点
      }
      // 新旧子节点不同
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
        } 
        // 新子节点不为 ARRAY_CHILDRE，则直接卸载旧子节点
        else {
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

  // diff
  const patchKeyedChildren = (
    oldChildren, 
    newChildren, 
    container,
    parentAnchor
    ) => {
      // 索引
      let i = 0;
      // 新的子节点的长度
      const newChildrenLength = newChildren.length;
      // 旧的子节点最大下标
      let oldChildrenEnd = oldChildren.length - 1;
      // 新的子节点最大下标
      let newChildrenEnd = newChildrenLength - 1;

      // 1. 自前向后的 diff 对比。经过该循环之后，从前开始的相同 vnode 将被处理
      while(i<=oldChildrenEnd && i<=newChildrenEnd) {
        const oldVNode = oldChildren[i];
        const newVNode = normalizeVNode(newChildren[i]);
        // 如果 oldVNode 和 newVNode 被认为是同一个 vnode，则直接 patch 即可
        if(isSameVNodeType(oldVNode, newVNode)) {
          patch(oldVNode, newVNode, container, null);
        }
        // 如果不是同一个 vnode，则直接跳出循环
        else {
          break;
        }
        i++
      }

      // 2. 自后向前的 diff 对比。经过该循环之后，从后开始的相同 vnode 将被处理
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
      
      // 4. 旧节点多于新节点
      else if(i>newChildrenEnd) {
        while(i<=oldChildrenEnd) {
          unmount(oldChildren[i]);
          i++
        }
      }

      // 5. 乱序的 diff 比对
    else {
      // 旧子节点的开始索引：oldChildrenStart
      const oldStartIndex = i
      // 新子节点的开始索引：newChildrenStart
      const newStartIndex = i
      // 5.1 创建一个 <key（新节点的 key）:index（新节点的位置）> 的 Map 对象 keyToNewIndexMap。通过该对象可知：新的 child（根据 key 判断指定 child） 更新后的位置（根据对应的 index 判断）在哪里
      const keyToNewIndexMap = new Map()
      // 通过循环为 keyToNewIndexMap 填充值（s2 = newChildrenStart; e2 = newChildrenEnd）
      for (i = newStartIndex; i <= newChildrenEnd; i++) {
        // 从 newChildren 中根据开始索引获取每一个 child（c2 = newChildren）
        const nextChild = normalizeVNode(newChildren[i])
        // child 必须存在 key（这也是为什么 v-for 必须要有 key 的原因）
        if (nextChild.key != null) {
          // 把 key 和 对应的索引，放到 keyToNewIndexMap 对象中
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }

      // 5.2 循环 oldChildren ，并尝试进行 patch（打补丁）或 unmount（删除）旧节点
      let j
      // 记录已经修复的新节点数量
      let patched = 0
      // 新节点待修补的数量 = newChildrenEnd - newChildrenStart + 1
      const toBePatched = newChildrenEnd - newStartIndex + 1
      // 标记位：节点是否需要移动
      let moved = false
      // 配合 moved 进行使用，它始终保存当前最大的 index 值
      let maxNewIndexSoFar = 0
      // 创建一个 Array 的对象，用来确定最长递增子序列。它的下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》，元素表示：《对应旧节点的下标（oldIndex），永远 +1》
      // 但是，需要特别注意的是：oldIndex 的值应该永远 +1 （ 因为 0 代表了特殊含义，他表示《新节点没有找到对应的旧节点，此时需要新增新节点》）。即：旧节点下标为 0， 但是记录时会被记录为 1
      const newIndexToOldIndexMap = new Array(toBePatched)
      // 遍历 toBePatched ，为 newIndexToOldIndexMap 进行初始化，初始化时，所有的元素为 0
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
      // 遍历 oldChildren（s1 = oldChildrenStart; e1 = oldChildrenEnd），获取旧节点，如果当前 已经处理的节点数量 > 待处理的节点数量，那么就证明：《所有的节点都已经更新完成，剩余的旧节点全部删除即可》
      for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
        // 获取旧节点
        const prevChild = oldChildren[i]
        // 如果当前 已经处理的节点数量 > 待处理的节点数量，那么就证明：《所有的节点都已经更新完成，剩余的旧节点全部删除即可》
        if (patched >= toBePatched) {
          // 所有的节点都已经更新完成，剩余的旧节点全部删除即可
          unmount(prevChild)
          continue
        }
        // 新节点需要存在的位置，需要根据旧节点来进行寻找（包含已处理的节点。即：n-c 被认为是 1）
        let newIndex
        // 旧节点的 key 存在时
        if (prevChild.key != null) {
          // 根据旧节点的 key，从 keyToNewIndexMap 中可以获取到新节点对应的位置
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // 旧节点的 key 不存在（无 key 节点）
          // 那么我们就遍历所有的新节点，找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》，如果能找到，那么 newIndex = 该新节点索引
          for (j = newStartIndex; j <= newChildrenEnd; j++) {
            // 找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》
            if (
              newIndexToOldIndexMap[j - newStartIndex] === 0 &&
              isSameVNodeType(prevChild, newChildren[j])
            ) {
              // 如果能找到，那么 newIndex = 该新节点索引
              newIndex = j
              break
            }
          }
        }
        // 最终没有找到新节点的索引，则证明：当前旧节点没有对应的新节点
        if (newIndex === undefined) {
          // 此时，直接删除即可
          unmount(prevChild)
        }
        // 没有进入 if，则表示：当前旧节点找到了对应的新节点，那么接下来就是要判断对于该新节点而言，是要 patch（打补丁）还是 move（移动）
        else {
          // 为 newIndexToOldIndexMap 填充值：下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》，元素表示：《对应旧节点的下标（oldIndex），永远 +1》
          // 因为 newIndex 包含已处理的节点，所以需要减去 s2（s2 = newChildrenStart）表示：不计算已处理的节点
          newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1
          // maxNewIndexSoFar 会存储当前最大的 newIndex，它应该是一个递增的，如果没有递增，则证明有节点需要移动
          if (newIndex >= maxNewIndexSoFar) {
            // 持续递增
            maxNewIndexSoFar = newIndex
          } else {
            // 没有递增，则需要移动，moved = true
            moved = true
          }
          // 打补丁
          patch(prevChild, newChildren[newIndex], container, null)
          // 自增已处理的节点数量
          patched++
        }
      }

      // 5.3 针对移动和挂载的处理
      // 仅当节点需要移动的时候，我们才需要生成最长递增子序列，否则只需要有一个空数组即可
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []
      // j >= 0 表示：初始值为 最长递增子序列的最后下标
      // j < 0 表示：《不存在》最长递增子序列。
      j = increasingNewIndexSequence.length - 1
      // 倒序循环，以便我们可以使用最后修补的节点作为锚点
      for (i = toBePatched - 1; i >= 0; i--) {
        // nextIndex（需要更新的新节点下标） = newChildrenStart + i
        const nextIndex = newStartIndex + i
        // 根据 nextIndex 拿到要处理的 新节点
        const nextChild = newChildren[nextIndex]
        // 获取锚点（是否超过了最长长度）
        const anchor =
          nextIndex + 1 < newChildrenLength
            ? newChildren[nextIndex + 1].el
            : parentAnchor
        // 如果 newIndexToOldIndexMap 中保存的 value = 0，则表示：新节点没有用对应的旧节点，此时需要挂载新节点
        if (newIndexToOldIndexMap[i] === 0) {
          // 挂载新节点
          patch(null, nextChild, container, anchor)
        }
        // moved 为 true，表示需要移动
        else if (moved) {
          // j < 0 表示：不存在 最长递增子序列
          // i !== increasingNewIndexSequence[j] 表示：当前节点不在最后位置
          // 那么此时就需要 move （移动）
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor)
          } else {
            // j 随着循环递减
            j--
          }
        }
      }
    }
  }

  // 移动节点到指定位置
  const move = (vnode, container, anchor) => {
    const { el } = vnode;
    hostInsert(el!, container, anchor)
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

    // 判断是否为相同类型节点
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
    render,
    createApp: createAppAPI(render)
  }
}

// 获取最长递增子序列下标
function getSequence(arr) {
  // 对数组的浅拷贝
  const p = arr.splice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for(i=0; i<len; i++) {
    const arrI = arr[i];
    if(arrI !== 0) {
      // result最后的元素，最大值
      j = result[result.length-1];
      if(arr[j]<arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      // 初始下标
      u = 0;
      // 最终下标
      v = result.length-1;
      while(u<v) {
        c = (u+v) >> 1;
        if(arr[result[c]] < arrI) {
          u = c+1;
        } else {
          v = c;
        }
      }
      if(arrI < arr[result[u]]) {
        if(u>0) {
          p[i] = result[u-1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u-1];
  while(u-->0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}