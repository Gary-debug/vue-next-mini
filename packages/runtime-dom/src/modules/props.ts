// 通过 DOM Properties 指定属性
export function patachDOMProp(el, key, value) {
  try {
    el[key] = value;
  } catch(e) {
    
  }
}