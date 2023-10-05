export const enum ShapeFlags {
  ELEMENT = 1,   // type = element
  FUNCTIONAL_COMPONENT = 1 << 1,   // 函数组件
  STATEFUL_COMPONENT = 1 << 2,   // 有状态（响应数据）组件
  TEXT_CHILDREN = 1 << 3,    // children = Text
  ARRAY_CHILDREN = 1 << 4, // children = Array
  SLOTS_CHILDREN = 1 << 5, // children = slot
  // 组件：有状态（响应数据）组件 ｜ 函数组件
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT 
}
