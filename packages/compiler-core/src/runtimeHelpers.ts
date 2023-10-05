export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
export const CREATE_VNODE = Symbol('createVnode');
export const TO_DISPLAY_STRING = Symbol('toDisplayString')
export const CREATE_COMMENT = Symbol('createCommentVNode');

export const helperNameMap = {
  // 在 renderer 中，通过 export { createVNode as createElementVNode }
  [CREATE_ELEMENT_VNODE]: 'createElementVNode',
  [CREATE_VNODE]: 'createVnode',
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [CREATE_COMMENT]: 'createCommentVNode'
}