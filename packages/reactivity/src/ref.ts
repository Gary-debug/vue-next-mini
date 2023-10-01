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
    this._rawValue = value;
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
      this._rawValue = newVal;
      this._value = ToReactive(newVal);
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