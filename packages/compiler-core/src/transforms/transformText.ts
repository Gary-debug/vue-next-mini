import { NodeTypes } from "../ast"
import { isText } from "../utils";

// 将相邻的文本节点和表达式合并成一个表达式
export const transformText = (node, context) => {
  if(
    node.type === NodeTypes.ROOT || 
    node.type === NodeTypes.ELEMENT || 
    node.type === NodeTypes.FOR || 
    node.type === NodeTypes.IF_BRANCH
  ) {
    return () => {
      // 获取所有的子节点
      const children = node.children;
      // 当前容器
      let currentContainer;
      // 循环处理所有的子节点
      for(let i = 0; i < children.length; i++) {
        const child = children[i];
        if(isText(child)) {
          for(let j = i + 1; j < children.length; j++) {
            const next = children[j];
            // 当前节点 child 和下一个节点 next 都是 Text 节点
            if(isText(next)) {
              if(!currentContainer) {
                // 生成一个复合表达式节点
                currentContainer = children[i] = createCompundExpression([child], child.loc);
              }
              // 在当前节点 child 和下一个节点 next 中间，插入"+"号
              currentContainer.children.push(` + `, next);
              // 把下一个删除
              children.splice(j, 1);
              j--;
            }
            // 当前节点 child 是 Text 节点，下一个节点 next 不是 Text 节点，则把 currentContainer 置空即可
            else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    }
  }
}

// return hello {{ msg }} 复合表达式
export function createCompundExpression(children, loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children
  }
}