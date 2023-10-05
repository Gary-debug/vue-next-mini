import { isOn } from "@vue/shared"
import {patchClass} from './modules/class'
import { patachDOMProp } from "./modules/props";
import { patchAttr } from "./modules/attrs";
import { patchStyle } from "./modules/style";
import { patchEvent } from "./modules/event";

// 为 prop 进行打补丁操作
export const patchProp = (el: Element, key, prevValue, nextValue) => {
  if(key === 'class') {
    patchClass(el, nextValue);
  } else if(key === 'style') {
    patchStyle(el, prevValue, nextValue);
  } else if(isOn(key)) {
    patchEvent(el, key, prevValue, nextValue);
  } else if(shouldSetAsProp(el, key)) {
    patachDOMProp(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
}

function shouldSetAsProp(el: Element, key: string) {
  // 各种边缘情况处理
	if (key === 'spellcheck' || key === 'draggable' || key === 'translate') {
		return false
	}
  // 表单元素的表单属性是只读的，必须设置为属性 attribute
  if(key === 'form') {
    return false;
  }
  // <input list> 必须设置为属性 attribute
  if(key === 'list' && el.tagName === 'INPUT') {
    return false;
  }
  // <textarea type> 必须设置为属性 attribute
  if(key === 'type' && el.tagName === 'TEXTAREA') {
    return false;
  }

  return key in el;
}