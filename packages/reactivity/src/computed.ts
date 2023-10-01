import { isFunction } from "@vue/shared";
import { Dep } from "./dep";
import { ReactiverEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

export class ComputedRefImpl<T> {

  public dep?: Dep = undefined
  private _value!: T;

  public readonly effect: ReactiverEffect<T>;

  public readonly __v_isRef = true;

  public _dirty = true; // 脏变量

  constructor(getter) {
    this.effect = new ReactiverEffect(getter, () => {
      if(!this._dirty) {
        this._dirty = true;
        triggerRefValue(this);
      }
    });
    this.effect.computed = this;
  }

  get value() {
    trackRefValue(this)
    if(this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
}

export function computed(getterOrOptions) {
  let getter;

  const onlyGetter = isFunction(getterOrOptions);

  if(onlyGetter) {
    getter = getterOrOptions;
  }

  const Cref = new ComputedRefImpl(getter);

  return Cref;
}