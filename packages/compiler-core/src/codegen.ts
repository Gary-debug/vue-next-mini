import { isArray, isString } from "@vue/shared";
import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING, helperNameMap } from "./runtimeHelpers";
import { getVNodeHelper } from "./utils";

const aliasHelper = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}`

function createCodegenContext(ast) {
  const context = {
    code: '', // render 函数代码字符串
    runtimeGlobalName: 'Vue', // 运行时全局的变量名
    source: ast.loc.source, // 模版源
    indentLevel: 0, // 缩进级别
    isSSR: false,
    // 需要触发的方法，关联 JavaScript AST 中的 helpers
    helper(key) {
      return `_${helperNameMap[key]}`
    },
    // 插入代码
    push(code) {
      context.code += code;
    },
    // 新的一行
    newline() {
      newline(context.indentLevel)
    },
    // 控制缩进 + 换行
    indent() {
      newline(++context.indentLevel);
    },
    // 控制缩进 + 换行
    deindent() {
      newline(--context.indentLevel)
    }
  };

  function newline(n: number) {
    context.code += '\n' + `  `.repeat(n);
  }

  return context;
}

// 根据 JavaScript AST 生成
export function generate(ast) {
  // 生成上下文 context
  const context = createCodegenContext(ast);

  // 获取 code 拼接方法
  const { push, newline, indent, deindent } = context;

  // 生成函数的前置代码：const _Vue = Vue
  genFunctionPreamble(context);

  // 创建方法名称
  const functionName = `render`;
  // 创建方法参数
  const args = ['_ctx', '_cache'];
  const signature = args.join(', ');

  // 利用方法名称和参数拼接函数声明
  push(`function ${functionName}(${signature}) {`);

  // 缩进 + 换行
  indent();

  // 增加 with 触发
  push(`with (_ctx) {`);
  indent()

  // 明确使用到的方法。如：createVNode
  const hasHelpers = ast.helpers.length > 0;
  if(hasHelpers) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = _Vue`);
    push('\n');
    newline();
  }

  // 最后拼接 return 的值
  newline();
  push(`return `);

  // 处理 return 结果。
  if(ast.codegenNode) {
    genNode(ast.codegenNode, context);
  } else {
    push(`null`);
  }

  // with 结尾
  deindent();
  push('}');

  // 收缩缩进 + 换行
  deindent();
  push('}');

  return {
    ast,
    code: context.code
  }
}

// 生成 "const _Vue = Vue\n\nreturn "
function genFunctionPreamble(context) {
  const { push, runtimeGlobalName, newline } = context;

  const VueVinding = runtimeGlobalName;
  push(`const _Vue = ${VueVinding}\n`);

  newline();
  push(`return `);
}

// 区分节点进行处理
function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.IF:
      genNode(node.codegenNode!, context);
      break;
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
    // 复合表达式处理
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    // 表达式处理
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    // {{}} 处理
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    // JS调用表达式的处理
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(node, context)
      break
    // JS条件表达式的处理
    case NodeTypes.JS_CONDITIONAL_EXPRESSION:
      genConditionalExpression(node, context)
      break
  }
}

// JS 调用表达式的处理
function genCallExpression(node, context) {
  const { push, helper } = context;
  const callee = isString(node.callee) ? node.callee : helper(node.callee);
  
  push(callee + `(`, node);
  genNodeList(node.arguments, context);
  push(`)`);
}

/**
 * JS条件表达式的处理。
 * 例如：
 *  isShow
        ? _createElementVNode("h1", null, ["你好，世界"])
        : _createCommentVNode("v-if", true),
 */
function genConditionalExpression(node, context) {
  const { test, alternate, consequent, newline: needNewLine } = node;
  const { push, indent, deindent, newline } = context;

  if(test.type === NodeTypes.SIMPLE_EXPRESSION) {
    // 写入变量
    genExpression(test, context);
  }

  needNewLine && indent();

  context.indentLevel++;
  needNewLine || push(` `);
  push(`? `);
  // 写入满足条件的处理逻辑
  genNode(consequent, context);

  context.indentLevel--;
  needNewLine && newline();
  needNewLine || push(` `);

  push(`: `);
  // 判断 else 的类型是否也为 JS_CONDITIONAL_EXPRESSION
  const isNested = alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION;
  // 不是则缩进
  if(!isNested) {
    context.indentLevel++;
  }
  // 写入 else（不满足条件）的处理逻辑
  genNode(alternate, context);

  if(!isNested) {
    context.indentLevel--;
  }
  needNewLine && deindent();
}

// 复合表达式处理
function genCompoundExpression(node, context) {
  for(let i = 0; i < node.children!.length; i++) {
    const child = node.children![i];
    if(isString(child)) {
      context.push(child);
    } else {
      genNode(child, context);
    }
  }
}

// 表达式处理
function genExpression(node, context) {
  const { content, isStatic } = node;
  context.push(isStatic ? JSON.stringify(content) : content, node);
}

// {{}} 处理
function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(')');
}

// 处理 Text 节点
function genText(node, context) {
  context.push(JSON.stringify(node.content), node);
}

// 处理 VNODE_CALL 节点
function genVNodeCall(node, context) {
  const { push, helper } = context;
  const { 
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking, 
    isComponent 
  } = node;

  const callHelper = getVNodeHelper(context.isSSR, isComponent);
  push(helper(callHelper) + `(`, node);

  const args = genNullableArgs([tag, props, children, patchFlag, dynamicProps]);

  genNodeList(args, context);

  push(')');
}

function genNullableArgs(args: any[]) {
  let i = args.length;
  while(i--) {
    if(args[i] != null) break;
  }
  return args.slice(0, i+1).map(arg => arg || `null`);
}

// 处理参数的填充
function genNodeList(nodes, context) {
  const { push, newline } = context;

  for(let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if(isString(node)) {
      push(node);
    } else if(isArray(node)) {
      genNodeListAsArray(node, context);
    } else {
      genNode(node, context);
    }
    if(i < nodes.length - 1) {
      push(`, `)
    }
  }
};

function genNodeListAsArray(nodes, context) {
  context.push('[');
  genNodeList(nodes, context);
  context.push(']');
}