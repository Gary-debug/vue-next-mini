export function patachDOMProp(el, key, value) {
  try {
    el[key] = value;
  } catch(e) {
    
  }
}