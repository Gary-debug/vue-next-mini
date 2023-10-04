import { ElementTypes, NodeTypes } from "./ast";

const enum TagType {
  Start,
  End
}

export interface ParserContext {
  source: string;
}

function createParserContext(content: string): ParserContext {
  return {
    source: content
  }
}

export function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc: {}
  }
}

export function baseParse(content: string) {
  const context = createParserContext(content);

  const children = parseChildren(context, []);

  return createRoot(children);
}

function parseChildren(context: ParserContext, ancestors) {
  const nodes = [];

  while(!isEnd(context, ancestors)) {
    const s = context.source;

    let node;

    if(startsWith(s, '{{')) {
      node = parseInterpolation(context);
    } else if(s[0] === '<') {
      if(/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }

    if(!node) {
      node = parseText(context);
    }

    pushNode(nodes, node);
  }

  return nodes;
}

function parseInterpolation(context: ParserContext) {
  // {{ xx }}
  const [open, close] = ['{{', '}}'];

  advanceBy(context, open.length);

  const closeIndex = context.source.indexOf(close, open.length);
  const preTrimContent = parseTextData(context, closeIndex);
  const content = preTrimContent.trim();

  advanceBy(context, close.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content
    }
  }
}

function parseElement(context: ParserContext, ancestors) {
  const element = parseTag(context, TagType.Start);
  
  ancestors.push(element);
  const chilren = parseChildren(context, ancestors);
  ancestors.pop();

  element.children = chilren;

  if(startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  }

  return element;
}

function parseTag(context: ParserContext, type: TagType) {
  const match: any = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1];

  advanceBy(context, match[0].length);

  // 属性和指令的处理
  advanceSpaces(context)
  let props = parseAttributes(context, type);

  let isSelfClosing = startsWith(context.source, '/>');
  advanceBy(context, isSelfClosing ? 2 : 1);


  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
    children: [],
    props
  }
}

function advanceSpaces(context: ParserContext): void {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if(match) {
    advanceBy(context, match[0].length);
  }
}

function parseAttributes(context, type) {
  const props: any = [];
  const attributeNames = new Set<string>();

  while(
    context.source.length > 0 && 
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    const attr = parseAttribute(context, attributeNames);
    if(type === TagType.Start) {
      props.push(attr);
    }
    advanceSpaces(context);
  }

  return props;
}

function parseAttribute(context: ParserContext, nameSet: Set<string>) {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!
  const name = match[0];

  nameSet.add(name);

  advanceBy(context, name.length);

  let value: any = undefined;

  if(/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context);
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context);
  }

  // v- 指令
  if(/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    // 获取指令名称
		const match =
    /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
      name
    )!

    let dirName = match[1];

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        loc: {}
      },
      art: undefined,
      modifiers: undefined,
      loc: {}
    }
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: {}
    },
    loc: {}
  }
}

function parseAttributeValue(context: ParserContext) {
  let content = '';

  const quote = context.source[0];
  advanceBy(context, 1);
  const endIndex = context.source.indexOf(quote);
  if(endIndex === -1) {
    content = parseTextData(context, context.source.length);
  } else {
    content = parseTextData(context, endIndex);
    advanceBy(context, 1);

  }

  return {
    content,
    isQuoted: true,
    loc: {}
  }
}

function pushNode(nodes, node) {
  nodes.push(node);
}

function parseText(context: ParserContext) {
  const endTokens = ['<', '{{'];

  let endIndex = context.source.length;

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if(index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData(context: ParserContext, length: number) {
  const rawText = context.source.slice(0, length);

  advanceBy(context, length);
  return rawText;
}

function isEnd(context: ParserContext, ancestors) {
  const s = context.source;

  if(startsWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; i++) {
      if(startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true;
      }
    }
  }

  return !s;
}

function startsWithEndTagOpen(source: string, tag: string): boolean {
  return startsWith(source, '</');
}

function startsWith(source: string, searchString: string) :boolean {
  return source.startsWith(searchString);
}

function advanceBy(context: ParserContext, numberOfCharacters: number) {
  const { source } = context;
  context.source = source.slice(numberOfCharacters);
}