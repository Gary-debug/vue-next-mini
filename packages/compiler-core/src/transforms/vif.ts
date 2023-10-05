import { isString } from "@vue/shared";
import { NodeTypes, createCallExpression, createConditionalExpression, createObjectProperty, createSimpleExpression } from "../ast";
import { TransformContext, createStructuralDirectiveTransform } from "../transform";
import { getMemoedVNodeCall } from "../utils";
import { CREATE_COMMENT } from "../runtimeHelpers";

/**
 * transformIf === exitFns。内部保存了所有 v-if、v-else、else-if 的处理函数
 */
export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      let key = 0;

      return () => {
        if(isRoot) {
          ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context);
        } else {}
      }
    })
  }
)

/**
 * v-if 的转化处理
 */
export function processIf(
  node, 
  dir, 
  context: TransformContext, 
  processCodegen?: (node, branch, isRoot: boolean) => (() => void) | undefined
) {
  // 仅处理 v-if
  if(dir.name === 'if') {
    // 创建 branch 属性
    const branch = createIfBranch(node, dir);

    // 生成 if 指令节点，包含 branches
    const ifNode = {
      type: NodeTypes.IF,
      loc: node.loc,
      branches: [branch]
    }

    // 切换 currentVNode，即：当前处理节点为 ifNode
    context.replaceNode(ifNode);

    // 生成对应的 codegen 属性
    if(processCodegen) {
      return processCodegen(ifNode, branch, true);
    }
  }
}

// 创建 if 指令的 branch 属性节点
function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    loc: node.loc,
    condition: dir.exp,
    children: [node]
  }
}

// 生成分支节点的 codegenNode
function createCodegenNodeForBranch(
  branch, 
  keyIndex: number,
  context: TransformContext
) {
  if(branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex),
      // 以注释的形式展示 v-if
      createCallExpression(context.helper(CREATE_COMMENT), ['"v-if"', 'true'])
    )
  } else {
    return createChildrenCodegenNode(branch, keyIndex);
  }
}

// 创建指定子节点的 codegen
function createChildrenCodegenNode(branch, keyIndex: number) {
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(`${keyIndex}`, false)
  )

  const { children } = branch;
  const firstChild = children[0];
  const ret = firstChild.codegenNode;
  const vnodeCall = getMemoedVNodeCall(ret);

  injectProp(vnodeCall, keyProperty)
  return ret;
}

// 填充 props
export function injectProp(node, prop) {
  let propsWithInjection;

  let props = node.type === NodeTypes.VNODE_CALL ? node.props : node.arguments[2];

  if(props === null || isString(props)) {
    propsWithInjection = createObjectExpression([prop]);
  }
  if(node.type === NodeTypes.VNODE_CALL) {
    node.props = propsWithInjection;
  }
}

// 创建对象表达式节点
export function createObjectExpression(properties) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc: {},
    properties
  }
}