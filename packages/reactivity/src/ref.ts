import { hasChanged } from "@vue/shared";
import { Dep, createDep } from "./dep";
import { activeEffect, trackEffects, triggerEffects } from "./effect";
import { ToReactive } from "./reactive";

export interface Ref<T = any> {
  value: T
}

export function ref(value?: unknown) {
  return createRef(value, false);
}

// 创建 RefImpl 实例
function createRef(rawValue: unknown, shallow: boolean) {
  if(isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}

class RefImpl<T> {
  private _value: T;
  private _rawValue: T;
  
  public dep?: Dep = undefined;
  public readonly __v_isRef = true;

  constructor(value: T, public readonly __v_isShallow: boolean) {
    // 原始数据
    this._rawValue = value;
    // 如果 __v_isShallow 为 true，则 value 不会被转化为 reactive 数据，即如果当前 value 为复杂数据类型，则会失去响应性。对应官方文档 shallowRef ：https://cn.vuejs.org/api/reactivity-advanced.html#shallowref
    this._value = __v_isShallow ? value : ToReactive(value);
  }
  // 实例的 getter 行为：ref.value
  get value () {
    trackRefValue(this)
    return this._value;
  }
  // 实例的 setter 行为：ref.value = xxx
  set value(newVal) {
    if(hasChanged(newVal, this._rawValue)) {
      // 更新原始数据
      this._rawValue = newVal;
      // 更新 .value 的值
      this._value = ToReactive(newVal);
      // 触发依赖
      triggerRefValue(this);
    }
  }
}

/**
 * 收集依赖
 * @param ref 
 */
export function trackRefValue(ref) {
  if(activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}
/**
 * 触发依赖
 */
export function triggerRefValue(ref) {
  if(ref.dep) {
    triggerEffects(ref.dep);
  }
}

/**
 * 是否是ref
 * @param r 
 * @returns 
 */
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_ifRef === true)
}